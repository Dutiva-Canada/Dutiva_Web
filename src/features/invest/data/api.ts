import { supabase } from '@/lib/supabaseClient'
import { normalizeRules } from './strategyRules'
import { ASSET_CLASSES } from './types'
import type {
  AssetClass,
  InvestAccount,
  InvestBotRun,
  InvestNewsItem,
  InvestOrder,
  InvestPosition,
  InvestSignal,
  InvestStrategy,
  InvestWatchItem,
  MarketSnapshot,
  MultiMatch,
  OrderStatus,
  SignalStatus,
  TestScanMatch,
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
  watchlist: InvestWatchItem[]
  news: InvestNewsItem[]
}

type InvestRole = 'client' | 'admin'

/**
 * The signed-in user's grant row, or null when the portal is not open to
 * them. `role` distinguishes invited clients from operators — an 'admin'
 * grant can, for example, invoke the run-all sweep with a user JWT.
 */
async function getInvestAccess(): Promise<{ role: InvestRole } | null> {
  const client = supabase
  if (!client) return null
  const { data } = await client.from('invest_access').select('role').maybeSingle()
  return data ? { role: data.role === 'admin' ? 'admin' : 'client' } : null
}

/** True when the signed-in user holds an invest_access grant. */
export async function hasInvestAccess(): Promise<boolean> {
  return (await getInvestAccess()) !== null
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
  const [accounts, positions, snapshots, strategies, signals, orders, runs, watchlist] =
    await Promise.all([
      client.from('invest_accounts').select('*'),
      client.from('invest_positions').select('*'),
      client.from('invest_market_snapshots').select('*').order('as_of', { ascending: false }),
      client.from('invest_strategies').select('*'),
      client
        .from('invest_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      client.from('invest_orders').select('*').order('created_at', { ascending: false }).limit(200),
      client.from('invest_bot_runs').select('*').order('ran_at', { ascending: false }).limit(50),
      client.from('invest_watchlist').select('*').order('created_at', { ascending: false }),
    ])
  for (const res of [
    accounts,
    positions,
    snapshots,
    strategies,
    signals,
    orders,
    runs,
    watchlist,
  ]) {
    if (res.error) throw res.error
  }

  /* News follows the same universe as market-sync: held ∪ watched symbols,
     plus general-market items (symbol ''). Server-side filter so general
     headlines can't crowd out a user's symbol news. */
  const symbols = [
    ...new Set(
      [...(positions.data ?? []), ...(watchlist.data ?? [])]
        .map((r) => String(r.symbol ?? '').toUpperCase())
        .filter(Boolean),
    ),
  ]
  const newsQuery = client
    .from('invest_market_news')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(30)
  const news = await (symbols.length > 0
    ? newsQuery.or(`symbol.eq."",symbol.in.(${symbols.map((s) => `"${s}"`).join(',')})`)
    : newsQuery.eq('symbol', ''))
  if (news.error) throw news.error

  /* The same headline can be stored under several symbols (market-wrap
     articles fetched by more than one query) — dedupe on url for display. */
  const seenUrls = new Set<string>()
  const newsItems = (news.data ?? [])
    .map(toNewsItem)
    .filter((n) => (seenUrls.has(n.url) ? false : (seenUrls.add(n.url), true)))

  return {
    accounts: (accounts.data ?? []).map(toAccount),
    positions: (positions.data ?? []).map(toPosition),
    snapshots: (snapshots.data ?? []).map(toSnapshot),
    strategies: (strategies.data ?? []).map(toStrategy),
    signals: (signals.data ?? []).map(toSignal),
    orders: (orders.data ?? []).map(toOrder),
    runs: (runs.data ?? []).map(toRun),
    watchlist: (watchlist.data ?? []).map(toWatchItem),
    news: newsItems,
  }
}

/* ── Watchlist ──────────────────────────────────────────────────────────── */

export async function addWatchSymbol(input: {
  assetClass: AssetClass
  symbol: string
  name?: string
}): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client.from('invest_watchlist').upsert(
    {
      user_id: userId,
      asset_class: input.assetClass,
      symbol: input.symbol.toUpperCase(),
      name: input.name?.trim() ?? '',
    },
    { onConflict: 'user_id,asset_class,symbol' },
  )
  if (error) throw error
}

export async function removeWatchSymbol(id: string): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client.from('invest_watchlist').delete().eq('id', id)
  if (error) throw error
}

/* ── Accounts / positions ────────────────────────────────────────────────── */

export async function createAccount(input: {
  name: string
  kind: InvestAccount['kind']
  baseCurrency?: string
  cashBalance?: number
  /** Marks the auto-provisioned first-run book — one per user, enforced by
      a partial unique index so concurrent tabs can't double-seed. */
  seeded?: boolean
}): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client.from('invest_accounts').insert({
    user_id: userId,
    name: input.name,
    kind: input.kind,
    base_currency: input.baseCurrency ?? 'CAD',
    cash_balance: input.cashBalance ?? 0,
    ...(input.seeded === true ? { seeded: true } : {}),
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

/** Edge-function failure carrying the server's error message, its machine
    `code`, and the correlation id the client sent — the strategies UI shows
    the id so support can line the failure up with function logs. */
export class BotRequestError extends Error {
  code?: string
  /** The request id we sent (echoed back by the function on JSON errors);
      always set client-side even when the server never saw the call. */
  requestId?: string
}

/** Shared invoker for the read-side bot actions (run, test-scan). Not used
    by execute-order — the fill path keeps its own call untouched. */
async function invokeBot(
  body: Record<string, unknown>,
  requestId?: string,
): Promise<unknown> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client.functions.invoke('invest-bot', {
    body: requestId ? { ...body, request_id: requestId } : body,
  })
  if (error) {
    const e = new BotRequestError(error.message)
    e.requestId = requestId
    /* FunctionsHttpError carries the Response — the function answers
       {error, code, request_id} json, which beats the transport message. */
    const ctx = (error as { context?: Response }).context
    if (ctx) {
      try {
        const payload = (await ctx.json()) as {
          error?: string
          code?: string
          request_id?: string
        }
        if (typeof payload.error === 'string' && payload.error) e.message = payload.error
        if (typeof payload.code === 'string') e.code = payload.code
        if (typeof payload.request_id === 'string') e.requestId = payload.request_id
      } catch {
        /* non-JSON error body — keep the transport message */
      }
    }
    throw e
  }
  return data
}

export async function saveStrategy(
  strategy: Omit<InvestStrategy, 'id'> & { id?: string },
): Promise<string | undefined> {
  const { client, userId } = await requireUserId()
  if (!strategy.scope.watchlist && strategy.scope.symbols.length === 0) {
    throw new Error('Strategy needs a scope: the watchlist or at least one symbol')
  }
  const payload = {
    user_id: userId,
    name: strategy.name,
    enabled: strategy.enabled,
    /* The scope UI replaced the legacy asset_classes restriction — writes
       explicitly cover every class so a saved strategy is restricted only
       by its scope symbols, while rows never touched post-0184 keep their
       legacy class filter (enforced in invest-bot). */
    asset_classes: [...ASSET_CLASSES],
    scope: {
      watchlist: strategy.scope.watchlist,
      symbols: strategy.scope.symbols.map((s) => s.toUpperCase()),
    },
    /* Rule order in this array is evaluation priority — the engine walks
       it top to bottom, so the UI's reorder controls persist as-is. */
    rules: rulesToWire(strategy.rules),
    notify: { in_app: strategy.notify.inApp, email: strategy.notify.email },
    cadence: strategy.cadence,
    template: strategy.template,
    updated_at: new Date().toISOString(),
  }
  /* 0190 column — spread outside the literal so the generated Insert type
     (pre-regen) doesn't flag it; the spread dissolves once db:types runs
     against the migrated schema. */
  const payloadWithMode = { ...payload, multi_match: strategy.multiMatch }
  /* Inserts select id back so the caller can open the editor on the new
     row without a round-trip guess. */
  let res = strategy.id
    ? await client.from('invest_strategies').update(payloadWithMode).eq('id', strategy.id)
    : await client.from('invest_strategies').insert(payloadWithMode).select('id').single()
  if (res.error && /multi_match/.test(res.error.message)) {
    /* Migration 0190 not applied yet — save everything else rather than
       failing; the mode defaults to 'each' server-side until the column
       lands. Mirrors loadStrategies' column fallback in invest-bot. */
    res = strategy.id
      ? await client.from('invest_strategies').update(payload).eq('id', strategy.id)
      : await client.from('invest_strategies').insert(payload).select('id').single()
  }
  if (res.error) throw res.error
  return strategy.id ?? (res.data as { id?: string } | null)?.id
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

export interface ScanResult {
  /** Distinct symbols that were evaluated. */
  scanned: string[]
  signals: number
  /** Draft orders created — they await approval in the Orders tab. */
  proposals: number
  ruleHits: Record<string, number>
  warnings: string[]
  durationMs: number
}

/** Scan the caller's strategies on demand. Scanning never places orders —
    order proposals become drafts awaiting approval in the Orders tab. */
export async function scanNow(): Promise<ScanResult> {
  return (await invokeBot({ action: 'run' }, crypto.randomUUID())) as ScanResult
}

export interface TestScanResult {
  /** Correlation id for this dry run — echoed by the server, generated
      client-side so even a network-level failure has an id to report. */
  requestId: string
  symbolsScanned: string[]
  ruleHits: Record<string, number>
  signals: number
  proposals: number
  warnings: string[]
  /** Per-rule×symbol match detail — what would have fired. */
  matches: TestScanMatch[]
}

/** Dry-run a draft strategy's rules against current snapshots — diagnostic
    only; writes no signals or orders server-side. */
export async function testScan(input: {
  rules: InvestStrategy['rules']
  symbols: string[]
  multiMatch: MultiMatch
}): Promise<TestScanResult> {
  const requestId = crypto.randomUUID()
  const data = (await invokeBot(
    {
      action: 'test-scan',
      rules: rulesToWire(input.rules),
      symbols: input.symbols,
      multi_match: input.multiMatch,
    },
    requestId,
  )) as Record<string, unknown>
  return {
    requestId: typeof data.request_id === 'string' ? data.request_id : requestId,
    symbolsScanned: Array.isArray(data.symbolsScanned) ? (data.symbolsScanned as string[]) : [],
    ruleHits: (data.ruleHits ?? {}) as Record<string, number>,
    signals: Number(data.signals) || 0,
    proposals: Number(data.proposals) || 0,
    warnings: Array.isArray(data.warnings) ? (data.warnings as string[]) : [],
    matches: Array.isArray(data.matches) ? (data.matches as TestScanMatch[]) : [],
  }
}

/* Wire shape for the rules jsonb column and the edge function — snake_case
   qty_unit; severity only on signals, order fields only on proposals. */
function rulesToWire(rules: InvestStrategy['rules']) {
  return rules.map((r) =>
    r.type === 'signal'
      ? {
          type: 'signal' as const,
          metric: r.metric,
          op: r.op,
          value: r.value,
          ...(r.op === 'between' ? { value2: r.value2 } : {}),
          title: r.title,
          severity: r.severity,
        }
      : {
          type: 'order_proposal' as const,
          metric: r.metric,
          op: r.op,
          value: r.value,
          ...(r.op === 'between' ? { value2: r.value2 } : {}),
          title: r.title,
          side: r.side,
          qty: r.qty,
          qty_unit: r.qtyUnit,
        },
  )
}

/** Refresh the caller's snapshots from the free feeds (CoinGecko/Stooq). */
export async function syncPrices(): Promise<{ symbols: number; synced: number; failed: string[] }> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client.functions.invoke('invest-market-sync', {
    body: { action: 'sync' },
  })
  if (error) throw error
  return data as { symbols: number; synced: number; failed: string[] }
}

/** invest-ai draft → save-ready wire strategy. Shared by the wizard and the
    review-queue "Add it" path, so a filed draft creates the same strategy
    either way — disabled, in-app notify, one match each. */
export function normalizeAiStrategyDraft(
  d: Record<string, unknown>,
): Omit<InvestStrategy, 'id'> {
  const scope = (d.scope ?? {}) as Record<string, unknown>
  return {
    name: String(d.name),
    enabled: false,
    scope: {
      watchlist: scope.watchlist !== false,
      symbols: Array.isArray(scope.symbols) ? (scope.symbols as string[]) : [],
    },
    rules: normalizeRules(d.rules),
    notify: { inApp: true, email: false },
    cadence: d.cadence === 'weekly' || d.cadence === 'monthly' ? d.cadence : 'daily',
    multiMatch: 'each',
    template: 'ai-draft',
  }
}

/**
 * Ask the model to author a strategy draft from a plain-language goal.
 * Returns a disabled draft — the user reviews, picks the scope, and saves
 * before anything reaches the book. The draft is also filed to the review
 * queue server-side; suggestionId links the wizard's save back to that row
 * (null when the queue write didn't land).
 */
export async function draftStrategy(
  goal: string,
  lang: 'en' | 'fr',
): Promise<{ draft: Omit<InvestStrategy, 'id'>; suggestionId: string | null }> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client.functions.invoke('invest-ai', {
    body: { action: 'draft-strategy', goal, lang },
  })
  if (error) throw error
  const raw = (data as {
    draft?: Record<string, unknown>
    suggestionId?: string | null
  }) ?? {}
  if (!raw.draft) throw new Error('No draft returned')
  return { draft: normalizeAiStrategyDraft(raw.draft), suggestionId: raw.suggestionId ?? null }
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
  const scope = (row.scope ?? {}) as Record<string, unknown>
  const notify = (row.notify ?? {}) as Record<string, unknown>
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled === true,
    scope: {
      /* Rows pre-0184 scanned every tracked symbol — the same thing
         watchlist:true means under the new model. */
      watchlist: scope.watchlist !== false,
      symbols: Array.isArray(scope.symbols) ? scope.symbols : [],
    },
    rules: normalizeRules(row.rules),
    notify: { inApp: notify.in_app !== false, email: notify.email === true },
    cadence: row.cadence === 'weekly' || row.cadence === 'monthly' ? row.cadence : 'daily',
    /* 0190 — absent on a code-before-schema deploy; 'each' is the
       historical behavior. */
    multiMatch: row.multi_match === 'summary' ? 'summary' : 'each',
    template: typeof row.template === 'string' ? row.template : '',
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
    titleFr: row.title_fr ?? null,
    bodyFr: row.body_fr ?? null,
    score: row.score === null ? null : Number(row.score),
    status: row.status,
    createdAt: row.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWatchItem(row: any): InvestWatchItem {
  return {
    id: row.id,
    assetClass: row.asset_class,
    symbol: row.symbol,
    name: row.name ?? '',
    createdAt: row.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNewsItem(row: any): InvestNewsItem {
  return {
    id: row.id,
    symbol: row.symbol ?? '',
    assetClass: row.asset_class ?? '',
    title: row.title,
    url: row.url,
    source: row.source ?? '',
    summary: row.summary ?? '',
    publishedAt: row.published_at ?? null,
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
    strategyId: row.strategy_id ?? null,
    signalsEmitted: row.signals_emitted,
    proposalsCreated: row.orders_suggested ?? 0,
    symbolsScanned: Array.isArray(row.symbols_scanned) ? row.symbols_scanned : [],
    ruleHits:
      row.rule_hits && typeof row.rule_hits === 'object' && !Array.isArray(row.rule_hits)
        ? (row.rule_hits as Record<string, number>)
        : {},
    durationMs: typeof row.duration_ms === 'number' ? row.duration_ms : null,
    summary: row.summary,
    status: row.status,
  }
}
