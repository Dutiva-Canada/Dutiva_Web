import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { fileSuggestion, textDedupeKey } from '../_shared/agentQueue.ts'
import {
  postChatCompletion,
  resolveApiKey,
} from '../_shared/modelUpstream.ts'
import {
  buildDraftPrompt,
  investChatPrompt,
  parseDraft,
  parseInvestChatReply,
  resolveInvestRef,
  sanitizeGoal,
  SYSTEM_PROMPT,
  validateAiAction,
  type InvestChatAction,
  type InvestChatContext,
} from './handlers.ts'

/**
 * invest-ai — AI assistance for the invest portal. Deliberately narrow: the
 * model *authors* strategy drafts; the deterministic invest-bot engine
 * executes them. A draft is validated server-side, returned disabled, and
 * only reaches the book after the user reviews and saves it.
 *
 * Actions (POST body, portal JWT + invest_access grant required):
 *   { action: 'draft-strategy', goal: string, lang?: 'en'|'fr' }
 *     → { draft: { name, cadence, asset_classes, rules } }
 *
 *   { kind: 'chat', message, lang?, today? } → { reply, action }
 *     — the portal assistant: answers over the book's own rows and executes
 *     whitelisted additive writes (watchlist add/remove, a QUEUED draft
 *     order — never a fill, signal status, a strategy draft filed for
 *     review). Both turns persist to invest_chat_messages.
 *   { kind: 'chat_history', limit? } → { turns }
 *   { kind: 'chat_clear' }           → { cleared: true }
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type SupabaseClient = ReturnType<typeof createClient>

interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
}

function serverConfig(): ServerConfig | Response {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }
  return { supabaseUrl, anonKey, serviceRoleKey }
}

async function authenticateInvestUser(
  req: Request,
  config: ServerConfig,
): Promise<{ userId: string; adminClient: SupabaseClient } | Response> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return json({ error: 'Missing bearer token' }, 401)

  const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey)
  const { data: userData, error: userError } = await adminClient.auth.getUser(token)
  if (userError || !userData?.user) return json({ error: 'Invalid user token' }, 401)

  const { data: access, error: accessError } = await adminClient
    .from('invest_access')
    .select('user_id, role')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return json({ error: accessError.message }, 500)
  if (!access) return json({ error: 'Invest access not granted', code: 'no_access' }, 403)

  return { userId: userData.user.id, adminClient }
}

/** Route lookup — `invest_ai` first, `advisor_chat` as the shared fallback
    (same contract as candidate-ai). */
async function activeModelRoute(adminClient: SupabaseClient) {
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
    if (error) return json({ error: error.message }, 500)
    const provider = route?.provider as { status?: string } | null | undefined
    if (route && provider && provider.status === 'active') {
      return { route, provider }
    }
  }
  return json({ error: 'No active model route configured' }, 503)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config

  const authed = await authenticateInvestUser(req, config)
  if (authed instanceof Response) return authed
  const { userId, adminClient } = authed

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  /* History read/clear need no model — they run through this function so the
     table's only writer is this code path (a client can't file its own
     'assistant' rows under the owner policy). */
  if (body['kind'] === 'chat_history') {
    const limit =
      typeof body['limit'] === 'number' && Number.isInteger(body['limit'])
        ? Math.min(Math.max(body['limit'], 1), 120)
        : 60
    const { data, error } = await adminClient
      .from('invest_chat_messages')
      .select('id, role, content, action, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return json({ error: error.message }, 500)
    return json({ turns: (data ?? []).reverse() })
  }
  if (body['kind'] === 'chat_clear') {
    const { error } = await adminClient
      .from('invest_chat_messages')
      .delete()
      .eq('user_id', userId)
    if (error) return json({ error: error.message }, 500)
    return json({ cleared: true })
  }
  if (body['kind'] === 'chat') {
    const message = typeof body['message'] === 'string' ? body['message'].trim().slice(0, 1200) : ''
    if (!message) return json({ error: 'message is required' }, 400)
    const lang = body['lang'] === 'fr' ? 'fr' : 'en'
    return await runChat(adminClient, userId, message, lang)
  }

  const actionCheck = validateAiAction(body['action'])
  if (!actionCheck.ok) return json({ error: actionCheck.error }, 400)

  /* draft-strategy */
  const goal = sanitizeGoal(body['goal'])
  if (!goal) return json({ error: 'goal must be at least 10 characters' }, 400)
  const lang = body['lang'] === 'fr' ? 'fr' : 'en'

  const routed = await activeModelRoute(adminClient)
  if (routed instanceof Response) return routed
  const { route, provider } = routed

  const keyResult = resolveApiKey(provider.secret_ref, (name) => Deno.env.get(name))
  if ('missingSecret' in keyResult) {
    return json({ error: `Missing secret ${keyResult.missingSecret}` }, 500)
  }

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      provider,
      keyResult.apiKey,
      {
        model: route.model_name,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildDraftPrompt(goal, lang) },
        ],
        max_tokens: route.config?.max_tokens ?? 900,
        temperature: 0.3,
      },
      45_000,
    )
  } catch (error) {
    console.error('invest-ai: model call failed', error)
    return json({ error: 'The AI service is temporarily unavailable.' }, 502)
  }
  if (!upstream.ok) {
    const errText = await upstream.text()
    console.error('invest-ai: upstream error', upstream.status, errText.slice(0, 300))
    return json({ error: 'The AI service is temporarily unavailable.' }, 502)
  }

  const completion = await upstream.json()
  const content = completion?.choices?.[0]?.message?.content
  if (typeof content !== 'string') return json({ error: 'Empty response from model' }, 502)

  const draft = parseDraft(content)
  if (!draft) {
    return json({ error: 'Could not turn that goal into a strategy — try describing it differently.', code: 'no_draft' }, 422)
  }

  /* File the draft for review — a wizard abandoned mid-edit shouldn't lose
     it. Deduped on the normalized goal so re-describing the same strategy
     returns the pending row instead of a twin; the draft itself ships
     disabled either way — the user reviews, then enables. */
  const shipped = { ...draft, enabled: false, autonomy: 'suggest', template: 'ai-draft' }
  const filed = await fileSuggestion(adminClient, {
    userId,
    surface: 'invest',
    kind: 'strategy',
    title: shipped.name,
    payload: { goal, draft: shipped },
    dedupeKey: textDedupeKey(goal),
  })
  return json({ draft: shipped, suggestionId: filed?.id ?? null })
})

/* ── kind 'chat' ──────────────────────────────────────────────────────────
   Context is the book's own rows — names, quantities, statuses — capped per
   list, plus the last CHAT_HISTORY turns. Actions execute through
   executeChatAction's whitelist only. A chat-created order lands 'queued' —
   the same draft state a bot proposal ships in; nothing fills itself. */

const CHAT_HISTORY = 20
const CHAT_LIST_CAP = 15

interface ExecutedAction {
  type: string
  /** Human-facing subject — the symbol, signal title, etc. */
  detail: string
  ok: boolean
  refId?: string
}

async function runChat(
  adminClient: SupabaseClient,
  userId: string,
  message: string,
  lang: 'en' | 'fr',
): Promise<Response> {
  const routed = await activeModelRoute(adminClient)
  if (routed instanceof Response) return routed
  const { route, provider } = routed
  const keyResult = resolveApiKey(provider.secret_ref, (name) => Deno.env.get(name))
  if ('missingSecret' in keyResult) {
    return json({ error: `Missing secret ${keyResult.missingSecret}` }, 500)
  }

  const [
    { data: accounts },
    { data: positions },
    { data: watchlist },
    { data: strategies },
    { data: signals },
    { data: orders },
    { data: historyRows },
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
    adminClient.from('invest_chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(CHAT_HISTORY),
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
      keyResult.apiKey,
      {
        model: route.model_name,
        messages: [
          investChatPrompt(ctx, lang),
          ...history,
          { role: 'user', content: message },
        ],
        max_tokens: route.config?.max_tokens ?? 500,
        temperature: 0.4,
      },
      45_000,
    )
  } catch (error) {
    console.error('invest-ai chat: model call failed', error)
    return json({ error: 'The AI service is temporarily unavailable.', code: 'upstream' }, 502)
  }
  if (!upstream.ok) {
    return json({ error: 'The AI service is temporarily unavailable.', code: 'upstream' }, 502)
  }
  const completion = await upstream.json()
  const parsed = parseInvestChatReply(completion?.choices?.[0]?.message?.content)
  if (!parsed) return json({ error: 'Model returned no usable reply', code: 'unparseable' }, 502)

  let executed: ExecutedAction | null = null
  if (parsed.action) {
    executed = await executeChatAction(adminClient, userId, parsed.action, {
      accounts: (accounts ?? []) as { id: string; name: string; kind: string }[],
      watchlist: (watchlist ?? []) as { id: string; symbol: string; asset_class: string }[],
      signals: (signals ?? []) as { id: string; title: string }[],
      route,
      provider,
      apiKey: keyResult.apiKey,
      lang,
    })
  }

  const nowIso = new Date().toISOString()
  await adminClient.from('invest_chat_messages').insert([
    { user_id: userId, role: 'user', content: message, created_at: nowIso },
    {
      user_id: userId,
      role: 'assistant',
      content: parsed.reply,
      action: executed,
      created_at: new Date(Date.parse(nowIso) + 1).toISOString(),
    },
  ])

  return json({ reply: parsed.reply, action: executed })
}

interface ChatActionDeps {
  accounts: { id: string; name: string; kind: string }[]
  watchlist: { id: string; symbol: string; asset_class: string }[]
  signals: { id: string; title: string }[]
  route: { model_name: string; config?: Record<string, unknown> | null }
  provider: Parameters<typeof postChatCompletion>[0]
  apiKey: string | null
  lang: 'en' | 'fr'
}

/** Execute a whitelisted action on the caller's own rows. An order lands
    'queued' — a draft the user executes themselves from the Orders tab; the
    function never fills it. A failure reports ok:false so the reply lands. */
async function executeChatAction(
  adminClient: SupabaseClient,
  userId: string,
  action: InvestChatAction,
  deps: ChatActionDeps,
): Promise<ExecutedAction> {
  switch (action.type) {
    case 'add_watch_symbol': {
      const { error } = await adminClient
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
      return { type: action.type, detail: action.symbol, ok: !error }
    }
    case 'remove_watch_symbol': {
      const target = resolveInvestRef(
        action.symbol,
        deps.watchlist as { id?: string; name?: string; symbol?: string }[],
      )
      if (!target?.id) return { type: action.type, detail: action.symbol, ok: false }
      const { error } = await adminClient
        .from('invest_watchlist')
        .delete()
        .eq('id', target.id)
        .eq('user_id', userId)
      return { type: action.type, detail: action.symbol, ok: !error, refId: target.id }
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
      return { type: action.type, detail: target.title || action.signalId, ok: !error, refId: action.signalId }
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
          45_000,
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
