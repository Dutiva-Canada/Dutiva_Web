import { describe, expect, it } from 'vitest'
import {
  applyFill,
  parseRules,
  planRun,
  ruleMatches,
  signalKey,
  strategyDue,
  validateBotAction,
  type MarketSnapshot,
  type Position,
  type RunContext,
  type Strategy,
} from './handlers'

const snap: MarketSnapshot = {
  asset_class: 'equity',
  symbol: 'ACME',
  price: 100,
  day_change_pct: -6,
  ma50: 110,
  currency: 'CAD',
}

const position: Position = {
  account_id: 'acc-1',
  asset_class: 'equity',
  symbol: 'ACME',
  quantity: 10,
  avg_cost: 95,
}

const baseStrategy: Strategy = {
  id: 's1',
  enabled: true,
  asset_classes: ['equity'],
  rules: [],
  autonomy: 'suggest',
  cadence: 'daily',
  last_evaluated_at: null,
}

const ctx: RunContext = { bookValue: 1000, cashTotal: 5000 }

describe('parseRules', () => {
  it('keeps valid rules and drops malformed ones', () => {
    const rules = parseRules([
      { metric: 'day_change_pct', op: 'lt', value: -5, kind: 'alert', title: 'Dip' },
      { metric: 'bogus', op: 'lt', value: 1, kind: 'alert', title: 'Bad metric' },
      { metric: 'vs_ma50', op: 'sideways', value: 1, kind: 'alert', title: 'Bad op' },
      { metric: 'vs_ma50', op: 'lt', value: 'nan', kind: 'alert', title: 'Bad value' },
      { metric: 'vs_ma50', op: 'lt', value: -10, kind: 'alert', title: '  ' },
      'junk',
    ])
    expect(rules).toHaveLength(1)
    expect(rules[0]).toMatchObject({ metric: 'day_change_pct', op: 'lt', value: -5 })
  })

  it('keeps side/qty only when both are valid', () => {
    const rules = parseRules([
      { metric: 'day_change_pct', op: 'lt', value: -5, kind: 'screen', title: 'A', side: 'buy', qty: 5 },
      { metric: 'day_change_pct', op: 'lt', value: -5, kind: 'screen', title: 'B', side: 'buy' },
      { metric: 'day_change_pct', op: 'lt', value: -5, kind: 'screen', title: 'C', side: 'bogus', qty: 5 },
    ])
    expect(rules[0].side).toBe('buy')
    expect(rules[0].qty).toBe(5)
    expect(rules[1].side).toBeUndefined()
    expect(rules[2].side).toBeUndefined()
  })

  it('returns [] for non-array input', () => {
    expect(parseRules(null)).toEqual([])
    expect(parseRules({ metric: 'x' })).toEqual([])
  })
})

describe('ruleMatches', () => {
  it('day_change_pct lt/gt', () => {
    const lt = parseRules([{ metric: 'day_change_pct', op: 'lt', value: -5, kind: 'alert', title: 'x' }])[0]
    const gt = parseRules([{ metric: 'day_change_pct', op: 'gt', value: -5, kind: 'alert', title: 'x' }])[0]
    expect(ruleMatches(lt, snap, position, ctx)).toBe(true)
    expect(ruleMatches(gt, snap, position, ctx)).toBe(false)
  })

  it('vs_ma50 derives from price and ma50', () => {
    /* (100 − 110) / 110 = −9.09% */
    const rule = parseRules([{ metric: 'vs_ma50', op: 'lt', value: -5, kind: 'insight', title: 'x' }])[0]
    expect(ruleMatches(rule, snap, position, ctx)).toBe(true)
    expect(ruleMatches(rule, { ...snap, ma50: null }, position, ctx)).toBe(false)
  })

  it('value_floor uses quantity × price and needs a position', () => {
    const rule = parseRules([{ metric: 'value_floor', op: 'lt', value: 1500, kind: 'alert', title: 'x' }])[0]
    expect(ruleMatches(rule, snap, position, ctx)).toBe(true) /* 10 × 100 = 1000 */
    expect(ruleMatches(rule, snap, null, ctx)).toBe(false)
    expect(ruleMatches(rule, snap, { ...position, quantity: 20 }, ctx)).toBe(false)
  })

  it('weight_pct is the position share of the marked book', () => {
    /* 10 × 100 = 1000 of a 1000 book → 100% */
    const rule = parseRules([{ metric: 'weight_pct', op: 'gt', value: 80, kind: 'alert', title: 'x' }])[0]
    expect(ruleMatches(rule, snap, position, ctx)).toBe(true)
    expect(ruleMatches(rule, snap, position, { ...ctx, bookValue: 5000 })).toBe(false) /* 20% */
    expect(ruleMatches(rule, snap, null, ctx)).toBe(false)
    expect(ruleMatches(rule, snap, position, { ...ctx, bookValue: 0 })).toBe(false)
  })

  it('unrealized_gain_pct is price vs avg cost', () => {
    /* (100 − 95) / 95 ≈ 5.26% */
    const rule = parseRules([{ metric: 'unrealized_gain_pct', op: 'gt', value: 5, kind: 'alert', title: 'x' }])[0]
    expect(ruleMatches(rule, snap, position, ctx)).toBe(true)
    expect(ruleMatches(rule, { ...snap, price: 90 }, position, ctx)).toBe(false)
    expect(ruleMatches(rule, snap, null, ctx)).toBe(false)
    expect(ruleMatches(rule, snap, { ...position, avg_cost: 0 }, ctx)).toBe(false)
  })

  it('cash_above reads the book-level cash total', () => {
    const rule = parseRules([{ metric: 'cash_above', op: 'gt', value: 4000, kind: 'insight', title: 'x' }])[0]
    expect(ruleMatches(rule, snap, null, ctx)).toBe(true) /* 5000 > 4000 */
    expect(ruleMatches(rule, snap, null, { ...ctx, cashTotal: 100 })).toBe(false)
  })
})

describe('strategyDue', () => {
  const now = new Date('2026-09-25T12:00:00Z')
  const ago = (days: number) => new Date(now.getTime() - days * 86400_000).toISOString()

  it('daily strategies are always due; never-run strategies are due', () => {
    expect(strategyDue({ cadence: 'daily', last_evaluated_at: ago(0.01) }, now)).toBe(true)
    expect(strategyDue({ cadence: 'weekly', last_evaluated_at: null }, now)).toBe(true)
    expect(strategyDue({ cadence: 'monthly', last_evaluated_at: 'not-a-date' }, now)).toBe(true)
  })

  it('weekly strategies wait seven days, monthly thirty', () => {
    expect(strategyDue({ cadence: 'weekly', last_evaluated_at: ago(6) }, now)).toBe(false)
    expect(strategyDue({ cadence: 'weekly', last_evaluated_at: ago(7.1) }, now)).toBe(true)
    expect(strategyDue({ cadence: 'monthly', last_evaluated_at: ago(20) }, now)).toBe(false)
    expect(strategyDue({ cadence: 'monthly', last_evaluated_at: ago(30.1) }, now)).toBe(true)
  })
})

describe('planRun', () => {
  it('emits a signal for each matching rule, deduped by open signals', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [
        { metric: 'day_change_pct', op: 'lt', value: -5, kind: 'alert', title: 'Dip below −5%' },
        { metric: 'day_change_pct', op: 'gt', value: 10, kind: 'screen', title: 'Spike' },
      ],
    }
    const plan = planRun([strategy], [snap], [position], new Set())
    expect(plan.signals).toHaveLength(1)
    expect(plan.signals[0].title).toBe('Dip below −5%')
    expect(plan.evaluated).toBe(1)

    /* Re-running with the emitted key present produces nothing. */
    const keys = new Set(plan.signals.map(signalKey))
    expect(planRun([strategy], [snap], [position], keys).signals).toHaveLength(0)
  })

  it('paper_execute strategies also emit an order at the snapshot price', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      autonomy: 'paper_execute',
      rules: [
        { metric: 'day_change_pct', op: 'lt', value: -5, kind: 'alert', title: 'Buy the dip', side: 'buy', qty: 2 },
      ],
    }
    const plan = planRun([strategy], [snap], [], new Set())
    expect(plan.orders).toHaveLength(1)
    expect(plan.orders[0]).toMatchObject({ side: 'buy', quantity: 2, executed_price: 100 })
  })

  it('suggest strategies never emit orders', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [
        { metric: 'day_change_pct', op: 'lt', value: -5, kind: 'alert', title: 'Dip', side: 'buy', qty: 2 },
      ],
    }
    expect(planRun([strategy], [snap], [], new Set()).orders).toHaveLength(0)
  })

  it('skips disabled strategies and non-matching asset classes', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [{ metric: 'day_change_pct', op: 'lt', value: 0, kind: 'alert', title: 'x' }],
    }
    expect(planRun([{ ...strategy, enabled: false }], [snap], [], new Set()).evaluated).toBe(0)
    expect(
      planRun([{ ...strategy, asset_classes: ['crypto'] }], [snap], [], new Set()).evaluated,
    ).toBe(0)
  })

  it('skips strategies whose cadence has not elapsed', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      cadence: 'weekly',
      last_evaluated_at: new Date(Date.now() - 86400_000).toISOString(), /* yesterday */
      rules: [{ metric: 'day_change_pct', op: 'lt', value: 0, kind: 'alert', title: 'x' }],
    }
    expect(planRun([strategy], [snap], [], new Set()).evaluated).toBe(0)

    const due = { ...strategy, last_evaluated_at: new Date(Date.now() - 8 * 86400_000).toISOString() }
    expect(planRun([due], [snap], [], new Set()).evaluated).toBe(1)
  })

  it('cash_above fires once per strategy, not once per snapshot', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [
        { metric: 'cash_above', op: 'gt', value: 1000, kind: 'insight', title: 'Idle cash' },
        { metric: 'day_change_pct', op: 'lt', value: -5, kind: 'alert', title: 'Dip' },
      ],
    }
    const plan = planRun([strategy], [snap, { ...snap, symbol: 'BETA' }], [], new Set(), {
      cashTotal: 5000,
    })
    const cashSignals = plan.signals.filter((s) => s.title === 'Idle cash')
    expect(cashSignals).toHaveLength(1)
    expect(cashSignals[0].symbol).toBe('')
    expect(plan.signals.filter((s) => s.title === 'Dip')).toHaveLength(2) /* both symbols */
  })
})

describe('applyFill', () => {
  it('buys raise quantity and recompute average cost', () => {
    const fill = applyFill(position, 'buy', 10, 105)
    expect(fill.quantity).toBe(20)
    expect(fill.avg_cost).toBeCloseTo(100) /* (10×95 + 10×105) / 20 */
  })

  it('sells reduce quantity, floor at zero, keep avg cost', () => {
    expect(applyFill(position, 'sell', 4, 120)).toEqual({ quantity: 6, avg_cost: 95 })
    expect(applyFill(position, 'sell', 50, 120).quantity).toBe(0)
  })

  it('opens a new position on buy', () => {
    expect(applyFill(null, 'buy', 3, 50)).toEqual({ quantity: 3, avg_cost: 50 })
  })
})

describe('validateBotAction', () => {
  it('accepts the three actions', () => {
    for (const action of ['run', 'run-all', 'execute-order']) {
      expect(validateBotAction(action).ok).toBe(true)
    }
    expect(validateBotAction('nope').ok).toBe(false)
  })
})

describe('insights helpers', () => {
  it('buildInsightPrompt summarizes the book factually', async () => {
    const { buildInsightPrompt } = await import('./insights')
    const prompt = buildInsightPrompt({
      snapshots: [snap, { ...snap, symbol: 'BETA', day_change_pct: 12 }],
      positions: [position, { ...position, symbol: 'BETA', quantity: 5 }],
      cashTotal: 5000,
      signalsEmitted: 3,
      ordersPlanned: 1,
    })
    expect(prompt).toContain('cash 5000.00')
    expect(prompt).toContain('ACME')
    expect(prompt).toContain('Notable moves')
    expect(prompt).toContain('BETA 12.0%')
  })

  it('parseInsights validates shape, caps at two, drops empties', async () => {
    const { parseInsights } = await import('./insights')
    const raw = JSON.stringify([
      { title_en: 'A', title_fr: 'Un', body_en: 'first', body_fr: 'premier' },
      { title_en: 'B', title_fr: 'Deux', body_en: 'second', body_fr: 'deuxième' },
      { title_en: 'C', title_fr: 'Trois', body_en: 'third', body_fr: 'troisième' },
      { title_en: '', body_en: 'no title' },
    ])
    const out = parseInsights(`\`\`\`json\n${raw}\n\`\`\``)
    expect(out).toHaveLength(2)
    expect(out[0].title_fr).toBe('Un')
    expect(parseInsights('not json')).toEqual([])
    expect(parseInsights('{"a":1}')).toEqual([])
    expect(parseInsights('[]')).toEqual([])
  })
})
