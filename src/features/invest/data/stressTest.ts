/**
 * Stress test — replay the book under hypothetical marks and re-evaluate
 * the user's own rules, theses, and goals. Client-side mirror of the
 * edge evaluator (supabase/functions/invest-bot/handlers.ts
 * metricValue/opMatches and analysis.ts goalCurrent) — the panel shows
 * what WOULD fire, it never writes anything. Keep the metric math in
 * sync with the server copies.
 */
import type {
  GoalMetric,
  GoalOp,
  InvestGoal,
  InvestPosition,
  InvestStrategy,
  InvestThesis,
  MarketSnapshot,
  RuleMetric,
  StrategyRule,
  ThesisStatus,
} from './types'
import { BOOK_METRICS } from './strategyRules'
import { convertFx, type FxTable } from './fx'

export interface Shock {
  /** 'ALL' hits every snapshot; a symbol matches (case-insensitive). */
  match: 'ALL' | string
  /** −15 means −15% on the mark. */
  pct: number
  /** 'fx' scales the foreign→book conversion instead of the quote — a
      stronger book currency shrinks foreign positions without moving
      their price. `pct` is the book currency's move (+5 = CAD up 5%). */
  kind?: 'price' | 'fx'
}

interface ShockedSnap extends MarketSnapshot {
  /** Multiplier on the converted (book-currency) value — 1 for price
      shocks, ~1/1.05 for a +5% book-currency FX shock. */
  bookScale: number
}

export interface StressStrategyHit {
  strategyName: string
  ruleTitle: string
  /** '' for book-level metrics. */
  symbol: string
}

export interface StressThesisResult {
  symbol: string
  name: string
  current: ThesisStatus
  stressed: ThesisStatus
  firedTitles: string[]
}

export interface StressGoalResult {
  title: string
  /** Shocked metric read — null when it genuinely can't compute. */
  current: number | null
  target: number
  op: GoalOp
  metric: GoalMetric
  /** null = couldn't evaluate (same silence-isn't-a-verdict rule). */
  met: boolean | null
}

export interface StressResult {
  bookValue: number | null
  /** vs the CURRENT book value — null when either side can't compute. */
  bookDeltaPct: number | null
  strategies: StressStrategyHit[]
  theses: StressThesisResult[]
  goals: StressGoalResult[]
  /** Symbols a shock named that no snapshot covers — they were skipped,
      not silently zeroed. */
  unmatched: string[]
}

export function applyShocks(
  snapshots: MarketSnapshot[],
  shocks: Shock[],
  bookCcy: string,
): { snaps: ShockedSnap[]; unmatched: string[] } {
  const matchedSymbols = new Set<string>()
  const snaps = snapshots.map((s) => {
    let price = s.price
    let bookScale = 1
    for (const sh of shocks) {
      const hit = sh.match === 'ALL' || s.symbol.toUpperCase() === sh.match.toUpperCase()
      if (!hit) continue
      matchedSymbols.add(s.symbol.toUpperCase())
      if (sh.kind === 'fx') {
        /* Foreign-currency marks only — a CAD quote doesn't re-price
           when CAD strengthens. */
        if (s.currency.toUpperCase() !== bookCcy) {
          bookScale *= 1 / (1 + sh.pct / 100)
        }
      } else {
        price = price * (1 + sh.pct / 100)
      }
    }
    const moved = price !== s.price
    return {
      ...s,
      price,
      /* The shock IS the day move — a −10% gap reads as −10% on the day,
         not "yesterday's change plus the gap". */
      dayChangePct:
        moved && s.price > 0 ? (price / s.price - 1) * 100 : s.dayChangePct,
      bookScale,
    }
  })
  const wanted = new Set(
    shocks.filter((s) => s.match !== 'ALL').map((s) => s.match.toUpperCase()),
  )
  const unmatched = [...wanted].filter((w) => !matchedSymbols.has(w))
  return { snaps, unmatched }
}

interface EvalCtx {
  bookValue: number
  cashTotal: number
  bookCcy: string
  fx: FxTable | null
}

function toBook(
  v: number,
  ccy: string,
  ctx: EvalCtx,
  bookScale = 1,
): number | null {
  const c = convertFx(v, ccy, ctx.bookCcy, ctx.fx)
  return c === null ? null : c * bookScale
}

function positionBookValue(
  p: InvestPosition,
  snap: ShockedSnap,
  ctx: EvalCtx,
): number | null {
  return toBook(p.quantity * snap.price, snap.currency, ctx, snap.bookScale)
}

/** Mirror of the edge metricValue — same null contract (an uncomputable
    metric is silence, not a fire). */
function metricValue(
  metric: RuleMetric,
  snap: ShockedSnap,
  position: InvestPosition | null,
  ctx: EvalCtx,
): number | null {
  switch (metric) {
    case 'day_change_pct':
      return snap.dayChangePct
    case 'vs_ma50':
      if (snap.ma50 === null || snap.ma50 === 0) return null
      return ((snap.price - snap.ma50) / snap.ma50) * 100
    case 'price':
      return snap.price
    case 'value_floor':
      return position ? positionBookValue(position, snap, ctx) : null
    case 'weight_pct': {
      if (!position || ctx.bookValue <= 0) return null
      const v = positionBookValue(position, snap, ctx)
      return v === null ? null : (v / ctx.bookValue) * 100
    }
    case 'unrealized_gain_pct': {
      if (!position || position.avgCost <= 0) return null
      const px = toBook(snap.price, snap.currency, ctx, snap.bookScale)
      const cost = toBook(position.avgCost, position.currency || snap.currency, ctx)
      if (px === null || cost === null || cost === 0) return null
      return ((px - cost) / cost) * 100
    }
    case 'cash_above':
      return ctx.cashTotal
  }
}

function opMatch(op: 'lt' | 'gt' | 'between', m: number, v: number, v2?: number): boolean {
  if (op === 'lt') return m < v
  if (op === 'gt') return m > v
  const lo = Math.min(v, v2 ?? v)
  const hi = Math.max(v, v2 ?? v)
  return m >= lo && m <= hi
}

function ruleFires(
  rule: StrategyRule,
  snap: ShockedSnap,
  position: InvestPosition | null,
  ctx: EvalCtx,
): boolean {
  const m = metricValue(rule.metric, snap, position, ctx)
  return m !== null && opMatch(rule.op, m, rule.value, rule.value2)
}

/** Scope symbols for a strategy — its explicit list plus the watchlist
    universe when it scans the watchlist. Mirrors the engine's expansion:
    watched ∪ held symbols. */
function strategyScopeSymbols(
  s: InvestStrategy,
  watchSymbols: string[],
  positions: InvestPosition[],
): string[] {
  const syms = new Set(s.scope.symbols.map((x) => x.toUpperCase()))
  if (s.scope.watchlist) {
    for (const w of watchSymbols) syms.add(w.toUpperCase())
    for (const p of positions) syms.add(p.symbol.toUpperCase())
  }
  return [...syms]
}

/** Find the position matching a snap — the engine keys on (class, symbol). */
function positionFor(
  positions: InvestPosition[],
  snap: MarketSnapshot,
): InvestPosition | null {
  return (
    positions.find(
      (p) => p.assetClass === snap.assetClass && p.symbol === snap.symbol,
    ) ?? null
  )
}

export function runStress(input: {
  snapshots: MarketSnapshot[]
  positions: InvestPosition[]
  strategies: InvestStrategy[]
  theses: InvestThesis[]
  goals: InvestGoal[]
  watchSymbols: string[]
  cashTotal: number
  bookCcy: string
  fx: FxTable | null
  shocks: Shock[]
}): StressResult {
  const { snaps, unmatched } = applyShocks(input.snapshots, input.shocks, input.bookCcy)

  const ctx: EvalCtx = {
    cashTotal: input.cashTotal,
    bookCcy: input.bookCcy,
    fx: input.fx,
    bookValue: 0,
  }
  /* Shocked book value — cash doesn't move under a price shock (the FX
     scenario leaves it: account cash is already denominated in its own
     currency). Positions re-mark under the shocked snaps. */
  let book = input.cashTotal
  for (const p of input.positions) {
    const snap = snaps.find(
      (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
    )
    if (!snap) continue
    const v = positionBookValue(p, snap, ctx)
    if (v !== null) book += v
  }
  ctx.bookValue = book

  const strategies: StressStrategyHit[] = []
  for (const s of input.strategies.filter((s) => s.enabled)) {
    /* Book-level rules evaluate once, against an empty snap. */
    for (const r of s.rules.filter((r) => BOOK_METRICS.includes(r.metric))) {
      const m = metricValue(r.metric, EMPTY_SNAP, null, ctx)
      if (m !== null && opMatch(r.op, m, r.value, r.value2)) {
        strategies.push({ strategyName: s.name, ruleTitle: r.title, symbol: '' })
      }
    }
    for (const sym of strategyScopeSymbols(s, input.watchSymbols, input.positions)) {
      const snap = snaps.find((sn) => sn.symbol.toUpperCase() === sym)
      if (!snap) continue
      const pos = positionFor(input.positions, snap)
      for (const r of s.rules.filter((r) => !BOOK_METRICS.includes(r.metric))) {
        if (ruleFires(r, snap, pos, ctx)) {
          strategies.push({ strategyName: s.name, ruleTitle: r.title, symbol: snap.symbol })
        }
      }
    }
  }

  const theses: StressThesisResult[] = []
  for (const t of input.theses) {
    const snap = snaps.find(
      (s) => s.assetClass === t.assetClass && s.symbol === t.symbol,
    )
    if (!snap) continue /* silence isn't a verdict — same as the sweep */
    const pos = positionFor(input.positions, snap)
    const firedBreak = t.breakRules.filter((r) => ruleFires(r, snap, pos, ctx))
    const firedDrift = t.driftRules.filter((r) => ruleFires(r, snap, pos, ctx))
    const stressed: ThesisStatus =
      firedBreak.length > 0 ? 'broken' : firedDrift.length > 0 ? 'drifting' : 'healthy'
    if (stressed !== t.status || firedBreak.length + firedDrift.length > 0) {
      theses.push({
        symbol: t.symbol,
        name: t.name,
        current: t.status,
        stressed,
        firedTitles: [...firedBreak, ...firedDrift].map((r) => r.title),
      })
    }
  }

  /* Goal metrics under the shocked marks — mirrors analysis.ts
     goalCurrent. Coverage/count don't respond to price but evaluate
     anyway — they're honest "unaffected" reads. */
  const marks: number[] = []
  const gainPcts: number[] = []
  for (const p of input.positions) {
    const snap = snaps.find(
      (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
    )
    if (!snap) continue
    const v = positionBookValue(p, snap, ctx)
    if (v !== null) marks.push(v)
    const g = metricValue('unrealized_gain_pct', snap, p, ctx)
    if (g !== null) gainPcts.push(g)
  }
  const thesised = input.positions.filter((p) =>
    input.theses.some((t) => t.assetClass === p.assetClass && t.symbol === p.symbol),
  ).length
  const goalValue = (metric: GoalMetric): number | null => {
    switch (metric) {
      case 'book_value':
        return ctx.bookValue > 0 ? ctx.bookValue : null
      case 'cash_pct':
        return ctx.bookValue > 0 ? (ctx.cashTotal / ctx.bookValue) * 100 : null
      case 'max_weight_pct':
        return ctx.bookValue > 0 && marks.length > 0
          ? (Math.max(...marks) / ctx.bookValue) * 100
          : null
      case 'unrealized_gain_pct':
        return gainPcts.length > 0
          ? gainPcts.reduce((a, b) => a + b, 0) / gainPcts.length
          : null
      case 'thesis_coverage':
        return input.positions.length > 0
          ? (thesised / input.positions.length) * 100
          : null
      case 'position_count':
        return input.positions.length
    }
  }
  const goals: StressGoalResult[] = input.goals.map((g) => {
    const cur = goalValue(g.metric)
    return {
      title: g.title,
      current: cur,
      target: g.target,
      op: g.op,
      metric: g.metric,
      met: cur === null ? null : g.op === 'gte' ? cur >= g.target : cur <= g.target,
    }
  })

  /* The delta reads against the same marks UNSHOCKED — recomputing the
     current book with the same conversion path keeps the comparison
     apples-to-apples (state totals could be FX-stale by a day). */
  let currentBook = input.cashTotal
  for (const p of input.positions) {
    const snap = input.snapshots.find(
      (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
    )
    if (!snap) continue
    const v = convertFx(p.quantity * snap.price, snap.currency, input.bookCcy, input.fx)
    if (v !== null) currentBook += v
  }

  return {
    bookValue: ctx.bookValue > 0 ? ctx.bookValue : null,
    bookDeltaPct:
      currentBook > 0 ? ((ctx.bookValue - currentBook) / currentBook) * 100 : null,
    strategies,
    theses,
    goals,
    unmatched,
  }
}

const EMPTY_SNAP: ShockedSnap = {
  assetClass: 'cash',
  symbol: '',
  price: 0,
  dayChangePct: null,
  ma50: null,
  currency: '',
  source: '',
  asOf: '',
  quoteName: '',
  bookScale: 1,
}
