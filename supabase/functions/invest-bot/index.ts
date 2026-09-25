import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  applyFill,
  parseRules,
  planRun,
  signalKey,
  validateBotAction,
  type MarketSnapshot,
  type Position,
  type Strategy,
} from './handlers.ts'

/**
 * Invest-bot edge function — evaluates each user's enabled strategies
 * against their market snapshots, emits signals, and (for paper_execute
 * strategies) fills paper orders at the snapshot price while updating
 * positions and the paper account's cash balance.
 *
 * Actions (POST body):
 *   { action: 'run' }                          — invest-portal JWT; runs the
 *                                                caller's book once.
 *   { action: 'run-all' }                      — service key / trigger
 *                                                secret; nightly sweep.
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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trigger-secret',
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
): Promise<{ userId: string; adminClient: SupabaseClient } | Response> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return json({ error: 'Missing bearer token' }, 401)

  const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey)
  const { data: userData, error: userError } = await adminClient.auth.getUser(token)
  if (userError || !userData?.user) return json({ error: 'Invalid user token' }, 401)

  const { data: access, error: accessError } = await adminClient
    .from('invest_access')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return json({ error: accessError.message }, 500)
  if (!access) return json({ error: 'Invest access not granted', code: 'no_access' }, 403)

  return { userId: userData.user.id, adminClient }
}

/* ── Org run ─────────────────────────────────────────────────────────────── */

async function runUser(
  adminClient: SupabaseClient,
  userId: string,
): Promise<Record<string, unknown>> {
  const [strategiesRes, snapshotsRes, positionsRes, signalsRes] = await Promise.all([
    adminClient.from('invest_strategies').select('id, enabled, asset_classes, rules, autonomy').eq('user_id', userId),
    adminClient.from('invest_market_snapshots').select('asset_class, symbol, price, day_change_pct, ma50, currency').eq('user_id', userId),
    adminClient.from('invest_positions').select('id, account_id, asset_class, symbol, name, quantity, avg_cost').eq('user_id', userId),
    adminClient.from('invest_signals').select('strategy_id, symbol, kind, title').eq('user_id', userId).eq('status', 'new'),
  ])

  const strategies: Strategy[] = (strategiesRes.data ?? []).map((r) => ({
    id: r.id as string,
    enabled: r.enabled === true,
    asset_classes: Array.isArray(r.asset_classes) ? (r.asset_classes as string[]) : [],
    rules: parseRules(r.rules),
    autonomy: r.autonomy === 'paper_execute' ? 'paper_execute' : 'suggest',
  }))
  const snapshots = (snapshotsRes.data ?? []) as MarketSnapshot[]
  const positions = (positionsRes.data ?? []) as (Position & { id: string; name: string })[]
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

  const plan = planRun(strategies, snapshots, positions, existingKeys)

  /* Insert signals; keep a key→signal id map for order back-links. */
  const signalIdByKey = new Map<string, string>()
  for (const signal of plan.signals) {
    const { data: row, error } = await adminClient
      .from('invest_signals')
      .insert({
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
      .select('id')
      .maybeSingle()
    if (!error && row) signalIdByKey.set(signalKey(signal), row.id as string)
  }

  /* Paper orders: pick the first active paper account as the book. */
  const { data: paperAccount } = await adminClient
    .from('invest_accounts')
    .select('id, cash_balance')
    .eq('user_id', userId)
    .eq('kind', 'paper')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  let ordersExecuted = 0
  if (paperAccount && plan.orders.length > 0) {
    const positionBySymbol = new Map<string, Position & { id: string }>()
    for (const p of positions) {
      positionBySymbol.set(`${p.asset_class}:${p.symbol}`, p)
    }
    let cash = Number(paperAccount.cash_balance)

    for (const order of plan.orders) {
      const cost = order.quantity * order.executed_price
      if (order.side === 'buy' && cash < cost) continue /* insufficient paper cash */
      const position = positionBySymbol.get(`${order.asset_class}:${order.symbol}`) ?? null
      const fill = applyFill(position, order.side, order.quantity, order.executed_price)

      const { data: orderRow } = await adminClient
        .from('invest_orders')
        .insert({
          user_id: userId,
          account_id: paperAccount.id,
          signal_id: signalIdByKey.get(order.signal_key) ?? null,
          asset_class: order.asset_class,
          symbol: order.symbol,
          name: order.name,
          side: order.side,
          quantity: order.quantity,
          order_type: 'market',
          mode: 'paper',
          status: 'executed',
          requested_price: order.executed_price,
          executed_price: order.executed_price,
          executed_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle()
      if (!orderRow) continue

      cash += order.side === 'sell' ? cost : -cost
      if (position) {
        await adminClient
          .from('invest_positions')
          .update({
            quantity: fill.quantity,
            avg_cost: fill.avg_cost,
            last_price: order.executed_price,
            last_price_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', position.id)
        position.quantity = fill.quantity
        position.avg_cost = fill.avg_cost
      } else if (order.side === 'buy') {
        const { data: newPos } = await adminClient
          .from('invest_positions')
          .insert({
            user_id: userId,
            account_id: paperAccount.id,
            asset_class: order.asset_class,
            symbol: order.symbol,
            name: order.name,
            quantity: fill.quantity,
            avg_cost: fill.avg_cost,
            last_price: order.executed_price,
            last_price_at: new Date().toISOString(),
          })
          .select('id')
          .maybeSingle()
        if (newPos) {
          const p: Position & { id: string } = {
            id: newPos.id as string,
            account_id: paperAccount.id as string,
            asset_class: order.asset_class,
            symbol: order.symbol,
            quantity: fill.quantity,
            avg_cost: fill.avg_cost,
          }
          positionBySymbol.set(`${order.asset_class}:${order.symbol}`, p)
          positions.push(p as Position & { id: string; name: string })
        }
      }
      ordersExecuted += 1
    }

    if (ordersExecuted > 0) {
      await adminClient
        .from('invest_accounts')
        .update({ cash_balance: cash, updated_at: new Date().toISOString() })
        .eq('id', paperAccount.id)
    }
  }

  await adminClient.from('invest_bot_runs').insert({
    user_id: userId,
    signals_emitted: plan.signals.length,
    orders_suggested: plan.orders.length,
    orders_executed: ordersExecuted,
    summary: `${plan.evaluated} snapshot(s) evaluated`,
    status: 'ok',
  })

  return {
    evaluated: plan.evaluated,
    signals: plan.signals.length,
    orders: plan.orders.length,
    executed: ordersExecuted,
  }
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
    position ? { account_id: '', asset_class: order.asset_class, symbol: order.symbol, quantity: Number(position.quantity), avg_cost: Number(position.avg_cost) } : null,
    side,
    qty,
    price,
  )

  if (position) {
    await adminClient
      .from('invest_positions')
      .update({ quantity: fill.quantity, avg_cost: fill.avg_cost, last_price: price, last_price_at: now, updated_at: now })
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
    if (!isAuthorizedTrigger(req)) return json({ error: 'Unauthorized' }, 401)
    const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey)
    /* Orgs with at least one enabled strategy — cheaper than sweeping all. */
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
    return json(await runUser(adminClient, userId))
  }

  /* execute-order */
  const orderId = typeof body['order_id'] === 'string' ? body['order_id'] : ''
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return json({ error: 'order_id must be a uuid' }, 400)
  }
  const fill = typeof body['fill_price'] === 'number' && body['fill_price'] > 0
    ? (body['fill_price'] as number)
    : null
  return executeOrder(adminClient, userId, orderId, fill)
})
