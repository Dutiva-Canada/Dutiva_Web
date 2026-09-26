/**
 * Pure, Deno-free rules engine for the invest-bot edge function. Kept
 * separate from index.ts so it can be unit-tested under Vitest — same split
 * as candidate-ai/handlers.ts and candidate-job-agent/handlers.ts.
 *
 * The bot is deliberately deterministic: strategies are declarative rules
 * over the org's market snapshots and positions. It emits signals and, for
 * `paper_execute` strategies, simulated orders filled at the snapshot price.
 * It never touches a broker; live orders are recorded and confirmed
 * manually in the workspace.
 */

export type AssetClass = 'equity' | 'etf' | 'crypto' | 'bond' | 'cash' | 'other'
export type RuleMetric =
  | 'day_change_pct'
  | 'vs_ma50'
  | 'value_floor'
  | 'weight_pct'
  | 'unrealized_gain_pct'
  | 'cash_above'
export type RuleOp = 'lt' | 'gt'
export type SignalKind = 'screen' | 'insight' | 'alert' | 'thesis'
export type OrderSide = 'buy' | 'sell'
export type StrategyCadence = 'daily' | 'weekly' | 'monthly'

export interface StrategyRule {
  metric: RuleMetric
  op: RuleOp
  value: number
  kind: SignalKind
  title: string
  /** Present → the rule can also emit a paper order when the strategy's
      autonomy is paper_execute. */
  side?: OrderSide
  qty?: number
}

export interface Strategy {
  id: string
  enabled: boolean
  asset_classes: string[]
  rules: StrategyRule[]
  autonomy: 'suggest' | 'paper_execute'
  cadence: StrategyCadence
  last_evaluated_at: string | null
}

export interface MarketSnapshot {
  asset_class: AssetClass
  symbol: string
  price: number
  day_change_pct: number | null
  ma50: number | null
  currency: string
}

export interface Position {
  account_id: string
  asset_class: AssetClass
  symbol: string
  quantity: number
  avg_cost: number
}

export interface NewSignal {
  strategy_id: string
  asset_class: AssetClass
  symbol: string
  name: string
  kind: SignalKind
  title: string
  body: string
  score: number | null
}

export interface NewPaperOrder {
  signal_key: string
  asset_class: AssetClass
  symbol: string
  name: string
  side: OrderSide
  quantity: number
  executed_price: number
}

const METRICS: readonly string[] = [
  'day_change_pct',
  'vs_ma50',
  'value_floor',
  'weight_pct',
  'unrealized_gain_pct',
  'cash_above',
]
export const CADENCES: readonly string[] = ['daily', 'weekly', 'monthly']
const OPS: readonly string[] = ['lt', 'gt']
const KINDS: readonly string[] = ['screen', 'insight', 'alert', 'thesis']
const SIDES: readonly string[] = ['buy', 'sell']
export const ASSET_CLASSES: readonly string[] = [
  'equity',
  'etf',
  'crypto',
  'bond',
  'cash',
  'other',
]

/* --- Rule parsing ---------------------------------------------------------- */

function num(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Validates the `rules` jsonb column — malformed entries drop, not throw. */
export function parseRules(raw: unknown): StrategyRule[] {
  if (!Array.isArray(raw)) return []
  const rules: StrategyRule[] = []
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const metric = o['metric']
    const op = o['op']
    const value = num(o['value'])
    const kind = o['kind']
    const title = o['title']
    if (
      typeof metric !== 'string' ||
      !METRICS.includes(metric) ||
      typeof op !== 'string' ||
      !OPS.includes(op) ||
      value === null ||
      typeof kind !== 'string' ||
      !KINDS.includes(kind) ||
      typeof title !== 'string' ||
      title.trim() === ''
    ) {
      continue
    }
    const rule: StrategyRule = {
      metric: metric as RuleMetric,
      op: op as RuleOp,
      value,
      kind: kind as SignalKind,
      title: title.trim(),
    }
    if (typeof o['side'] === 'string' && SIDES.includes(o['side'])) {
      const qty = num(o['qty'])
      if (qty !== null && qty > 0) {
        rule.side = o['side'] as OrderSide
        rule.qty = qty
      }
    }
    rules.push(rule)
  }
  return rules.slice(0, 20)
}

/* --- Rule evaluation ------------------------------------------------------- */

/**
 * Book-level context for portfolio metrics — computed once per run in
 * planRun. `bookValue` is the marked-to-market total of positions whose
 * symbol has a snapshot; `cashTotal` is the sum of active account balances.
 */
export interface RunContext {
  bookValue: number
  cashTotal: number
}

/** Metrics that describe the whole book, not one symbol — evaluated once
    per strategy rather than once per snapshot. */
export const BOOK_METRICS: readonly string[] = ['cash_above']

function metricValue(
  metric: RuleMetric,
  snap: MarketSnapshot,
  position: Position | null,
  ctx: RunContext,
): number | null {
  switch (metric) {
    case 'day_change_pct':
      return snap.day_change_pct
    case 'vs_ma50':
      if (snap.ma50 === null || snap.ma50 === 0) return null
      return ((snap.price - snap.ma50) / snap.ma50) * 100
    case 'value_floor':
      return position ? position.quantity * snap.price : null
    case 'weight_pct':
      if (!position || ctx.bookValue <= 0) return null
      return ((position.quantity * snap.price) / ctx.bookValue) * 100
    case 'unrealized_gain_pct':
      if (!position || position.avg_cost <= 0) return null
      return ((snap.price - position.avg_cost) / position.avg_cost) * 100
    case 'cash_above':
      return ctx.cashTotal
  }
}

export function ruleMatches(
  rule: StrategyRule,
  snap: MarketSnapshot,
  position: Position | null,
  ctx: RunContext,
): boolean {
  const m = metricValue(rule.metric, snap, position, ctx)
  if (m === null) return false
  return rule.op === 'lt' ? m < rule.value : m > rule.value
}

/* --- Cadence ----------------------------------------------------------------- */

/** Long-horizon strategies stay quiet between windows: weekly = 7d,
    monthly = 30d. A never-run strategy is always due. */
export function strategyDue(strategy: Pick<Strategy, 'cadence' | 'last_evaluated_at'>, now: Date): boolean {
  if (strategy.cadence === 'daily' || !strategy.last_evaluated_at) return true
  const last = new Date(strategy.last_evaluated_at).getTime()
  if (!Number.isFinite(last)) return true
  const windowMs = strategy.cadence === 'weekly' ? 7 : 30
  return now.getTime() - last >= windowMs * 24 * 60 * 60 * 1000
}

/* --- Run planning ------------------------------------------------------------ */

export interface RunPlan {
  signals: NewSignal[]
  orders: NewPaperOrder[]
  evaluated: number
}

/**
 * Evaluate every enabled strategy against the snapshots. `existingKeys`
 * dedupes — a strategy won't re-emit a signal with the same (kind, symbol,
 * title) while an identical `new` signal is still open, so a daily cron
 * doesn't stack duplicates.
 */
export function planRun(
  strategies: Strategy[],
  snapshots: MarketSnapshot[],
  positions: Position[],
  existingKeys: ReadonlySet<string>,
  opts: { cashTotal?: number; now?: Date } = {},
): RunPlan {
  const plan: RunPlan = { signals: [], orders: [], evaluated: 0 }
  const now = opts.now ?? new Date()
  const positionBySymbol = new Map<string, Position>()
  const priceBySymbol = new Map<string, number>()
  for (const p of positions) positionBySymbol.set(`${p.asset_class}:${p.symbol}`, p)
  for (const s of snapshots) priceBySymbol.set(`${s.asset_class}:${s.symbol}`, s.price)

  /* Marked-to-market book value — the denominator for weight_pct. Only
     positions with a snapshot count; stale symbols can't inflate weights. */
  let bookValue = 0
  for (const p of positions) {
    const price = priceBySymbol.get(`${p.asset_class}:${p.symbol}`) ?? 0
    bookValue += p.quantity * price
  }
  const ctx: RunContext = { bookValue, cashTotal: opts.cashTotal ?? 0 }

  for (const strategy of strategies) {
    if (!strategy.enabled || strategy.rules.length === 0) continue
    if (!strategyDue(strategy, now)) continue
    const symbolRules = strategy.rules.filter((r) => !BOOK_METRICS.includes(r.metric))
    const bookRules = strategy.rules.filter((r) => BOOK_METRICS.includes(r.metric))

    for (const snap of snapshots) {
      if (!strategy.asset_classes.includes(snap.asset_class)) continue
      plan.evaluated += 1
      const position = positionBySymbol.get(`${snap.asset_class}:${snap.symbol}`) ?? null
      for (const rule of symbolRules) {
        if (!ruleMatches(rule, snap, position, ctx)) continue

        const key = `${strategy.id}:${snap.symbol}:${rule.kind}:${rule.title}`
        if (existingKeys.has(key)) continue

        const signal: NewSignal = {
          strategy_id: strategy.id,
          asset_class: snap.asset_class,
          symbol: snap.symbol,
          name: snap.symbol,
          kind: rule.kind,
          title: rule.title,
          body: buildSignalBody(rule, snap, position, ctx),
          score: scoreFor(rule, snap, position, ctx),
        }
        plan.signals.push(signal)

        if (
          strategy.autonomy === 'paper_execute' &&
          rule.side !== undefined &&
          rule.qty !== undefined &&
          snap.price > 0
        ) {
          plan.orders.push({
            signal_key: key,
            asset_class: snap.asset_class,
            symbol: snap.symbol,
            name: snap.symbol,
            side: rule.side,
            quantity: rule.qty,
            executed_price: snap.price,
          })
        }
      }
    }

    /* Book-level rules (cash_above) fire once per strategy — no symbol. */
    for (const rule of bookRules) {
      const m = metricValue(rule.metric, EMPTY_SNAP, null, ctx)
      if (m === null) continue
      if (rule.op === 'lt' ? m >= rule.value : m <= rule.value) continue
      const key = `${strategy.id}::${rule.kind}:${rule.title}`
      if (existingKeys.has(key)) continue
      plan.signals.push({
        strategy_id: strategy.id,
        asset_class: 'cash',
        symbol: '',
        name: '',
        kind: rule.kind,
        title: rule.title,
        body: `cash ${ctx.cashTotal.toFixed(2)}`,
        score: scoreFor(rule, EMPTY_SNAP, null, ctx),
      })
      plan.evaluated += 1
    }
  }
  return plan
}

const EMPTY_SNAP: MarketSnapshot = {
  asset_class: 'cash',
  symbol: '',
  price: 0,
  day_change_pct: null,
  ma50: null,
  currency: '',
}

export function signalKey(s: { strategy_id: string; symbol: string; kind: string; title: string }): string {
  return `${s.strategy_id}:${s.symbol}:${s.kind}:${s.title}`
}

function buildSignalBody(
  rule: StrategyRule,
  snap: MarketSnapshot,
  position: Position | null,
  ctx: RunContext,
): string {
  const parts = [
    `${snap.symbol} — ${snap.price.toFixed(2)} ${snap.currency}`,
    rule.metric === 'day_change_pct' && snap.day_change_pct !== null
      ? `day change ${snap.day_change_pct.toFixed(2)}%`
      : null,
    rule.metric === 'vs_ma50' && snap.ma50 !== null
      ? `vs 50-day avg ${snap.ma50.toFixed(2)}`
      : null,
    position ? `held: ${position.quantity} @ ${position.avg_cost.toFixed(2)}` : null,
    rule.metric === 'weight_pct' && position && ctx.bookValue > 0
      ? `weight ${(((position.quantity * snap.price) / ctx.bookValue) * 100).toFixed(1)}%`
      : null,
    rule.metric === 'unrealized_gain_pct' && position && position.avg_cost > 0
      ? `unrealized ${(((snap.price - position.avg_cost) / position.avg_cost) * 100).toFixed(1)}%`
      : null,
  ]
  return parts.filter(Boolean).join(' · ')
}

/** Heuristic 0-100: distance past the threshold, saturating at 100. */
function scoreFor(
  rule: StrategyRule,
  snap: MarketSnapshot,
  position: Position | null,
  ctx: RunContext,
): number | null {
  const m = metricValue(rule.metric, snap, position, ctx)
  if (m === null || rule.value === 0) return null
  const distance = Math.abs(m - rule.value) / Math.max(Math.abs(rule.value), 1)
  return Math.round(Math.min(100, 50 + distance * 50) * 10) / 10
}

/* --- Paper execution ------------------------------------------------------- */

export interface PositionFill {
  quantity: number
  avg_cost: number
}

/** Average-cost math for a paper fill against an existing position. */
export function applyFill(
  position: Position | null,
  side: OrderSide,
  qty: number,
  price: number,
): PositionFill {
  const held = position?.quantity ?? 0
  const cost = position?.avg_cost ?? 0
  if (side === 'buy') {
    const total = held * cost + qty * price
    const newQty = held + qty
    return { quantity: newQty, avg_cost: newQty > 0 ? total / newQty : 0 }
  }
  /* sell — quantity floors at zero; avg cost unchanged for the remainder */
  return { quantity: Math.max(0, held - qty), avg_cost: cost }
}

/* --- Request validation ------------------------------------------------------ */

export type BotAction = 'run' | 'run-all' | 'execute-order'

export function validateBotAction(action: unknown): { ok: true; value: BotAction } | { ok: false; error: string } {
  if (action === 'run' || action === 'run-all' || action === 'execute-order') {
    return { ok: true, value: action }
  }
  return { ok: false, error: `Unknown action: ${String(action)}` }
}
