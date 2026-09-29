/**
 * Client-side helpers for the strategy builder — rule normalization, the
 * plain-English rule sentence, scope validation, cadence/metric warnings,
 * and firing history. Pure and unit-tested; the edge engine keeps its own
 * compatible copy in supabase/functions/invest-bot/handlers.ts.
 */
import type { Bi } from '@/i18n/core'
import type {
  InvestBotRun,
  InvestSignal,
  InvestStrategy,
  OrderProposalRule,
  QuantityUnit,
  RuleMetric,
  SignalSeverity,
  StrategyRule,
} from './types'

export const RULE_METRICS: readonly RuleMetric[] = [
  'day_change_pct',
  'vs_ma50',
  'value_floor',
  'weight_pct',
  'unrealized_gain_pct',
  'cash_above',
]

/** Metrics that describe the whole book — evaluated once per strategy, and
    unavailable to order proposals (a proposal needs a symbol). */
export const BOOK_METRICS: readonly RuleMetric[] = ['cash_above']

/** Metric → investMessages key; shared by the builder cards, template
    previews, and the strategy list. */
export const RULE_METRIC_LABELS: Record<RuleMetric, string> = {
  day_change_pct: 'invest_rule_metric_day_change',
  vs_ma50: 'invest_rule_metric_vs_ma50',
  value_floor: 'invest_rule_metric_value_floor',
  weight_pct: 'invest_rule_metric_weight',
  unrealized_gain_pct: 'invest_rule_metric_gain',
  cash_above: 'invest_rule_metric_cash',
}

/** Metrics tied to a single trading day — on a slower cadence they only
    ever see one day in N, so the UI suggests Daily. Mirrors DAILY_METRICS
    in the edge engine. */
const DAILY_METRICS: readonly RuleMetric[] = ['day_change_pct']

const QTY_UNITS: readonly QuantityUnit[] = ['shares', 'percent_of_position', 'currency']

/**
 * Stored rules jsonb → typed rules. Tolerates pre-0184 rows: legacy
 * {kind, side?, qty?} entries map to the new type split the same way the
 * engine's parseRules does (side+qty ⇒ order_proposal, else a signal whose
 * severity keeps 'alert' and maps everything else to 'insight').
 */
export function normalizeRules(raw: unknown): StrategyRule[] {
  if (!Array.isArray(raw)) return []
  const out: StrategyRule[] = []
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (typeof o.metric !== 'string' || !RULE_METRICS.includes(o.metric as RuleMetric)) continue
    const base = {
      metric: o.metric as RuleMetric,
      op: (o.op === 'lt' ? 'lt' : 'gt') as 'lt' | 'gt',
      value: Number(o.value),
      title: typeof o.title === 'string' ? o.title.trim() : '',
    }
    if (!Number.isFinite(base.value) || base.title === '') continue
    const isProposal =
      o.type === 'order_proposal' ||
      (o.type !== 'signal' && (o.side === 'buy' || o.side === 'sell') && Number(o.qty) > 0)
    if (isProposal) {
      /* An explicit proposal with bad/missing side or qty drops — same as
         the engine's parseRules; it must not silently become a signal. */
      if ((o.side !== 'buy' && o.side !== 'sell') || !(Number(o.qty) > 0)) continue
      out.push({
        ...base,
        type: 'order_proposal',
        side: o.side,
        qty: Number(o.qty),
        qtyUnit: QTY_UNITS.includes(o.qty_unit as QuantityUnit)
          ? (o.qty_unit as QuantityUnit)
          : 'shares',
      })
    } else {
      out.push({
        ...base,
        type: 'signal',
        severity: (o.severity === 'alert' || o.kind === 'alert'
          ? 'alert'
          : 'insight') as SignalSeverity,
      })
    }
  }
  return out
}

/** A strategy can't be saved without something to scan. */
export function scopeIsEmpty(scope: InvestStrategy['scope']): boolean {
  return !scope.watchlist && scope.symbols.length === 0
}

/**
 * Plain-English rendering of a rule — "Day change is above 15%". Used by
 * the builder cards, the template preview, and the strategy list.
 */
export function ruleSentence(rule: StrategyRule, label: (m: RuleMetric) => Bi): Bi {
  const metric = label(rule.metric)
  if (rule.op === 'lt') {
    return { en: `${metric.en} is below ${rule.value}`, fr: `${metric.fr} est sous ${rule.value}` }
  }
  return { en: `${metric.en} is above ${rule.value}`, fr: `${metric.fr} dépasse ${rule.value}` }
}

/** Cadence/metric mismatch warnings — e.g. a day-change rule can only
    fire meaningfully when the strategy scans daily. Returns the suggested
    cadence per offending rule, or null when fine. */
export function cadenceMismatch(
  rule: StrategyRule,
  cadence: InvestStrategy['cadence'],
): 'daily' | null {
  if (DAILY_METRICS.includes(rule.metric) && cadence !== 'daily') return 'daily'
  return null
}

export const DEFAULT_NOTIFY: InvestStrategy['notify'] = { inApp: true, email: false }

export function defaultSignalRule(): StrategyRule {
  return {
    type: 'signal',
    metric: 'day_change_pct',
    op: 'lt',
    value: -5,
    severity: 'insight',
    title: '',
  }
}

export function defaultProposalRule(): OrderProposalRule {
  return {
    type: 'order_proposal',
    metric: 'day_change_pct',
    op: 'lt',
    value: -5,
    side: 'buy',
    qty: 1,
    qtyUnit: 'shares',
    title: '',
  }
}

/**
 * Times a rule fired in the last 90 days — the run-history rule_hits are
 * the firing record going forward (they count matches even when dedupe
 * suppressed the signal). Signals are the fallback for pre-0184 runs that
 * carry no diagnostics — not added on top, since a signal row is the
 * output of a hit the run already counted. Returns null when there's
 * simply no history to count — never a fabricated number.
 */
export function ruleFireCount(
  rule: StrategyRule,
  strategyId: string | null,
  runs: InvestBotRun[],
  signals: InvestSignal[],
  now: Date,
): number | null {
  if (!strategyId) return null /* unsaved draft — no history exists */
  const cutoff = now.getTime() - 90 * 24 * 60 * 60 * 1000
  let hits = 0
  let hasDiagnostics = false
  for (const run of runs) {
    if (new Date(run.ranAt).getTime() < cutoff) continue
    if (run.strategyId && run.strategyId !== strategyId) continue
    if (Object.keys(run.ruleHits).length > 0) hasDiagnostics = true
    const n = run.ruleHits[rule.title]
    if (typeof n === 'number') hits += n
  }
  if (hasDiagnostics) return hits
  /* No diagnostic runs in the window — fall back to counting the signals
     this strategy emitted under the rule's title (pre-0184 coverage), or
     null when even that record is absent/irrelevant. */
  let legacy = 0
  let sawLegacySignal = false
  for (const s of signals) {
    if (s.strategyId !== strategyId || s.title !== rule.title) continue
    if (new Date(s.createdAt).getTime() < cutoff) continue
    legacy += 1
    sawLegacySignal = true
  }
  return sawLegacySignal ? legacy : null
}

/** Estimated firing frequency for the health panel, from the same history
    ruleFireCount reads. */
export function estimateFrequency(
  rules: StrategyRule[],
  strategyId: string | null,
  runs: InvestBotRun[],
  signals: InvestSignal[],
  now: Date,
): { perWeek: number } | null {
  const total = rules.reduce(
    (sum, r) => sum + (ruleFireCount(r, strategyId, runs, signals, now) ?? 0),
    0,
  )
  if (!strategyId || rules.length === 0) return null
  const hasHistory = rules.some((r) => ruleFireCount(r, strategyId, runs, signals, now) !== null)
  if (!hasHistory) return null
  return { perWeek: Math.round((total / (90 / 7)) * 10) / 10 }
}
