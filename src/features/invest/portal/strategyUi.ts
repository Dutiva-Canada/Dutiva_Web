/**
 * Strategy-builder presentation helpers — pure functions that render the
 * domain model into localized strings. All counts/dates/money go through
 * `Intl` under en-CA / fr-CA; pluralization follows the prototype's `pl()`
 * rule (French singular covers 0 and 1, English only 1).
 *
 * Imported by the list, editor, and wizard views — no React here so every
 * formatter is unit-testable in isolation.
 */
import { fill } from '@/lib/format'
import { pick } from '@/i18n/core'
import type { Bi, Lang } from '@/i18n/core'
import { investMessages as IM } from '@/i18n/messages/invest'
import { RULE_METRIC_LABELS } from '../data/strategyRules'
import type {
  InvestBotRun,
  InvestStrategy,
  OrderProposalRule,
  RuleMetric,
  StrategyCadence,
  StrategyNotify,
  StrategyRule,
  StrategyScope,
  TestScanMatch,
} from '../data/types'

const localeOf = (lang: Lang): string => (lang === 'fr' ? 'fr-CA' : 'en-CA')

/** Locale-aware number — 1000 → "1,000" / "1 000". */
export function fmtNum(lang: Lang, n: number): string {
  return Number(n).toLocaleString(localeOf(lang))
}

/** Pluralized count — "1 rule" / "3 rules" / "1 règle" / "0 signal". */
export function pl(lang: Lang, n: number, one: Bi, many: Bi): string {
  const word = pick(lang === 'fr' ? (n <= 1 ? one : many) : n === 1 ? one : many, lang)
  return `${fmtNum(lang, n)} ${word}`
}

/** Money threshold with its unit — "$1,000 CAD" / "1 000 $ CAD". */
export function fmtCad(lang: Lang, n: number): string {
  return lang === 'fr' ? `${fmtNum(lang, n)} $ CAD` : `$${fmtNum(lang, n)} CAD`
}

/** Metrics whose threshold is a dollar amount — the input/labels carry the
    "$ … CAD" suffix treatment (fix #5). Everything else is a percentage. */
export const CURRENCY_METRICS: readonly RuleMetric[] = ['value_floor', 'cash_above']

export function isCurrencyMetric(metric: RuleMetric): boolean {
  return CURRENCY_METRICS.includes(metric)
}

/** Percent threshold with its unit on the value — "−8%" / "−8 %"
    (typographic minus; FR keeps the thin space before %). */
export function fmtPct(lang: Lang, n: number): string {
  const s = fmtNum(lang, n).replace('-', '−')
  return lang === 'fr' ? `${s} %` : `${s}%`
}

function metricLabel(lang: Lang, metric: RuleMetric): string {
  const key = RULE_METRIC_LABELS[metric] as keyof typeof IM
  return pick(IM[key], lang)
}

/**
 * The auto-generated rule title — always derived from metric + condition +
 * threshold (fix #11: the generated title is primary; the user's 60-char
 * label renders beneath it). e.g. "Price vs 50-day average falls below −12%",
 * "Cash balance rises above $500 CAD".
 */
export function ruleTitle(lang: Lang, rule: StrategyRule): string {
  const verb = pick(rule.op === 'lt' ? IM.invest_sb_verb_below : IM.invest_sb_verb_above, lang)
  const threshold = isCurrencyMetric(rule.metric)
    ? fmtCad(lang, rule.value)
    : Number.isFinite(rule.value)
      ? fmtPct(lang, rule.value)
      : ''
  return `${metricLabel(lang, rule.metric)} ${verb} ${threshold}`
}

/** Title persisted on the wire — the user's label when present, else the
    English auto-title so the engine's dedupe keys stay distinct. */
export function storedRuleTitle(rule: StrategyRule): string {
  return rule.title.trim() || ruleTitle('en', rule)
}

/** Live plain-language preview under the quantity control — "Buys 1 share",
    "Adds 1% to your existing position", "Vend pour 1 000 $". */
export function qtyPreview(lang: Lang, rule: OrderProposalRule): string {
  const amt = Number(rule.qty) || 0
  const side = pick(rule.side === 'buy' ? IM.invest_sb_buys : IM.invest_sb_sells, lang)
  if (rule.qtyUnit === 'shares') {
    const word =
      lang === 'fr'
        ? pick(amt <= 1 ? IM.invest_sb_share_one : IM.invest_sb_share_many, lang)
        : pick(amt === 1 ? IM.invest_sb_share_one : IM.invest_sb_share_many, lang)
    return `${side} ${fmtNum(lang, amt)} ${word}`
  }
  if (rule.qtyUnit === 'percent_of_position') {
    return fill(pick(rule.side === 'buy' ? IM.invest_sb_adds_pct : IM.invest_sb_reduces_pct, lang), {
      n: fmtNum(lang, amt),
    })
  }
  return fill(pick(IM.invest_sb_qty_worth, lang), { side, n: fmtNum(lang, amt) })
}

export type ActionChip = { label: string; tone: 'order' | 'alert' | 'insight' }

/** Collapsed-row action chip — "Propose order" for order proposals;
    "Notify · Alert" / "Notify · Insight" for signal rules. */
export function actionChip(lang: Lang, rule: StrategyRule): ActionChip {
  if (rule.type === 'order_proposal') {
    return { label: pick(IM.invest_sb_propose_order, lang), tone: 'order' }
  }
  const sev = pick(rule.severity === 'alert' ? IM.invest_sb_alert : IM.invest_sb_insight, lang)
  return {
    label: `${pick(IM.invest_sb_notify_chip, lang)} · ${sev}`,
    tone: rule.severity === 'alert' ? 'alert' : 'insight',
  }
}

/** Helper text under the notify pills — recomputed from the selection so it
    always describes what's actually on (fix #6). */
export function channelHelper(lang: Lang, notify: StrategyNotify): string {
  const { inApp, email } = notify
  const key =
    inApp && email
      ? IM.invest_sb_chan_both
      : inApp
        ? IM.invest_sb_chan_app
        : email
          ? IM.invest_sb_chan_email_help
          : IM.invest_sb_chan_none
  return pick(key, lang)
}

export const CADENCE_LABEL: Record<StrategyCadence, Bi> = {
  daily: IM.invest_cadence_daily,
  weekly: IM.invest_cadence_weekly,
  monthly: IM.invest_cadence_monthly,
}

/** What the cadence actually does — the daily 7:45 UTC sweep exists; slower
    cadences gate on elapsed days inside it (handlers.ts strategyDue). No
    "after close" claims: the sweep runs pre-open UTC. */
export function cadenceHelp(lang: Lang, cadence: StrategyCadence): string {
  const key =
    cadence === 'weekly'
      ? IM.invest_sb_cadence_help_weekly
      : cadence === 'monthly'
        ? IM.invest_sb_cadence_help_monthly
        : IM.invest_sb_cadence_help_daily
  return pick(key, lang)
}

export function cadenceLabel(lang: Lang, cadence: StrategyCadence): string {
  return pick(CADENCE_LABEL[cadence], lang)
}

/** The full symbol universe a "watchlist" scope scans: held ∪ watched. */
export function trackedUniverse(
  positions: { symbol: string }[],
  watchlist: { symbol: string }[],
): string[] {
  return [
    ...new Set(
      [...positions, ...watchlist].map((s) => s.symbol.toUpperCase()).filter(Boolean),
    ),
  ].sort()
}

/** Symbols a scope actually evaluates — mirrors the engine's scopeSymbols:
    watchlist ⇒ the full universe, plus any explicit symbols. */
export function scopeSymbols(scope: StrategyScope, universe: string[]): string[] {
  return [
    ...new Set(
      [...(scope.watchlist ? universe : []), ...scope.symbols].map((s) =>
        s.toUpperCase(),
      ),
    ),
  ].sort()
}

/** Card meta line — "4 rules · Daily · 12 tracked symbols". */
export function strategyMeta(lang: Lang, s: InvestStrategy, trackedCount: number): string {
  return [
    pl(lang, s.rules.length, IM.invest_sb_rule_one, IM.invest_sb_rule_many),
    cadenceLabel(lang, s.cadence),
    pl(lang, trackedCount, IM.invest_sb_tracked_one, IM.invest_sb_tracked_many),
  ].join(' · ')
}

/** "Sep 29, 4:15 PM" / "29 sept., 16 h 15". */
export function formatRunWhen(lang: Lang, iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(localeOf(lang), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

/** "0.4s" / "0,4 s". */
export function formatDuration(lang: Lang, ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return '—'
  const s = Math.round(ms / 100) / 10
  return `${s.toLocaleString(localeOf(lang))}s`
}

/** One run-history row — "Sep 29, 4:15 PM — Bot sweep · 1 signal ·
    2 proposals · 0.4s". */
export function runLine(lang: Lang, run: InvestBotRun, strategyName?: string): string {
  const when = formatRunWhen(lang, run.ranAt)
  const what = run.strategyId
    ? (strategyName ?? pick(IM.invest_run_deleted_strategy, lang))
    : pick(IM.invest_sb_sweep, lang)
  return [
    `${when} — ${what}`,
    pl(lang, run.signalsEmitted, IM.invest_sb_signal_one, IM.invest_sb_signal_many),
    pl(lang, run.proposalsCreated, IM.invest_sb_proposal_one, IM.invest_sb_proposal_many),
    formatDuration(lang, run.durationMs),
  ].join(' · ')
}

/* ── Test-scan result rendering ─────────────────────────────────────────── */

function matchReading(lang: Lang, match: TestScanMatch, rule: StrategyRule | undefined): string {
  const v = isCurrencyMetric(rule?.metric ?? 'cash_above')
    ? fmtCad(lang, match.metricValue)
    : fmtPct(lang, match.metricValue)
  const label = rule ? metricLabel(lang, rule.metric) : match.ruleTitle
  return rule && isCurrencyMetric(rule.metric)
    ? fill(pick(IM.invest_sb_balance_at, lang), { value: v })
    : fill(pick(IM.invest_sb_metric_at, lang), { label, value: v })
}

function orderDetail(lang: Lang, match: TestScanMatch): string {
  const side = pick(match.outcome.kind === 'order' && match.outcome.side === 'buy' ? IM.invest_sb_buy : IM.invest_sb_sell, lang)
  const q = match.outcome.kind === 'order' ? match.outcome.quantity : null
  return `${side} ${q === null ? '—' : fmtNum(lang, q)}`
}

/** One match card — "AAPL / Matched rule "…" — Day change % is at -6.2.
    / Outcome: alert notification". */
export function matchCard(
  lang: Lang,
  match: TestScanMatch,
  rule: StrategyRule | undefined,
): { symbol: string; detail: string; outcome: string } {
  const title = match.ruleTitle
  const detail = fill(pick(IM.invest_sb_match_line, lang), {
    title,
    detail: matchReading(lang, match, rule),
  })
  const outcome =
    match.outcome.kind === 'order'
      ? fill(pick(IM.invest_sb_outcome_order, lang), {
          detail: orderDetail(lang, match),
        })
      : pick(
          match.outcome.severity === 'alert'
            ? IM.invest_sb_outcome_alert
            : IM.invest_sb_outcome_insight,
          lang,
        )
  return { symbol: match.symbol || pick(IM.invest_sb_sweep, lang), detail, outcome }
}

/** Summary line under the results heading — "{symbols} scanned · {signals}
    · {proposals}" with real plural nouns. */
export function scanSummaryLine(lang: Lang, res: {
  symbolsScanned: string[]
  signals: number
  proposals: number
}): string {
  return fill(pick(IM.invest_sb_scanned_line, lang), {
    symbols: pl(lang, res.symbolsScanned.length, IM.invest_sb_tracked_one, IM.invest_sb_tracked_many),
    signals: pl(lang, res.signals, IM.invest_sb_signal_one, IM.invest_sb_signal_many),
    proposals: pl(lang, res.proposals, IM.invest_sb_proposal_one, IM.invest_sb_proposal_many),
  })
}
