/**
 * Pure aggregation behind the Analytics cards — every number a customer
 * could screenshot is computed here, deterministically, from injected
 * inputs. No `Date.now()`: callers pass "today" (the demo passes the
 * diorama's fixed date, production passes the real one), so the demo stays
 * stable and every path is unit-testable.
 *
 * All dates are YYYY-MM-DD strings compared in UTC.
 */

export function parseISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

/** Whole days from `fromISO` to `toISO` (negative when `toISO` is earlier). */
export function daysBetweenISO(fromISO: string, toISO: string): number {
  const ms = parseISODate(toISO).getTime() - parseISODate(fromISO).getTime()
  return Math.round(ms / 86_400_000)
}

/** First-of-month (YYYY-MM-01) for the month containing `todayISO`. */
export function monthStartISO(todayISO: string): string {
  return `${todayISO.slice(0, 7)}-01`
}

/** ISO date shifted by whole days (negative shifts backwards). */
export function addDaysISO(iso: string, days: number): string {
  const date = parseISODate(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Localized month name off a YYYY-MM-DD string ('Feb' / 'févr.' / 'February'…). */
export function formatMonthISO(
  monthISO: string,
  locale: string,
  style: 'short' | 'long' = 'short',
): string {
  return new Intl.DateTimeFormat(locale, { month: style, timeZone: 'UTC' }).format(
    parseISODate(monthISO),
  )
}

/* ------------------------------------------------------- needs attention */

export type AttentionStatus = 'overdue' | 'due_soon' | 'upcoming'

export interface RankedAttention<T> {
  item: T
  status: AttentionStatus
  /** Whole days until due — negative when overdue. */
  daysUntilDue: number
}

/**
 * Rank dated items for the "Needs attention" card: ascending by due date,
 * which puts overdue first (most overdue at the top) and then soonest-due —
 * exactly the required order. Ties break on id so the order is stable.
 */
export function rankAttention<T extends { id: string; dueISO: string }>(
  items: readonly T[],
  todayISO: string,
  dueSoonDays = 14,
): RankedAttention<T>[] {
  return [...items]
    .sort((a, b) => a.dueISO.localeCompare(b.dueISO) || a.id.localeCompare(b.id))
    .map((item) => {
      const daysUntilDue = daysBetweenISO(todayISO, item.dueISO)
      const status: AttentionStatus =
        daysUntilDue < 0 ? 'overdue' : daysUntilDue <= dueSoonDays ? 'due_soon' : 'upcoming'
      return { item, status, daysUntilDue }
    })
}

/* ------------------------------------------------------------ score axis */

export interface AxisWindow {
  min: number
  max: number
  ticks: number[]
}

/**
 * Window an axis to the data instead of zero: pad the data range, snap to
 * clean ticks (5s for narrow ranges, 10s for wide ones) and clamp to the
 * scale's bounds. Data 74–82 → axis 70–85 with ticks every 5.
 */
export function windowAxis(
  values: readonly number[],
  { pad = 2, clampMin = 0, clampMax = Number.POSITIVE_INFINITY } = {},
): AxisWindow {
  if (values.length === 0) {
    const max = Number.isFinite(clampMax) ? clampMax : 100
    const step = (max - clampMin) / 4
    return { min: clampMin, max, ticks: [0, 1, 2, 3, 4].map((i) => clampMin + i * step) }
  }
  const lo = Math.min(...values) - pad
  const hi = Math.max(...values) + pad
  const step = hi - lo <= 30 ? 5 : 10
  const min = Math.max(clampMin, Math.floor(lo / step) * step)
  const max = Math.min(clampMax, Math.ceil(hi / step) * step)
  const ticks: number[] = []
  for (let t = min; t <= max; t += step) ticks.push(t)
  return { min, max, ticks }
}

/** The windowed axis for a 0–100 score. */
export function windowScoreAxis(values: readonly number[], pad = 2): AxisWindow {
  return windowAxis(values, { pad, clampMax: 100 })
}

/* ----------------------------------------------------------- score delta */

export interface ScoreDelta {
  current: number
  baseline: number
  delta: number
  baselineMonthISO: string
}

/** Current score vs the oldest point in the window (needs ≥ 2 points). */
export function scoreDelta(
  history: readonly { monthISO: string; score: number }[],
): ScoreDelta | null {
  if (history.length < 2) return null
  const sorted = [...history].sort((a, b) => a.monthISO.localeCompare(b.monthISO))
  const first = sorted[0]!
  const last = sorted.at(-1)!
  return {
    current: last.score,
    baseline: first.score,
    delta: last.score - first.score,
    baselineMonthISO: first.monthISO,
  }
}

/* ------------------------------------------------------------ case aging */

export interface CaseAgingRow<T> {
  caseRow: T
  daysOpen: number
}

export interface CaseAging<T> {
  openCount: number
  avgDays: number
  oldestDays: number
  /** Oldest first — the row most worth looking at leads. */
  rows: CaseAgingRow<T>[]
}

export function caseAging<T extends { openedISO: string }>(
  openCases: readonly T[],
  todayISO: string,
): CaseAging<T> | null {
  if (openCases.length === 0) return null
  const rows = openCases
    .map((caseRow) => ({
      caseRow,
      daysOpen: Math.max(0, daysBetweenISO(caseRow.openedISO, todayISO)),
    }))
    .sort((a, b) => b.daysOpen - a.daysOpen)
  const total = rows.reduce((sum, r) => sum + r.daysOpen, 0)
  return {
    openCount: rows.length,
    avgDays: Math.round(total / rows.length),
    oldestDays: rows[0]!.daysOpen,
    rows,
  }
}

/* --------------------------------------------------------- expiry buckets */

export interface ExpiryBuckets<T> {
  expired: T[]
  /** Due within 30 days (inclusive), starting today. */
  within30: T[]
  /** 31–60 days out. */
  within60: T[]
  /** 61–90 days out. */
  within90: T[]
}

/**
 * Bucket dated records for the certification / document-expiry cards:
 * expired · ≤30 · 31–60 · 61–90 days, each sorted soonest-first. Records
 * more than 90 days out are excluded — the cards look one quarter ahead.
 */
export function expiryBuckets<T extends { id: string; expiryISO: string }>(
  records: readonly T[],
  todayISO: string,
): ExpiryBuckets<T> {
  const buckets: ExpiryBuckets<T> = { expired: [], within30: [], within60: [], within90: [] }
  const sorted = [...records].sort(
    (a, b) => a.expiryISO.localeCompare(b.expiryISO) || a.id.localeCompare(b.id),
  )
  for (const record of sorted) {
    const days = daysBetweenISO(todayISO, record.expiryISO)
    if (days < 0) buckets.expired.push(record)
    else if (days <= 30) buckets.within30.push(record)
    else if (days <= 60) buckets.within60.push(record)
    else if (days <= 90) buckets.within90.push(record)
  }
  return buckets
}

/** Flat soonest-first list across all four buckets. */
export function flattenBuckets<T>(buckets: ExpiryBuckets<T>): T[] {
  return [...buckets.expired, ...buckets.within30, ...buckets.within60, ...buckets.within90]
}

/* ------------------------------------------------- acknowledgment meter */

export interface AckProgress {
  signed: number
  total: number
  outstanding: number
  /** 0–100, rounded. */
  pct: number
}

export function ackProgress(signed: number, total: number): AckProgress {
  const safeTotal = Math.max(0, total)
  const safeSigned = Math.min(Math.max(0, signed), safeTotal)
  return {
    signed: safeSigned,
    total: safeTotal,
    outstanding: safeTotal - safeSigned,
    pct: safeTotal > 0 ? Math.round((safeSigned / safeTotal) * 100) : 0,
  }
}

/* --------------------------------------------------------- turnover rate */

/**
 * Rolling 12-month turnover: terminations dated inside
 * (windowEnd − 365 days, windowEnd] over the average headcount, as a
 * percentage rounded to one decimal. Null when the denominator is missing
 * or zero — no rate is better than a fictional one.
 */
export function turnoverRatePct(
  terminationISOs: readonly string[],
  windowEndISO: string,
  avgHeadcount: number | null,
): number | null {
  if (avgHeadcount === null || avgHeadcount <= 0) return null
  const windowStartISO = addDaysISO(windowEndISO, -365)
  const separations = terminationISOs.filter((d) => d > windowStartISO && d <= windowEndISO).length
  return Math.round((separations / avgHeadcount) * 1000) / 10
}

/**
 * Mean of the month-series values whose month falls inside
 * (startExclusive, endInclusive] — the turnover denominator over snapshot
 * headcounts. Null when the window holds no points.
 */
export function meanInWindow(
  points: readonly { monthISO: string; value: number }[],
  startExclusiveISO: string,
  endInclusiveISO: string,
): number | null {
  const inWindow = points.filter(
    (p) => p.monthISO > startExclusiveISO && p.monthISO <= endInclusiveISO,
  )
  if (inWindow.length === 0) return null
  return inWindow.reduce((sum, p) => sum + p.value, 0) / inWindow.length
}

/* ------------------------------------------- production score components */

/**
 * Score formula version, recorded on every snapshot row so a trend that
 * crosses a formula change can be labeled instead of silently mixed.
 * v1: raw done/total ratios for all three components, no ceiling.
 * v2: findings weighted by severity, cancelled tasks excluded, and an open
 *     critical finding caps the blend.
 * v3: the obligation register as a fourth component (status 'ok' over all),
 *     and tasks scoped to provenanced rows (docs/SCORING_LOGIC.md §8).
 * v4: Comms/PR signals added — issues resolved/closed, submissions
 *     submitted/recorded, active brand claims, and closed/in-force policy
 *     files.
 *
 * MIRROR: supabase/functions/record-score-snapshots/scoring.ts computes the
 * same formula for the scheduled job; scoring.test.ts there is the drift
 * test. Change the two together.
 */
export const SCORE_FORMULA_VERSION = 4

/**
 * v3 task scoping: only rows with provenance count toward the score — a
 * category the pipeline or a module set (anything but the 'general'
 * default), or an app-written metadata.kind linkage. A hand-added to-do is
 * real work but not compliance posture. Everything still counts in the
 * Tasks view, the nav badge and the attention queue — this rule scopes the
 * score only.
 */
export function isProvenancedTask(category: string, linkedKind: string | null): boolean {
  return category !== 'general' || linkedKind !== null
}

/**
 * Severity weights for the findings component: a critical exposure moves
 * the score more than a note. Frozen for v2 — changing them is a formula
 * change and bumps SCORE_FORMULA_VERSION.
 */
export const FINDING_SEVERITY_WEIGHTS = {
  info: 1,
  low: 2,
  medium: 3,
  high: 5,
  critical: 8,
} as const

/**
 * An org with an open critical finding must not read as healthy no matter
 * what the other components average: the blend is capped below any healthy
 * reading while one is open. Dismissing or resolving the finding lifts it.
 */
export const CRITICAL_SCORE_CEILING = 69

export interface ScoreComponent {
  key: string
  done: number
  total: number
  /** 0–100, rounded — null when the component has no rows yet. */
  pct: number | null
  /** Severity-weighted numerator/denominator, set only by weightedComponent. */
  weightedDone?: number
  weightedTotal?: number
}

export function scoreComponent(key: string, done: number, total: number): ScoreComponent {
  return {
    key,
    done,
    total,
    pct: total > 0 ? Math.round((done / total) * 100) : null,
  }
}

/**
 * Severity-weighted component: pct is resolved-weight over total-weight,
 * while done/total stay raw counts so the meter's "1 of 2" text remains
 * literal. Null pct when there are no rows, same as scoreComponent.
 */
export function weightedComponent(
  key: string,
  items: readonly { done: boolean; weight: number }[],
): ScoreComponent {
  const weightedTotal = items.reduce((sum, i) => sum + i.weight, 0)
  const weightedDone = items.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0)
  return {
    key,
    done: items.filter((i) => i.done).length,
    total: items.length,
    weightedDone,
    weightedTotal,
    pct: weightedTotal > 0 ? Math.round((weightedDone / weightedTotal) * 100) : null,
  }
}

/**
 * Blend component percentages into one score: the unweighted mean of the
 * components that have data. Null until at least one component has rows.
 */
export function blendScore(components: readonly ScoreComponent[]): number | null {
  const present = components.filter((c): c is ScoreComponent & { pct: number } => c.pct !== null)
  if (present.length === 0) return null
  return Math.round(present.reduce((sum, c) => sum + c.pct, 0) / present.length)
}

export interface CeilingResult {
  score: number | null
  /** True only when the ceiling actually lowered the blend. */
  capped: boolean
}

/** Apply the open-critical ceiling to a blended score. */
export function applyCriticalCeiling(
  score: number | null,
  openCriticalCount: number,
): CeilingResult {
  if (score === null || openCriticalCount === 0 || score <= CRITICAL_SCORE_CEILING) {
    return { score, capped: false }
  }
  return { score: CRITICAL_SCORE_CEILING, capped: true }
}
