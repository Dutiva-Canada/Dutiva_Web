import { describe, expect, it } from 'vitest'
import { planSuggestions, type OutcomeHistory, type SuggestionContext } from './suggestions'
import type { MarketSnapshot, Position, Strategy, StrategyRule } from './handlers'

const NOW = 1_700_000_000_000

const emptyOutcomes = (): OutcomeHistory => ({
  dismissedKeys: new Map(),
  kindStats: new Map(),
  dismissedSignals: new Map(),
  expiredDrafts: new Map(),
})

const ctx = (over: Partial<SuggestionContext> = {}): SuggestionContext => ({
  strategies: [],
  positions: [],
  snapshots: [],
  cashTotal: 0,
  fx: null,
  bookCurrency: 'CAD',
  outcomes: emptyOutcomes(),
  advice: false,
  now: NOW,
  ...over,
})

const snap = (symbol: string, price = 100, dayChange: number | null = 0): MarketSnapshot => ({
  asset_class: 'equity',
  symbol,
  price,
  day_change_pct: dayChange,
  ma50: 90,
  currency: 'CAD',
})

const pos = (symbol: string, quantity: number, avgCost = 100): Position => ({
  account_id: 'acc-1',
  asset_class: 'equity',
  symbol,
  quantity,
  avg_cost: avgCost,
})

const strat = (over: Partial<Strategy> = {}): Strategy => ({
  id: 's1',
  name: 'Watcher',
  enabled: true,
  scope_symbols: ['ACME'],
  rules: [],
  cadence: 'daily',
  last_evaluated_at: null,
  ...over,
})

const signalRule = (over: Partial<StrategyRule> = {}): StrategyRule => ({
  type: 'signal',
  id: 'r1',
  metric: 'day_change_pct',
  op: 'lt',
  value: -5,
  severity: 'alert',
  title: 'Dip',
  ...over,
})

describe('planSuggestions', () => {
  it('files nothing for an empty book', () => {
    expect(planSuggestions(ctx())).toEqual([])
  })

  it('seeds a disabled draft strategy when nothing watches the book', () => {
    const out = planSuggestions(
      ctx({ positions: [pos('ACME', 5)], snapshots: [snap('ACME')] }),
    )
    expect(out).toHaveLength(1)
    const s = out[0]!
    expect(s.kind).toBe('strategy')
    const draft = s.payload['draft'] as { rules: { type: string }[] }
    /* Generic tier stays observation-only — order proposals belong to the
       advice tier, never to a suggestion a generic user could accept. */
    expect(draft.rules.every((r) => r.type === 'signal')).toBe(true)
  })

  it('adds a trim proposal rule to the seeded draft at the advice tier', () => {
    const out = planSuggestions(
      ctx({ advice: true, positions: [pos('ACME', 5)], snapshots: [snap('ACME')] }),
    )
    const draft = out[0]!.payload['draft'] as {
      rules: { type: string; qty_unit?: string }[]
    }
    const proposal = draft.rules.find((r) => r.type === 'order_proposal')
    expect(proposal?.qty_unit).toBe('percent_of_position')
  })

  it('suggests a concentration rule when a fat position has no weight watcher', () => {
    /* 4 000 mark against a 5 000 book → 80% in one symbol. */
    const out = planSuggestions(
      ctx({
        strategies: [strat()],
        positions: [pos('ACME', 40), pos('BETA', 10)],
        snapshots: [snap('ACME'), snap('BETA')],
      }),
    )
    const conc = out.find((s) => s.dedupeKey.includes('weight_pct'))
    expect(conc?.kind).toBe('rule_add')
    const rule = conc!.payload['rule'] as { metric: string; type: string }
    expect(rule.metric).toBe('weight_pct')
    expect(rule.type).toBe('signal')
    expect(conc!.payload['strategy_id']).toBe('s1')
  })

  it('skips the concentration suggestion once a weight rule exists', () => {
    const out = planSuggestions(
      ctx({
        strategies: [
          strat({ rules: [signalRule({ id: 'r9', metric: 'weight_pct', op: 'gt', value: 30 })] }),
        ],
        positions: [pos('ACME', 40), pos('BETA', 10)],
        snapshots: [snap('ACME'), snap('BETA')],
      }),
    )
    expect(out.find((s) => s.dedupeKey.includes('weight_pct'))).toBeUndefined()
  })

  it('suggests the trim variant at the advice tier past 35%', () => {
    const out = planSuggestions(
      ctx({
        advice: true,
        strategies: [strat()],
        positions: [pos('ACME', 40), pos('BETA', 10)],
        snapshots: [snap('ACME'), snap('BETA')],
      }),
    )
    const conc = out.find((s) => s.dedupeKey.includes('weight_pct'))
    const rule = conc!.payload['rule'] as { type: string; qty_unit?: string }
    expect(rule.type).toBe('order_proposal')
    expect(rule.qty_unit).toBe('percent_of_position')
  })

  it('suggests scope_add for held symbols no enabled strategy covers', () => {
    const out = planSuggestions(
      ctx({
        strategies: [strat()],
        positions: [pos('ACME', 1), pos('MSFT', 1)],
        snapshots: [snap('ACME'), snap('MSFT')],
      }),
    )
    const scope = out.find((s) => s.kind === 'scope_add')
    expect(scope).toBeDefined()
    expect(scope!.payload['symbols']).toEqual(['MSFT'])
    expect(scope!.payload['strategy_id']).toBe('s1')
  })

  it('suggests loosening a rule whose signals keep getting dismissed', () => {
    const outcomes = emptyOutcomes()
    outcomes.dismissedSignals.set('s1::r1', 3)
    const out = planSuggestions(
      ctx({
        strategies: [strat({ rules: [signalRule()] })],
        positions: [pos('ACME', 1)],
        snapshots: [snap('ACME')],
        outcomes,
      }),
    )
    const tune = out.find((s) => s.kind === 'rule_tune')
    expect(tune).toBeDefined()
    expect(tune!.payload['rule_ident']).toBe('r1')
    expect(tune!.payload['reason']).toBe('dismissed')
    /* lt -5 loosens to -6.25 — fires ~25% less eagerly. */
    expect((tune!.payload['rule'] as { value: number }).value).toBe(-6.25)
  })

  it('suggests demoting a proposal whose drafts keep expiring', () => {
    const outcomes = emptyOutcomes()
    outcomes.expiredDrafts.set('s1::r2', 2)
    const strategy = strat({
      rules: [
        {
          type: 'order_proposal',
          id: 'r2',
          metric: 'weight_pct',
          op: 'gt',
          value: 30,
          side: 'sell',
          qty: 5,
          qty_unit: 'percent_of_position',
          title: 'Trim',
        },
      ],
    })
    const out = planSuggestions(
      ctx({
        strategies: [strategy],
        positions: [pos('ACME', 1)],
        snapshots: [snap('ACME')],
        outcomes,
      }),
    )
    const tune = out.find((s) => s.dedupeKey === 'rule_tune:s1:r2:ignored')
    expect(tune).toBeDefined()
    const rule = tune!.payload['rule'] as Record<string, unknown>
    expect(rule['type']).toBe('signal')
    expect(rule['side']).toBeUndefined()
    expect(tune!.payload['reason']).toBe('ignored')
  })

  it('suppresses a shape the user dismissed inside the cooldown', () => {
    const outcomes = emptyOutcomes()
    outcomes.dismissedKeys.set('rule_add:s1:weight_pct:gt:25', NOW - 3_600_000)
    const out = planSuggestions(
      ctx({
        strategies: [strat()],
        positions: [pos('ACME', 40), pos('BETA', 10)],
        snapshots: [snap('ACME'), snap('BETA')],
        outcomes,
      }),
    )
    expect(out.find((s) => s.dedupeKey === 'rule_add:s1:weight_pct:gt:25')).toBeUndefined()
  })

  it('cools a whole kind the user dismisses ~always', () => {
    const outcomes = emptyOutcomes()
    outcomes.kindStats.set('rule_add', { accepted: 0, dismissed: 4, lastResolved: NOW - 1000 })
    const out = planSuggestions(
      ctx({
        strategies: [strat()],
        positions: [pos('ACME', 40), pos('BETA', 10), pos('WIN', 1, 50)],
        snapshots: [snap('ACME'), snap('BETA'), snap('WIN')],
        outcomes,
      }),
    )
    expect(out.every((s) => s.kind !== 'rule_add')).toBe(true)
  })

  it('caps filings at five, ranked by score', () => {
    const outcomes = emptyOutcomes()
    outcomes.dismissedSignals.set('s1::r1', 4)
    outcomes.expiredDrafts.set('s1::r2', 3)
    const strategy = strat({
      rules: [
        signalRule(),
        {
          type: 'order_proposal',
          id: 'r2',
          metric: 'vs_ma50',
          op: 'gt',
          value: 10,
          side: 'sell',
          qty: 5,
          qty_unit: 'percent_of_position',
          title: 'Trim',
        },
      ],
    })
    const out = planSuggestions(
      ctx({
        strategies: [strategy],
        /* Concentration(80) + two tunes(75) + scope(70) + gain(60) +
           cash(50) = 6 candidates — the cap drops the lowest-scored.
           (The strategy's day_change_pct rule suppresses the mover.) */
        positions: [
          pos('ACME', 40),
          pos('WIN', 5, 50),
          pos('BETA', 5),
          pos('MSFT', 5),
        ],
        snapshots: [snap('ACME'), snap('WIN', 100, 1), snap('BETA', 100, -7), snap('MSFT')],
        cashTotal: 1200,
        outcomes,
      }),
    )
    expect(out.length).toBeLessThanOrEqual(5)
    const scores = out.map((s) => s.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
    /* The feedback loop outranks generic gaps — both tunes survive. */
    expect(out.filter((s) => s.kind === 'rule_tune')).toHaveLength(2)
    expect(out.find((s) => s.kind === 'scope_add')).toBeDefined()
  })
})
