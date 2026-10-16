/**
 * Spec for the thesis evaluator — status derivation, the posture action
 * lines (internal tier names the posture, external stays observational),
 * and the transition/dedupe contract the signal pass relies on.
 */
import { describe, expect, it } from 'vitest'
import {
  evaluateTheses,
  thesisAction,
  thesisBookContext,
  thesisSignalTitle,
  type Thesis,
} from './theses.ts'
import type { MarketSnapshot, Position, RunContext, SignalRule } from './handlers.ts'

const ctx: RunContext = { bookValue: 10_000, cashTotal: 1_000 }

function signalRule(partial: Partial<SignalRule>): SignalRule {
  return {
    type: 'signal',
    metric: 'vs_ma50',
    op: 'lt',
    value: -5,
    title: 'Under the 50-day average',
    severity: 'insight',
    ...partial,
  }
}

function thesis(partial: Partial<Thesis>): Thesis {
  return {
    id: 't1',
    asset_class: 'equity',
    symbol: 'ARM',
    name: 'Arm Holdings',
    thesis: 'Arm keeps its phone royalties and wins data-center designs.',
    intent: 'core',
    break_rules: [],
    drift_rules: [],
    status: 'healthy',
    last_evaluated_at: '2026-02-01T00:00:00Z',
    ...partial,
  }
}

function snap(partial: Partial<MarketSnapshot>): MarketSnapshot {
  return {
    asset_class: 'equity',
    symbol: 'ARM',
    price: 90,
    day_change_pct: -1,
    ma50: 100, // price 10% under the 50-day
    currency: 'USD',
    ...partial,
  }
}

const pos: Position = {
  account_id: 'a1',
  asset_class: 'equity',
  symbol: 'ARM',
  quantity: 10,
  avg_cost: 100,
  currency: 'USD',
}

describe('evaluateTheses', () => {
  it('breaks on any fired break rule', () => {
    const [ev] = evaluateTheses(
      [
        thesis({
          break_rules: [signalRule({ metric: 'unrealized_gain_pct', op: 'lt', value: -5 })],
        }),
      ],
      [snap({})],
      [pos],
      ctx,
      { advice: true },
    )
    /* price 90 vs cost 100 → -10% < -5 → break */
    expect(ev.status).toBe('broken')
    expect(ev.statusChanged).toBe(true)
    expect(ev.detail.fired_break).toBe(1)
    expect(ev.detail.rules[0]).toMatchObject({ zone: 'break', fired: true })
    expect(ev.detail.rules[0].value).toBeCloseTo(-10, 1)
  })

  it('drifts on a fired drift rule when no break fires', () => {
    const [ev] = evaluateTheses(
      [
        thesis({
          drift_rules: [signalRule({ metric: 'vs_ma50', op: 'lt', value: -5 })],
          break_rules: [signalRule({ metric: 'unrealized_gain_pct', op: 'lt', value: -50 })],
        }),
      ],
      [snap({})],
      [pos],
      ctx,
      { advice: true },
    )
    expect(ev.status).toBe('drifting')
    expect(ev.detail.fired_drift).toBe(1)
    expect(ev.detail.fired_break).toBe(0)
  })

  it('stays healthy when nothing fires', () => {
    const [ev] = evaluateTheses(
      [thesis({ drift_rules: [signalRule({ metric: 'vs_ma50', op: 'lt', value: -30 })] })],
      [snap({})],
      [pos],
      ctx,
      { advice: true },
    )
    expect(ev.status).toBe('healthy')
    /* healthy → healthy is no transition */
    expect(ev.statusChanged).toBe(false)
  })

  it('reports a transition when the stored status differs', () => {
    const [ev] = evaluateTheses(
      [
        thesis({
          status: 'broken',
          drift_rules: [signalRule({ metric: 'vs_ma50', op: 'lt', value: -30 })],
        }),
      ],
      [snap({})],
      [pos],
      ctx,
      { advice: true },
    )
    /* broken → healthy IS a transition — the recovery signal matters */
    expect(ev.status).toBe('healthy')
    expect(ev.statusChanged).toBe(true)
  })

  it('first eval of an already-degraded thesis counts as a transition', () => {
    const [ev] = evaluateTheses(
      [
        thesis({
          status: 'healthy',
          last_evaluated_at: null,
          drift_rules: [signalRule({ metric: 'vs_ma50', op: 'lt', value: -5 })],
        }),
      ],
      [snap({})],
      [pos],
      ctx,
      { advice: true },
    )
    /* healthy row + never evaluated + drifting now → alert, don't wait a day */
    expect(ev.status).toBe('drifting')
    expect(ev.statusChanged).toBe(true)
  })

  it('first eval of a healthy thesis is quiet', () => {
    const [ev] = evaluateTheses(
      [thesis({ last_evaluated_at: null, drift_rules: [signalRule({ value: -30 })] })],
      [snap({})],
      [pos],
      ctx,
      { advice: true },
    )
    expect(ev.status).toBe('healthy')
    expect(ev.statusChanged).toBe(false)
  })

  it('keeps the stored status with no snapshot — silence is not a verdict', () => {
    const [ev] = evaluateTheses(
      [thesis({ status: 'drifting', drift_rules: [signalRule({})] })],
      [],
      [pos],
      ctx,
      { advice: true },
    )
    expect(ev.noSnapshot).toBe(true)
    expect(ev.status).toBe('drifting')
    expect(ev.statusChanged).toBe(false)
  })

  it('matches the thesis to its own symbol only', () => {
    const [ev] = evaluateTheses(
      [thesis({ symbol: 'SHOP', break_rules: [signalRule({ metric: 'day_change_pct', op: 'lt', value: -1 })] })],
      [snap({ symbol: 'ARM', day_change_pct: -9 })],
      [],
      ctx,
      { advice: true },
    )
    expect(ev.noSnapshot).toBe(true)
  })
})

describe('thesisAction', () => {
  it('names the posture for internal accounts on degraded states', () => {
    const broken = thesisAction('broken', 'speculative', true)
    expect(broken.en).toMatch(/exit/i)
    const drifting = thesisAction('drifting', 'core', true)
    expect(drifting.en).toMatch(/hold/i)
  })

  it('stays observational for external accounts on degraded states', () => {
    const broken = thesisAction('broken', 'speculative', false)
    expect(broken.en).not.toMatch(/exit/i)
    expect(broken.en).toMatch(/needs a decision/i)
  })

  it('gives the intent line to everyone when healthy', () => {
    expect(thesisAction('healthy', 'income', false).en).toMatch(/collecting/i)
  })
})

describe('thesisSignalTitle', () => {
  it('embeds the status word — the dedupe handle per transition', () => {
    expect(thesisSignalTitle('ARM', 'Arm Holdings', 'broken').en).toContain('broken')
    expect(thesisSignalTitle('ARM', 'Arm Holdings', 'drifting').en).toContain('drifting')
    expect(thesisSignalTitle('ARM', 'Arm Holdings', 'healthy').en).toContain('intact')
  })
})

describe('thesisBookContext', () => {
  it('sums marks + cash in the book currency through the FX table', () => {
    /* 1 CAD = 0.72 USD → USD leg at 100 units = 138.9 CAD */
    const fx = { date: 'd', rates: { CAD: 1, USD: 0.72 } }
    const c = thesisBookContext(
      [{ account_id: 'a', asset_class: 'equity', symbol: 'ARM', quantity: 1, avg_cost: 1 }],
      [{ asset_class: 'equity', symbol: 'ARM', price: 100, day_change_pct: 0, ma50: null, currency: 'USD' }],
      1_000,
      fx,
      'CAD',
    )
    expect(c.cashTotal).toBe(1_000)
    expect(c.bookValue).toBeCloseTo(1_000 + 100 / 0.72, 1)
    expect(c.bookCurrency).toBe('CAD')
  })

  it('drops an unconvertible leg rather than blending face values', () => {
    const fx = { date: 'd', rates: { CAD: 1 } } /* no USD rate */
    const c = thesisBookContext(
      [{ account_id: 'a', asset_class: 'equity', symbol: 'ARM', quantity: 1, avg_cost: 1 }],
      [{ asset_class: 'equity', symbol: 'ARM', price: 100, day_change_pct: 0, ma50: null, currency: 'USD' }],
      1_000,
      fx,
      'CAD',
    )
    expect(c.bookValue).toBe(1_000)
  })

  it('falls back snapshot → last_price → cost for unpriced positions', () => {
    const fx = { date: 'd', rates: { CAD: 1, USD: 0.72 } }
    const noSnap = thesisBookContext(
      [{ account_id: 'a', asset_class: 'equity', symbol: 'ARM', quantity: 2, avg_cost: 80, last_price: 100, currency: 'USD' }],
      [],
      1_000,
      fx,
      'CAD',
    )
    /* last_price wins over cost: 2 × 100 USD → CAD. */
    expect(noSnap.bookValue).toBeCloseTo(1_000 + 200 / 0.72, 1)

    const costOnly = thesisBookContext(
      [{ account_id: 'a', asset_class: 'equity', symbol: 'ARM', quantity: 2, avg_cost: 80, currency: 'USD' }],
      [],
      1_000,
      fx,
      'CAD',
    )
    /* No snapshot, no last_price → cost basis, still converted. */
    expect(costOnly.bookValue).toBeCloseTo(1_000 + 160 / 0.72, 1)

    /* Truly unknown (no price anywhere) still drops out. */
    const nothing = thesisBookContext(
      [{ account_id: 'a', asset_class: 'equity', symbol: 'ARM', quantity: 2, avg_cost: 0 }],
      [],
      1_000,
      fx,
      'CAD',
    )
    expect(nothing.bookValue).toBe(1_000)
  })
})
