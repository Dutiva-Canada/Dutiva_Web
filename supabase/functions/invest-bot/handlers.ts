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
export type RuleMetric = 'day_change_pct' | 'vs_ma50' | 'value_floor'
export type RuleOp = 'lt' | 'gt'
export type SignalKind = 'screen' | 'insight' | 'alert' | 'thesis'
export type OrderSide = 'buy' | 'sell'

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

const METRICS: readonly string[] = ['day_change_pct', 'vs_ma50', 'value_floor']
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

function metricValue(
  metric: RuleMetric,
  snap: MarketSnapshot,
  position: Position | null,
): number | null {
  switch (metric) {
    case 'day_change_pct':
      return snap.day_change_pct
    case 'vs_ma50':
      if (snap.ma50 === null || snap.ma50 === 0) return null
      return ((snap.price - snap.ma50) / snap.ma50) * 100
    case 'value_floor':
      return position ? position.quantity * snap.price : null
  }
}

export function ruleMatches(
  rule: StrategyRule,
  snap: MarketSnapshot,
  position: Position | null,
): boolean {
  const m = metricValue(rule.metric, snap, position)
  if (m === null) return false
  return rule.op === 'lt' ? m < rule.value : m > rule.value
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
): RunPlan {
  const plan: RunPlan = { signals: [], orders: [], evaluated: 0 }
  const positionBySymbol = new Map<string, Position>()
  for (const p of positions) positionBySymbol.set(`${p.asset_class}:${p.symbol}`, p)

  for (const strategy of strategies) {
    if (!strategy.enabled || strategy.rules.length === 0) continue
    for (const snap of snapshots) {
      if (!strategy.asset_classes.includes(snap.asset_class)) continue
      plan.evaluated += 1
      const position = positionBySymbol.get(`${snap.asset_class}:${snap.symbol}`) ?? null
      for (const rule of strategy.rules) {
        if (!ruleMatches(rule, snap, position)) continue

        const key = `${strategy.id}:${snap.symbol}:${rule.kind}:${rule.title}`
        if (existingKeys.has(key)) continue

        const signal: NewSignal = {
          strategy_id: strategy.id,
          asset_class: snap.asset_class,
          symbol: snap.symbol,
          name: snap.symbol,
          kind: rule.kind,
          title: rule.title,
          body: buildSignalBody(rule, snap, position),
          score: scoreFor(rule, snap, position),
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
  }
  return plan
}

export function signalKey(s: { strategy_id: string; symbol: string; kind: string; title: string }): string {
  return `${s.strategy_id}:${s.symbol}:${s.kind}:${s.title}`
}

function buildSignalBody(
  rule: StrategyRule,
  snap: MarketSnapshot,
  position: Position | null,
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
  ]
  return parts.filter(Boolean).join(' · ')
}

/** Heuristic 0-100: distance past the threshold, saturating at 100. */
function scoreFor(
  rule: StrategyRule,
  snap: MarketSnapshot,
  position: Position | null,
): number | null {
  const m = metricValue(rule.metric, snap, position)
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
