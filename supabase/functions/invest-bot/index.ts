import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  applyFill,
  CADENCES,
  draftKey,
  parseRules,
  planRun,
  signalKey,
  strategyDue,
  validateBotAction,
  type MarketSnapshot,
  type Position,
  type Strategy,
  type StrategyCadence,
} from './handlers.ts'
import { maybeEmitInsights } from './insights.ts'

/**
 * Invest-bot edge function — evaluates each user's enabled strategies
 * against the symbols in each strategy's scope, emits signals, and turns
 * order-proposal rules into DRAFT orders that wait in the Orders tab for
 * explicit user approval. The bot never executes anything itself; the only
 * fill path is the user-invoked execute-order action below.
 *
 * Actions (POST body):
 *   { action: 'run' }                          — invest-portal JWT; scans the
 *                                                caller's strategies now
 *                                                (manual scans ignore the
 *                                                cadence window).
 *   { action: 'run-all' }                      — service key / trigger
 *                                                secret (nightly sweep), or
 *                                                a portal JWT whose grant is
 *                                                role 'admin'. Cadence-gated.
 *   { action: 'test-scan', rules, symbols }    — invest-portal JWT; dry-run
 *                                                diagnostics for a draft
 *                                                strategy. Writes nothing.
 *   { action: 'execute-order', order_id }      — invest-portal JWT; executes a
 *                                                draft/queued paper order at
 *                                                the snapshot price, or
 *                                                confirms a live order at
 *                                                the caller-provided fill.
 *
 * Deliberate scope: market data comes from invest_market_snapshots (manual
 * or future feed adapters); no broker calls are ever made — 'live' orders
 * are bookkeeping that a human confirms.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-trigger-secret',
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

/** Same contract as monitor-law-changes / candidate-job-agent. */
function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && req.headers.get('x-trigger-secret') === sharedSecret) return true

  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (token === '') return false

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
  return (serviceKey !== '' && token === serviceKey) || (secretKey !== '' && token === secretKey)
}

/**
 * Portal JWT → the caller's user id, gated on the invest_access grant table
 * — access is invite-only; no row, no run.
 */
async function authenticateInvestUser(
  req: Request,
  config: ServerConfig,
  options: { requireAdmin?: boolean } = {},
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
  if (options.requireAdmin && access.role !== 'admin') {
    return json({ error: 'Admin access required', code: 'not_admin' }, 403)
  }

  return { userId: userData.user.id, adminClient }
}

/** A test scan evaluates caller-supplied symbols — cap the request so a
    draft strategy can't turn into an unbounded read. */
const MAX_TEST_SYMBOLS = 64

interface StrategyRow {
  id: string
  enabled: boolean
  rules: unknown
  cadence: unknown
  last_evaluated_at: unknown
  scope?: unknown
}

/** Reads strategies with the 0184 columns when present; falls back to a
    scope covering every known symbol when the migration hasn't landed yet,
    so the bot keeps working through a code-before-schema deploy. */
async function loadStrategies(
  adminClient: SupabaseClient,
  userId: string,
  allSymbols: string[],
): Promise<{ strategies: Strategy[]; scoped: boolean }> {
  const select = 'id, enabled, rules, cadence, last_evaluated_at, scope'
  const res = await adminClient.from('invest_strategies').select(select).eq('user_id', userId)

  let rows: StrategyRow[]
  let scoped = true
  if (res.error && /scope/.test(res.error.message)) {
    const fallback = await adminClient
      .from('invest_strategies')
      .select('id, enabled, rules, cadence, last_evaluated_at')
      .eq('user_id', userId)
    if (fallback.error) throw new Error(fallback.error.message)
    rows = (fallback.data ?? []) as StrategyRow[]
    scoped = false
  } else {
    if (res.error) throw new Error(res.error.message)
    rows = (res.data ?? []) as StrategyRow[]
  }

  return {
    scoped,
    strategies: rows.map((r) => {
      const scope = (r.scope ?? null) as { watchlist?: unknown; symbols?: unknown } | null
      const scopeSymbols = scoped
        ? [
            ...(Array.isArray(scope?.symbols) ? (scope.symbols as string[]) : []),
            ...(scope?.watchlist === true ? allSymbols : []),
          ]
        : allSymbols
      return {
        id: r.id as string,
        enabled: r.enabled === true,
        scope_symbols: [...new Set(scopeSymbols.map((s) => String(s).toUpperCase()))],
        rules: parseRules(r.rules),
        cadence: CADENCES.includes(r.cadence as string) ? (r.cadence as StrategyCadence) : 'daily',
        last_evaluated_at: (r.last_evaluated_at as string | null) ?? null,
      }
    }),
  }
}

/* ── Org run ─────────────────────────────────────────────────────────────── */

async function runUser(
  adminClient: SupabaseClient,
  userId: string,
  opts: { force?: boolean } = {},
): Promise<Record<string, unknown>> {
  const startedAt = Date.now()
  const [snapshotsRes, positionsRes, signalsRes, accountsRes, watchlistRes, draftsRes] =
    await Promise.all([
      adminClient
        .from('invest_market_snapshots')
        .select('asset_class, symbol, price, day_change_pct, ma50, currency')
        .eq('user_id', userId),
      adminClient
        .from('invest_positions')
        .select('id, account_id, asset_class, symbol, name, quantity, avg_cost')
        .eq('user_id', userId),
      adminClient
        .from('invest_signals')
        .select('strategy_id, symbol, kind, title')
        .eq('user_id', userId)
        .eq('status', 'new'),
      adminClient
        .from('invest_accounts')
        .select('cash_balance')
        .eq('user_id', userId)
        .eq('status', 'active'),
      adminClient.from('invest_watchlist').select('symbol').eq('user_id', userId),
      adminClient
        .from('invest_orders')
        .select('strategy_id, symbol, note')
        .eq('user_id', userId)
        .eq('status', 'draft'),
    ])
  for (const res of [snapshotsRes, positionsRes, signalsRes, accountsRes, watchlistRes]) {
    if (res.error) throw new Error(res.error.message)
  }
  /* draftsRes may 42703 on a pre-0184 schema (no strategy_id column) —
     degrade to no proposal dedupe rather than failing the run. */
  const openDraftKeys = new Set(
    (draftsRes.error ? [] : (draftsRes.data ?? [])).map((o) =>
      draftKey({
        strategy_id: o.strategy_id as string | null,
        symbol: o.symbol as string,
        note: (o.note as string | null) ?? null,
      }),
    ),
  )

  const snapshots = (snapshotsRes.data ?? []) as MarketSnapshot[]
  const positions = (positionsRes.data ?? []) as (Position & { id: string; name: string })[]
  /* Scope resolution universe: held symbols ∪ watched symbols — the set
     market-sync keeps snapshots fresh for. */
  const knownSymbols = [
    ...new Set(
      [
        ...positions.map((p) => p.symbol),
        ...(watchlistRes.data ?? []).map((w) => w.symbol as string),
      ].map((s) => s.toUpperCase()),
    ),
  ]
  const { strategies } = await loadStrategies(adminClient, userId, knownSymbols)

  const cashTotal = (accountsRes.data ?? []).reduce((sum, a) => sum + Number(a.cash_balance), 0)
  const existingKeys = new Set(
    (signalsRes.data ?? []).map((s) =>
      signalKey({
        strategy_id: s.strategy_id as string,
        symbol: s.symbol as string,
        kind: s.kind as string,
        title: s.title as string,
      }),
    ),
  )

  const plan = planRun(strategies, snapshots, positions, existingKeys, {
    cashTotal,
    force: opts.force === true,
    openDraftKeys,
  })

  /* Stamp the evaluation clock on strategies that were actually due — a
     weekly strategy that ran today must not re-fire tomorrow even if it
     emitted nothing. Manual scans stamp too: cadence means "at most". */
  const evaluatedIds = strategies
    .filter(
      (s) => s.enabled && s.rules.length > 0 && (opts.force === true || strategyDue(s, new Date())),
    )
    .map((s) => s.id)
  if (evaluatedIds.length > 0) {
    await adminClient
      .from('invest_strategies')
      .update({ last_evaluated_at: new Date().toISOString() })
      .in('id', evaluatedIds)
  }

  /* Insert signals. */
  let writesFailed = false
  for (const signal of plan.signals) {
    const { error } = await adminClient.from('invest_signals').insert({
      user_id: userId,
      strategy_id: signal.strategy_id,
      asset_class: signal.asset_class,
      symbol: signal.symbol,
      name: signal.name,
      kind: signal.kind,
      title: signal.title,
      body: signal.body,
      score: signal.score,
    })
    if (error) writesFailed = true
  }

  /* Order proposals → DRAFT orders on the first active paper account.
     Nothing executes: approval happens in the Orders tab via
     execute-order, and only ever at the user's request. */
  const { data: paperAccount } = await adminClient
    .from('invest_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('kind', 'paper')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  let proposalsCreated = 0
  const proposalsByStrategy = new Map<string, number>()
  if (plan.proposals.length > 0) {
    if (!paperAccount) {
      plan.warnings.push('order proposals skipped — no active paper account')
    } else {
      for (const proposal of plan.proposals) {
        const { error } = await adminClient.from('invest_orders').insert({
          user_id: userId,
          account_id: paperAccount.id,
          strategy_id: proposal.strategy_id,
          asset_class: proposal.asset_class,
          symbol: proposal.symbol,
          name: proposal.name,
          side: proposal.side,
          quantity: proposal.quantity,
          order_type: 'market',
          mode: 'paper',
          status: 'draft',
          requested_price: proposal.requested_price,
          note: proposal.note,
        })
        if (error) {
          writesFailed = true
          continue
        }
        proposalsCreated += 1
        proposalsByStrategy.set(
          proposal.strategy_id,
          (proposalsByStrategy.get(proposal.strategy_id) ?? 0) + 1,
        )
      }
    }
  }

  /* AI insight pass — bilingual plain-language observations on the run.
     Never fatal: a model outage must not lose the deterministic signals. */
  const insights = await maybeEmitInsights(adminClient, {
    snapshots,
    positions,
    cashTotal,
    signalsEmitted: plan.signals.length,
    ordersPlanned: plan.proposals.length,
  })
  for (const insight of insights) {
    await adminClient.from('invest_signals').insert({
      user_id: userId,
      strategy_id: null,
      asset_class: 'other',
      symbol: '',
      name: '',
      kind: 'insight',
      title: insight.title_en,
      title_fr: insight.title_fr,
      body: insight.body_en,
      body_fr: insight.body_fr,
      score: null,
    })
  }

  /* Run history is per strategy — one row for each strategy evaluated this
     sweep, so rule_hits and symbols_scanned never mix across strategies
     that share a rule title. Proposals count what was actually inserted. */
  const durationMs = Date.now() - startedAt
  const runRows: Record<string, unknown>[] = plan.perStrategy.map((s) => {
    return {
      user_id: userId,
      strategy_id: s.strategyId,
      signals_emitted: s.signals,
      orders_suggested: proposalsByStrategy.get(s.strategyId) ?? 0,
      orders_executed: 0,
      summary: `${s.symbolsScanned.length} symbol(s) scanned`,
      status: writesFailed ? 'partial' : 'ok',
      symbols_scanned: s.symbolsScanned,
      rule_hits: s.ruleHits,
      duration_ms: durationMs,
    }
  })
  if (insights.length > 0 || runRows.length === 0) {
    runRows.push({
      user_id: userId,
      strategy_id: null,
      signals_emitted: insights.length,
      orders_suggested: 0,
      orders_executed: 0,
      summary: `${plan.symbolsScanned.length} symbol(s) scanned`,
      status: writesFailed ? 'partial' : 'ok',
      symbols_scanned: plan.symbolsScanned,
      rule_hits: {},
      duration_ms: durationMs,
    })
  }
  const runInsert = await adminClient.from('invest_bot_runs').insert(runRows)
  if (
    runInsert.error &&
    /strategy_id|symbols_scanned|rule_hits|duration_ms/.test(runInsert.error.message)
  ) {
    /* Pre-0184 schema — record a single flat row without diagnostics. */
    await adminClient.from('invest_bot_runs').insert({
      user_id: userId,
      signals_emitted: plan.signals.length + insights.length,
      orders_suggested: proposalsCreated,
      orders_executed: 0,
      summary: `${plan.symbolsScanned.length} symbol(s) scanned`,
      status: writesFailed ? 'partial' : 'ok',
    })
  }

  return {
    scanned: plan.symbolsScanned,
    signals: plan.signals.length,
    proposals: proposalsCreated,
    ruleHits: plan.ruleHits,
    warnings: plan.warnings,
    durationMs: Date.now() - startedAt,
  }
}

/* ── Test scan (dry run — evaluates a draft strategy, writes nothing) ────── */

async function testScan(
  adminClient: SupabaseClient,
  userId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const rules = parseRules(body['rules'])
  const symbols = Array.isArray(body['symbols'])
    ? [
        ...new Set(
          (body['symbols'] as unknown[]).map((s) => String(s).toUpperCase()).filter(Boolean),
        ),
      ]
    : []
  if (rules.length === 0) return json({ error: 'No valid rules', code: 'no_rules' }, 400)
  if (symbols.length === 0) return json({ error: 'No symbols in scope', code: 'no_scope' }, 400)
  if (symbols.length > MAX_TEST_SYMBOLS) {
    return json(
      { error: `Too many symbols (max ${MAX_TEST_SYMBOLS})`, code: 'too_many_symbols' },
      400,
    )
  }

  const [snapshotsRes, positionsRes, accountsRes] = await Promise.all([
    adminClient
      .from('invest_market_snapshots')
      .select('asset_class, symbol, price, day_change_pct, ma50, currency')
      .eq('user_id', userId),
    adminClient
      .from('invest_positions')
      .select('id, account_id, asset_class, symbol, name, quantity, avg_cost')
      .eq('user_id', userId),
    adminClient
      .from('invest_accounts')
      .select('cash_balance')
      .eq('user_id', userId)
      .eq('status', 'active'),
  ])
  for (const res of [snapshotsRes, positionsRes, accountsRes]) {
    if (res.error) return json({ error: res.error.message }, 500)
  }

  const cashTotal = (accountsRes.data ?? []).reduce((sum, a) => sum + Number(a.cash_balance), 0)
  const draft: Strategy = {
    id: 'test-scan',
    enabled: true,
    scope_symbols: symbols,
    rules,
    cadence: 'daily',
    last_evaluated_at: null,
  }
  const plan = planRun(
    [draft],
    (snapshotsRes.data ?? []) as MarketSnapshot[],
    (positionsRes.data ?? []) as Position[],
    new Set(),
    { cashTotal, force: true },
  )
  return json({
    symbolsScanned: plan.symbolsScanned,
    ruleHits: plan.ruleHits,
    signals: plan.signals.length,
    proposals: plan.proposals.length,
    warnings: plan.warnings,
  })
}

/* ── Manual order execution (paper fills + live confirmations) ────────────── */

async function executeOrder(
  adminClient: SupabaseClient,
  userId: string,
  orderId: string,
  fillPrice: number | null,
): Promise<Response> {
  const { data: order } = await adminClient
    .from('invest_orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!order) return json({ error: 'Order not found' }, 404)
  if (!['draft', 'queued'].includes(order.status as string)) {
    return json({ error: `Order is ${order.status}`, code: 'not_executable' }, 409)
  }

  let price = fillPrice
  if (price === null) {
    if (order.mode === 'live') {
      return json({ error: 'Live orders need an explicit fill price', code: 'fill_required' }, 400)
    }
    const { data: snap } = await adminClient
      .from('invest_market_snapshots')
      .select('price')
      .eq('user_id', userId)
      .eq('asset_class', order.asset_class)
      .eq('symbol', order.symbol)
      .maybeSingle()
    price = snap ? Number(snap.price) : (order.limit_price as number | null)
  }
  if (price === null || !Number.isFinite(price) || price <= 0) {
    return json({ error: 'No price available to execute at', code: 'no_price' }, 409)
  }

  const qty = Number(order.quantity)
  const side = order.side as 'buy' | 'sell'
  const now = new Date().toISOString()

  const { data: position } = await adminClient
    .from('invest_positions')
    .select('id, quantity, avg_cost')
    .eq('account_id', order.account_id)
    .eq('asset_class', order.asset_class)
    .eq('symbol', order.symbol)
    .maybeSingle()
  const fill = applyFill(
    position
      ? {
          account_id: '',
          asset_class: order.asset_class,
          symbol: order.symbol,
          quantity: Number(position.quantity),
          avg_cost: Number(position.avg_cost),
        }
      : null,
    side,
    qty,
    price,
  )

  if (position) {
    await adminClient
      .from('invest_positions')
      .update({
        quantity: fill.quantity,
        avg_cost: fill.avg_cost,
        last_price: price,
        last_price_at: now,
        updated_at: now,
      })
      .eq('id', position.id)
  } else if (side === 'buy') {
    await adminClient.from('invest_positions').insert({
      user_id: userId,
      account_id: order.account_id,
      asset_class: order.asset_class,
      symbol: order.symbol,
      name: order.name,
      quantity: fill.quantity,
      avg_cost: fill.avg_cost,
      last_price: price,
      last_price_at: now,
    })
  }

  const cost = qty * price
  const { data: account } = await adminClient
    .from('invest_accounts')
    .select('cash_balance')
    .eq('id', order.account_id)
    .maybeSingle()
  if (account) {
    await adminClient
      .from('invest_accounts')
      .update({
        cash_balance: Number(account.cash_balance) + (side === 'sell' ? cost : -cost),
        updated_at: now,
      })
      .eq('id', order.account_id)
  }

  await adminClient
    .from('invest_orders')
    .update({ status: 'executed', executed_price: price, executed_at: now, updated_at: now })
    .eq('id', orderId)

  return json({ status: 'executed', executed_price: price })
}

/* ── Handler ─────────────────────────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const actionCheck = validateBotAction(body['action'])
  if (!actionCheck.ok) return json({ error: actionCheck.error }, 400)

  if (actionCheck.value === 'run-all') {
    /* Trigger secret / service key first; otherwise an admin-tier grant
       holder may invoke the sweep with their own portal JWT. */
    if (!isAuthorizedTrigger(req)) {
      const authed = await authenticateInvestUser(req, config, { requireAdmin: true })
      if (authed instanceof Response) return authed
    }
    const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey)
    /* Users with at least one enabled strategy — cheaper than sweeping all. */
    const { data: userRows } = await adminClient
      .from('invest_strategies')
      .select('user_id')
      .eq('enabled', true)
    const userIds = [...new Set((userRows ?? []).map((r) => r.user_id as string))]
    const results: Record<string, unknown>[] = []
    for (const userId of userIds) {
      try {
        results.push({ userId, ...(await runUser(adminClient, userId)) })
      } catch (error) {
        console.error('invest-bot: run failed', userId, error)
        results.push({ userId, error: String(error).slice(0, 200) })
      }
    }
    return json({ scanned: results.length, results })
  }

  const authed = await authenticateInvestUser(req, config)
  if (authed instanceof Response) return authed
  const { userId, adminClient } = authed

  if (actionCheck.value === 'run') {
    return json(await runUser(adminClient, userId, { force: true }))
  }

  if (actionCheck.value === 'test-scan') {
    return testScan(adminClient, userId, body)
  }

  /* execute-order */
  const orderId = typeof body['order_id'] === 'string' ? body['order_id'] : ''
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return json({ error: 'order_id must be a uuid' }, 400)
  }
  const fill =
    typeof body['fill_price'] === 'number' && body['fill_price'] > 0
      ? (body['fill_price'] as number)
      : null
  return executeOrder(adminClient, userId, orderId, fill)
})
