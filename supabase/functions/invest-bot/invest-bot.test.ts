import { describe, expect, it } from 'vitest'
import {
  applyFill,
  parseRules,
  planRun,
  ruleMatches,
  signalKey,
  validateBotAction,
  type MarketSnapshot,
  type Position,
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
}

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
    expect(ruleMatches(lt, snap, position)).toBe(true)
    expect(ruleMatches(gt, snap, position)).toBe(false)
  })

  it('vs_ma50 derives from price and ma50', () => {
    /* (100 − 110) / 110 = −9.09% */
    const rule = parseRules([{ metric: 'vs_ma50', op: 'lt', value: -5, kind: 'insight', title: 'x' }])[0]
    expect(ruleMatches(rule, snap, position)).toBe(true)
    expect(ruleMatches(rule, { ...snap, ma50: null }, position)).toBe(false)
  })

  it('value_floor uses quantity × price and needs a position', () => {
    const rule = parseRules([{ metric: 'value_floor', op: 'lt', value: 1500, kind: 'alert', title: 'x' }])[0]
    expect(ruleMatches(rule, snap, position)).toBe(true) /* 10 × 100 = 1000 */
    expect(ruleMatches(rule, snap, null)).toBe(false)
    expect(ruleMatches(rule, snap, { ...position, quantity: 20 })).toBe(false)
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
