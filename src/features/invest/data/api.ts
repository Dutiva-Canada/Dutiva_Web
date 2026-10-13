import { supabase } from '@/lib/supabaseClient'
import { normalizeRules, validateRules } from './strategyRules'
import { ASSET_CLASSES } from './types'
import type {
  AssetClass,
  GoalMetric,
  GoalOp,
  InvestAccount,
  InvestBotRun,
  InvestGoal,
  InvestMemory,
  InvestNewsItem,
  InvestOrder,
  InvestPosition,
  InvestScanItem,
  InvestSignal,
  InvestStrategy,
  InvestThesis,
  InvestWatchItem,
  MarketSnapshot,
  MemoryKind,
  MultiMatch,
  OrderStatus,
  RunWarning,
  ScanDirection,
  ScanTheme,
  SignalRule,
  SignalStatus,
  TestScanMatch,
  ThesisSwot,
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
  theses: InvestThesis[]
  goals: InvestGoal[]
  scanItems: InvestScanItem[]
  memories: InvestMemory[]
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
  const [accounts, positions, snapshots, strategies, signals, orders, runs, watchlist, theses, goals, scanItems, memories] =
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
      client
        .from('invest_bot_runs')
        .select('*')
        .order('ran_at', { ascending: false })
        .limit(200),
      client.from('invest_watchlist').select('*').order('created_at', { ascending: false }),
      client.from('invest_theses').select('*').order('updated_at', { ascending: false }),
      client.from('invest_goals').select('*').order('created_at', { ascending: false }),
      client.from('invest_scan_items').select('*').order('created_at', { ascending: false }),
      client.from('invest_memories').select('*').order('created_at', { ascending: false }),
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
  /* invest_theses (0219) and the 0220/0222 analysis+memory tables can be
     absent while code outruns the migration — the portal renders without
     those surfaces instead of failing the whole state load. */
  const thesisRows = theses.error ? [] : (theses.data ?? [])
  const goalRows = goals.error ? [] : (goals.data ?? [])
  const scanRows = scanItems.error ? [] : (scanItems.data ?? [])
  const memoryRows = memories.error ? [] : (memories.data ?? [])

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
    /* in_feed=false rows persist for dedupe/audit only — an in-app-off
       strategy's hits never reach this surface. */
    signals: (signals.data ?? []).map(toSignal).filter((s) => s.inFeed),
    orders: (orders.data ?? []).map(toOrder),
    runs: (runs.data ?? []).map(toRun),
    watchlist: (watchlist.data ?? []).map(toWatchItem),
    news: newsItems,
    theses: thesisRows.map(toThesis),
    goals: goalRows.map(toGoal),
    scanItems: scanRows.map(toScanItem),
    memories: memoryRows.map(toMemory),
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

export async function updateAccount(
  id: string,
  input: { name?: string; kind?: InvestAccount['kind']; baseCurrency?: string; cashBalance?: number },
): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client
    .from('invest_accounts')
    .update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.baseCurrency !== undefined ? { base_currency: input.baseCurrency } : {}),
      ...(input.cashBalance !== undefined ? { cash_balance: input.cashBalance } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

/* Cascades invest_positions (and orders referencing the account) via the
   schema's ON DELETE CASCADE — the UI confirms before calling this. */
export async function deleteAccount(id: string): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client
    .from('invest_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
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

export async function updatePosition(
  id: string,
  input: { name: string; quantity: number; avgCost: number; currency?: string },
): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client
    .from('invest_positions')
    .update({
      name: input.name,
      quantity: input.quantity,
      avg_cost: input.avgCost,
      ...(input.currency ? { currency: input.currency } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deletePosition(id: string): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client.from('invest_positions').delete().eq('id', id).eq('user_id', userId)
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
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error('Order quantity must be greater than zero')
  }
  if (
    input.orderType === 'limit' &&
    (!Number.isFinite(Number(input.limitPrice)) || Number(input.limitPrice) <= 0)
  ) {
    throw new Error('A limit order needs a positive limit price')
  }
  const { client, userId } = await requireUserId()
  /* The row's RLS only binds user_id — account_id is just a foreign key, so
     verify the target book is actually the caller's before inserting. */
  const { data: account } = await client
    .from('invest_accounts')
    .select('id')
    .eq('id', input.accountId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!account) throw new Error('Account not found')
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
  const { client, userId } = await requireUserId()
  const { error } = await client
    .from('invest_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
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
  /* Last-resort guard — the UI validates with localized messages before
     calling; this keeps non-UI callers (review-queue accept, future API
     uses) from persisting a rule the engine would silently drop. */
  const problems = validateRules(strategy.rules)
  if (problems.length > 0) {
    const first = problems[0]!
    const what =
      first.code === 'qty_required'
        ? 'an order quantity above 0'
        : first.code === 'value2_required'
          ? 'a second bound (between needs two numbers)'
          : 'a threshold'
    throw new Error(`Rule ${first.index + 1} needs ${what}`)
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
    /* Rule order in this array is display order — the engine evaluates
       every rule each scan, so the reorder controls only change how the
       list reads, persisted verbatim. */
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
  /** Code+params twins of `warnings` — localized rendering reads these. */
  warningDetails: RunWarning[]
  /** Per-rule×symbol match detail — what would have fired. */
  matches: TestScanMatch[]
}

/** Dry-run a draft strategy's rules against current snapshots — diagnostic
    only; writes no signals or orders server-side. */
export async function testScan(input: {
  rules: InvestStrategy['rules']
  symbols: string[]
  multiMatch: MultiMatch
  /** The saved strategy's id — dedupe keys are strategy-scoped, so a test
      scan on an existing strategy must read THAT strategy's open rows or
      every already-open hit reports as a fresh match. */
  strategyId?: string
}): Promise<TestScanResult> {
  const requestId = crypto.randomUUID()
  const data = (await invokeBot(
    {
      action: 'test-scan',
      rules: rulesToWire(input.rules),
      symbols: input.symbols,
      multi_match: input.multiMatch,
      ...(input.strategyId ? { strategy_id: input.strategyId } : {}),
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
    /* Structured twins of `warnings` — the UI localizes by code; the raw
       strings stay as the fallback for codes it doesn't know yet. */
    warningDetails: Array.isArray(data.warningDetails)
      ? (data.warningDetails as RunWarning[])
      : [],
    matches: Array.isArray(data.matches) ? (data.matches as TestScanMatch[]) : [],
  }
}

/* Wire shape for the rules jsonb column and the edge function — snake_case
   qty_unit; severity only on signals, order fields only on proposals. The
   rule id rides along — it's the dedupe/history identity (0218). */
function rulesToWire(rules: InvestStrategy['rules']) {
  return rules.map((r) =>
    r.type === 'signal'
      ? {
          ...(r.id ? { id: r.id } : {}),
          type: 'signal' as const,
          metric: r.metric,
          op: r.op,
          value: r.value,
          ...(r.op === 'between' ? { value2: r.value2 } : {}),
          title: r.title,
          severity: r.severity,
        }
      : {
          ...(r.id ? { id: r.id } : {}),
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

/** Refresh the caller's snapshots from the free feeds (CoinGecko/Yahoo). */
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

/* ── Theses (0219) ──────────────────────────────────────────────────────────
   One standing claim per held symbol. The sweep evaluates break/drift rules
   server-side and writes status + eval_detail; the client only edits the
   story and the conditions — it never writes the verdict. */

export async function saveThesis(
  thesis: Omit<
    InvestThesis,
    'id' | 'status' | 'evalDetail' | 'lastEvaluatedAt' | 'createdAt' | 'updatedAt' | 'swot'
  > & {
    id?: string
  },
): Promise<void> {
  const { client, userId } = await requireUserId()
  const payload = {
    user_id: userId,
    asset_class: thesis.assetClass,
    symbol: thesis.symbol.toUpperCase(),
    name: thesis.name.trim(),
    thesis: thesis.thesis.trim(),
    intent: thesis.intent,
    /* Thesis rules are signals only — enforced by the type, re-stamped here
       so a stray proposal object can't ride the jsonb column. */
    break_rules: thesis.breakRules.map((r) => ({
      ...(r.id ? { id: r.id } : {}),
      type: 'signal' as const,
      metric: r.metric,
      op: r.op,
      value: r.value,
      ...(r.op === 'between' ? { value2: r.value2 } : {}),
      title: r.title,
      severity: r.severity,
    })),
    drift_rules: thesis.driftRules.map((r) => ({
      ...(r.id ? { id: r.id } : {}),
      type: 'signal' as const,
      metric: r.metric,
      op: r.op,
      value: r.value,
      ...(r.op === 'between' ? { value2: r.value2 } : {}),
      title: r.title,
      severity: r.severity,
    })),
    updated_at: new Date().toISOString(),
  }
  const res = thesis.id
    ? await client
        .from('invest_theses')
        .update(payload)
        .eq('id', thesis.id)
        .eq('user_id', userId)
    : await client
        .from('invest_theses')
        .upsert(payload, { onConflict: 'user_id,asset_class,symbol' })
  if (res.error) throw res.error
}

export async function deleteThesis(id: string): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client
    .from('invest_theses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

/** Tally-authored thesis draft — the model writes the claim and its watch
    conditions from the holder's description; also filed to the review
    queue server-side (suggestionId links the save back). */
export async function draftThesis(input: {
  assetClass: AssetClass
  symbol: string
  name?: string
  description: string
  lang: 'en' | 'fr'
}): Promise<{
  draft: { thesis: string; intent: InvestThesis['intent']; breakRules: SignalRule[]; driftRules: SignalRule[] }
  suggestionId: string | null
}> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client.functions.invoke('invest-ai', {
    body: {
      action: 'draft-thesis',
      assetClass: input.assetClass,
      symbol: input.symbol,
      name: input.name ?? '',
      description: input.description,
      lang: input.lang,
    },
  })
  if (error) throw error
  const raw = (data as {
    draft?: { thesis?: unknown; intent?: unknown; break_rules?: unknown; drift_rules?: unknown }
    suggestionId?: string | null
  }) ?? {}
  const d = raw.draft
  if (!d || typeof d.thesis !== 'string') throw new Error('No draft returned')
  const intent =
    d.intent === 'growth' || d.intent === 'income' || d.intent === 'speculative'
      ? d.intent
      : 'core'
  const signals = (rules: unknown) =>
    normalizeRules(rules).filter((r): r is SignalRule => r.type === 'signal')
  return {
    draft: {
      thesis: d.thesis,
      intent,
      breakRules: signals(d.break_rules),
      driftRules: signals(d.drift_rules),
    },
    suggestionId: raw.suggestionId ?? null,
  }
}

/* ── Analysis (0220) ───────────────────────────────────────────────────────
   SMART goals + the scan board. The sweep stamps baseline/status/eval —
   the client writes intent fields only, never the verdict. */

export async function saveGoal(goal: {
  id?: string
  title: string
  detail: string
  metric: GoalMetric
  op: GoalOp
  target: number
  deadline: string | null
}): Promise<void> {
  const { client, userId } = await requireUserId()
  const payload = {
    user_id: userId,
    title: goal.title.trim().slice(0, 120),
    detail: goal.detail.trim().slice(0, 400),
    metric: goal.metric,
    op: goal.op,
    target: goal.target,
    deadline: goal.deadline,
    updated_at: new Date().toISOString(),
  }
  /* Edits keep the stored baseline — it anchors the progress math the
     sweep already ran against. A goal edited beyond recognition should
     be recreated, not rebaselined silently. */
  const res = goal.id
    ? await client
        .from('invest_goals')
        .update(payload)
        .eq('id', goal.id)
        .eq('user_id', userId)
    : await client.from('invest_goals').insert(payload)
  if (res.error) throw res.error
}

export async function deleteGoal(id: string): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client
    .from('invest_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function saveScanItem(item: {
  id?: string
  theme: ScanTheme
  direction: ScanDirection
  title: string
  note: string
  symbols: string[]
}): Promise<void> {
  const { client, userId } = await requireUserId()
  const payload = {
    user_id: userId,
    theme: item.theme,
    direction: item.direction,
    title: item.title.trim().slice(0, 120),
    note: item.note.trim().slice(0, 400),
    symbols: item.symbols.map((s) => s.toUpperCase()).slice(0, 12),
    /* Editing an item is reviewing it — the freshness clock resets on
       save so a stale badge only means "not looked at". */
    last_reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const res = item.id
    ? await client
        .from('invest_scan_items')
        .update(payload)
        .eq('id', item.id)
        .eq('user_id', userId)
    : await client.from('invest_scan_items').insert(payload)
  if (res.error) throw res.error
}

export async function deleteScanItem(id: string): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client
    .from('invest_scan_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

/** "Reviewed" without an edit — clears the stale badge only. */
export async function markScanItemReviewed(id: string): Promise<void> {
  const { client, userId } = await requireUserId()
  const { error } = await client
    .from('invest_scan_items')
    .update({ last_reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

/** Write a thesis row's SWOT quadrant — fields beside it stay untouched
    by sending only the column. */
export async function saveSwot(thesisId: string, swot: ThesisSwot): Promise<void> {
  const { client, userId } = await requireUserId()
  const clean = (list: string[]) =>
    list.map((s) => s.trim()).filter(Boolean).slice(0, 8)
  const { error } = await client
    .from('invest_theses')
    .update({
      swot: {
        strengths: clean(swot.strengths),
        weaknesses: clean(swot.weaknesses),
        opportunities: clean(swot.opportunities),
        threats: clean(swot.threats),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', thesisId)
    .eq('user_id', userId)
  if (error) throw error
}

/** Tally-drafted SWOT for one thesis — filed to the review queue like
    every agent artifact; suggestionId links the apply back. */
export async function draftSwot(input: {
  assetClass: AssetClass
  symbol: string
  name?: string
  thesis?: string
  intent?: string
  lang: 'en' | 'fr'
}): Promise<{ draft: ThesisSwot; suggestionId: string | null }> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client.functions.invoke('invest-ai', {
    body: {
      action: 'draft-swot',
      assetClass: input.assetClass,
      symbol: input.symbol,
      name: input.name ?? '',
      thesis: input.thesis ?? '',
      intent: input.intent ?? 'core',
      lang: input.lang,
    },
  })
  if (error) throw error
  const raw = (data as { draft?: Record<string, unknown>; suggestionId?: string | null }) ?? {}
  if (!raw.draft) throw new Error('No draft returned')
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []
  return {
    draft: {
      strengths: list(raw.draft['strengths']),
      weaknesses: list(raw.draft['weaknesses']),
      opportunities: list(raw.draft['opportunities']),
      threats: list(raw.draft['threats']),
    },
    suggestionId: raw.suggestionId ?? null,
  }
}

export interface ScanDraft {
  theme: ScanTheme
  direction: ScanDirection
  title: string
  note: string
  symbols: string[]
}

/** Tally-drafted scan items for the held universe — each returns with
    its queue row id so accepting resolves it. */
export async function draftScan(input: {
  holdings: { assetClass: AssetClass; symbol: string; name: string }[]
  lang: 'en' | 'fr'
}): Promise<{ item: ScanDraft; suggestionId: string | null }[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client.functions.invoke('invest-ai', {
    body: {
      action: 'draft-scan',
      holdings: input.holdings.map((h) => ({
        assetClass: h.assetClass,
        symbol: h.symbol,
        name: h.name,
      })),
      lang: input.lang,
    },
  })
  if (error) throw error
  const raw = (data as { items?: { item?: Record<string, unknown>; suggestionId?: string | null }[] }) ?? {}
  if (!Array.isArray(raw.items)) throw new Error('No items returned')
  return raw.items
    .filter((r) => r.item && typeof r.item === 'object')
    .map((r) => {
      const it = r.item as Record<string, unknown>
      return {
        item: {
          theme: (typeof it['theme'] === 'string' ? it['theme'] : 'sector') as ScanTheme,
          direction: (typeof it['direction'] === 'string'
            ? it['direction']
            : 'monitor') as ScanDirection,
          title: typeof it['title'] === 'string' ? it['title'] : '',
          note: typeof it['note'] === 'string' ? it['note'] : '',
          symbols: Array.isArray(it['symbols'])
            ? (it['symbols'] as unknown[]).filter((s): s is string => typeof s === 'string')
            : [],
        },
        suggestionId: r.suggestionId ?? null,
      }
    })
}

/* ── Memories (0222) ─────────────────────────────────────────────────────── */

/** Write a memory by hand — 'manual' provenance. Tally-proposed facts
    arrive through saveMemorySuggestion on the profile page instead, which
    stamps source 'tally'. */
export async function saveMemory(input: {
  kind: MemoryKind
  text: string
  symbol?: string | null
  source?: 'manual' | 'tally'
}): Promise<void> {
  const { client, userId } = await requireUserId()
  const text = input.text.trim().slice(0, 400)
  /* Same minimum the review-memories parser enforces — a blank or near-
     blank row would render as an empty bullet in every prompt. */
  if (text.length < 8) throw new Error('memory text must be at least 8 characters')
  const symbol = input.symbol ? input.symbol.trim().toUpperCase().slice(0, 12) : null
  if (symbol !== null && !/^[A-Z0-9.-]{1,12}$/.test(symbol)) {
    throw new Error('memory symbol is not a ticker')
  }
  const { error } = await client.from('invest_memories').insert({
    user_id: userId,
    kind: input.kind,
    text,
    symbol,
    source: input.source ?? 'manual',
  })
  if (error) throw error
}

export async function deleteMemory(id: string): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client.from('invest_memories').delete().eq('id', id)
  if (error) throw error
}

/** "Ask Tally to review what she's learned" — the model reads recent chat
    turns and files durable facts as 'memory' suggestions. The accept on
    the profile page is what turns one into a real memory. */
export async function reviewMemories(input: {
  lang: 'en' | 'fr'
}): Promise<{ proposed: number; suggestionIds: string[] }> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client.functions.invoke('invest-ai', {
    body: { action: 'review-memories', lang: input.lang },
  })
  if (error) throw error
  const raw = (data as { proposed?: number; suggestionIds?: unknown }) ?? {}
  return {
    proposed: typeof raw.proposed === 'number' ? raw.proposed : 0,
    suggestionIds: Array.isArray(raw.suggestionIds)
      ? (raw.suggestionIds as unknown[]).filter((s): s is string => typeof s === 'string')
      : [],
  }
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
    lastEvaluatedAt: row.last_evaluated_at ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSignal(row: any): InvestSignal {
  return {
    id: row.id,
    strategyId: row.strategy_id ?? null,
    ruleId: row.rule_id ?? null,
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
    /* 0218 — hidden rows (in-app-off strategies) still persist for dedupe
       but must not surface in the feed. Absent column reads as visible. */
    inFeed: row.in_feed !== false,
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
    ruleId: row.rule_id ?? null,
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
function toThesis(row: any): InvestThesis {
  const status =
    row.status === 'drifting' || row.status === 'broken' ? row.status : 'healthy'
  return {
    id: row.id,
    assetClass: row.asset_class,
    symbol: row.symbol,
    name: row.name ?? '',
    thesis: row.thesis ?? '',
    intent:
      row.intent === 'growth' || row.intent === 'income' || row.intent === 'speculative'
        ? row.intent
        : 'core',
    breakRules: normalizeRules(row.break_rules).filter(
      (r): r is SignalRule => r.type === 'signal',
    ),
    driftRules: normalizeRules(row.drift_rules).filter(
      (r): r is SignalRule => r.type === 'signal',
    ),
    swot: toSwot(row.swot),
    status,
    evalDetail:
      row.eval_detail && typeof row.eval_detail === 'object'
        ? (row.eval_detail as InvestThesis['evalDetail'])
        : null,
    lastEvaluatedAt: row.last_evaluated_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSwot(raw: any): ThesisSwot {
  const empty = (): ThesisSwot => ({
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  })
  if (!raw || typeof raw !== 'object') return empty()
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []
  const o = raw as Record<string, unknown>
  return {
    strengths: list(o['strengths']),
    weaknesses: list(o['weaknesses']),
    opportunities: list(o['opportunities']),
    threats: list(o['threats']),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toGoal(row: any): InvestGoal {
  const status =
    row.status === 'behind' || row.status === 'achieved' || row.status === 'missed'
      ? row.status
      : 'on_track'
  return {
    id: row.id,
    title: row.title ?? '',
    detail: row.detail ?? '',
    metric: row.metric as GoalMetric,
    op: row.op === 'lte' ? 'lte' : 'gte',
    target: Number(row.target),
    baseline: row.baseline === null ? null : Number(row.baseline),
    deadline: row.deadline ?? null,
    status,
    evalDetail:
      row.eval_detail && typeof row.eval_detail === 'object'
        ? (row.eval_detail as InvestGoal['evalDetail'])
        : null,
    lastEvaluatedAt: row.last_evaluated_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toScanItem(row: any): InvestScanItem {
  return {
    id: row.id,
    theme: (typeof row.theme === 'string' ? row.theme : 'sector') as ScanTheme,
    direction: (typeof row.direction === 'string' ? row.direction : 'monitor') as ScanDirection,
    title: row.title ?? '',
    note: row.note ?? '',
    symbols: Array.isArray(row.symbols)
      ? (row.symbols as unknown[]).filter((s): s is string => typeof s === 'string')
      : [],
    lastReviewedAt: row.last_reviewed_at ?? row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMemory(row: any): InvestMemory {
  const kind =
    row.kind === 'preference' || row.kind === 'plan' || row.kind === 'philosophy'
      ? row.kind
      : 'fact'
  return {
    id: row.id,
    symbol: typeof row.symbol === 'string' && row.symbol ? row.symbol : null,
    kind,
    text: row.text ?? '',
    source: row.source === 'tally' ? 'tally' : 'manual',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
