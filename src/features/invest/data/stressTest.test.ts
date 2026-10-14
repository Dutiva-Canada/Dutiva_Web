import { describe, expect, it } from 'vitest'
import { applyShocks, runStress } from './stressTest'
import type {
  InvestGoal,
  InvestPosition,
  InvestStrategy,
  InvestThesis,
  MarketSnapshot,
} from './types'

const snap = (
  symbol: string,
  price: number,
  extra: Partial<MarketSnapshot> = {},
): MarketSnapshot => ({
  assetClass: 'equity',
  symbol,
  price,
  dayChangePct: 1,
  ma50: price * 0.9,
  currency: 'CAD',
  source: 'test',
  asOf: '2025-01-01',
  ...extra,
})

const pos = (
  symbol: string,
  quantity: number,
  avgCost: number,
  extra: Partial<InvestPosition> = {},
): InvestPosition => ({
  id: `p-${symbol}`,
  accountId: 'a1',
  assetClass: 'equity',
  symbol,
  name: symbol,
  quantity,
  avgCost,
  currency: 'CAD',
  lastPrice: null,
  lastPriceAt: null,
  targetWeightPct: null,
  ...extra,
})

const baseInput = () => ({
  snapshots: [snap('SHOP', 100), snap('VFV', 50)],
  positions: [pos('SHOP', 10, 80), pos('VFV', 20, 45)],
  strategies: [] as InvestStrategy[],
  theses: [] as InvestThesis[],
  goals: [] as InvestGoal[],
  watchSymbols: [] as string[],
  cashTotal: 500,
  bookCcy: 'CAD',
  fx: null,
})

describe('applyShocks', () => {
  it('shocks every mark under ALL and makes the shock the day move', () => {
    const { snaps, unmatched } = applyShocks(
      [snap('SHOP', 100)],
      [{ match: 'ALL', pct: -10 }],
      'CAD',
    )
    expect(snaps[0]?.price).toBe(90)
    expect(snaps[0]?.dayChangePct).toBeCloseTo(-10, 9)
    expect(unmatched).toEqual([])
  })

  it('shocks one symbol and reports names with no snapshot', () => {
    const { snaps, unmatched } = applyShocks(
      [snap('SHOP', 100)],
      [
        { match: 'SHOP', pct: -20 },
        { match: 'MSFT', pct: -5 },
      ],
      'CAD',
    )
    expect(snaps[0]?.price).toBe(80)
    expect(unmatched).toEqual(['MSFT'])
  })

  it('scales foreign-currency marks under an fx shock, not CAD marks', () => {
    const { snaps } = applyShocks(
      [snap('CADP', 100), snap('USDP', 100, { currency: 'USD' })],
      [{ match: 'ALL', pct: 5, kind: 'fx' }],
      'CAD',
    )
    expect(snaps[0]?.bookScale).toBe(1)
    expect(snaps[1]?.bookScale).toBeCloseTo(1 / 1.05, 6)
    expect(snaps[1]?.price).toBe(100) /* the quote never moved */
  })
})

describe('runStress', () => {
  const strategy = (over: Partial<InvestStrategy> = {}): InvestStrategy => ({
    id: 's1',
    name: 'Dip watcher',
    enabled: true,
    scope: { watchlist: false, symbols: ['SHOP'] },
    rules: [
      {
        metric: 'day_change_pct',
        op: 'lt',
        value: -8,
        title: 'drops 8% in a day',
        type: 'signal',
        severity: 'alert',
      },
    ],
    notify: { inApp: true, email: false },
    cadence: 'daily',
    multiMatch: 'each',
    template: '',
    lastEvaluatedAt: null,
    ...over,
  })

  it('re-fires a rule that current marks leave quiet', () => {
    const res = runStress({
      ...baseInput(),
      strategies: [strategy()],
      shocks: [{ match: 'SHOP', pct: -15 }],
    })
    /* SHOP −15% becomes the day move → the −8% rule fires. */
    expect(res.strategies).toEqual([
      { strategyName: 'Dip watcher', ruleTitle: 'drops 8% in a day', symbol: 'SHOP' },
    ])
    /* Book = 85×10 + 50×20 + 500 cash = 2350; current = 1000+1000+500 = 2500. */
    expect(res.bookValue).toBe(2350)
    expect(res.bookDeltaPct).toBeCloseTo(-6, 1)
  })

  it('fires nothing under a mild shock and reports it honestly', () => {
    const res = runStress({
      ...baseInput(),
      strategies: [strategy()],
      shocks: [{ match: 'ALL', pct: -3 }],
    })
    expect(res.strategies).toEqual([])
  })

  it('marks a thesis drifting/broken when its rules fire under shock', () => {
    const thesis: InvestThesis = {
      id: 't1',
      assetClass: 'equity',
      symbol: 'SHOP',
      name: 'SHOP',
      thesis: 'commerce compounds',
      intent: 'core',
      breakRules: [
        {
          metric: 'day_change_pct',
          op: 'lt',
          value: -25,
          title: 'falls 25% in a day',
          type: 'signal',
          severity: 'alert',
        },
      ],
      driftRules: [
        {
          metric: 'day_change_pct',
          op: 'lt',
          value: -10,
          title: 'falls 10% in a day',
          type: 'signal',
          severity: 'insight',
        },
      ],
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      status: 'healthy',
      evalDetail: null,
      lastEvaluatedAt: null,
      createdAt: '',
      updatedAt: '',
    }
    const res = runStress({
      ...baseInput(),
      theses: [thesis],
      shocks: [{ match: 'SHOP', pct: -22 }],
    })
    /* −22%: under the −25% break line but past the −10% drift line. */
    expect(res.theses).toEqual([
      {
        symbol: 'SHOP',
        name: 'SHOP',
        current: 'healthy',
        stressed: 'drifting',
        firedTitles: ['falls 10% in a day'],
      },
    ])
    const broken = runStress({
      ...baseInput(),
      theses: [thesis],
      shocks: [{ match: 'SHOP', pct: -30 }],
    })
    expect(broken.theses[0]?.stressed).toBe('broken')
  })

  it('re-reads goal metrics under shocked marks', () => {
    const goal: InvestGoal = {
      id: 'g1',
      title: 'Keep the book above $2,400',
      detail: '',
      metric: 'book_value',
      op: 'gte',
      target: 2400,
      baseline: null,
      deadline: null,
      status: 'on_track',
      evalDetail: null,
      lastEvaluatedAt: null,
      createdAt: '',
      updatedAt: '',
    }
    const res = runStress({
      ...baseInput(),
      goals: [goal],
      shocks: [{ match: 'SHOP', pct: -15 }],
    })
    /* Shocked book 2350 < 2400 → the goal slips. */
    expect(res.goals[0]?.current).toBe(2350)
    expect(res.goals[0]?.met).toBe(false)
  })

  it('converts through FX when a foreign position is price-shocked', () => {
    const res = runStress({
      ...baseInput(),
      positions: [pos('AAPL', 10, 100, { currency: 'USD' })],
      snapshots: [snap('AAPL', 120, { currency: 'USD' })],
      fx: { date: '2025-01-01', rates: { CAD: 1, USD: 0.7 } },
      shocks: [{ match: 'AAPL', pct: -25 }],
    })
    /* AAPL 90 USD × 10 = 900 USD → CAD at 0.7 USD/CAD = 1285.71 + 500 cash. */
    expect(res.bookValue).toBeCloseTo(900 / 0.7 + 500, 0)
  })
})
