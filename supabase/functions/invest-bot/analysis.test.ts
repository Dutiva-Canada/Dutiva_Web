/**
 * Spec for the book-level analysis pass — goal metric reads, status
 * transitions (terminal achieved/missed never regress, 'behind' earns
 * its name near the deadline or materially off pace), baseline
 * stamping, and the scan-board connector that links watch items to
 * degraded theses.
 */
import { describe, expect, it } from 'vitest'
import {
  connectScan,
  evaluateGoals,
  goalBookContext,
  goalCurrent,
  goalSignalTitle,
  type Goal,
  type GoalBookContext,
  type ScanItem,
} from './analysis.ts'
import type { MarketSnapshot, Position, RunContext } from './handlers.ts'

const NOW = Date.parse('2026-03-10T12:00:00Z')

function position(partial: Partial<Position>): Position {
  return {
    account_id: 'a1',
    asset_class: 'equity',
    symbol: 'SHOP',
    quantity: 10,
    avg_cost: 100,
    currency: 'CAD',
    ...partial,
  }
}

function snapshot(partial: Partial<MarketSnapshot>): MarketSnapshot {
  return {
    asset_class: 'equity',
    symbol: 'SHOP',
    price: 120,
    day_change_pct: 0,
    ma50: null,
    currency: 'CAD',
    ...partial,
  }
}

/** Book = 2 positions @100 each marked at 120 + 2,000 cash → 4,400. */
const bookCtx: RunContext = {
  bookValue: 4_400,
  cashTotal: 2_000,
  bookCurrency: 'CAD',
  toBook: (amount) => amount, // everything already CAD
}

const positions = [
  position({ symbol: 'SHOP', avg_cost: 100 }),
  position({ symbol: 'ARM', avg_cost: 100 }),
]
const snapshots = [
  snapshot({ symbol: 'SHOP', price: 120 }),
  snapshot({ symbol: 'ARM', price: 120 }),
]

function goal(partial: Partial<Goal>): Goal {
  return {
    id: 'g1',
    title: 'Keep cash under 40%',
    metric: 'cash_pct',
    op: 'lte',
    target: 40,
    baseline: null,
    deadline: null,
    status: 'on_track',
    ...partial,
  }
}

describe('goalBookContext', () => {
  it('marks positions through FX and counts thesis coverage', () => {
    const ctx = goalBookContext(positions, snapshots, bookCtx, [
      { asset_class: 'equity', symbol: 'SHOP' },
    ])
    expect(ctx.bookValue).toBe(4_400)
    expect(ctx.cashTotal).toBe(2_000)
    expect(ctx.marks.get('equity:SHOP')).toBe(1_200)
    expect(ctx.gainPcts.get('equity:SHOP')).toBeCloseTo(20)
    expect(ctx.thesisedCount).toBe(1)
    expect(ctx.positionCount).toBe(2)
  })

  it('skips positions without a snapshot — silence, not a zero', () => {
    const ctx = goalBookContext(positions, [], bookCtx, [])
    expect(ctx.marks.size).toBe(0)
    expect(ctx.gainPcts.size).toBe(0)
    expect(goalCurrent('max_weight_pct', ctx)).toBeNull()
    expect(goalCurrent('unrealized_gain_pct', ctx)).toBeNull()
  })
})

describe('goalCurrent', () => {
  const ctx = goalBookContext(positions, snapshots, bookCtx, [
    { asset_class: 'equity', symbol: 'SHOP' },
  ])

  it('reads every metric off the same book', () => {
    expect(goalCurrent('book_value', ctx)).toBe(4_400)
    expect(goalCurrent('cash_pct', ctx)).toBeCloseTo(45.45, 1)
    expect(goalCurrent('max_weight_pct', ctx)).toBeCloseTo(27.27, 1)
    expect(goalCurrent('unrealized_gain_pct', ctx)).toBeCloseTo(20)
    expect(goalCurrent('thesis_coverage', ctx)).toBeCloseTo(50)
    expect(goalCurrent('position_count', ctx)).toBe(2)
  })

  it('returns null for book_value when the book is empty', () => {
    const empty: GoalBookContext = {
      bookValue: 0,
      cashTotal: 0,
      marks: new Map(),
      gainPcts: new Map(),
      thesisedCount: 0,
      positionCount: 0,
    }
    expect(goalCurrent('book_value', empty)).toBeNull()
    expect(goalCurrent('thesis_coverage', empty)).toBeNull()
    expect(goalCurrent('position_count', empty)).toBe(0)
  })
})

describe('evaluateGoals', () => {
  it('marks an lte goal achieved when the metric is under target', () => {
    /* cash 45.45% ≤ 50% target */
    const [ev] = evaluateGoals([goal({ target: 50 })], ctx(), { now: NOW })
    expect(ev.status).toBe('achieved')
    expect(ev.detail.progress_pct).toBe(100)
    expect(ev.baseline).toBeCloseTo(45.45, 1)
  })

  it('stamps the baseline on first eval — progress starts at zero', () => {
    const [ev] = evaluateGoals(
      [goal({ metric: 'book_value', op: 'gte', target: 8_000 })],
      ctx(),
      { now: NOW },
    )
    expect(ev.baseline).toBe(4_400)
    /* baseline just stamped at current → the journey starts here */
    expect(ev.detail.progress_pct).toBe(0)
  })

  it('keeps a stored baseline instead of rebaselining', () => {
    const [ev] = evaluateGoals(
      [goal({ metric: 'book_value', op: 'gte', target: 8_000, baseline: 4_000 })],
      ctx(),
      { now: NOW },
    )
    expect(ev.baseline).toBe(4_000)
    /* (4400-4000)/(8000-4000) = 10% */
    expect(ev.detail.progress_pct).toBe(10)
  })

  it('flags behind only inside the 30-day window', () => {
    const near = evaluateGoals(
      [
        goal({
          metric: 'book_value',
          op: 'gte',
          target: 8_000,
          deadline: '2026-04-01', // 22 days out
        }),
      ],
      ctx(),
      { now: NOW },
    )
    expect(near[0]!.status).toBe('behind')
    expect(near[0]!.detail.days_left).toBe(22)

    const far = evaluateGoals(
      [
        goal({
          metric: 'book_value',
          op: 'gte',
          target: 8_000,
          deadline: '2026-12-01',
        }),
      ],
      ctx(),
      { now: NOW },
    )
    expect(far[0]!.status).toBe('on_track')
  })

  it('flags behind on pace — most of the window gone, little progress', () => {
    /* Created Jan 1, deadline May 1 → ~57% of the window elapsed at
       NOW (Mar 10). Progress 10% is under half of expected → behind. */
    const [ev] = evaluateGoals(
      [
        goal({
          metric: 'book_value',
          op: 'gte',
          target: 8_000,
          baseline: 4_000,
          deadline: '2026-05-01',
          created_at: '2026-01-01T00:00:00Z',
        }),
      ],
      ctx(),
      { now: NOW },
    )
    expect(ev.detail.expected_pct).toBeCloseTo(57, 0)
    expect(ev.detail.progress_pct).toBe(10)
    expect(ev.status).toBe('behind')
    expect(ev.detail.days_left).toBeGreaterThan(30) /* pace, not proximity */
  })

  it('stays on track when progress keeps rough pace', () => {
    /* Same window — progress 40% vs ~57% expected is over the half bar. */
    const [ev] = evaluateGoals(
      [
        goal({
          metric: 'book_value',
          op: 'gte',
          target: 8_000,
          baseline: 2_000,
          deadline: '2026-05-01',
          created_at: '2026-01-01T00:00:00Z',
        }),
      ],
      ctx(),
      { now: NOW },
    )
    expect(ev.detail.progress_pct).toBe(40)
    expect(ev.status).toBe('on_track')
  })

  it('does not pace-flag a young goal — the quarter-window floor holds', () => {
    /* Created Mar 1, deadline Jul 1 → ~8% elapsed; progress 0 stays
       on_track — a fresh goal hasn't had time to fall behind. */
    const [ev] = evaluateGoals(
      [
        goal({
          metric: 'book_value',
          op: 'gte',
          target: 8_000,
          deadline: '2026-07-01',
          created_at: '2026-03-01T00:00:00Z',
        }),
      ],
      ctx(),
      { now: NOW },
    )
    expect(ev.detail.expected_pct).toBeLessThan(25)
    expect(ev.status).toBe('on_track')
  })

  it('falls back to proximity when the creation stamp is missing', () => {
    const [ev] = evaluateGoals(
      [
        goal({
          metric: 'book_value',
          op: 'gte',
          target: 8_000,
          baseline: 4_000,
          deadline: '2026-05-01',
          created_at: null,
        }),
      ],
      ctx(),
      { now: NOW },
    )
    expect(ev.detail.expected_pct).toBeNull()
    expect(ev.status).toBe('on_track')
  })

  it('misses the goal once the deadline passes unmet', () => {
    const [ev] = evaluateGoals(
      [
        goal({
          metric: 'book_value',
          op: 'gte',
          target: 8_000,
          deadline: '2026-03-01',
        }),
      ],
      ctx(),
      { now: NOW },
    )
    expect(ev.status).toBe('missed')
    expect(ev.detail.days_left).toBeLessThan(0)
  })

  it('keeps terminal statuses — an achieved goal stays achieved', () => {
    const [ev] = evaluateGoals(
      [
        goal({
          metric: 'book_value',
          op: 'gte',
          target: 8_000,
          status: 'achieved',
          last_evaluated_at: '2026-03-01T00:00:00Z',
        }),
      ],
      ctx(),
      { now: NOW },
    )
    expect(ev.status).toBe('achieved')
    expect(ev.statusChanged).toBe(false)
  })

  it('reports a first non-on-track eval as a change — silence is not a verdict', () => {
    const [ev] = evaluateGoals(
      [
        goal({
          metric: 'book_value',
          op: 'gte',
          target: 8_000,
          deadline: '2026-03-01',
          last_evaluated_at: null,
        }),
      ],
      ctx(),
      { now: NOW },
    )
    expect(ev.statusChanged).toBe(true)
  })

  it('an open-ended goal can only be on-track or achieved', () => {
    const [ev] = evaluateGoals(
      [goal({ metric: 'book_value', op: 'gte', target: 8_000, deadline: null })],
      ctx(),
      { now: NOW },
    )
    expect(ev.status).toBe('on_track')
    expect(ev.detail.days_left).toBeNull()
  })
})

describe('goalSignalTitle', () => {
  it('names the transition bilingually', () => {
    expect(goalSignalTitle('Cash cap', 'behind').en).toContain('at risk')
    expect(goalSignalTitle('Cash cap', 'achieved').fr).toContain('atteint')
    expect(goalSignalTitle('', 'missed').en).toContain('Goal')
  })
})

describe('connectScan', () => {
  const items: ScanItem[] = [
    { id: 'w1', theme: 'currency', direction: 'headwind', title: 'USD strength', symbols: ['ARM'] },
    { id: 'w2', theme: 'economy', direction: 'monitor', title: 'Rate path', symbols: [] },
    { id: 'w3', theme: 'sector', direction: 'tailwind', title: 'Retail AI', symbols: ['SHOP'] },
  ]
  const degraded = [
    { asset_class: 'equity', symbol: 'ARM', status: 'drifting' as const },
  ]

  it('links a covered symbol to its watch item', () => {
    const links = connectScan(items, degraded)
    expect(links.map((l) => l.item.id).sort()).toEqual(['w1', 'w2'])
    expect(links.find((l) => l.item.id === 'w1')?.thesisStatus).toBe('drifting')
  })

  it('a whole-book item connects to anything degraded', () => {
    const links = connectScan(items, degraded)
    expect(links.some((l) => l.item.id === 'w2')).toBe(true)
  })

  it('no degradation → no links', () => {
    expect(connectScan(items, [])).toEqual([])
  })

  it('symbol matching is case-insensitive', () => {
    const links = connectScan(
      [{ id: 'w4', theme: 'company', direction: 'monitor', title: 'Arm news', symbols: ['arm'] }],
      degraded,
    )
    expect(links).toHaveLength(1)
  })
})

function ctx(): GoalBookContext {
  return goalBookContext(positions, snapshots, bookCtx, [])
}
