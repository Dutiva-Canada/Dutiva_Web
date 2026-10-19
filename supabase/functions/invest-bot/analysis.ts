/**
 * Book-level analysis — SMART goals and the scan-board connector.
 *
 * A goal row is a measurable objective: metric + direction + target +
 * an optional deadline. Every sweep re-measures the metric against the
 * book it already loaded (no new data feeds, no model in the verdict)
 * and stamps status + eval_detail — the Analysis page renders straight
 * from the row. Statuses: 'on_track' → 'behind' (deadline under 30 days
 * and not met, or materially behind pace — a quarter of the window
 * gone with less than half the expected progress) → 'missed' (deadline
 * passed) or 'achieved' (met).
 * 'achieved' and 'missed' are terminal — a finished goal doesn't
 * oscillate back and forth as prices move.
 *
 * Scan items aren't re-scored — the sweep connects them. When a thesis
 * transitions to drifting/broken and a watch item lists that symbol, a
 * kind 'scan' signal links the two ("your currency-policy watch may
 * explain ARM's drift"). Whole-book items (empty symbols) connect to
 * any degrading thesis.
 *
 * Pure + deterministic, same contract as evaluateTheses: no writes.
 */
import type { Position, MarketSnapshot, RunContext } from './handlers.ts'

export type GoalMetric =
  | 'book_value'
  | 'cash_pct'
  | 'max_weight_pct'
  | 'unrealized_gain_pct'
  | 'thesis_coverage'
  | 'position_count'
export type GoalOp = 'gte' | 'lte'
export type GoalStatus = 'on_track' | 'behind' | 'achieved' | 'missed'

export interface Goal {
  id: string
  title: string
  metric: GoalMetric
  op: GoalOp
  target: number
  baseline: number | null
  /** ISO date (yyyy-mm-dd) or null — an open-ended goal can't be behind
      or missed, only on-track or achieved. */
  deadline: string | null
  status: GoalStatus
  /** Row creation — the pace window runs from here to the deadline. */
  created_at?: string | null
  last_evaluated_at?: string | null
}

export interface GoalEvalDetail {
  /** The metric's current read — null when it can't compute (no marks). */
  current: number | null
  target: number
  op: GoalOp
  /** 0–100 progress toward the target from the creation baseline —
      null when the metric can't read or the goal is already met. */
  progress_pct: number | null
  /** 0–100 share of the created→deadline window already elapsed —
      the pace expectation. Null for open-ended goals. */
  expected_pct: number | null
  /** Days until the deadline — negative means it passed. */
  days_left: number | null
  /** Bilingual status line the card renders directly. */
  line_en: string
  line_fr: string
}

export interface GoalEval {
  id: string
  status: GoalStatus
  statusChanged: boolean
  /** Stamped on the first eval — progress math reads from it. */
  baseline: number | null
  detail: GoalEvalDetail
}

/** Everything a metric needs — the run builds it once and shares it
    between the goal pass and the page's "current" column. */
export interface GoalBookContext {
  bookValue: number
  cashTotal: number
  /** mark value per position in book currency (FX-converted). */
  marks: Map<string, number>
  /** unrealized gain % per position — null when it can't compute. */
  gainPcts: Map<string, number>
  /** Held symbols carrying a thesis row. */
  thesisedCount: number
  positionCount: number
}

/** Per-position gain % — price vs avg cost converted through FX. */
function gainPctFor(
  p: Position,
  snap: MarketSnapshot,
  ctx: RunContext,
): number | null {
  if (p.avg_cost <= 0 || !ctx.toBook) return null
  const pxBook = ctx.toBook(snap.price, snap.currency)
  const costBook = ctx.toBook(p.avg_cost, p.currency ?? snap.currency)
  if (pxBook === null || pxBook <= 0 || costBook === null || costBook <= 0) return null
  return ((pxBook - costBook) / costBook) * 100
}

/** Build the shared context from the rows runUser already loaded —
    the same FX-aware marks the rule engine and theses use. */
export function goalBookContext(
  positions: Position[],
  snapshots: MarketSnapshot[],
  ctx: RunContext,
  theses: { asset_class: string; symbol: string }[],
): GoalBookContext {
  const marks = new Map<string, number>()
  const gainPcts = new Map<string, number>()
  for (const p of positions) {
    const key = `${p.asset_class}:${p.symbol.toUpperCase()}`
    const snap = snapshots.find(
      (s) => s.asset_class === p.asset_class && s.symbol === p.symbol,
    )
    if (!snap) continue
    const mark = ctx.toBook?.(p.quantity * snap.price, snap.currency)
    if (mark !== null && mark !== undefined) marks.set(key, mark)
    const g = gainPctFor(p, snap, ctx)
    if (g !== null) gainPcts.set(key, g)
  }
  const thesised = new Set(
    theses.map((t) => `${t.asset_class}:${t.symbol.toUpperCase()}`),
  )
  const thesisedCount = positions.filter((p) =>
    thesised.has(`${p.asset_class}:${p.symbol.toUpperCase()}`),
  ).length
  return {
    bookValue: ctx.bookValue,
    cashTotal: ctx.cashTotal,
    marks,
    gainPcts,
    thesisedCount,
    positionCount: positions.length,
  }
}

/** The metric's current read — null when it genuinely can't compute
    (an unsnapshotted book has no weights or gains). */
export function goalCurrent(metric: GoalMetric, ctx: GoalBookContext): number | null {
  switch (metric) {
    case 'book_value':
      return ctx.bookValue > 0 ? ctx.bookValue : null
    case 'cash_pct':
      return ctx.bookValue > 0 ? (ctx.cashTotal / ctx.bookValue) * 100 : null
    case 'max_weight_pct': {
      if (ctx.bookValue <= 0 || ctx.marks.size === 0) return null
      let max = 0
      for (const m of ctx.marks.values()) max = Math.max(max, (m / ctx.bookValue) * 100)
      return max
    }
    case 'unrealized_gain_pct': {
      if (ctx.gainPcts.size === 0) return null
      let sum = 0
      for (const g of ctx.gainPcts.values()) sum += g
      return sum / ctx.gainPcts.size
    }
    case 'thesis_coverage':
      return ctx.positionCount > 0 ? (ctx.thesisedCount / ctx.positionCount) * 100 : null
    case 'position_count':
      return ctx.positionCount
  }
}

const goalMet = (op: GoalOp, current: number, target: number): boolean =>
  op === 'gte' ? current >= target : current <= target

/** Progress toward the target, 0–100 — from the creation baseline when
    it exists and the goal isn't already there, else the share read. */
function goalProgress(
  op: GoalOp,
  current: number,
  target: number,
  baseline: number | null,
): number | null {
  if (goalMet(op, current, target)) return 100
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
  if (op === 'gte') {
    if (baseline !== null && baseline < target) {
      return clamp(((current - baseline) / (target - baseline)) * 100)
    }
    return target > 0 ? clamp((current / target) * 100) : null
  }
  /* lte — shrinking toward a lower target. */
  if (baseline !== null && baseline > target) {
    return clamp(((baseline - current) / (baseline - target)) * 100)
  }
  return null
}

/** Whole days from today to the deadline — negative once it passes.
    The date is UTC-parsed; a date input means "end of that day". */
function daysLeft(deadline: string, now: number): number {
  const end = Date.parse(`${deadline}T23:59:59Z`)
  if (!Number.isFinite(end)) return 0
  return Math.floor((end - now) / 86_400_000)
}

/** Pace expectation — the elapsed share of the created→deadline window
    as 0–100. Null when the window can't read (no creation stamp, a
    malformed or inverted range): silence isn't a verdict. */
function expectedPct(
  createdAt: string | null | undefined,
  deadline: string,
  now: number,
): number | null {
  const start = Date.parse(createdAt ?? '')
  const end = Date.parse(`${deadline}T23:59:59Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100))
}

const fmtNum = (n: number): string =>
  Math.abs(n) >= 1000 ? Math.round(n).toLocaleString('en-CA') : `${Math.round(n * 10) / 10}`
const fmtNumFr = (n: number): string =>
  Math.abs(n) >= 1000 ? Math.round(n).toLocaleString('fr-CA') : `${Math.round(n * 10) / 10}`

/** Bilingual status line — the eval writes it; the card never formats. */
function goalLine(
  metric: GoalMetric,
  status: GoalStatus,
  detail: { current: number; target: number; op: GoalOp; days_left: number | null },
): { en: string; fr: string } {
  const unit = metric === 'book_value' ? '' : '%'
  const cur = `${fmtNum(detail.current)}${unit}`
  const curFr = `${fmtNumFr(detail.current)}${unit === '%' ? ' %' : ''}`
  const tgt = `${fmtNum(detail.target)}${unit}`
  const tgtFr = `${fmtNumFr(detail.target)}${unit === '%' ? ' %' : ''}`
  switch (status) {
    case 'achieved':
      return {
        en: `Goal met — ${cur} against the ${tgt} target.`,
        fr: `Objectif atteint — ${curFr} contre la cible de ${tgtFr}.`,
      }
    case 'missed':
      return {
        en: `Deadline passed — ${cur} against the ${tgt} target.`,
        fr: `Échéance dépassée — ${curFr} contre la cible de ${tgtFr}.`,
      }
    case 'behind':
      return {
        en: `${detail.days_left ?? 0} days left — at ${cur}, target is ${tgt}.`,
        fr: `${detail.days_left ?? 0} jours restants — à ${curFr}, cible de ${tgtFr}.`,
      }
    case 'on_track':
      return detail.days_left !== null
        ? {
            en: `On the way — ${cur} against the ${tgt} target, ${detail.days_left} days left.`,
            fr: `En cours — ${curFr} contre la cible de ${tgtFr}, ${detail.days_left} jours restants.`,
          }
        : {
            en: `Open-ended — at ${cur}, target is ${tgt}.`,
            fr: `Sans échéance — à ${curFr}, cible de ${tgtFr}.`,
          }
  }
}

const TERMINAL: ReadonlySet<GoalStatus> = new Set(['achieved', 'missed'])
/** A 'behind' flag only earns its name this close to the deadline. */
const BEHIND_DAYS = 30
/** Or this far off pace: once a quarter of the created→deadline window
    has run, progress under half of expected reads 'behind' — a goal
    untouched for most of its window no longer claims 'on_track'. */
const PACE_MIN_PCT = 25
const PACE_RATIO = 0.5

/** Re-measure every goal against the book. Terminal statuses stick —
    an achieved goal stays achieved even if the metric drifts back. */
export function evaluateGoals(
  goals: Goal[],
  ctx: GoalBookContext,
  opts: { now?: number } = {},
): GoalEval[] {
  const now = opts.now ?? Date.now()
  return goals.map((g) => {
    const current = goalCurrent(g.metric, ctx)
    const baseline = g.baseline ?? current
    const left = g.deadline ? daysLeft(g.deadline, now) : null
    const expected = g.deadline ? expectedPct(g.created_at, g.deadline, now) : null
    const progress =
      current !== null ? goalProgress(g.op, current, g.target, baseline) : null
    let status: GoalStatus
    if (TERMINAL.has(g.status)) {
      status = g.status
    } else if (current !== null && goalMet(g.op, current, g.target)) {
      status = 'achieved'
    } else if (left !== null && left < 0) {
      status = 'missed'
    } else {
      const offPace =
        progress !== null &&
        expected !== null &&
        expected >= PACE_MIN_PCT &&
        progress < expected * PACE_RATIO
      status = (left !== null && left <= BEHIND_DAYS) || offPace ? 'behind' : 'on_track'
    }
    const line =
      current !== null
        ? goalLine(g.metric, status, {
            current,
            target: g.target,
            op: g.op,
            days_left: left,
          })
        : {
            en: 'No reading yet — the metric needs priced positions.',
            fr: 'Aucune lecture pour l’instant — la métrique exige des positions évaluées.',
          }
    /* A first eval on a degraded/at-target state still says so — same
       contract as theses: silence isn't a verdict. */
    const statusChanged =
      status !== g.status ||
      (!g.last_evaluated_at && status !== 'on_track')
    return {
      id: g.id,
      status,
      statusChanged,
      baseline,
      detail: {
        current,
        target: g.target,
        op: g.op,
        progress_pct: progress,
        expected_pct: expected,
        days_left: left,
        line_en: line.en,
        line_fr: line.fr,
      },
    }
  })
}

/** Signal title for a goal transition — the status word is the dedupe
    handle, same contract as thesisSignalTitle. */
export function goalSignalTitle(title: string, status: GoalStatus): { en: string; fr: string } {
  const label = title || 'Goal'
  switch (status) {
    case 'achieved':
      return { en: `${label} — goal met`, fr: `${label} — objectif atteint` }
    case 'missed':
      return { en: `${label} — goal missed`, fr: `${label} — objectif manqué` }
    case 'behind':
      return { en: `${label} — goal at risk`, fr: `${label} — objectif en péril` }
    case 'on_track':
      return { en: `${label} — goal back on track`, fr: `${label} — objectif de nouveau en voie` }
  }
}

/* ── Scan-board connector ───────────────────────────────────────────────── */

export type ScanDirection = 'tailwind' | 'headwind' | 'monitor'
export type ScanTheme =
  | 'economy'
  | 'policy'
  | 'sector'
  | 'currency'
  | 'geopolitical'
  | 'company'

export interface ScanItem {
  id: string
  theme: ScanTheme
  direction: ScanDirection
  title: string
  /** Uppercased symbols the item could touch — empty = whole book. */
  symbols: string[]
}

export interface ScanLink {
  item: ScanItem
  symbol: string
  thesisStatus: 'drifting' | 'broken'
}

/** Watch items that overlap a thesis that just degraded — the board's
    reason to exist: connecting a macro watch to a specific holding's
    fray. Empty-symbol items are whole-book and connect to anything. */
export function connectScan(
  items: ScanItem[],
  degraded: { asset_class: string; symbol: string; status: 'drifting' | 'broken' }[],
): ScanLink[] {
  const out: ScanLink[] = []
  if (degraded.length === 0) return out
  for (const item of items) {
    const covered = new Set(item.symbols.map((s) => s.toUpperCase()))
    for (const d of degraded) {
      if (covered.size > 0 && !covered.has(d.symbol.toUpperCase())) continue
      out.push({ item, symbol: d.symbol.toUpperCase(), thesisStatus: d.status })
    }
  }
  return out
}
