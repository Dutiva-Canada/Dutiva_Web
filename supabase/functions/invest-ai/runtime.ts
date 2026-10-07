import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import {
  postChatCompletion,
  readUpstreamText,
  resolveApiKey,
} from '../_shared/modelUpstream.ts'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import { createReplyDeltaExtractor } from '../_shared/replyDelta.ts'
import {
  buildDraftPrompt,
  investChatPrompt,
  investReactPrompt,
  parseDraft,
  parseInvestChatReply,
  resolveInvestRef,
  sanitizeGoal,
  SYSTEM_PROMPT,
  type InvestChatAction,
  type InvestChatContext,
  type InvestChatReply,
  type InvestReactEvent,
} from './handlers.ts'

/* Runtime for invest-ai — everything the serve() router delegates to: the
   chat and react kinds, their shared book-context load, action execution +
   undo, and the SSE plumbing. Kept out of index.ts so the router stays
   readable under the repo's file-size budget. Deno-only — the pure/prompt
   layer lives in handlers.ts where vitest can reach it. */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const UPSTREAM_TIMEOUT_MS = 45_000
const CHAT_HISTORY = 20
const CHAT_LIST_CAP = 15

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface ExecutedAction {
  type: string
  /** Human-facing subject — the symbol, signal title, etc. */
  detail: string
  ok: boolean
  /** Row id of the created/toggled row — lets the client offer undo. */
  refId?: string
  /** The watch row remove_watch_symbol deleted — undo re-inserts it. */
  restore?: { symbol: string; name: string; asset_class: string }
  /** The status update_signal replaced — undo puts it back. */
  prevStatus?: string
  /** Set once chat_undo reverses the write — the client hides the chip. */
  undone?: boolean
}

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

/** One Server-Sent-Events channel: send() emits `data: {…}` events, close()
    ends the stream. The pump runs after the Response is already returned. */
function sseChannel() {
  const ts = new TransformStream<Uint8Array, Uint8Array>()
  const writer = ts.writable.getWriter()
  const encoder = new TextEncoder()
  return {
    response: new Response(ts.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    }),
    send: (event: Record<string, unknown>) => {
      void writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    },
    close: () => {
      void writer.close()
    },
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
): Promise<{ userId: string | null; assistantId: string | null }> {
  const nowIso = new Date().toISOString()
  const { data: userRow } = await adminClient
    .from('invest_chat_messages')
    .insert({ user_id: userId, role: 'user', content: message, created_at: nowIso })
    .select('id')
    .single()
  const { data: assistantRow } = await adminClient
    .from('invest_chat_messages')
    .insert({
      user_id: userId,
      role: 'assistant',
      content: reply,
      action: executed,
      created_at: new Date(Date.parse(nowIso) + 1).toISOString(),
    })
    .select('id')
    .single()
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
): Promise<Response> {
  const routed = await modelRoute(adminClient)
  if ('error' in routed) return routed.error
  const { route, provider, apiKey } = routed

  const [book, { data: historyRows, error: histError }] = await Promise.all([
    loadBookContext(adminClient, userId),
    adminClient.from('invest_chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_HISTORY),
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
          investChatPrompt(book.ctx, lang),
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
            })
          : null
        const ids = await persistChatTurns(adminClient, userId, message, parsed.reply, executed)
        sse.send({ type: 'done', reply: parsed.reply, action: executed, ...ids })
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
      })
    : null
  const ids = await persistChatTurns(adminClient, userId, message, parsed.reply, executed)

  return json({ reply: parsed.reply, action: executed, ...ids })
}

interface ChatActionDeps {
  accounts: { id: string; name: string; kind: string }[]
  watchlist: { id: string; symbol: string; asset_class: string; name: string }[]
  signals: { id: string; title: string; status: string }[]
  route: { model_name: string; config?: Record<string, unknown> | null }
  provider: Provider
  apiKey: string | null
  lang: 'en' | 'fr'
}

/** Execute a whitelisted action on the caller's own rows. An order lands
    'queued' — a draft the user executes themselves from the Orders tab; the
    function never fills it. A failure reports ok:false so the reply lands.
    Undo metadata rides along: refId, the restore row for a watch removal,
    the previous status for a signal update. */
async function executeChatAction(
  adminClient: SupabaseClient,
  userId: string,
  action: InvestChatAction,
  deps: ChatActionDeps,
): Promise<ExecutedAction> {
  switch (action.type) {
    case 'add_watch_symbol': {
      const { data, error } = await adminClient
        .from('invest_watchlist')
        .upsert(
          {
            user_id: userId,
            asset_class: action.assetClass ?? 'equity',
            symbol: action.symbol,
            name: action.name ?? '',
          },
          { onConflict: 'user_id,asset_class,symbol' },
        )
        .select('id')
        .single()
      return { type: action.type, detail: action.symbol, ok: !error, refId: data?.id }
    }
    case 'remove_watch_symbol': {
      const target = resolveInvestRef(
        action.symbol,
        deps.watchlist as { id?: string; name?: string; symbol?: string }[],
      )
      if (!target?.id) return { type: action.type, detail: action.symbol, ok: false }
      const row = deps.watchlist.find((w) => w.id === target.id)
      const { error } = await adminClient
        .from('invest_watchlist')
        .delete()
        .eq('id', target.id)
        .eq('user_id', userId)
      return {
        type: action.type,
        detail: action.symbol,
        ok: !error,
        refId: target.id,
        /* What undo puts back — the delete throws the row away otherwise. */
        restore: row
          ? { symbol: String(row.symbol), name: String(row.name ?? ''), asset_class: String(row.asset_class) }
          : undefined,
      }
    }
    case 'create_order': {
      /* Resolve the account: named one wins; a single active account is the
         default. More than one unnamed → ask rather than guess. */
      const accounts = deps.accounts
      let accountId: string | null = null
      if (action.account) {
        const hit = resolveInvestRef(action.account, accounts)
        if (!hit?.id) return { type: action.type, detail: action.symbol, ok: false }
        accountId = hit.id
      } else if (accounts.length === 1) {
        accountId = accounts[0]!.id
      } else if (accounts.length === 0) {
        return { type: action.type, detail: action.symbol, ok: false }
      } else {
        return { type: action.type, detail: `${action.symbol} — account unclear`, ok: false }
      }
      const account = accounts.find((a) => a.id === accountId)
      const mode =
        action.mode ?? (account?.kind === 'paper' ? 'paper' : account?.kind === 'live' ? 'live' : 'paper')
      /* asset_class follows the watchlist row when the symbol is tracked —
         otherwise 'equity' is the table's default guess. */
      const watched = deps.watchlist.find(
        (w) => w.symbol.toUpperCase() === action.symbol.toUpperCase(),
      )
      /* The order lands 'queued' — the same draft state the bot's own
         proposals ship in. Nothing fills it but the Orders tab's manual
         execute action. */
      const { data, error } = await adminClient
        .from('invest_orders')
        .insert({
          user_id: userId,
          account_id: accountId,
          asset_class: watched?.asset_class ?? 'equity',
          symbol: action.symbol,
          name: action.symbol,
          side: action.side,
          quantity: action.quantity,
          order_type: action.orderType ?? 'market',
          limit_price: action.orderType === 'limit' ? (action.limitPrice ?? null) : null,
          mode,
          status: 'queued',
          note: action.note ?? null,
        })
        .select('id')
        .single()
      return {
        type: action.type,
        detail: `${action.side} ${action.quantity} ${action.symbol}`,
        ok: !error,
        refId: data?.id,
      }
    }
    case 'update_signal': {
      const target = deps.signals.find((s) => s.id === action.signalId)
      if (!target) return { type: action.type, detail: action.signalId, ok: false }
      const { error } = await adminClient
        .from('invest_signals')
        .update({ status: action.status })
        .eq('id', action.signalId)
        .eq('user_id', userId)
      return {
        type: action.type,
        detail: target.title || action.signalId,
        ok: !error,
        refId: action.signalId,
        prevStatus: target.status,
      }
    }
    case 'draft_strategy': {
      /* Run the existing draft pipeline — the model authors a draft the
         same way the wizard does, then files it for review. */
      const goal = sanitizeGoal(action.goal)
      if (!goal) return { type: action.type, detail: action.goal, ok: false }
      let upstream: Response
      try {
        upstream = await postChatCompletion(
          deps.provider,
          deps.apiKey,
          {
            model: deps.route.model_name,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: buildDraftPrompt(goal, deps.lang) },
            ],
            max_tokens: deps.route.config?.max_tokens ?? 900,
            temperature: 0.3,
          },
          UPSTREAM_TIMEOUT_MS,
        )
      } catch {
        return { type: action.type, detail: goal, ok: false }
      }
      if (!upstream.ok) return { type: action.type, detail: goal, ok: false }
      const completion = await upstream.json()
      const content = completion?.choices?.[0]?.message?.content
      const draft = typeof content === 'string' ? parseDraft(content) : null
      if (!draft) return { type: action.type, detail: goal, ok: false }
      const shipped = { ...draft, enabled: false, autonomy: 'suggest', template: 'ai-draft' }
      const filed = await fileSuggestion(adminClient, {
        userId,
        surface: 'invest',
        kind: 'strategy',
        title: shipped.name,
        payload: { goal, draft: shipped },
        dedupeKey: textDedupeKey(goal),
      })
      return { type: action.type, detail: shipped.name, ok: true, refId: filed?.id ?? undefined }
    }
  }
}

/* ── kind 'chat_undo' ────────────────────────────────────────────────────
   Reverses what an assistant turn's action wrote, where the write is still
   reversible: a queued order that hasn't moved, a watch row (deleted or
   added), a signal status, a filed strategy suggestion. Anything that has
   since changed hands — an executed order — reports not_undoable rather
   than rewriting it. The action payload sits on the assistant message
   row; undo marks it undone there so a reload doesn't offer the chip. */

async function undoChatAction(
  adminClient: SupabaseClient,
  userId: string,
  action: ExecutedAction,
): Promise<boolean> {
  switch (action.type) {
    case 'add_watch_symbol': {
      const { error } = await adminClient
        .from('invest_watchlist')
        .delete()
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    case 'remove_watch_symbol': {
      if (!action.restore?.symbol) return false
      const { error } = await adminClient
        .from('invest_watchlist')
        .upsert(
          {
            user_id: userId,
            asset_class: action.restore.asset_class,
            symbol: action.restore.symbol,
            name: action.restore.name,
          },
          { onConflict: 'user_id,asset_class,symbol' },
        )
      return !error
    }
    case 'create_order': {
      /* Only while it is still a draft — once the person executed or
         cancelled it the order is theirs, not ours to delete. */
      const { data: order, error: readError } = await adminClient
        .from('invest_orders')
        .select('status')
        .eq('id', action.refId as string)
        .eq('user_id', userId)
        .maybeSingle()
      if (readError || !order || !['draft', 'queued'].includes(String(order.status))) return false
      const { error } = await adminClient
        .from('invest_orders')
        .delete()
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    case 'update_signal': {
      if (typeof action.prevStatus !== 'string') return false
      const { error } = await adminClient
        .from('invest_signals')
        .update({ status: action.prevStatus })
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    case 'draft_strategy': {
      const { error } = await adminClient
        .from('agent_suggestions')
        .delete()
        .eq('id', action.refId as string)
        .eq('user_id', userId)
      return !error
    }
    default:
      return false
  }
}

export async function runChatUndo(
  adminClient: SupabaseClient,
  userId: string,
  messageId: string,
): Promise<Response> {
  const { data: msg, error } = await adminClient
    .from('invest_chat_messages')
    .select('id, action')
    .eq('id', messageId)
    .eq('user_id', userId)
    .eq('role', 'assistant')
    .maybeSingle()
  if (error) return json({ error: error.message }, 500)
  const action = (msg?.action ?? null) as ExecutedAction | null
  if (!msg || !action || !action.ok || action.undone === true || !action.refId) {
    return json({ error: 'Nothing to undo', code: 'not_undoable' }, 400)
  }
  if (!(await undoChatAction(adminClient, userId, action))) {
    return json({ error: 'Nothing to undo', code: 'not_undoable' }, 400)
  }
  const { error: markError } = await adminClient
    .from('invest_chat_messages')
    .update({ action: { ...action, undone: true } })
    .eq('id', messageId)
    .eq('user_id', userId)
  if (markError) return json({ error: markError.message }, 500)
  return json({ ok: true })
}

/* ── kind 'react' ─────────────────────────────────────────────────────────
   Tally reacts to what the person just did elsewhere on the book — a
   symbol watched, a draft order queued. No action grammar — one short
   plain-text line that persists to invest_chat_messages so it still exists
   on the next visit; the originating page renders it inline too. */

export function parseInvestReactEvent(raw: unknown): InvestReactEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const ev = raw as Record<string, unknown>
  if (ev.type === 'watch_added') {
    const symbol = typeof ev.symbol === 'string' ? ev.symbol.trim().slice(0, 12) : ''
    if (!symbol) return null
    return { type: 'watch_added', symbol }
  }
  if (ev.type === 'order_queued') {
    const symbol = typeof ev.symbol === 'string' ? ev.symbol.trim().slice(0, 12) : ''
    const side = ev.side === 'buy' || ev.side === 'sell' ? ev.side : null
    const quantity = Number(ev.quantity)
    if (!symbol || !side || !Number.isFinite(quantity) || quantity <= 0) return null
    return { type: 'order_queued', symbol, side, quantity }
  }
  return null
}

export async function runReact(
  adminClient: SupabaseClient,
  userId: string,
  event: InvestReactEvent,
  lang: 'en' | 'fr',
  stream: boolean,
): Promise<Response> {
  const routed = await modelRoute(adminClient)
  if ('error' in routed) return routed.error
  const { route, provider, apiKey } = routed
  const book = await loadBookContext(adminClient, userId)

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      provider,
      apiKey,
      {
        model: route.model_name,
        messages: [{ role: 'user', content: investReactPrompt(event, book.ctx, lang) }],
        temperature: 0.5,
        max_tokens: 160,
        stream,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (error) {
    console.error('invest-ai react: model call failed', error)
    return json({ error: 'The AI service is temporarily unavailable.', code: 'upstream' }, 502)
  }
  if (!upstream.ok) {
    return json({ error: 'The AI service is temporarily unavailable.', code: 'upstream' }, 502)
  }

  if (stream) {
    const sse = sseChannel()
    void (async () => {
      try {
        const reply = (
          await readUpstreamText(upstream, (piece) => {
            if (piece) sse.send({ type: 'delta', text: piece })
          })
        ).trim()
        if (!reply) {
          sse.send({ type: 'error', error: 'Model returned empty text', code: 'empty' })
          return
        }
        const { data: row } = await adminClient
          .from('invest_chat_messages')
          .insert({ user_id: userId, role: 'assistant', content: reply })
          .select('id')
          .single()
        sse.send({ type: 'done', reply, assistantId: row?.id ?? null })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        sse.close()
      }
    })()
    return sse.response
  }

  const completion = await upstream.json()
  const reply = (completion?.choices?.[0]?.message?.content ?? '').trim()
  if (!reply) return json({ error: 'Model returned empty text', code: 'empty' }, 502)

  const { data: row } = await adminClient
    .from('invest_chat_messages')
    .insert({ user_id: userId, role: 'assistant', content: reply })
    .select('id')
    .single()
  return json({ reply, assistantId: row?.id ?? null })
}
