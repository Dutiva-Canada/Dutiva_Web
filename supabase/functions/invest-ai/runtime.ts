import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import {
  postChatCompletion,
  readUpstreamCompletion,
  resolveApiKey,
  routeBodyExtras,
  type UpstreamMessage,
} from '../_shared/modelUpstream.ts'
import {
  buildRepairNote,
  chatSources,
  extractMentionedSymbols,
  formatMarketEntry,
  investChatPrompt,
  parseInvestChatReply,
  verifyReplyClaims,
  type ChatSource,
  type InvestChatContext,
  type InvestChatReply,
  type MarketContextEntry,
} from './handlers.ts'
import {
  formatWebResultsBlock,
  mergeSources,
  webSearch,
  webSources,
  type WebResult,
} from '../_shared/webSearch.ts'
import { fetchOnDemandMarket } from './marketFetch.ts'
import { executeChatAction, type ExecutedAction } from './chatActions.ts'
import { json, sseChannel, UPSTREAM_TIMEOUT_MS } from './runtimeShared.ts'

/* Runtime for invest-ai — everything the serve() router delegates to: the
   chat kind's route lookup, shared book-context load, and SSE persistence.
   The action whitelist + undo live in chatActions.ts, the react kind in
   reactRuntime.ts, and the shared response plumbing in runtimeShared.ts.
   Deno-only — the pure/prompt layer lives in handlers.ts where vitest can
   reach it. */

export { json, UPSTREAM_TIMEOUT_MS } from './runtimeShared.ts'
export { runChatUndo } from './chatActions.ts'

const CHAT_HISTORY = 20
const CHAT_LIST_CAP = 15

type Provider = Parameters<typeof postChatCompletion>[0]
interface ModelRoute {
  route: { model_name: string; config?: Record<string, unknown> | null }
  provider: Provider
  apiKey: string | null
}

/** Route lookup — `invest_ai` first, `advisor_chat` as the shared fallback
    (same contract as candidate-ai), plus the resolved provider key. */
export async function modelRoute(adminClient: SupabaseClient): Promise<ModelRoute | { error: Response }> {
  for (const routeKey of ['invest_ai', 'advisor_chat']) {
    const { data: route, error } = await adminClient
      .from('ai_model_routes')
      .select(
        'id, model_name, config, provider:ai_model_providers(id, provider_key, base_url, secret_ref, status)',
      )
      .eq('route_key', routeKey)
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error) return { error: json({ error: error.message }, 500) }
    const provider = route?.provider as { status?: string } | null | undefined
    if (route && provider && provider.status === 'active') {
      const keyResult = resolveApiKey(
        (provider as { secret_ref?: string }).secret_ref,
        (name) => Deno.env.get(name),
      )
      if ('missingSecret' in keyResult) {
        return { error: json({ error: `Missing secret ${keyResult.missingSecret}` }, 500) }
      }
      return {
        route: route as ModelRoute['route'],
        provider: provider as unknown as Provider,
        apiKey: keyResult.apiKey,
      }
    }
  }
  return { error: json({ error: 'No active model route configured' }, 503) }
}

/** The book's own rows, shared by chat and react — names, quantities,
    statuses, capped per list. Every row belongs to the caller. */
export async function loadBookContext(
  adminClient: SupabaseClient,
  userId: string,
): Promise<{
  ctx: InvestChatContext
  accounts: { id: string; name: string; kind: string }[]
  watchlist: { id: string; symbol: string; asset_class: string; name: string }[]
  signals: { id: string; title: string; status: string }[]
}> {
  const [
    { data: accounts },
    { data: positions },
    { data: watchlist },
    { data: strategies },
    { data: signals },
    { data: orders },
    { data: snapshots },
  ] = await Promise.all([
    adminClient.from('invest_accounts')
      .select('id, name, kind, base_currency, cash_balance, status')
      .eq('user_id', userId).eq('status', 'active').limit(CHAT_LIST_CAP),
    adminClient.from('invest_positions')
      .select('symbol, name, quantity, last_price, last_price_at, currency')
      .eq('user_id', userId).limit(CHAT_LIST_CAP),
    adminClient.from('invest_watchlist')
      .select('id, symbol, asset_class, name')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    adminClient.from('invest_strategies')
      .select('id, name, enabled, cadence')
      .eq('user_id', userId).limit(CHAT_LIST_CAP),
    adminClient.from('invest_signals')
      .select('id, title, symbol, kind, status')
      .eq('user_id', userId).eq('status', 'new')
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    adminClient.from('invest_orders')
      .select('symbol, side, quantity, status')
      .eq('user_id', userId).in('status', ['draft', 'queued'])
      .order('created_at', { ascending: false }).limit(CHAT_LIST_CAP),
    /* Every stored snapshot — the rows the sync already maintains for the
       book's universe, now readable by the chat surface for analysis. */
    adminClient.from('invest_market_snapshots')
      .select(
        'symbol, asset_class, price, currency, day_change_pct, ma50, ma200, rsi14, ret_1m, ret_3m, ret_12m, vol_20d, high_52w, low_52w, fundamentals, fundamentals_as_of, as_of',
      )
      .eq('user_id', userId)
      .order('as_of', { ascending: false })
      .limit(60),
  ])

  /* Headlines ride the market section — the table is global, so the query
     joins on the symbols the book actually names, plus the general feed
     row ('') for market backdrop. */
  const universe = new Set<string>()
  for (const s of snapshots ?? []) universe.add(String(s.symbol).toUpperCase())
  for (const p of positions ?? []) universe.add(String(p.symbol).toUpperCase())
  for (const w of watchlist ?? []) universe.add(String(w.symbol).toUpperCase())
  for (const s of signals ?? []) universe.add(String(s.symbol).toUpperCase())

  let newsRows: { symbol: string; title: string; source: string; published_at: string | null; url: string | null }[] = []
  if (universe.size > 0) {
    const { data } = await adminClient
      .from('invest_market_news')
      .select('symbol, title, source, published_at, url')
      .in('symbol', [...universe, ''])
      .order('published_at', { ascending: false })
      .limit(50)
    newsRows = (data ?? []) as typeof newsRows
  }
  const headlinesBySymbol = new Map<string, MarketContextEntry['headlines']>()
  const generalNews: InvestChatContext['generalNews'] = []
  for (const row of newsRows) {
    const item = {
      title: String(row.title).slice(0, 200),
      source: String(row.source).slice(0, 60),
      publishedAt: row.published_at,
      url: row.url ?? null,
    }
    const sym = String(row.symbol ?? '').toUpperCase()
    if (sym === '') {
      if (generalNews.length < 3) generalNews.push(item)
      continue
    }
    const list = headlinesBySymbol.get(sym) ?? []
    if (list.length < 3) {
      list.push(item)
      headlinesBySymbol.set(sym, list)
    }
  }

  const market: MarketContextEntry[] = []
  const seenSymbols = new Set<string>()
  for (const s of snapshots ?? []) {
    const sym = String(s.symbol).toUpperCase()
    if (seenSymbols.has(sym)) continue
    seenSymbols.add(sym)
    market.push({
      symbol: sym,
      assetClass: String(s.asset_class),
      price: s.price ?? null,
      currency: String(s.currency ?? 'USD'),
      dayChangePct: s.day_change_pct ?? null,
      ma50: s.ma50 ?? null,
      ma200: s.ma200 ?? null,
      rsi14: s.rsi14 ?? null,
      ret1m: s.ret_1m ?? null,
      ret3m: s.ret_3m ?? null,
      ret12m: s.ret_12m ?? null,
      vol20d: s.vol_20d ?? null,
      high52w: s.high_52w ?? null,
      low52w: s.low_52w ?? null,
      fundamentals: (s.fundamentals as MarketContextEntry['fundamentals']) ?? null,
      asOf: s.as_of ?? null,
      headlines: headlinesBySymbol.get(sym) ?? [],
    })
  }

  const ctx: InvestChatContext = {
    accounts: (accounts ?? []).map((a) => ({
      name: String(a.name),
      kind: String(a.kind),
      cashBalance: Number(a.cash_balance ?? 0),
      baseCurrency: String(a.base_currency ?? ''),
    })),
    positions: (positions ?? []).map((p) => ({
      symbol: String(p.symbol),
      name: String(p.name ?? ''),
      quantity: Number(p.quantity ?? 0),
      lastPrice: typeof p.last_price === 'number' ? p.last_price : null,
      lastPriceAt: typeof p.last_price_at === 'string' ? p.last_price_at : null,
      currency: String(p.currency ?? ''),
    })),
    watchlist: (watchlist ?? []).map((w) => ({
      symbol: String(w.symbol), assetClass: String(w.asset_class),
    })),
    strategies: (strategies ?? []).map((s) => ({
      name: String(s.name), enabled: Boolean(s.enabled), cadence: String(s.cadence),
    })),
    newSignals: (signals ?? []).map((s) => ({
      id: String(s.id), title: String(s.title ?? ''),
      symbol: String(s.symbol ?? ''), kind: String(s.kind),
    })),
    openOrders: (orders ?? []).map((o) => ({
      symbol: String(o.symbol), side: String(o.side),
      quantity: Number(o.quantity ?? 0), status: String(o.status),
    })),
    market,
    generalNews,
  }
  return {
    ctx,
    accounts: (accounts ?? []) as { id: string; name: string; kind: string }[],
    watchlist: (watchlist ?? []) as { id: string; symbol: string; asset_class: string; name: string }[],
    signals: (signals ?? []) as { id: string; title: string; status: string }[],
  }
}

/* Persist both turns — history is server-side so the next device/session
   sees the same conversation, and the assistant row keeps what it did.
   The assistant id goes back so the client can attach feedback to it. */
async function persistChatTurns(
  adminClient: SupabaseClient,
  userId: string,
  message: string,
  reply: string,
  executed: ExecutedAction | null,
  threadId: string | null,
  reasoning: string,
  sources: ChatSource[],
): Promise<{ userId: string | null; assistantId: string | null }> {
  const nowIso = new Date().toISOString()
  const { data: userRow } = await adminClient
    .from('invest_chat_messages')
    .insert({
      user_id: userId,
      role: 'user',
      content: message,
      thread_id: threadId,
      created_at: nowIso,
    })
    .select('id')
    .single()
  const { data: assistantRow } = await adminClient
    .from('invest_chat_messages')
    .insert({
      user_id: userId,
      role: 'assistant',
      content: reply,
      action: executed,
      thread_id: threadId,
      reasoning: reasoning || null,
      sources: sources.length > 0 ? sources : null,
      created_at: new Date(Date.parse(nowIso) + 1).toISOString(),
    })
    .select('id')
    .single()
  /* A named thread takes its title from the first user message — set only
     while the title is still null, so a later turn never renames it. */
  if (threadId) {
    await adminClient
      .from('invest_chat_threads')
      .update({ title: message.slice(0, 80) })
      .eq('id', threadId)
      .eq('user_id', userId)
      .is('title', null)
  }
  return { userId: userRow?.id ?? null, assistantId: assistantRow?.id ?? null }
}

/* ── kind 'chat' ──────────────────────────────────────────────────────────
   The conversational surface — Tally answers over the book's own rows plus
   the last CHAT_HISTORY turns, and acts only through executeChatAction's
   whitelist. A chat-created order lands 'queued' — the same draft state a
   bot proposal ships in; nothing fills itself. */

export async function runChat(
  adminClient: SupabaseClient,
  userId: string,
  message: string,
  lang: 'en' | 'fr',
  stream: boolean,
  advice: boolean,
  threadId: string | null = null,
): Promise<Response> {
  const routed = await modelRoute(adminClient)
  if ('error' in routed) return routed.error
  const { route, provider, apiKey } = routed

  /* Context history scopes to the same thread — a named conversation must
     not leak turns from the default one into the model window. */
  let histQuery = adminClient.from('invest_chat_messages')
    .select('role, content')
    .eq('user_id', userId)
  histQuery = threadId === null
    ? histQuery.is('thread_id', null)
    : histQuery.eq('thread_id', threadId)
  const [book, { data: historyRows, error: histError }] = await Promise.all([
    loadBookContext(adminClient, userId),
    histQuery.order('created_at', { ascending: false }).limit(CHAT_HISTORY),
  ])
  if (histError) return json({ error: histError.message }, 500)

  /* A ticker named in the message but absent from the stored snapshots
     gets one live pull — "What about AMD?" should get numbers on the
     first ask, not a "watch it first" deflection. Bounded inside
     fetchOnDemandMarket; nothing persists. */
  const mentioned = extractMentionedSymbols(message)
  const covered = new Set(book.ctx.market.map((m) => m.symbol))
  const missing = mentioned.filter((s) => !covered.has(s))
  const onDemand = missing.length > 0 ? await fetchOnDemandMarket(missing) : []
  const chatCtx: InvestChatContext = {
    ...book.ctx,
    market: [...book.ctx.market, ...onDemand],
  }

  const history: UpstreamMessage[] = ((historyRows ?? []) as { role: string; content: string }[])
    .reverse()
    .map((r) => ({
      role: r.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: r.content.slice(0, 1500),
    }))

  const baseMessages: UpstreamMessage[] = [
    investChatPrompt(chatCtx, lang, { advice }),
    ...history,
    { role: 'user', content: message },
  ]

  /* Reply content is never emitted before the fetch loop and the claim
     verifier have both had their pass — content pieces are buffered even
     when the upstream call itself streams. Reasoning pieces are different:
     they're the model's working, not its answer, so they flow straight to
     the client's thinking panel as they arrive and persist on the turn. */
  const extras = routeBodyExtras(route.config)
  interface ModelRound {
    raw: string
    parsed: InvestChatReply | null
    /** The round's reasoning_content — '' when the model doesn't emit any. */
    reasoning: string
  }
  const callModel = async (
    extra: {
      fetched?: MarketContextEntry[]
      web?: { query: string; results: WebResult[] }
      draft?: string
      repairNote?: string
    } = {},
    onReasoning?: (piece: string) => void,
  ): Promise<ModelRound | null> => {
    const messages: UpstreamMessage[] = [...baseMessages]
    if (extra.draft) messages.push({ role: 'assistant', content: extra.draft })
    if (extra.fetched && extra.fetched.length > 0) {
      messages.push({
        role: 'system',
        content:
          'Market data pulled live for this turn — treat it as on file; the same grounding rules apply:\n' +
          extra.fetched.map(formatMarketEntry).join('\n'),
      })
    }
    /* Live web results the model asked for — marked untrusted by the block
       itself; the grounding rules still apply to anything it cites. */
    if (extra.web) {
      messages.push({
        role: 'system',
        content: extra.web.results.length > 0
          ? formatWebResultsBlock(extra.web.query, extra.web.results, lang)
          : lang === 'fr'
            ? `La recherche web pour « ${extra.web.query} » n'a rien retourné — dis-le plutôt que d'inventer.`
            : `The web search for "${extra.web.query}" returned nothing — say so rather than invent.`,
      })
    }
    if (extra.repairNote) messages.push({ role: 'system', content: extra.repairNote })
    try {
      const upstream = await postChatCompletion(
        provider,
        apiKey,
        {
          model: route.model_name,
          messages,
          /* Analysis replies run longer than chit-chat — the JSON contract
             asks for a verdict + labeled sections on those asks. */
          max_tokens: route.config?.max_tokens ?? 900,
          temperature: 0.4,
          /* Streaming upstream only when a listener wants the reasoning
             pieces live — the content side stays buffered either way. */
          stream: onReasoning !== undefined,
          ...extras,
        },
        UPSTREAM_TIMEOUT_MS,
      )
      if (!upstream.ok) {
        console.error('invest-ai chat: upstream rejected', upstream.status)
        return null
      }
      if (onReasoning) {
        const { text, reasoning } = await readUpstreamCompletion(upstream, () => {}, onReasoning)
        return { raw: text, parsed: parseInvestChatReply(text), reasoning }
      }
      const completion = await upstream.json()
      const msg = completion?.choices?.[0]?.message ?? {}
      const raw = msg.content
      return {
        raw: typeof raw === 'string' ? raw : '',
        parsed: parseInvestChatReply(raw),
        reasoning: typeof msg.reasoning_content === 'string' ? msg.reasoning_content : '',
      }
    } catch (e) {
      console.error('invest-ai chat: model call failed', e)
      return null
    }
  }

  /* The rounds pipeline — fetch loop, verify, repair, action, persist —
     shared by the streamed and plain responses. Reasoning accumulates
     across rounds: a fetch-request or repair round's working is still the
     turn's thinking, so it stays on the record. */
  interface ChatOutcome {
    reply: string
    action: ExecutedAction | null
    suggests: string[]
    reasoning: string
    sources: ChatSource[]
    userId: string | null
    assistantId: string | null
  }
  const runPipeline = async (
    onReasoning?: (piece: string) => void,
    onStatus?: (code: string) => void,
  ): Promise<{ error: string } | ChatOutcome> => {
    let reasoning = ''
    let webResults: WebResult[] = []
    let webQuery = ''
    let round = await callModel({}, onReasoning)
    if (!round) return { error: 'The AI service is temporarily unavailable.' }
    reasoning = round.reasoning

    /* Fetch+search hop — one bounded detour. The model may hold its answer
       and name tickers to pull, a web query to run, or both; the data
       lands and the question repeats. Round two cannot ask again (reply
       required). Web results stay in scope for the sources block. */
    let parsed = round.parsed
    if (parsed && parsed.reply === '' && (parsed.fetch.length > 0 || parsed.search)) {
      const want = parsed.fetch.filter((s) => !covered.has(s))
      if (parsed.search) {
        onStatus?.('web_search')
        webQuery = parsed.search
      }
      const [fetched, searched] = await Promise.all([
        want.length > 0 ? fetchOnDemandMarket(want) : Promise.resolve([]),
        parsed.search ? webSearch(parsed.search) : Promise.resolve([]),
      ])
      for (const e of fetched) covered.add(e.symbol)
      chatCtx.market = [...chatCtx.market, ...fetched]
      webResults = searched
      round = await callModel(
        {
          fetched,
          ...(parsed.search ? { web: { query: webQuery, results: webResults } } : {}),
        },
        onReasoning,
      )
      if (!round) return { error: 'The AI service is temporarily unavailable.' }
      if (round.reasoning) reasoning += `\n\n${round.reasoning}`
      parsed = round.parsed
    }
    if (!parsed || parsed.reply === '') {
      return { error: 'Model returned no usable reply' }
    }

    /* Verify pass — deterministic, not another model opinion. Labeled
       metric claims that match no row on file go back for one repair
       rewrite; a repair that still cites wrong figures ships anyway but
       gets logged — blocking the whole turn over one number is worse than
       the note. */
    const mismatches = verifyReplyClaims(parsed.reply, chatCtx.market)
    if (mismatches.length > 0) {
      console.warn('invest-ai reply cited figures off-file', JSON.stringify(mismatches))
      const repaired = await callModel(
        { draft: round.raw, repairNote: buildRepairNote(mismatches) },
        onReasoning,
      )
      if (repaired?.parsed?.reply) {
        const residual = verifyReplyClaims(repaired.parsed.reply, chatCtx.market)
        if (residual.length > 0) {
          console.warn('invest-ai residual mismatches after repair', JSON.stringify(residual))
        }
        if (repaired.reasoning) reasoning += `\n\n${repaired.reasoning}`
        parsed = repaired.parsed
      }
    }

    const executed = parsed.action
      ? await executeChatAction(adminClient, userId, parsed.action, {
          accounts: book.accounts,
          watchlist: book.watchlist,
          signals: book.signals,
          route,
          provider,
          apiKey,
          lang,
          advice,
        })
      : null
    /* Sources ride the verified reply — computed after repair so a replaced
       answer can't cite rows it no longer uses. Web results the model saw
       join the same list — that's the point of the sources block. */
    const sources = mergeSources(chatSources(chatCtx, parsed.reply), webSources(webResults))
    const ids = await persistChatTurns(
      adminClient,
      userId,
      message,
      parsed.reply,
      executed,
      threadId,
      reasoning,
      sources,
    )
    return {
      reply: parsed.reply,
      action: executed,
      suggests: parsed.suggests,
      reasoning,
      sources,
      ...ids,
    }
  }

  if (stream) {
    /* The channel opens before the first upstream call so reasoning pieces
       arrive while the model thinks — the verified reply's deltas still
       leave only after the pipeline. */
    const sse = sseChannel()
    void (async () => {
      try {
        const out = await runPipeline(
          (piece) => sse.send({ type: 'reasoning', text: piece }),
          (code) => sse.send({ type: 'status', code }),
        )
        if ('error' in out) {
          sse.send({ type: 'error', error: out.error })
          return
        }
        for (let i = 0; i < out.reply.length; i += 120) {
          sse.send({ type: 'delta', text: out.reply.slice(i, i + 120) })
        }
        sse.send({ type: 'done', ...out, reasoning: out.reasoning || null })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        sse.close()
      }
    })()
    return sse.response
  }

  const out = await runPipeline()
  if ('error' in out) {
    return json({ error: out.error, code: 'upstream' }, 502)
  }
  return json({ ...out, reasoning: out.reasoning || null })
}
