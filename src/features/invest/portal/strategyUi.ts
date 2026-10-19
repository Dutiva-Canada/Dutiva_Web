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
import { persistedRuleTitle } from '../data/strategyRules'
import type { RuleProblem } from '../data/strategyRules'
import type {
  AssetClass,
  InvestBotRun,
  InvestStrategy,
  OrderProposalRule,
  RuleMetric,
  RunWarning,
  ScanDirection,
  SignalKind,
  StrategyCadence,
  StrategyNotify,
  StrategyRule,
  StrategyScope,
  TestScanMatch,
} from '../data/types'

/* Scan-board direction vocabulary — the saved board and the pending
   "Tally suggests" strip tag items with the same labels and pills. */
export const SCAN_DIR_LABEL: Record<ScanDirection, keyof typeof IM> = {
  tailwind: 'invest_scan_dir_tailwind',
  headwind: 'invest_scan_dir_headwind',
  monitor: 'invest_scan_dir_monitor',
}
export const SCAN_DIR_PILL: Record<ScanDirection, string> = {
  tailwind: 'sb-pill-ok',
  headwind: 'sb-pill-warn',
  monitor: 'sb-pill-draft',
}

/* Signal-kind → label key — the Signals log and the Notifications inbox
   tag the same rows; one map so they can't disagree. */
export const SIGNAL_KIND_LABEL: Record<SignalKind, keyof typeof IM> = {
  screen: 'invest_signal_kind_screen',
  insight: 'invest_signal_kind_insight',
  alert: 'invest_signal_kind_alert',
  thesis: 'invest_signal_kind_thesis',
  goal: 'invest_signal_kind_goal',
  scan: 'invest_signal_kind_scan',
}

/** Symbols a signal's text mentions that are actually held — rendered as
   pills linking to the book so "QUBT fell 6.9%" cross-references without
   a hunt. Whole-token match, case-SENSITIVE on purpose: bot copy writes
   tickers uppercase, and a held ticker that is also an English word
   (ON, ARE, IT, NOW, CAN, BE, AT, KEY, MAN) would otherwise chip on
   ordinary prose — "fell on Friday" is not an ON Semiconductor mention.
   The left boundary also excludes '.', so a held TO doesn't chip on the
   .TO exchange suffix in "VFV.TO" (VFV itself still does — the suffix
   doesn't claim the base ticker). */
export function mentionedSymbols(text: string, heldSymbols: string[]): string[] {
  return heldSymbols.filter((sym) =>
    new RegExp(`(^|[^A-Z0-9.])${sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Z0-9]|$)`).test(
      text,
    ),
  )
}

/* Asset-class → label key — the allocation legend and the headline
   facets name classes with the same vocabulary. */
export const ASSET_LABEL: Record<AssetClass, keyof typeof IM> = {
  equity: 'invest_asset_equity',
  etf: 'invest_asset_etf',
  crypto: 'invest_asset_crypto',
  bond: 'invest_asset_bond',
  cash: 'invest_asset_cash',
  other: 'invest_asset_other',
}

const localeOf = (lang: Lang): string => (lang === 'fr' ? 'fr-CA' : 'en-CA')

/** Locale-aware number — 1000 → "1,000" / "1 000". `digits` pins the
    fraction width (20.66 → "20.7" / "20,7"); a {min,max} object allows
    trailing-zero trim ("20%" but "20.7%"). */
export function fmtNum(
  lang: Lang,
  n: number,
  digits?: number | { min?: number; max?: number },
): string {
  const opts =
    digits === undefined
      ? undefined
      : typeof digits === 'number'
        ? { minimumFractionDigits: digits, maximumFractionDigits: digits }
        : {
            minimumFractionDigits: digits.min ?? 0,
            maximumFractionDigits: digits.max ?? 3,
          }
  return Number(n).toLocaleString(localeOf(lang), opts)
}

/** YYYY-MM-DD → localized medium date ("Oct 14, 2026" / "14 oct. 2026").
    Noon-parsed so a UTC-midnight read can't roll the day back; a malformed
    input returns as-is rather than printing "Invalid Date". */
export function fmtDay(lang: Lang, iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(localeOf(lang), { dateStyle: 'medium' })
}

/** Pluralized count — "1 rule" / "3 rules" / "1 règle" / "0 signal". */
export function pl(lang: Lang, n: number, one: Bi, many: Bi): string {
  const word = pick(lang === 'fr' ? (n <= 1 ? one : many) : n === 1 ? one : many, lang)
  return `${fmtNum(lang, n)} ${word}`
}

/** Money threshold with its unit — "$1,000 CAD" / "1 000 $ CAD". The book
    currency comes from the first active account (the engine's own rule);
    CAD is only the fallback, not a hardcoded label. */
export function fmtCad(lang: Lang, n: number, ccy = 'CAD'): string {
  return lang === 'fr' ? `${fmtNum(lang, n)} $ ${ccy}` : `$${fmtNum(lang, n)} ${ccy}`
}

/** Metrics whose threshold is a money amount in the BOOK currency — the
    input/labels carry the "$ … {ccy}" suffix treatment (fix #5).
    Everything else is a percentage. `price` is deliberately absent: its
    amount is in the symbol's *listing* currency, which varies across a
    scope — it formats unitless ("Price rises above 150") and takes the
    bare-$ input treatment instead of a possibly-wrong {ccy} label. */
export const CURRENCY_METRICS: readonly RuleMetric[] = ['value_floor', 'cash_above']

export function isCurrencyMetric(metric: RuleMetric): boolean {
  return CURRENCY_METRICS.includes(metric)
}

/** Percent threshold with its unit on the value — "−8%" / "−8 %"
    (typographic minus; FR keeps the thin space before %). */
export function fmtPct(
  lang: Lang,
  n: number,
  digits?: number | { min?: number; max?: number },
): string {
  const s = fmtNum(lang, n, digits).replace('-', '−')
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
 * "Cash balance rises above $500 CAD". `ccy` is the book currency — money
 * thresholds are denominated in it, not always CAD.
 */
export function ruleTitle(lang: Lang, rule: StrategyRule, ccy = 'CAD'): string {
  const fmt = (n: number) =>
    rule.metric === 'price'
      ? fmtNum(lang, n)
      : isCurrencyMetric(rule.metric)
        ? fmtCad(lang, n, ccy)
        : Number.isFinite(n)
          ? fmtPct(lang, n)
          : ''
  if (rule.op === 'between') {
    const lo = Math.min(rule.value, rule.value2 ?? rule.value)
    const hi = Math.max(rule.value, rule.value2 ?? rule.value)
    return `${metricLabel(lang, rule.metric)} ${pick(IM.invest_sb_verb_between, lang)} ${fmt(lo)} ${pick(IM.invest_sb_and, lang)} ${fmt(hi)}`.trimEnd()
  }
  const verb = pick(rule.op === 'lt' ? IM.invest_sb_verb_below : IM.invest_sb_verb_above, lang)
  return `${metricLabel(lang, rule.metric)} ${verb} ${fmt(rule.value)}`.trimEnd()
}

/** Title persisted on the wire — the user's label when present, else the
    English auto-title so the dedupe fallback key stays distinct. The
    stored form stays CAD-templated: the label predates the book currency,
    and titles are fallback keys, not rendered truth. Delegates to the data
    layer's persistedRuleTitle so every writer — editor, watchlist alert,
    thesis conditions — stores the identical fallback string. */
export function storedRuleTitle(rule: StrategyRule): string {
  return persistedRuleTitle(rule)
}

/** Live plain-language preview under the quantity control — "Buys 1 share",
    "Adds 1% to your existing position", "Vend pour 1 000 $ CAD". A
    currency-unit amount is denominated in the book currency. */
export function qtyPreview(lang: Lang, rule: OrderProposalRule, ccy = 'CAD'): string {
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
  return fill(pick(IM.invest_sb_qty_worth, lang), { side, n: fmtCad(lang, amt, ccy) })
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

/** "0.4s" / "1 min" — whole minutes once the run crosses 60 s ("60s" on a
    history row reads as a typo for "minutes"). */
export function formatDuration(lang: Lang, ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return '—'
  const s = Math.round(ms / 100) / 10
  if (s >= 60) {
    return `${Math.round(s / 60).toLocaleString(localeOf(lang))} min`
  }
  return `${s.toLocaleString(localeOf(lang))}s`
}

/** One run-history row — "Sep 29, 4:15 PM — Agent sweep · 12 symbols
    scanned · 1 signal · 2 proposals · 0.4s". The scanned segment explains
    why a run fired nothing; rows recorded before 0184 (null duration,
    no symbols_scanned) omit it rather than claim "0 scanned", and a
    book-metrics-only strategy row says so instead. Sweep rows carry AI
    book observations, not rule signals — labelled as such. */
export function runLine(lang: Lang, run: InvestBotRun, strategyName?: string): string {
  const when = formatRunWhen(lang, run.ranAt)
  const isSweep = run.strategyId === null
  const what = isSweep
    ? pick(IM.invest_sb_sweep, lang)
    : (strategyName ?? pick(IM.invest_run_deleted_strategy, lang))
  const scanned =
    run.symbolsScanned.length === 0 && run.durationMs !== null
      ? pick(IM.invest_sb_book_only, lang)
      : run.durationMs !== null || run.symbolsScanned.length > 0
        ? pl(lang, run.symbolsScanned.length, IM.invest_sb_scanned_one, IM.invest_sb_scanned_many)
        : null
  return [
    `${when} — ${what}`,
    scanned,
    pl(
      lang,
      run.signalsEmitted,
      isSweep ? IM.invest_sb_observation_one : IM.invest_sb_signal_one,
      isSweep ? IM.invest_sb_observation_many : IM.invest_sb_signal_many,
    ),
    pl(lang, run.proposalsCreated, IM.invest_sb_proposal_one, IM.invest_sb_proposal_many),
    run.durationMs !== null ? formatDuration(lang, run.durationMs) : null,
  ]
    .filter((s): s is string => s !== null)
    .join(' · ')
}

/* ── Test-scan result rendering ─────────────────────────────────────────── */

function matchReading(
  lang: Lang,
  match: TestScanMatch,
  rule: StrategyRule | undefined,
  ccy: string,
): string {
  const v =
    rule?.metric === 'price'
      ? fmtNum(lang, match.metricValue)
      : isCurrencyMetric(rule?.metric ?? 'cash_above')
        ? fmtCad(lang, match.metricValue, ccy)
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
    / Outcome: alert notification". Book-level matches (empty symbol) get
    the portfolio label — 'Agent sweep' as a symbol was nonsense. A
    suppressed hit says so: a real scan would not re-emit it. */
export function matchCard(
  lang: Lang,
  match: TestScanMatch,
  rule: StrategyRule | undefined,
  ccy = 'CAD',
): { symbol: string; detail: string; outcome: string; suppressed: boolean } {
  const title = match.ruleTitle
  const detail = fill(pick(IM.invest_sb_match_line, lang), {
    title,
    detail: matchReading(lang, match, rule, ccy),
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
  return {
    symbol: match.symbol || pick(IM.invest_sb_book_match, lang),
    detail,
    outcome: match.suppressed
      ? `${outcome} · ${pick(IM.invest_sb_outcome_suppressed, lang)}`
      : outcome,
    suppressed: match.suppressed === true,
  }
}

/** Summary line under the results heading — "{symbols} scanned · {signals}
    · {proposals}" with real plural nouns, plus the suppressed count when
    matches are already covered by an open signal/draft (the dry run reads
    the same dedupe sets the sweep does). */
export function scanSummaryLine(lang: Lang, res: {
  symbolsScanned: string[]
  signals: number
  proposals: number
  matches?: TestScanMatch[]
}): string {
  const base = fill(pick(IM.invest_sb_scanned_line, lang), {
    symbols: pl(lang, res.symbolsScanned.length, IM.invest_sb_tracked_one, IM.invest_sb_tracked_many),
    signals: pl(lang, res.signals, IM.invest_sb_signal_one, IM.invest_sb_signal_many),
    proposals: pl(lang, res.proposals, IM.invest_sb_proposal_one, IM.invest_sb_proposal_many),
  })
  const suppressed = res.matches?.filter((m) => m.suppressed).length ?? 0
  return suppressed > 0
    ? `${base} · ${fill(pick(IM.invest_sb_suppressed_seg, lang), { n: fmtNum(lang, suppressed) })}`
    : base
}

/** Localized text for a save-blocking rule problem — the rule's position
    in the list names it for the user ("Rule 2 needs a threshold"). */
export function ruleProblemText(lang: Lang, problem: RuleProblem): string {
  const n = fmtNum(lang, problem.index + 1)
  const key =
    problem.code === 'qty_required'
      ? IM.invest_sb_rule_needs_qty
      : problem.code === 'value2_required'
        ? IM.invest_sb_rule_needs_value2
        : IM.invest_sb_rule_needs_value
  return fill(pick(key, lang), { n })
}

/** Localized render of a run warning — the engine ships code+params twins
    alongside its English strings so a bilingual UI never shows raw
    engine text. Unknown codes fall back to the raw string rather than
    dropping the warning. */
export function warningText(
  lang: Lang,
  warning: RunWarning | undefined,
  fallback: string,
): string {
  if (!warning) return fallback
  const p = warning.params
  switch (warning.code) {
    case 'fx_missing':
      return fill(pick(IM.invest_warn_fx_missing, lang), { currencies: p.currencies ?? '' })
    case 'no_snapshot':
      return fill(pick(IM.invest_warn_no_snapshot, lang), { symbols: p.symbols ?? '' })
    case 'qty_unresolvable':
      return fill(pick(IM.invest_warn_qty_unresolvable, lang), {
        title: p.title ?? '',
        symbol: p.symbol ?? '',
      })
    case 'book_metric_proposal':
      return fill(pick(IM.invest_warn_book_proposal, lang), { title: p.title ?? '' })
    case 'cash_fx_missing':
      return pick(IM.invest_warn_cash_fx, lang)
    case 'no_paper_account':
      return pick(IM.invest_warn_no_paper, lang)
    case 'email_failed':
      return fill(pick(IM.invest_warn_email_failed, lang), { name: p.name ?? '' })
    case 'digest_failed':
      return pick(IM.invest_warn_digest_failed, lang)
    case 'run_history_failed':
      return pick(IM.invest_warn_history_failed, lang)
    default:
      return fallback
  }
}

/** Tally's opening turn on an empty conversation — one breath: hello, at
    most one thing she noticed (the watchlist count, queued orders waiting,
    or open signals), then a question. Deterministic and bilingual, so she
    speaks first without a model call. */
export function tallyGreeting(
  state: {
    watchlist: unknown[]
    orders: { status: string }[]
    signals: { status: string }[]
  } | undefined,
  lang: Lang,
): string {
  const parts = [pick(IM.invest_chat_hi, lang)]
  if (state) {
    const queued = state.orders.filter((o) => o.status === 'queued' || o.status === 'draft').length
    const open = state.signals.filter((s) => s.status === 'new').length
    if (queued >= 1) {
      parts.push(pl(lang, queued, IM.invest_chat_hi_orders_one, IM.invest_chat_hi_orders_many))
    } else if (state.watchlist.length >= 1) {
      parts.push(
        pl(lang, state.watchlist.length, IM.invest_chat_hi_watch_one, IM.invest_chat_hi_watch_many),
      )
    } else if (open >= 1) {
      parts.push(pl(lang, open, IM.invest_chat_hi_signals_one, IM.invest_chat_hi_signals_many))
    }
  }
  parts.push(pick(IM.invest_chat_hi_ask, lang))
  return parts.join(' ')
}

/** The Overview strip — Tally's presence outside the chat tab. One thing
    she noticed, picked deterministically from local state (no call): queued
    orders waiting on the user, else open signals, else the watchlist size.
    `kind` lets the brief drop the same fact rather than say it twice on
    one screen. Null means nothing worth noticing; the strip stays hidden. */
export function tallyNoticed(
  state: {
    watchlist: unknown[]
    orders: { status: string }[]
    signals: { status: string }[]
  } | undefined,
  lang: Lang,
): { kind: 'orders' | 'signals' | 'watch'; text: string } | null {
  if (!state) return null
  const queued = state.orders.filter((o) => o.status === 'queued' || o.status === 'draft').length
  if (queued >= 1) {
    return {
      kind: 'orders',
      text: pl(lang, queued, IM.invest_home_tally_orders_one, IM.invest_home_tally_orders_many),
    }
  }
  const open = state.signals.filter((s) => s.status === 'new').length
  if (open >= 1) {
    return {
      kind: 'signals',
      text: pl(lang, open, IM.invest_home_tally_signals_one, IM.invest_home_tally_signals_many),
    }
  }
  if (state.watchlist.length >= 1) {
    return {
      kind: 'watch',
      text: pl(lang, state.watchlist.length, IM.invest_home_tally_watch_one, IM.invest_home_tally_watch_many),
    }
  }
  return null
}
