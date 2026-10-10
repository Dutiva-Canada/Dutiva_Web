import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import {
  postChatCompletion,
  readUpstreamText,
  resolveApiKey,
} from '../_shared/modelUpstream.ts'
import { createReplyDeltaExtractor } from '../_shared/replyDelta.ts'
import {
  investChatPrompt,
  parseInvestChatReply,
  type InvestChatContext,
  type InvestChatReply,
} from './handlers.ts'
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
  ] = await Promise.all([
    adminClient.from('invest_accounts')
      .select('id, name, kind, base_currency, cash_balance, status')
      .eq('user_id', userId).eq('status', 'active').limit(CHAT_LIST_CAP),
    adminClient.from('invest_positions')
      .select('symbol, name, quantity, last_price, currency')
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
  ])

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

  const history = ((historyRows ?? []) as { role: string; content: string }[])
    .reverse()
    .map((r) => ({
      role: r.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: r.content.slice(0, 1500),
    }))

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      provider,
      apiKey,
      {
        model: route.model_name,
        messages: [
          investChatPrompt(book.ctx, lang, { advice }),
          ...history,
          { role: 'user', content: message },
        ],
        max_tokens: route.config?.max_tokens ?? 500,
        temperature: 0.4,
        stream,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (error) {
    console.error('invest-ai chat: model call failed', error)
    return json({ error: 'The AI service is temporarily unavailable.', code: 'upstream' }, 502)
  }
  if (!upstream.ok) {
    return json({ error: 'The AI service is temporarily unavailable.', code: 'upstream' }, 502)
  }

  if (stream) {
    /* SSE out, SSE in — but only the reply text streams through. The model's
       output is one JSON object; createReplyDeltaExtractor emits its reply
       field without the scaffolding, so the action JSON never leaks into
       the bubble. The done event carries the parsed payload + row ids. */
    const sse = sseChannel()
    const extractor = createReplyDeltaExtractor()
    void (async () => {
      try {
        const fullText = await readUpstreamText(upstream, (piece) => {
          const visible = extractor.push(piece)
          if (visible) sse.send({ type: 'delta', text: visible })
        })
        const parsed: InvestChatReply | null = parseInvestChatReply(fullText)
        if (!parsed) {
          sse.send({ type: 'error', error: 'Model returned no usable reply', code: 'unparseable' })
          return
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
        const ids = await persistChatTurns(
          adminClient,
          userId,
          message,
          parsed.reply,
          executed,
          threadId,
        )
        sse.send({
          type: 'done',
          reply: parsed.reply,
          action: executed,
          suggests: parsed.suggests,
          ...ids,
        })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        sse.close()
      }
    })()
    return sse.response
  }

  const completion = await upstream.json()
  const parsed = parseInvestChatReply(completion?.choices?.[0]?.message?.content)
  if (!parsed) return json({ error: 'Model returned no usable reply', code: 'unparseable' }, 502)

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
  const ids = await persistChatTurns(
    adminClient,
    userId,
    message,
    parsed.reply,
    executed,
    threadId,
  )

  return json({
    reply: parsed.reply,
    action: executed,
    suggests: parsed.suggests,
    ...ids,
  })
}
