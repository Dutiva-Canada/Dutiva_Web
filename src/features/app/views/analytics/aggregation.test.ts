import { describe, expect, it } from 'vitest'
import { demoTodayISO } from '@/data'
import {
  CRITICAL_SCORE_CEILING,
  FINDING_SEVERITY_WEIGHTS,
  ackProgress,
  addDaysISO,
  applyCriticalCeiling,
  blendScore,
  caseAging,
  daysBetweenISO,
  expiryBuckets,
  flattenBuckets,
  formatMonthISO,
  meanInWindow,
  monthStartISO,
  rankAttention,
  scoreComponent,
  scoreDelta,
  turnoverRatePct,
  weightedComponent,
  windowAxis,
  windowScoreAxis,
} from './aggregation'

describe('daysBetweenISO', () => {
  it('counts whole days, crossing month and year boundaries', () => {
    expect(daysBetweenISO('2026-07-05', '2026-07-05')).toBe(0)
    expect(daysBetweenISO('2026-07-05', '2026-07-14')).toBe(9)
    expect(daysBetweenISO('2026-06-30', '2026-07-05')).toBe(5)
    expect(daysBetweenISO('2025-12-31', '2026-01-01')).toBe(1)
  })

  it('is negative when the target is in the past', () => {
    expect(daysBetweenISO('2026-07-05', '2026-06-30')).toBe(-5)
  })

  it('handles February in a non-leap year', () => {
    expect(daysBetweenISO('2026-02-10', '2026-03-01')).toBe(19)
    /* The demo's oldest case: opened Feb 10, today Jul 5. */
    expect(daysBetweenISO('2026-02-10', '2026-07-05')).toBe(145)
  })
})

describe('monthStartISO', () => {
  it('returns the first of the containing month', () => {
    expect(monthStartISO('2026-07-05')).toBe('2026-07-01')
    expect(monthStartISO('2026-12-31')).toBe('2026-12-01')
  })
})

describe('formatMonthISO', () => {
  it('formats month names per locale', () => {
    expect(formatMonthISO('2026-02-01', 'en-CA')).toMatch(/^Feb/)
    expect(formatMonthISO('2026-02-01', 'fr-CA')).toMatch(/f[ée]vr/i)
    expect(formatMonthISO('2026-02-01', 'en-CA', 'long')).toBe('February')
  })
})

describe('rankAttention', () => {
  const items = [
    { id: 'later', dueISO: '2026-07-31' },
    { id: 'overdue', dueISO: '2026-06-30' },
    { id: 'soon', dueISO: '2026-07-14' },
    { id: 'edge15', dueISO: '2026-07-20' },
  ]

  it('sorts overdue first, then soonest due', () => {
    const ranked = rankAttention(items, '2026-07-05')
    expect(ranked.map((r) => r.item.id)).toEqual(['overdue', 'soon', 'edge15', 'later'])
  })

  it('buckets: overdue / due ≤ 14 days = due_soon / later = upcoming', () => {
    const ranked = rankAttention(items, '2026-07-05')
    const byId = Object.fromEntries(ranked.map((r) => [r.item.id, r]))
    expect(byId['overdue']).toMatchObject({ status: 'overdue', daysUntilDue: -5 })
    expect(byId['soon']).toMatchObject({ status: 'due_soon', daysUntilDue: 9 })
    /* Exactly 15 days out is no longer "due soon". */
    expect(byId['edge15']).toMatchObject({ status: 'upcoming', daysUntilDue: 15 })
    expect(byId['later']).toMatchObject({ status: 'upcoming', daysUntilDue: 26 })
  })

  it('treats due-today as due_soon, not overdue', () => {
    const [today] = rankAttention([{ id: 'x', dueISO: '2026-07-05' }], '2026-07-05')
    expect(today).toMatchObject({ status: 'due_soon', daysUntilDue: 0 })
  })

  it('breaks same-day ties on id for a stable order', () => {
    const ranked = rankAttention(
      [
        { id: 'b', dueISO: '2026-07-14' },
        { id: 'a', dueISO: '2026-07-14' },
      ],
      '2026-07-05',
    )
    expect(ranked.map((r) => r.item.id)).toEqual(['a', 'b'])
  })
})

describe('windowScoreAxis', () => {
  it('windows 74–82 to 70–85 with ticks every 5 (the spec example)', () => {
    expect(windowScoreAxis([74, 76, 79, 78, 81, 82])).toEqual({
      min: 70,
      max: 85,
      ticks: [70, 75, 80, 85],
    })
  })

  it('never starts at zero for high scores', () => {
    const { min } = windowScoreAxis([88, 90, 92])
    expect(min).toBeGreaterThan(0)
  })

  it('clamps to the 0–100 score scale', () => {
    expect(windowScoreAxis([96, 99, 100]).max).toBe(100)
    expect(windowScoreAxis([1, 3]).min).toBe(0)
  })

  it('widens the step to 10 for wide ranges', () => {
    const axis = windowScoreAxis([40, 82])
    expect(axis).toEqual({ min: 30, max: 90, ticks: [30, 40, 50, 60, 70, 80, 90] })
  })

  it('produces a sane window for flat data', () => {
    const axis = windowScoreAxis([80, 80, 80])
    expect(axis.min).toBeLessThan(80)
    expect(axis.max).toBeGreaterThan(80)
    expect(axis.ticks.length).toBeGreaterThanOrEqual(2)
  })

  it('falls back to the full scale with no data', () => {
    expect(windowScoreAxis([])).toEqual({ min: 0, max: 100, ticks: [0, 25, 50, 75, 100] })
  })
})

describe('windowAxis (generic)', () => {
  it('is not clamped to 100 — headcount over 100 windows normally', () => {
    const axis = windowAxis([118, 124])
    expect(axis).toEqual({ min: 115, max: 130, ticks: [115, 120, 125, 130] })
  })

  it('windows the demo headcount history like a score', () => {
    expect(windowAxis([76, 77, 79, 80, 81, 82])).toEqual({
      min: 70,
      max: 85,
      ticks: [70, 75, 80, 85],
    })
  })
})

describe('expiryBuckets', () => {
  const rec = (id: string, expiryISO: string) => ({ id, expiryISO })
  const TODAY = '2026-07-05'

  it('buckets on the exact 0/30/60/90-day boundaries', () => {
    const buckets = expiryBuckets(
      [
        rec('yesterday', '2026-07-04'), // -1 → expired
        rec('today', '2026-07-05'), // 0 → ≤30
        rec('day30', '2026-08-04'), // 30 → ≤30
        rec('day31', '2026-08-05'), // 31 → 31–60
        rec('day60', '2026-09-03'), // 60 → 31–60
        rec('day61', '2026-09-04'), // 61 → 61–90
        rec('day90', '2026-10-03'), // 90 → 61–90
        rec('day91', '2026-10-04'), // 91 → out of window
      ],
      TODAY,
    )
    expect(buckets.expired.map((r) => r.id)).toEqual(['yesterday'])
    expect(buckets.within30.map((r) => r.id)).toEqual(['today', 'day30'])
    expect(buckets.within60.map((r) => r.id)).toEqual(['day31', 'day60'])
    expect(buckets.within90.map((r) => r.id)).toEqual(['day61', 'day90'])
    expect(flattenBuckets(buckets).map((r) => r.id)).not.toContain('day91')
  })

  it('sorts each bucket (and the flat list) soonest-first', () => {
    const buckets = expiryBuckets(
      [rec('b', '2026-07-20'), rec('a', '2026-07-10'), rec('old', '2026-06-01')],
      TODAY,
    )
    expect(flattenBuckets(buckets).map((r) => r.id)).toEqual(['old', 'a', 'b'])
  })

  it('buckets the demo certification fixtures 1 / 2 / 3 / 1', () => {
    const buckets = expiryBuckets(
      [
        rec('devon', '2026-06-28'),
        rec('noah', '2026-07-18'),
        rec('marc', '2026-07-30'),
        rec('theo', '2026-08-22'),
        rec('fatou', '2026-08-30'),
        rec('sarah', '2026-09-08'),
        rec('aiden', '2026-09-26'),
      ],
      demoTodayISO,
    )
    expect([
      buckets.expired.length,
      buckets.within30.length,
      buckets.within60.length,
      buckets.within90.length,
    ]).toEqual([1, 2, 3, 1])
  })
})

describe('scoreDelta', () => {
  it('compares the newest point against the oldest, sorting first', () => {
    const delta = scoreDelta([
      { monthISO: '2026-07-01', score: 82 },
      { monthISO: '2026-02-01', score: 74 },
      { monthISO: '2026-05-01', score: 78 },
    ])
    expect(delta).toEqual({
      current: 82,
      baseline: 74,
      delta: 8,
      baselineMonthISO: '2026-02-01',
    })
  })

  it('supports declines', () => {
    expect(
      scoreDelta([
        { monthISO: '2026-06-01', score: 90 },
        { monthISO: '2026-07-01', score: 84 },
      ])?.delta,
    ).toBe(-6)
  })

  it('needs at least two points', () => {
    expect(scoreDelta([{ monthISO: '2026-07-01', score: 82 }])).toBeNull()
    expect(scoreDelta([])).toBeNull()
  })
})

describe('caseAging', () => {
  const open = [
    { id: 'new', openedISO: '2026-07-05' },
    { id: 'pip', openedISO: '2026-06-20' },
    { id: 'accom', openedISO: '2026-02-10' },
  ]

  it('computes days open, average and oldest for the demo cases', () => {
    const aging = caseAging(open, '2026-07-05')
    expect(aging).not.toBeNull()
    expect(aging!.openCount).toBe(3)
    /* 0 + 15 + 145 days → avg 53. */
    expect(aging!.rows.map((r) => r.daysOpen)).toEqual([145, 15, 0])
    expect(aging!.avgDays).toBe(53)
    expect(aging!.oldestDays).toBe(145)
  })

  it('sorts oldest first', () => {
    const aging = caseAging(open, '2026-07-05')
    expect(aging!.rows.map((r) => (r.caseRow as { id: string }).id)).toEqual([
      'accom',
      'pip',
      'new',
    ])
  })

  it('clamps future open dates to zero days', () => {
    const aging = caseAging([{ openedISO: '2026-08-01' }], '2026-07-05')
    expect(aging!.rows[0]!.daysOpen).toBe(0)
  })

  it('returns null with no open cases', () => {
    expect(caseAging([], '2026-07-05')).toBeNull()
  })
})

describe('ackProgress', () => {
  it('computes the demo campaign: 74/82 → 90%, 8 outstanding', () => {
    expect(ackProgress(74, 82)).toEqual({ signed: 74, total: 82, outstanding: 8, pct: 90 })
  })

  it('handles complete and empty campaigns', () => {
    expect(ackProgress(82, 82).outstanding).toBe(0)
    expect(ackProgress(82, 82).pct).toBe(100)
    expect(ackProgress(0, 0)).toEqual({ signed: 0, total: 0, outstanding: 0, pct: 0 })
  })

  it('clamps out-of-range inputs', () => {
    expect(ackProgress(90, 82).signed).toBe(82)
    expect(ackProgress(-3, 82).signed).toBe(0)
  })
})

describe('turnoverRatePct', () => {
  it('counts separations in the trailing 365 days over the average headcount', () => {
    const terms = ['2026-01-15', '2026-05-01', '2025-06-30']
    /* Window (2025-08-07, 2026-08-07]: the 2025-06-30 exit is outside. */
    expect(turnoverRatePct(terms, '2026-08-07', 20)).toBe(10)
  })

  it('is boundary-exact: window start exclusive, end inclusive', () => {
    expect(turnoverRatePct(['2025-08-07'], '2026-08-07', 10)).toBe(0)
    expect(turnoverRatePct(['2025-08-08'], '2026-08-07', 10)).toBe(10)
    expect(turnoverRatePct(['2026-08-07'], '2026-08-07', 10)).toBe(10)
  })

  it('rounds to one decimal', () => {
    expect(turnoverRatePct(['2026-05-01'], '2026-08-07', 12)).toBe(8.3)
  })

  it('refuses a missing or zero denominator', () => {
    expect(turnoverRatePct(['2026-05-01'], '2026-08-07', null)).toBeNull()
    expect(turnoverRatePct(['2026-05-01'], '2026-08-07', 0)).toBeNull()
  })
})

describe('meanInWindow', () => {
  const points = [
    { monthISO: '2026-05-01', value: 70 },
    { monthISO: '2026-06-01', value: 74 },
    { monthISO: '2026-07-01', value: 78 },
  ]

  it('averages the points inside the window', () => {
    expect(meanInWindow(points, '2026-05-15', '2026-07-31')).toBe(76)
  })

  it('is null when the window holds no points', () => {
    expect(meanInWindow(points, '2026-07-02', '2026-07-31')).toBeNull()
    expect(meanInWindow([], '2020-01-01', '2030-01-01')).toBeNull()
  })
})

describe('addDaysISO', () => {
  it('shifts across month and year boundaries', () => {
    expect(addDaysISO('2026-08-07', -365)).toBe('2025-08-07')
    expect(addDaysISO('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDaysISO('2026-02-28', 1)).toBe('2026-03-01')
  })
})

describe('score components + blend', () => {
  it('computes per-component percentages', () => {
    expect(scoreComponent('policies', 3, 4)).toEqual({
      key: 'policies',
      done: 3,
      total: 4,
      pct: 75,
    })
  })

  it('marks empty components null instead of 0 or 100', () => {
    expect(scoreComponent('tasks', 0, 0).pct).toBeNull()
  })

  it('blends only the components that have data', () => {
    const score = blendScore([
      scoreComponent('policies', 3, 4), // 75
      scoreComponent('tasks', 9, 10), // 90
      scoreComponent('findings', 0, 0), // null — excluded
    ])
    expect(score).toBe(83)
  })

  it('is null until any component has rows', () => {
    expect(blendScore([scoreComponent('policies', 0, 0)])).toBeNull()
    expect(blendScore([])).toBeNull()
  })
})

describe('weightedComponent (formula v2)', () => {
  it('scores by weight while keeping raw counts for display', () => {
    /* Critical open (8) + info resolved (1): 1 of 2 findings closed, but
       only 1 of 9 weight — the meter text stays "1 of 2", the pct says 11. */
    const c = weightedComponent('findings', [
      { done: false, weight: FINDING_SEVERITY_WEIGHTS.critical },
      { done: true, weight: FINDING_SEVERITY_WEIGHTS.info },
    ])
    expect(c).toEqual({
      key: 'findings',
      done: 1,
      total: 2,
      weightedDone: 1,
      weightedTotal: 9,
      pct: 11,
    })
  })

  it('marks an empty component null, same as scoreComponent', () => {
    expect(weightedComponent('findings', []).pct).toBeNull()
  })

  it('matches scoreComponent when every weight is equal', () => {
    const items = [
      { done: true, weight: 3 },
      { done: false, weight: 3 },
      { done: true, weight: 3 },
    ]
    expect(weightedComponent('findings', items).pct).toBe(scoreComponent('findings', 2, 3).pct)
  })
})

describe('applyCriticalCeiling (formula v2)', () => {
  it('caps a healthy blend while a critical finding is open', () => {
    expect(applyCriticalCeiling(92, 1)).toEqual({ score: CRITICAL_SCORE_CEILING, capped: true })
  })

  it('leaves the blend alone with no open critical', () => {
    expect(applyCriticalCeiling(92, 0)).toEqual({ score: 92, capped: false })
  })

  it('never raises a blend already at or under the ceiling', () => {
    expect(applyCriticalCeiling(69, 2)).toEqual({ score: 69, capped: false })
    expect(applyCriticalCeiling(40, 2)).toEqual({ score: 40, capped: false })
  })

  it('passes null through — no data stays no data', () => {
    expect(applyCriticalCeiling(null, 3)).toEqual({ score: null, capped: false })
  })
})
