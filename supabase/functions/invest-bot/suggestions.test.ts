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

const fullProfile = {
  risk: 'balanced',
  horizon: 'long',
  goal: 'growth',
  mandate: 'Long-term compounding.',
}

const ctx = (over: Partial<SuggestionContext> = {}): SuggestionContext => ({
  strategies: [],
  positions: [],
  snapshots: [],
  cashTotal: 0,
  fx: null,
  bookCurrency: 'CAD',
  /* A complete profile by default — the book-shaped specs stay about the
     book; the 'profile' specs below override it to exercise the gaps. */
  profile: fullProfile,
  chatTurns: 0,
  memoryCount: 0,
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
  it('files nothing for an empty book when the profile is complete', () => {
    expect(planSuggestions(ctx({ profile: fullProfile, chatTurns: 0 }))).toEqual([])
  })

  /* ── profile — the "get to know you" nudges ─────────────────────────── */
  it('nudges the blank profile even on an empty book — that holder is who it serves', () => {
    const out = planSuggestions(ctx({ profile: null, chatTurns: 0 }))
    expect(out).toHaveLength(1)
    expect(out[0]!.kind).toBe('profile')
    expect(out[0]!.dedupeKey).toBe('profile:dims')
    expect((out[0]!.payload as Record<string, unknown>)['section']).toBe('declared')
  })
  it('escalates to the mandate nudge once the dimensions are set', () => {
    const out = planSuggestions(
      ctx({ profile: { risk: 'balanced', horizon: null, goal: null, mandate: null } }),
    )
    expect(out.map((c) => c.dedupeKey)).toEqual(['profile:mandate'])
  })
  it('nudges the memory review only when there is actually something said', () => {
    /* No chat yet → nothing to mine → the nudge would promise a review
       with nothing to review. */
    expect(
      planSuggestions(ctx({ profile: fullProfile, chatTurns: 0, memoryCount: 0 })),
    ).toEqual([])
    const out = planSuggestions(
      ctx({ profile: fullProfile, chatTurns: 6, memoryCount: 0 }),
    )
    expect(out.map((c) => c.dedupeKey)).toEqual(['profile:memories'])
    /* Already remembering → the nudge is done. */
    expect(
      planSuggestions(ctx({ profile: fullProfile, chatTurns: 6, memoryCount: 3 })),
    ).toEqual([])
  })
  it('files every profile nudge alongside the book’s own work on a held book', () => {
    const out = planSuggestions(
      ctx({
        positions: [pos('ACME', 5)],
        snapshots: [snap('ACME')],
        strategies: [strat()],
        profile: null,
        chatTurns: 4,
        memoryCount: 0,
      }),
    )
    const kinds = out.map((c) => c.kind)
    expect(kinds).toContain('profile')
    /* The profile nudges score under the book's own filings — ranking
       keeps them visible without crowding the strategy work out. */
    const profileScores = out.filter((c) => c.kind === 'profile').map((c) => c.score)
    expect(Math.max(...profileScores)).toBeLessThan(50)
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

  /* ── thesis suggestions — untracked holdings ──────────────────────────── */

  it('offers a seeded thesis for a held symbol with none', () => {
    const out = planSuggestions(
      ctx({
        strategies: [strat()],
        positions: [pos('ACME', 5)],
        snapshots: [snap('ACME')],
        theses: [],
      }),
    )
    const s = out.find((c) => c.kind === 'thesis')
    expect(s).toBeDefined()
    expect(s!.dedupeKey).toBe('thesis:equity:ACME')
    const seed = s!.payload['seed'] as {
      break_rules: { type: string }[]
      drift_rules: { type: string }[]
      intent: string
    }
    /* The seed ships conditions, never a written claim — the story is
       the user's to tell (or Tally's to draft). Signals only. */
    expect(seed.break_rules.every((r) => r.type === 'signal')).toBe(true)
    expect(seed.drift_rules.every((r) => r.type === 'signal')).toBe(true)
    expect(seed.intent).toBe('core')
  })

  it('names the holding facts in the scaffold detail — rows differ per asset', () => {
    const out = planSuggestions(
      ctx({
        strategies: [strat({ scope_symbols: ['ACME', 'TELL'] })],
        positions: [
          { ...pos('ACME', 5), currency: 'CAD' },
          { ...pos('TELL', 40, 2), currency: 'USD' },
        ],
        snapshots: [snap('ACME'), snap('TELL')],
        theses: [],
      }),
    )
    const acme = out.find((c) => c.dedupeKey === 'thesis:equity:ACME')
    const tell = out.find((c) => c.dedupeKey === 'thesis:equity:TELL')
    expect(acme?.detail_en).toMatch(/hold 5 ACME at an average cost of 100 CAD/)
    expect(acme?.detail_fr).toMatch(/détenez 5 ACME au coût moyen de 100 CAD/)
    expect(tell?.detail_en).toMatch(/hold 40 TELL at an average cost of 2 USD/)
    /* A currency-less row still gets the generic detail — no dangling
       "at  " artifacts. */
    const out2 = planSuggestions(
      ctx({
        strategies: [strat()],
        positions: [pos('ACME', 5)],
        snapshots: [snap('ACME')],
        theses: [],
      }),
    )
    expect(out2.find((c) => c.kind === 'thesis')?.detail_en).toMatch(
      /^A thesis names the story/,
    )
  })

  it('day-move rule on a slower strategy carries the cadence switch it needs', () => {
    const out = planSuggestions(
      ctx({
        strategies: [strat({ cadence: 'monthly' })],
        positions: [pos('ACME', 5)],
        snapshots: [snap('ACME', 100, -8)],
        theses: [],
      }),
    )
    const s = out.find((c) => c.dedupeKey?.includes('day_change_pct'))
    expect(s).toBeDefined()
    /* The promise "a daily watcher would catch it" is only honest if the
       accept actually moves the strategy to daily — the payload carries it. */
    expect(s!.payload['cadence']).toBe('daily')
    expect(s!.detail_en).toMatch(/switches it to a daily run/)
    /* The meta line already names the strategy — the detail must not
       repeat it a second time. */
    expect(s!.detail_en).not.toMatch(/Watcher/)
    expect(s!.detail_fr).toMatch(/passe en quotidien/)
    /* On a daily strategy the rule just lands — no cadence field. */
    const out2 = planSuggestions(
      ctx({
        strategies: [strat()],
        positions: [pos('ACME', 5)],
        snapshots: [snap('ACME', 100, -8)],
        theses: [],
      }),
    )
    const s2 = out2.find((c) => c.dedupeKey?.includes('day_change_pct'))
    expect(s2!.payload['cadence']).toBeUndefined()
    expect(s2!.detail_en).toBe('Adds one rule to “Watcher”.')
    /* FR keeps the comma decimal. */
    expect(s2!.title_fr).toMatch(/a bougé de -8,0 %|a bougé de −8,0 %/)
  })

  it('skips a symbol that already carries a thesis', () => {
    const out = planSuggestions(
      ctx({
        strategies: [strat()],
        positions: [pos('ACME', 5)],
        snapshots: [snap('ACME')],
        theses: [{ asset_class: 'equity', symbol: 'ACME' }],
      }),
    )
    expect(out.some((c) => c.kind === 'thesis')).toBe(false)
  })

  it('caps thesis filings so a fresh book does not flood', () => {
    const out = planSuggestions(
      ctx({
        strategies: [strat({ scope_symbols: ['A', 'B', 'C', 'D', 'E'] })],
        positions: [pos('A', 5), pos('B', 5), pos('C', 5), pos('D', 5), pos('E', 5)],
        snapshots: [snap('A'), snap('B'), snap('C'), snap('D'), snap('E')],
        theses: [],
      }),
    )
    expect(out.filter((c) => c.kind === 'thesis').length).toBeLessThanOrEqual(3)
  })

  it('does not file thesis rows when no strategy watches the book yet', () => {
    /* The whole-strategy draft is the answer to an unwatched book — the
       pass returns early, so thesis suggestions wait for a strategy to
       land first rather than pile onto the empty queue. */
    const out = planSuggestions(
      ctx({
        positions: [pos('ACME', 5)],
        snapshots: [snap('ACME')],
        theses: [],
      }),
    )
    expect(out.every((c) => c.kind === 'strategy')).toBe(true)
  })
})
