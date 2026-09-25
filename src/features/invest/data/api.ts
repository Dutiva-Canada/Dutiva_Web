import { supabase } from '@/lib/supabaseClient'
import type {
  AssetClass,
  InvestAccount,
  InvestBotRun,
  InvestOrder,
  InvestPosition,
  InvestSignal,
  InvestStrategy,
  MarketSnapshot,
  OrderStatus,
  SignalStatus,
} from './types'

/**
 * Invest portal API — CRUD for the 0180 invest_* tables. Everything is
 * user-scoped: RLS restricts rows to the signed-in user (`auth.uid() =
 * user_id`), and access itself is gated by an `invest_access` grant row —
 * presence means the portal is open to them.
 *
 * `executeOrder` and `runBot` call the invest-bot edge function — the only
 * path that touches positions/cash from an order, so fills stay consistent.
 */

export interface InvestState {
  accounts: InvestAccount[]
  positions: InvestPosition[]
  snapshots: MarketSnapshot[]
  strategies: InvestStrategy[]
  signals: InvestSignal[]
  orders: InvestOrder[]
  runs: InvestBotRun[]
}

/** True when the signed-in user holds an invest_access grant. */
export async function hasInvestAccess(): Promise<boolean> {
  const client = supabase
  if (!client) return false
  const { data } = await client.from('invest_access').select('user_id').maybeSingle()
  return !!data
}

async function requireUserId(): Promise<{ client: NonNullable<typeof supabase>; userId: string }> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data: userData, error } = await client.auth.getUser()
  if (error || !userData.user) throw new Error('Not signed in')
  return { client, userId: userData.user.id }
}

export async function loadInvestState(): Promise<InvestState> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const [accounts, positions, snapshots, strategies, signals, orders, runs] = await Promise.all([
    client.from('invest_accounts').select('*'),
    client.from('invest_positions').select('*'),
    client
      .from('invest_market_snapshots')
      .select('*')
      .order('as_of', { ascending: false }),
    client.from('invest_strategies').select('*'),
    client
      .from('invest_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
    client
      .from('invest_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
    client
      .from('invest_bot_runs')
      .select('*')
      .order('ran_at', { ascending: false })
      .limit(50),
  ])
  for (const res of [accounts, positions, snapshots, strategies, signals, orders, runs]) {
    if (res.error) throw res.error
  }
  return {
    accounts: (accounts.data ?? []).map(toAccount),
    positions: (positions.data ?? []).map(toPosition),
    snapshots: (snapshots.data ?? []).map(toSnapshot),
    strategies: (strategies.data ?? []).map(toStrategy),
    signals: (signals.data ?? []).map(toSignal),
    orders: (orders.data ?? []).map(toOrder),
    runs: (runs.data ?? []).map(toRun),
  }
}

/* ── Accounts / positions ────────────────────────────────────────────────── */

export async function createAccount(input: {
  name: string
  kind: InvestAccount['kind']
  baseCurrency?: string
  cashBalance?: number
}): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client.from('invest_accounts').insert({
    user_id: userId,
    name: input.name,
    kind: input.kind,
    base_currency: input.baseCurrency ?? 'CAD',
    cash_balance: input.cashBalance ?? 0,
  })
  if (error) throw error
}

export async function createPosition(input: {
  accountId: string
  assetClass: AssetClass
  symbol: string
  name: string
  quantity: number
  avgCost: number
  currency?: string
}): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client.from('invest_positions').upsert(
    {
      user_id: userId,
      account_id: input.accountId,
      asset_class: input.assetClass,
      symbol: input.symbol.toUpperCase(),
      name: input.name,
      quantity: input.quantity,
      avg_cost: input.avgCost,
      currency: input.currency ?? 'CAD',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'account_id,asset_class,symbol' },
  )
  if (error) throw error
}

export async function upsertSnapshot(input: {
  assetClass: AssetClass
  symbol: string
  price: number
  dayChangePct?: number | null
  ma50?: number | null
  currency?: string
}): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client.from('invest_market_snapshots').upsert(
    {
      user_id: userId,
      asset_class: input.assetClass,
      symbol: input.symbol.toUpperCase(),
      price: input.price,
      day_change_pct: input.dayChangePct ?? null,
      ma50: input.ma50 ?? null,
      currency: input.currency ?? 'CAD',
      source: 'manual',
      as_of: new Date().toISOString(),
    },
    { onConflict: 'user_id,asset_class,symbol' },
  )
  if (error) throw error
}

/* ── Signals / orders ────────────────────────────────────────────────────── */

export async function setSignalStatus(id: string, status: SignalStatus): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client.from('invest_signals').update({ status }).eq('id', id)
  if (error) throw error
}

export async function createOrder(input: {
  accountId: string
  assetClass: AssetClass
  symbol: string
  name?: string
  side: 'buy' | 'sell'
  quantity: number
  orderType: 'market' | 'limit'
  limitPrice?: number | null
  mode: 'paper' | 'live'
  note?: string
}): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client.from('invest_orders').insert({
    user_id: userId,
    account_id: input.accountId,
    asset_class: input.assetClass,
    symbol: input.symbol.toUpperCase(),
    name: input.name ?? input.symbol.toUpperCase(),
    side: input.side,
    quantity: input.quantity,
    order_type: input.orderType,
    limit_price: input.limitPrice ?? null,
    mode: input.mode,
    status: 'queued',
    note: input.note ?? null,
  })
  if (error) throw error
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client
    .from('invest_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** Ask the edge function to fill a queued order (snapshot price, or an
    explicit fill for live orders). */
export async function executeOrder(orderId: string, fillPrice?: number): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client.functions.invoke('invest-bot', {
    body: { action: 'execute-order', order_id: orderId, fill_price: fillPrice ?? null },
  })
  if (error) throw error
}

/* ── Strategies / bot ────────────────────────────────────────────────────── */

export async function saveStrategy(
  strategy: Omit<InvestStrategy, 'id'> & { id?: string },
): Promise<void> {
  const { client, userId } = await requireUserId()
  const payload = {
    user_id: userId,
    name: strategy.name,
    enabled: strategy.enabled,
    asset_classes: strategy.assetClasses,
    rules: strategy.rules as never,
    autonomy: strategy.autonomy,
    updated_at: new Date().toISOString(),
  }
  const { error } = strategy.id
    ? await client.from('invest_strategies').update(payload).eq('id', strategy.id)
    : await client.from('invest_strategies').insert(payload)
  if (error) throw error
}

export async function setStrategyEnabled(id: string, enabled: boolean): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client
    .from('invest_strategies')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteStrategy(id: string): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client.from('invest_strategies').delete().eq('id', id)
  if (error) throw error
}

/** Run the bot for the caller's book on demand. */
export async function runBot(): Promise<{
  evaluated: number
  signals: number
  orders: number
  executed: number
}> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client.functions.invoke('invest-bot', {
    body: { action: 'run' },
  })
  if (error) throw error
  return data as { evaluated: number; signals: number; orders: number; executed: number }
}

/* ── Mappers ─────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAccount(row: any): InvestAccount {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    baseCurrency: row.base_currency,
    cashBalance: Number(row.cash_balance),
    status: row.status,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPosition(row: any): InvestPosition {
  return {
    id: row.id,
    accountId: row.account_id,
    assetClass: row.asset_class,
    symbol: row.symbol,
    name: row.name,
    quantity: Number(row.quantity),
    avgCost: Number(row.avg_cost),
    currency: row.currency,
    lastPrice: row.last_price === null ? null : Number(row.last_price),
    lastPriceAt: row.last_price_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSnapshot(row: any): MarketSnapshot {
  return {
    assetClass: row.asset_class,
    symbol: row.symbol,
    price: Number(row.price),
    dayChangePct: row.day_change_pct === null ? null : Number(row.day_change_pct),
    ma50: row.ma50 === null ? null : Number(row.ma50),
    currency: row.currency,
    source: row.source,
    asOf: row.as_of,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toStrategy(row: any): InvestStrategy {
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled === true,
    assetClasses: Array.isArray(row.asset_classes) ? row.asset_classes : [],
    rules: Array.isArray(row.rules) ? row.rules : [],
    autonomy: row.autonomy === 'paper_execute' ? 'paper_execute' : 'suggest',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSignal(row: any): InvestSignal {
  return {
    id: row.id,
    strategyId: row.strategy_id ?? null,
    assetClass: row.asset_class,
    symbol: row.symbol,
    name: row.name,
    kind: row.kind,
    title: row.title,
    body: row.body,
    score: row.score === null ? null : Number(row.score),
    status: row.status,
    createdAt: row.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrder(row: any): InvestOrder {
  return {
    id: row.id,
    accountId: row.account_id,
    signalId: row.signal_id ?? null,
    assetClass: row.asset_class,
    symbol: row.symbol,
    name: row.name,
    side: row.side,
    quantity: Number(row.quantity),
    orderType: row.order_type,
    limitPrice: row.limit_price === null ? null : Number(row.limit_price),
    mode: row.mode,
    status: row.status,
    requestedPrice: row.requested_price === null ? null : Number(row.requested_price),
    executedPrice: row.executed_price === null ? null : Number(row.executed_price),
    executedAt: row.executed_at,
    note: row.note,
    error: row.error,
    createdAt: row.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRun(row: any): InvestBotRun {
  return {
    id: row.id,
    ranAt: row.ran_at,
    signalsEmitted: row.signals_emitted,
    ordersSuggested: row.orders_suggested,
    ordersExecuted: row.orders_executed,
    summary: row.summary,
    status: row.status,
  }
}
