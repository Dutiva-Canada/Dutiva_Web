import { describe, expect, it } from 'vitest'
import {
  applyFill,
  buildDigestEmail,
  buildSignalEmail,
  dedupeRowActive,
  digestFlushDue,
  draftExpiryCutoff,
  DRAFT_EXPIRY_DAYS,
  marketSessionsMissed,
  parseRules,
  planRun,
  resolveQuantity,
  ruleMatches,
  signalKey,
  snapshotStale,
  strategyDue,
  validateBotAction,
  type MarketSnapshot,
  type OrderProposalRule,
  type Position,
  type RunContext,
  type Strategy,
  type StrategyRule,
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
  scope_symbols: ['ACME'],
  rules: [],
  cadence: 'daily',
  last_evaluated_at: null,
}

const ctx: RunContext = { bookValue: 1000, cashTotal: 5000 }

const signalRule = (over: Partial<StrategyRule> = {}): StrategyRule => ({
  type: 'signal',
  metric: 'day_change_pct',
  op: 'lt',
  value: -5,
  severity: 'alert',
  title: 'Dip',
  ...over,
})

const proposalRule = (over: Partial<OrderProposalRule> = {}): OrderProposalRule => ({
  type: 'order_proposal',
  metric: 'day_change_pct',
  op: 'lt',
  value: -5,
  side: 'buy',
  qty: 2,
  qty_unit: 'shares',
  title: 'Buy the dip',
  ...over,
})

describe('parseRules', () => {
  it('keeps valid rules and drops malformed ones', () => {
    const rules = parseRules([
      signalRule(),
      {
        metric: 'bogus',
        op: 'lt',
        value: 1,
        type: 'signal',
        severity: 'alert',
        title: 'Bad metric',
      },
      {
        metric: 'vs_ma50',
        op: 'sideways',
        value: 1,
        type: 'signal',
        severity: 'alert',
        title: 'Bad op',
      },
      {
        metric: 'vs_ma50',
        op: 'lt',
        value: 'nan',
        type: 'signal',
        severity: 'alert',
        title: 'Bad value',
      },
      { metric: 'vs_ma50', op: 'lt', value: -10, type: 'signal', severity: 'alert', title: '  ' },
      'junk',
    ])
    expect(rules).toHaveLength(1)
    expect(rules[0]).toMatchObject({ type: 'signal', metric: 'day_change_pct', severity: 'alert' })
  })

  it('maps legacy {kind, side, qty} rules onto the type split', () => {
    const rules = parseRules([
      { metric: 'day_change_pct', op: 'lt', value: -5, kind: 'alert', title: 'A' },
      {
        metric: 'day_change_pct',
        op: 'lt',
        value: -5,
        kind: 'screen',
        title: 'B',
        side: 'buy',
        qty: 5,
      },
      { metric: 'day_change_pct', op: 'lt', value: -5, kind: 'thesis', title: 'C' },
    ])
    expect(rules[0]).toMatchObject({ type: 'signal', severity: 'alert' })
    expect(rules[1]).toMatchObject({
      type: 'order_proposal',
      side: 'buy',
      qty: 5,
      qty_unit: 'shares',
    })
    expect(rules[2]).toMatchObject({ type: 'signal', severity: 'insight' })
    /* Signal rules never carry order fields. */
    expect('side' in rules[0]).toBe(false)
    expect('side' in rules[2]).toBe(false)
  })

  it('order proposals require side + qty + unit; invalid ones drop', () => {
    const rules = parseRules([
      proposalRule(),
      {
        type: 'order_proposal',
        metric: 'day_change_pct',
        op: 'lt',
        value: -5,
        title: 'No side',
        qty: 5,
      },
      {
        type: 'order_proposal',
        metric: 'day_change_pct',
        op: 'lt',
        value: -5,
        title: 'No qty',
        side: 'buy',
      },
      proposalRule({ title: 'Pct', qty_unit: 'percent_of_position', qty: 25 }),
    ])
    expect(rules).toHaveLength(2)
    expect(rules[1]).toMatchObject({ qty_unit: 'percent_of_position' })
  })

  it('between requires a finite second bound', () => {
    const rules = parseRules([
      {
        metric: 'day_change_pct',
        op: 'between',
        value: -10,
        value2: -3,
        type: 'signal',
        severity: 'alert',
        title: 'Range',
      },
      {
        metric: 'day_change_pct',
        op: 'between',
        value: -10,
        type: 'signal',
        severity: 'alert',
        title: 'No bound',
      },
    ])
    expect(rules).toHaveLength(1)
    expect(rules[0]).toMatchObject({ op: 'between', value: -10, value2: -3 })
  })

  it('returns [] for non-array input', () => {
    expect(parseRules(null)).toEqual([])
    expect(parseRules({ metric: 'x' })).toEqual([])
  })
})

describe('resolveQuantity', () => {
  it('shares pass through', () => {
    expect(resolveQuantity(proposalRule({ qty: 3 }), snap, position)).toBe(3)
  })

  it('currency resolves against the snapshot price', () => {
    const r = proposalRule({ qty: 500, qty_unit: 'currency' })
    expect(resolveQuantity(r, snap, position)).toBe(5) /* 500 CAD / 100 CAD */
    expect(resolveQuantity(r, { ...snap, price: 0 }, position)).toBeNull()
  })

  it('percent_of_position needs a held position', () => {
    const r = proposalRule({ qty: 25, qty_unit: 'percent_of_position' })
    expect(resolveQuantity(r, snap, position)).toBe(2.5) /* 25% of 10 */
    expect(resolveQuantity(r, snap, null)).toBeNull()
    expect(resolveQuantity(r, snap, { ...position, quantity: 0 })).toBeNull()
  })

  it('returns null for resolved quantities that round to zero', () => {
    const r = proposalRule({ qty_unit: 'currency', qty: 0.00001 }) /* 1e-7 shares */
    expect(resolveQuantity(r, snap, position)).toBeNull()
  })
})

describe('ruleMatches', () => {
  it('day_change_pct lt/gt', () => {
    expect(ruleMatches(signalRule(), snap, position, ctx)).toBe(true)
    expect(ruleMatches(signalRule({ op: 'gt' }), snap, position, ctx)).toBe(false)
  })

  it('between is an inclusive range and order-agnostic', () => {
    /* snap.day_change_pct = -6 */
    expect(
      ruleMatches(signalRule({ op: 'between', value: -10, value2: -3 }), snap, position, ctx),
    ).toBe(true)
    expect(
      ruleMatches(signalRule({ op: 'between', value: -3, value2: 0 }), snap, position, ctx),
    ).toBe(false)
    /* reversed bounds normalize to min/max */
    expect(
      ruleMatches(signalRule({ op: 'between', value: 0, value2: -10 }), snap, position, ctx),
    ).toBe(true)
    /* edge values are inclusive */
    expect(
      ruleMatches(signalRule({ op: 'between', value: -6, value2: -3 }), snap, position, ctx),
    ).toBe(true)
  })

  it('vs_ma50 derives from price and ma50', () => {
    const rule = signalRule({ metric: 'vs_ma50' })
    expect(ruleMatches(rule, snap, position, ctx)).toBe(true)
    expect(ruleMatches(rule, { ...snap, ma50: null }, position, ctx)).toBe(false)
  })

  it('value_floor uses quantity × price and needs a position', () => {
    const rule = signalRule({ metric: 'value_floor', value: 1500 })
    expect(ruleMatches(rule, snap, position, ctx)).toBe(true) /* 10 × 100 = 1000 */
    expect(ruleMatches(rule, snap, null, ctx)).toBe(false)
    expect(ruleMatches(rule, snap, { ...position, quantity: 20 }, ctx)).toBe(false)
  })

  it('weight_pct is the position share of the marked book', () => {
    /* 10 × 100 = 1000 of a 1000 book → 100% */
    const rule = signalRule({ metric: 'weight_pct', op: 'gt', value: 80 })
    expect(ruleMatches(rule, snap, position, ctx)).toBe(true)
    expect(ruleMatches(rule, snap, position, { ...ctx, bookValue: 5000 })).toBe(false) /* 20% */
    expect(ruleMatches(rule, snap, null, ctx)).toBe(false)
    expect(ruleMatches(rule, snap, position, { ...ctx, bookValue: 0 })).toBe(false)
  })

  it('unrealized_gain_pct is price vs avg cost', () => {
    /* (100 − 95) / 95 ≈ 5.26% */
    const rule = signalRule({ metric: 'unrealized_gain_pct', op: 'gt', value: 5 })
    expect(ruleMatches(rule, snap, position, ctx)).toBe(true)
    expect(ruleMatches(rule, { ...snap, price: 90 }, position, ctx)).toBe(false)
    expect(ruleMatches(rule, snap, null, ctx)).toBe(false)
    expect(ruleMatches(rule, snap, { ...position, avg_cost: 0 }, ctx)).toBe(false)
  })

  it('cash_above reads the book-level cash total', () => {
    const rule = signalRule({ metric: 'cash_above', op: 'gt', value: 4000 })
    expect(ruleMatches(rule, snap, null, ctx)).toBe(true) /* 5000 > 4000 */
    expect(ruleMatches(rule, snap, null, { ...ctx, cashTotal: 100 })).toBe(false)
  })
})

describe('strategyDue', () => {
  const now = new Date('2026-09-25T12:00:00Z')
  const ago = (days: number) => new Date(now.getTime() - days * 86400_000).toISOString()

  it('daily is a 24h window — the twice-weekday sweep must not double-eval', () => {
    /* Sweeps fire morning + midday; a daily strategy evaluated hours ago
       is not due again. */
    expect(strategyDue({ cadence: 'daily', last_evaluated_at: ago(0.4) }, now)).toBe(false)
    expect(strategyDue({ cadence: 'daily', last_evaluated_at: ago(1.1) }, now)).toBe(true)
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
  it('scopes snapshots to the strategy asset_classes when set', () => {
    /* Pre-0184 strategies restricted scans by asset class; the scope
       backfill widened them to every watched/held symbol. The class filter
       must keep an equity-only legacy strategy off crypto. */
    const cryptoSnap: MarketSnapshot = { ...snap, asset_class: 'crypto', symbol: 'BTC' }
    const strategy: Strategy = {
      ...baseStrategy,
      scope_symbols: ['ACME', 'BTC'],
      asset_classes: ['equity'],
      rules: [signalRule()],
    }
    const plan = planRun([strategy], [snap, cryptoSnap], [position], new Set())
    expect(plan.symbolsScanned).toEqual(['ACME'])
    expect(plan.signals.map((s) => s.symbol)).toEqual(['ACME'])

    /* No restriction (empty set = unrestricted, post-0184 saves) sees both. */
    const wide: Strategy = { ...strategy, asset_classes: [] }
    const widePlan = planRun([wide], [snap, cryptoSnap], [position], new Set())
    expect(widePlan.symbolsScanned).toEqual(['ACME', 'BTC'])
  })

  it('emits a signal for each matching signal rule, deduped by open signals', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [
        signalRule({ title: 'Dip below −5%' }),
        signalRule({ title: 'Spike', op: 'gt', value: 10, severity: 'insight' }),
      ],
    }
    const plan = planRun([strategy], [snap], [position], new Set())
    expect(plan.signals).toHaveLength(1)
    expect(plan.signals[0].title).toBe('Dip below −5%')
    expect(plan.signals[0].kind).toBe('alert') /* severity becomes the signal kind */
    expect(plan.evaluated).toBe(1)
    expect(plan.symbolsScanned).toEqual(['ACME'])
    expect(plan.ruleHits).toEqual({ 'Dip below −5%': 1 })

    /* Re-running with the emitted key present produces nothing. */
    const keys = new Set(plan.signals.map(signalKey))
    expect(planRun([strategy], [snap], [position], keys).signals).toHaveLength(0)
  })

  it('order proposals become draft plans — never executed fills', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [proposalRule()],
    }
    const plan = planRun([strategy], [snap], [position], new Set())
    expect(plan.signals).toHaveLength(0) /* proposals don't emit signals */
    expect(plan.proposals).toHaveLength(1)
    expect(plan.proposals[0]).toMatchObject({
      strategy_id: 's1',
      symbol: 'ACME',
      side: 'buy',
      quantity: 2,
      requested_price: 100,
    })
    /* The plan carries no execution path — there is no executed_price, no
       fill, no position mutation anywhere in planRun's output. */
    expect(JSON.stringify(plan.proposals)).not.toContain('executed')
    expect(plan.ruleHits).toEqual({ 'Buy the dip': 1 })
  })

  it('dedupes proposals against open draft orders', () => {
    const strategy: Strategy = { ...baseStrategy, rules: [proposalRule()] }
    const first = planRun([strategy], [snap], [position], new Set())
    expect(first.proposals).toHaveLength(1)
    const openDrafts = new Set(first.proposals.map((p) => p.rule_key))
    const second = planRun([strategy], [snap], [position], new Set(), {
      openDraftKeys: openDrafts,
    })
    expect(second.proposals).toHaveLength(0)
    expect(second.ruleHits['Buy the dip']).toBe(1) /* hit still recorded */
  })

  it('skips proposals whose quantity cannot resolve', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [proposalRule({ qty_unit: 'percent_of_position', qty: 25 })],
    }
    const plan = planRun([strategy], [snap], [], new Set())
    expect(plan.proposals).toHaveLength(0)
    expect(plan.warnings.length).toBeGreaterThan(0)
    expect(plan.ruleHits['Buy the dip']).toBe(1)
  })

  it('scans only symbols inside the strategy scope', () => {
    const strategy: Strategy = { ...baseStrategy, rules: [signalRule()] }
    const other: MarketSnapshot = { ...snap, symbol: 'BETA' }
    const plan = planRun([strategy], [snap, other], [position], new Set())
    expect(plan.symbolsScanned).toEqual(['ACME'])
    expect(plan.signals).toHaveLength(1)

    const wider = { ...strategy, scope_symbols: ['ACME', 'BETA'] }
    expect(planRun([wider], [snap, other], [position], new Set()).signals).toHaveLength(2)
  })

  it('skips disabled strategies; an empty scope still counts as evaluated', () => {
    const strategy: Strategy = { ...baseStrategy, rules: [signalRule()] }
    expect(planRun([{ ...strategy, enabled: false }], [snap], [], new Set()).evaluated).toBe(0)
    /* Empty scope: the strategy WAS evaluated — runs.ts stamps its
       last_evaluated_at — there was just nothing in it to scan. */
    const empty = planRun([{ ...strategy, scope_symbols: [] }], [snap], [], new Set())
    expect(empty.evaluated).toBe(1)
    expect(empty.symbolsScanned).toEqual([])
    expect(empty.signals).toHaveLength(0)
  })

  it('skips strategies whose cadence has not elapsed unless forced', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      cadence: 'weekly',
      last_evaluated_at: new Date(Date.now() - 86400_000).toISOString() /* yesterday */,
      rules: [signalRule()],
    }
    expect(planRun([strategy], [snap], [], new Set()).evaluated).toBe(0)
    /* Manual "Scan now" bypasses the cadence window. */
    expect(planRun([strategy], [snap], [], new Set(), { force: true }).evaluated).toBe(1)

    const due = {
      ...strategy,
      last_evaluated_at: new Date(Date.now() - 8 * 86400_000).toISOString(),
    }
    expect(planRun([due], [snap], [], new Set()).evaluated).toBe(1)
  })

  it('records diagnostics per strategy so same-title rules never mix', () => {
    const a: Strategy = { ...baseStrategy, id: 's1', rules: [signalRule({ title: 'Shared' })] }
    const b: Strategy = { ...baseStrategy, id: 's2', rules: [signalRule({ title: 'Shared' })] }
    const plan = planRun([a, b], [snap], [position], new Set())
    expect(plan.ruleHits).toEqual({ Shared: 2 })
    expect(plan.perStrategy).toHaveLength(2)
    expect(plan.perStrategy.map((s) => s.strategyId)).toEqual(['s1', 's2'])
    for (const s of plan.perStrategy) {
      expect(s.ruleHits).toEqual({ Shared: 1 })
      expect(s.symbolsScanned).toEqual(['ACME'])
      expect(s.signals).toBe(1)
    }
  })

  it('dedupes same-title proposals within a single scan', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [proposalRule({ title: 'Same' }), proposalRule({ title: 'Same' })],
    }
    const plan = planRun([strategy], [snap], [position], new Set())
    expect(plan.proposals).toHaveLength(1)
    expect(plan.ruleHits['Same']).toBe(2)
  })

  it('cash_above fires once per strategy, and only as a signal', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [
        signalRule({
          metric: 'cash_above',
          op: 'gt',
          value: 1000,
          severity: 'insight',
          title: 'Idle cash',
        }),
        signalRule({ title: 'Dip' }),
      ],
    }
    const plan = planRun([strategy], [snap, { ...snap, symbol: 'BETA' }], [], new Set(), {
      cashTotal: 5000,
    })
    const cashSignals = plan.signals.filter((s) => s.title === 'Idle cash')
    expect(cashSignals).toHaveLength(1)
    expect(cashSignals[0].symbol).toBe('')
    /* BETA is out of scope — only ACME fires */
    expect(plan.signals.filter((s) => s.title === 'Dip')).toHaveLength(1)
  })

  it('book-metric order proposals warn instead of ordering', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [
        proposalRule({ metric: 'cash_above', op: 'gt', value: 1000, title: 'Buy with idle cash' }),
      ],
    }
    const plan = planRun([strategy], [snap], [], new Set(), { cashTotal: 5000 })
    expect(plan.proposals).toHaveLength(0)
    expect(plan.warnings).toHaveLength(1)
    expect(plan.ruleHits['Buy with idle cash']).toBe(1)
  })

  it('summary mode collapses signal hits into one row per scan', () => {
    const other: MarketSnapshot = { ...snap, symbol: 'BETA' }
    const strategy: Strategy = {
      ...baseStrategy,
      scope_symbols: ['ACME', 'BETA'],
      multi_match: 'summary',
      rules: [
        signalRule({ title: 'Dip', severity: 'alert' }),
        signalRule({ title: 'Idle cash', metric: 'cash_above', op: 'gt', value: 1000, severity: 'insight' }),
      ],
    }
    /* ACME and BETA both dip — plus one cash hit: three hits, ONE signal. */
    const plan = planRun([strategy], [snap, other], [position], new Set(), {
      cashTotal: 5000,
    })
    expect(plan.ruleHits).toEqual({ Dip: 2, 'Idle cash': 1 })
    expect(plan.signals).toHaveLength(1)
    expect(plan.signals[0]).toMatchObject({
      kind: 'alert', /* strongest severity wins */
      symbol: '',
      title: '3 rules matched',
      title_fr: '3 règles déclenchées',
    })
    expect(plan.signals[0].body).toContain('ACME — Dip')
    expect(plan.signals[0].body).toContain('Idle cash')
    /* Per-rule hit diagnostics are unaffected by the collapse. */
    expect(plan.perStrategy[0].ruleHits).toEqual({ Dip: 2, 'Idle cash': 1 })
  })

  it('summary mode still emits every order proposal', () => {
    /* Proposals are never merged — each is a distinct draft needing its
       own approval, even when notifications collapse to one. */
    const strategy: Strategy = {
      ...baseStrategy,
      multi_match: 'summary',
      rules: [
        proposalRule({ title: 'Buy A' }),
        proposalRule({ title: 'Buy B', qty: 4 }),
      ],
    }
    const plan = planRun([strategy], [snap], [position], new Set())
    expect(plan.proposals).toHaveLength(2)
    expect(plan.signals).toHaveLength(0)
  })

  it('collectMatches reports per-rule outcomes without writing anything', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [
        signalRule({ title: 'Dip', severity: 'alert' }),
        signalRule({ title: 'Miss', op: 'gt', value: 99 }),
        proposalRule({ title: 'Buy the dip', qty: 2 }),
      ],
    }
    const plan = planRun([strategy], [snap], [position], new Set(), {
      collectMatches: true,
    })
    expect(plan.matches).toHaveLength(2)
    expect(plan.matches[0]).toMatchObject({
      ruleIndex: 0,
      ruleTitle: 'Dip',
      symbol: 'ACME',
      metricValue: -6,
      outcome: { kind: 'signal', severity: 'alert' },
    })
    expect(plan.matches[1]).toMatchObject({
      ruleIndex: 2,
      outcome: { kind: 'order', side: 'buy', quantity: 2 },
    })
    /* Non-matching rules produce no row; the dry run still plans drafts
       in memory only — nothing is inserted here or in test-scan. */
    const off = planRun([strategy], [snap], [position], new Set())
    expect(off.matches).toHaveLength(0)
  })

  it('evaluates rules in array order — order is the persisted priority', () => {
    /* ruleHits preserve insertion order; a reorder survives a round-trip
       through parseRules untouched, so save order = evaluation order. */
    const raw = [
      { metric: 'day_change_pct', op: 'lt', value: -5, type: 'signal', severity: 'alert', title: 'First' },
      { metric: 'vs_ma50', op: 'lt', value: 0, type: 'signal', severity: 'insight', title: 'Second' },
    ]
    const parsed = parseRules(raw)
    expect(parsed.map((r) => r.title)).toEqual(['First', 'Second'])
    const reversed = parseRules([...raw].reverse())
    expect(reversed.map((r) => r.title)).toEqual(['Second', 'First'])
  })
})

describe('snapshot freshness', () => {
  /* Market sessions are Mon–Fri 13:00–22:00 UTC — market-sync only writes
     inside them, so staleness counts missed sessions, not wall-clock age. */
  const friClose = Date.parse('2025-10-10T21:00:00Z') /* Fri Oct 10 */
  const monMorning = Date.parse('2025-10-13T12:45:00Z') /* Mon, before the 13:00 open */
  const monClose = Date.parse('2025-10-13T22:30:00Z') /* Mon, after the 22:00 close */
  const wedMorning = Date.parse('2025-10-15T12:45:00Z') /* Wed, Mon+Tue sessions closed */

  it('a weekend gap is not staleness — Friday close is fresh Monday morning', () => {
    expect(marketSessionsMissed(friClose, monMorning)).toBe(0)
    expect(snapshotStale({ ...snap, as_of: '2025-10-10T21:00:00Z' }, monMorning)).toBe(false)
  })

  it('one missed session warns nothing; two missed sessions go stale', () => {
    expect(marketSessionsMissed(friClose, monClose)).toBe(1)
    expect(snapshotStale({ ...snap, as_of: '2025-10-10T21:00:00Z' }, monClose)).toBe(false)
    expect(marketSessionsMissed(friClose, wedMorning)).toBe(2)
    expect(snapshotStale({ ...snap, as_of: '2025-10-10T21:00:00Z' }, wedMorning)).toBe(true)
  })

  it('a mark written inside the session is never stale to it', () => {
    const inSession = Date.parse('2025-10-13T14:00:00Z')
    expect(marketSessionsMissed(inSession, monClose)).toBe(0)
  })

  it('absent or unparseable as_of cannot be judged — treated fresh', () => {
    expect(snapshotStale(snap, wedMorning)).toBe(false)
    expect(snapshotStale({ ...snap, as_of: 'not-a-date' }, wedMorning)).toBe(false)
  })

  it('stale in-scope marks skip rules and warn — they never emit signals', () => {
    const staleSnap: MarketSnapshot = { ...snap, as_of: '2025-10-10T21:00:00Z' }
    const strategy: Strategy = { ...baseStrategy, rules: [signalRule()] }
    const plan = planRun([strategy], [staleSnap], [position], new Set(), {
      now: new Date(wedMorning),
    })
    expect(plan.signals).toHaveLength(0)
    expect(plan.symbolsScanned).toHaveLength(0)
    const w = plan.warningDetails.find((d) => d.code === 'snapshot_stale')
    expect(w?.params.symbols).toBe('ACME')
  })

  it('staleness outside every scope warns nothing — it changed nothing', () => {
    const staleSnap: MarketSnapshot = { ...snap, symbol: 'ELSE', as_of: '2025-10-10T21:00:00Z' }
    const strategy: Strategy = { ...baseStrategy, rules: [signalRule()] }
    const plan = planRun([strategy], [snap, staleSnap], [position], new Set(), {
      now: new Date(wedMorning),
    })
    expect(plan.warningDetails.some((d) => d.code === 'snapshot_stale')).toBe(false)
    /* ...while the fresh in-scope mark still evaluates normally. */
    expect(plan.signals).toHaveLength(1)
  })
})

describe('sell-side proposal guard', () => {
  it('clamps an oversized sell to the held quantity and warns', () => {
    const rule = proposalRule({ side: 'sell', qty: 50, qty_unit: 'shares' })
    const strategy: Strategy = { ...baseStrategy, rules: [rule] }
    const plan = planRun([strategy], [snap], [position], new Set())
    expect(plan.proposals).toHaveLength(1)
    expect(plan.proposals[0].quantity).toBe(10) /* held qty — never more */
    expect(plan.warningDetails.some((d) => d.code === 'qty_clamped')).toBe(true)
  })

  it('a >100% percent-of-position sell clamps to the full position', () => {
    const rule = proposalRule({ side: 'sell', qty: 150, qty_unit: 'percent_of_position' })
    const strategy: Strategy = { ...baseStrategy, rules: [rule] }
    const plan = planRun([strategy], [snap], [position], new Set())
    expect(plan.proposals[0]?.quantity).toBe(10)
  })

  it('a sell rule on an unheld symbol proposes nothing and warns', () => {
    const rule = proposalRule({ side: 'sell', qty: 5, qty_unit: 'shares' })
    const strategy: Strategy = { ...baseStrategy, rules: [rule] }
    const plan = planRun([strategy], [snap], [], new Set())
    expect(plan.proposals).toHaveLength(0)
    expect(plan.warningDetails.some((d) => d.code === 'sell_nothing_held')).toBe(true)
  })

  it('buys still plan at full requested size — no clamp on the buy side', () => {
    const rule = proposalRule({ side: 'buy', qty: 50, qty_unit: 'shares' })
    const strategy: Strategy = { ...baseStrategy, rules: [rule] }
    const plan = planRun([strategy], [snap], [position], new Set())
    expect(plan.proposals[0]?.quantity).toBe(50)
  })
})

describe('dedupeRowActive', () => {
  const now = Date.parse('2026-01-15T12:00:00Z')
  const ago = (ms: number) => new Date(now - ms).toISOString()

  it('open rows suppress while open; feed-hidden rows re-arm after the window', () => {
    expect(dedupeRowActive({ status: 'new', in_feed: true }, now)).toBe(true)
    expect(dedupeRowActive({ status: 'acknowledged', in_feed: true }, now)).toBe(true)
    expect(
      dedupeRowActive({ status: 'new', in_feed: false, created_at: ago(86400_000) }, now),
    ).toBe(true)
    expect(
      dedupeRowActive({ status: 'new', in_feed: false, created_at: ago(8 * 86400_000) }, now),
    ).toBe(false)
  })

  it('a dismissal quiets the key for the re-arm window, then releases it', () => {
    expect(
      dedupeRowActive(
        { status: 'dismissed', in_feed: true, dismissed_at: ago(3600_000) },
        now,
      ),
    ).toBe(true)
    expect(
      dedupeRowActive(
        { status: 'dismissed', in_feed: true, dismissed_at: ago(8 * 86400_000) },
        now,
      ),
    ).toBe(false)
    /* Pre-0246 dismissed rows carry no stamp — they re-arm immediately. */
    expect(
      dedupeRowActive({ status: 'dismissed', in_feed: true, dismissed_at: null }, now),
    ).toBe(false)
  })
})

describe('book denominator fallback', () => {
  it('unsnapshotted positions still count at their last mark — weights stay honest', () => {
    /* HELD has no snapshot but a mirrored last_price: 10 × 50 = 500.
       ACME marks 10 × 100 = 1000 → weight 66.7%, not the 100% a
       HELD-dropped denominator would report. */
    const heldNoSnap: Position = {
      account_id: 'acc-1',
      asset_class: 'equity',
      symbol: 'HELD',
      quantity: 10,
      avg_cost: 40,
      last_price: 50,
    }
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [signalRule({ metric: 'weight_pct', op: 'gt', value: 90 })],
    }
    const plan = planRun([strategy], [snap], [position, heldNoSnap], new Set())
    expect(plan.signals).toHaveLength(0)
    const w = plan.warningDetails.find((d) => d.code === 'no_snapshot')
    expect(w?.params.symbols).toBe('HELD')
  })

  it('a position with no mark at all drops out of weights and warns separately', () => {
    const ghost: Position = {
      account_id: 'acc-1',
      asset_class: 'equity',
      symbol: 'GHOST',
      quantity: 10,
      avg_cost: 0,
    }
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [signalRule({ metric: 'weight_pct', op: 'gt', value: 90 })],
    }
    const plan = planRun([strategy], [snap], [position, ghost], new Set())
    /* GHOST contributed nothing → ACME weight is 100% → fires. */
    expect(plan.signals).toHaveLength(1)
    expect(plan.warningDetails.some((d) => d.code === 'no_mark')).toBe(true)
  })
})

describe('rule identity dedupe (0218)', () => {
  it('dedupe keys ride the rule id — renaming the label re-arms nothing', () => {
    const rule = signalRule({ id: 'rule-7', title: 'Dip' })
    const strategy: Strategy = { ...baseStrategy, rules: [rule] }
    const first = planRun([strategy], [snap], [position], new Set())
    expect(first.signals).toHaveLength(1)
    expect(first.signals[0].rule_id).toBe('rule-7')
    /* The emitted row's key is what the next sweep reads back. */
    const keys = new Set(first.signals.map(signalKey))
    const renamed: Strategy = { ...baseStrategy, rules: [{ ...rule, title: 'Renamed label' }] }
    expect(planRun([renamed], [snap], [position], keys).signals).toHaveLength(0)
  })

  it('two same-title rules with ids keep separate dedupe slots', () => {
    const a = signalRule({ id: 'rule-a', title: 'Dip' })
    const b = signalRule({ id: 'rule-b', title: 'Dip' })
    const strategy: Strategy = { ...baseStrategy, rules: [a, b] }
    const plan = planRun([strategy], [snap], [position], new Set())
    expect(plan.signals).toHaveLength(2)
    /* Firing history splits by id — the titles being equal merges nothing. */
    expect(plan.ruleHits).toEqual({ 'rule-a': 1, 'rule-b': 1 })
  })

  it('title-keyed legacy rows still suppress an id-carrying rule', () => {
    const rule = signalRule({ id: 'rule-7', title: 'Dip' })
    const strategy: Strategy = { ...baseStrategy, rules: [rule] }
    /* Pre-0218 open signal — no rule_id, so its key is title-keyed. */
    const legacyKeys = new Set([
      signalKey({ strategy_id: 's1', symbol: 'ACME', kind: 'alert', title: 'Dip', rule_id: null }),
    ])
    expect(planRun([strategy], [snap], [position], legacyKeys).signals).toHaveLength(0)
  })

  it('test-scan matches flag suppression instead of counting fresh hits', () => {
    const rule = signalRule({ id: 'rule-7', title: 'Dip' })
    const strategy: Strategy = { ...baseStrategy, rules: [rule] }
    const first = planRun([strategy], [snap], [position], new Set())
    const open = new Set(first.signals.map(signalKey))
    const scan = planRun([strategy], [snap], [position], open, { collectMatches: true })
    expect(scan.matches).toHaveLength(1)
    expect(scan.matches[0].suppressed).toBe(true)
    expect(scan.signals).toHaveLength(0)
    expect(scan.ruleHits['rule-7']).toBe(1) /* the hit is still real */
  })
})

describe('cash-inclusive book weight (0218)', () => {
  it('weights a position against marked positions plus cash', () => {
    /* 10×100 = 1000 of a 1000-position + 1000-cash book → 50%, not 100%. */
    const strategy: Strategy = {
      ...baseStrategy,
      rules: [signalRule({ metric: 'weight_pct', op: 'gt', value: 60, title: 'Concentrated' })],
    }
    const plan = planRun([strategy], [snap], [position], new Set(), { cashTotal: 1000 })
    expect(plan.signals).toHaveLength(0)
    const over = planRun([{ ...baseStrategy, rules: [signalRule({ metric: 'weight_pct', op: 'gt', value: 40, title: 'Concentrated' })] }], [snap], [position], new Set(), { cashTotal: 1000 })
    expect(over.signals).toHaveLength(1)
  })

  it('warns on positions with no snapshot rather than silently shrinking the book', () => {
    const stray: Position = { ...position, symbol: 'GHOST' }
    const strategy: Strategy = { ...baseStrategy, rules: [signalRule()] }
    const plan = planRun([strategy], [snap], [position, stray], new Set())
    expect(plan.warnings.join(' ')).toContain('GHOST')
    expect(plan.warningDetails.some((w) => w.code === 'no_snapshot')).toBe(true)
    expect(plan.warningDetails.find((w) => w.code === 'no_snapshot')?.params.symbols).toBe('GHOST')
  })

  it('reports per-strategy durations instead of the whole sweep', () => {
    const a: Strategy = { ...baseStrategy, id: 's1', rules: [signalRule({ title: 'A' })] }
    const b: Strategy = { ...baseStrategy, id: 's2', rules: [signalRule({ title: 'B' })] }
    const plan = planRun([a, b], [snap], [position], new Set())
    expect(plan.perStrategy).toHaveLength(2)
    for (const s of plan.perStrategy) {
      expect(s.durationMs).toBeGreaterThanOrEqual(0)
      expect(Number.isFinite(s.durationMs)).toBe(true)
    }
  })

  it('summary-mode dedupe key is constant regardless of match count', () => {
    const strategy: Strategy = {
      ...baseStrategy,
      scope_symbols: ['ACME', 'BETA'],
      multi_match: 'summary',
      rules: [signalRule({ title: 'Dip' })],
    }
    const two = planRun([strategy], [snap, { ...snap, symbol: 'BETA' }], [position], new Set())
    expect(two.signals).toHaveLength(1)
    /* One more matched symbol changes the title ("3 rules matched") but
       NOT the dedupe key — the next sweep stays suppressed. */
    const keys = new Set(two.signals.map(signalKey))
    const again = planRun([strategy], [snap], [position], keys)
    expect(again.signals).toHaveLength(0)
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

describe('draftExpiryCutoff', () => {
  it('returns an ISO timestamp DRAFT_EXPIRY_DAYS back', () => {
    const now = new Date('2026-03-10T12:00:00Z')
    const cutoff = new Date(draftExpiryCutoff(now))
    expect(now.getTime() - cutoff.getTime()).toBe(DRAFT_EXPIRY_DAYS * 86_400_000)
  })
})

describe('buildSignalEmail', () => {
  const summary = {
    strategyName: 'Dip watcher',
    signals: ['ACME fell 6% in a day (ACME)'],
    proposals: ['buy 10 ACME'],
    portalUrl: 'https://dutiva.ca/invest',
  }

  it('subjects the email by strategy and lists hits in both languages', () => {
    const { subject, text } = buildSignalEmail(summary)
    expect(subject).toContain('Dip watcher')
    expect(text).toContain('ACME fell 6% in a day (ACME)')
    expect(text).toContain('buy 10 ACME')
    expect(text).toContain('Signaux')
    expect(text).toContain('https://dutiva.ca/invest')
  })

  it('labels proposals as drafts — the email can’t read as a fill', () => {
    const { text } = buildSignalEmail(summary)
    expect(text).toContain('drafts only')
    expect(text).toContain('brouillons seulement')
  })

  it('omits empty sections instead of printing bare headings', () => {
    const { text } = buildSignalEmail({ ...summary, proposals: [] })
    expect(text).not.toContain('proposals')
    expect(text).not.toContain('Propositions')
  })
})

describe('digestFlushDue', () => {
  const day = 86_400_000
  const now = Date.parse('2026-10-15T12:00:00Z')

  it('never flushes an empty buffer, even long overdue', () => {
    expect(digestFlushDue('daily', 0, '2026-10-01T12:00:00Z', now)).toBe(false)
    expect(digestFlushDue('weekly', 0, null, now)).toBe(false)
  })

  it('flushes daily once 24h has passed, not before', () => {
    const sent = new Date(now - day + 1000).toISOString()
    expect(digestFlushDue('daily', 2, sent, now)).toBe(false)
    expect(digestFlushDue('daily', 2, new Date(now - day).toISOString(), now)).toBe(true)
  })

  it('uses a seven-day window for weekly', () => {
    const sixDays = new Date(now - 6 * day).toISOString()
    const sevenDays = new Date(now - 7 * day).toISOString()
    expect(digestFlushDue('weekly', 1, sixDays, now)).toBe(false)
    expect(digestFlushDue('weekly', 1, sevenDays, now)).toBe(true)
  })

  it('treats a missing or corrupt last-sent stamp as due', () => {
    expect(digestFlushDue('daily', 1, null, now)).toBe(true)
    expect(digestFlushDue('daily', 1, 'not-a-date', now)).toBe(true)
  })
})

describe('buildDigestEmail', () => {
  const digest = {
    items: [
      { name: 'Dip watcher', signals: ['ACME fell 6% (ACME)'], proposals: ['buy 10 ACME'] },
      { name: 'Momentum', signals: ['MSFT crossed above MA50'], proposals: [] },
    ],
    portalUrl: 'https://dutiva.ca/invest',
    cadence: 'daily' as const,
  }

  it('groups every strategy in one bilingual email with the total in the lead', () => {
    const { subject, text } = buildDigestEmail(digest)
    expect(subject).toContain('daily')
    expect(text).toContain('3 hit(s)')
    expect(text).toContain('Dip watcher')
    expect(text).toContain('Momentum')
    expect(text).toContain('sommaire quotidien')
    expect(text).toContain('https://dutiva.ca/invest')
  })

  it('labels proposals as drafts in both languages', () => {
    const { text } = buildDigestEmail(digest)
    expect(text).toContain('drafts only')
    expect(text).toContain('brouillons')
    expect(text).toContain('buy 10 ACME (draft)')
  })

  it('drops the drafts disclaimer when the digest has no proposals', () => {
    const { text } = buildDigestEmail({
      ...digest,
      items: [{ name: 'Momentum', signals: ['MSFT crossed above MA50'], proposals: [] }],
    })
    expect(text).not.toContain('drafts only')
    expect(text).not.toContain('brouillons')
  })

  it('names the weekly window in both languages', () => {
    const { subject, text } = buildDigestEmail({ ...digest, cadence: 'weekly' })
    expect(subject).toContain('weekly')
    expect(text).toContain('last weekly digest')
    expect(text).toContain('sommaire hebdomadaire')
  })
})

describe('validateBotAction', () => {
  it('accepts the four actions', () => {
    for (const action of ['run', 'run-all', 'execute-order', 'test-scan']) {
      expect(validateBotAction(action).ok).toBe(true)
    }
    expect(validateBotAction('nope').ok).toBe(false)
  })
})

describe('planRun FX conversion', () => {
  /* 1 CAD = 0.73 USD → 1 USD ≈ 1.3699 CAD. */
  const fx = { date: '2026-10-13', rates: { CAD: 1, USD: 0.73 } }
  const usdSnap: MarketSnapshot = { ...snap, symbol: 'AMD', currency: 'USD', price: 50 }
  const usdPos: Position = { ...position, symbol: 'AMD', currency: 'USD' }
  const weightStrategy: Strategy = {
    ...baseStrategy,
    scope_symbols: ['ACME', 'AMD'],
    rules: [signalRule({ metric: 'weight_pct', op: 'gt', value: 35, title: 'Concentration' })],
  }

  it('converts foreign-currency positions before weight math', () => {
    /* ACME 1000 CAD + AMD 500 USD→684.93 CAD = a 1684.93-CAD book:
       ACME 59.3%, AMD 40.7% — both over 35. Summed raw (the old bug),
       AMD counted 500 of a 1500 "book" and never reached the line. */
    const plan = planRun([weightStrategy], [snap, usdSnap], [position, usdPos], new Set(), { fx })
    expect(plan.signals.map((s) => s.symbol).sort()).toEqual(['ACME', 'AMD'])
    const amd = plan.signals.find((s) => s.symbol === 'AMD')
    expect(amd?.body).toContain('weight 40.7%')
  })

  it('excludes positions whose currency has no rate — never blends raw', () => {
    const plan = planRun([weightStrategy], [snap, usdSnap], [position, usdPos], new Set(), {
      fx: null,
    })
    /* AMD can't convert: it stays out of bookValue and its weight rule
       cannot fire. ACME is 100% of the CAD-only book and still fires. */
    expect(plan.signals.map((s) => s.symbol)).toEqual(['ACME'])
    expect(plan.warnings.join(' ')).toContain('USD')
  })

  it('weights unrealized gain across currencies in the book currency', () => {
    /* AMD cost 95 USD, now 50 USD — a -47.4% loss. Read raw against a CAD
       book it would compute 50 vs 95 identically here, so assert the cross-
       currency case where cost and quote legs both convert. */
    const plan = planRun(
      [
        {
          ...baseStrategy,
          scope_symbols: ['AMD'],
          rules: [signalRule({ metric: 'unrealized_gain_pct', op: 'lt', value: -40, title: 'Deep loss' })],
        },
      ],
      [usdSnap],
      [usdPos],
      new Set(),
      { fx },
    )
    expect(plan.signals.map((s) => s.symbol)).toEqual(['AMD'])
  })

  it('reports the converted unrealized % in the signal body, not raw math', () => {
    /* A CAD-cost position quoting in USD: cost 95 CAD, quote 50 USD ≈
       68.49 CAD → −27.9%. The old body divided raw numbers (−47.4%) —
       the line must match the value the firing decision used. */
    const cadCostPos: Position = { ...position, symbol: 'AMD', currency: 'CAD' }
    const plan = planRun(
      [
        {
          ...baseStrategy,
          scope_symbols: ['AMD'],
          rules: [
            signalRule({ metric: 'unrealized_gain_pct', op: 'lt', value: -25, title: 'Under water' }),
          ],
        },
      ],
      [usdSnap],
      [cadCostPos],
      new Set(),
      { fx },
    )
    const sig = plan.signals[0]
    expect(sig).toBeDefined()
    expect(sig!.body).toContain('unrealized -27.9%')
    expect(sig!.body).not.toContain('-47.4%')
    /* The held line names the cost currency so `@ 95.00` can't read as USD. */
    expect(sig!.body).toContain('held: 10 @ 95.00 CAD')
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

  it('converts mixed-currency positions before quoting weights', async () => {
    const { buildInsightPrompt } = await import('./insights')
    const prompt = buildInsightPrompt({
      snapshots: [snap, { ...snap, symbol: 'AMD', currency: 'USD', price: 50 }],
      positions: [position, { ...position, symbol: 'AMD', currency: 'USD' }],
      cashTotal: 0,
      signalsEmitted: 0,
      ordersPlanned: 0,
      fx: { date: '2026-10-13', rates: { CAD: 1, USD: 0.73 } },
      bookCurrency: 'CAD',
    })
    /* AMD 500 USD → 684.93 CAD of a 1684.93-CAD book → 40.7%. */
    expect(prompt).toContain('weight 40.7%')
    expect(prompt).toContain('book value ~1684.93 CAD')
  })

  it('omits weight when a position currency has no rate', async () => {
    const { buildInsightPrompt } = await import('./insights')
    const prompt = buildInsightPrompt({
      snapshots: [snap, { ...snap, symbol: 'AMD', currency: 'USD', price: 50 }],
      positions: [position, { ...position, symbol: 'AMD', currency: 'USD' }],
      cashTotal: 0,
      signalsEmitted: 0,
      ordersPlanned: 0,
      fx: null,
    })
    const amdLine = prompt.split('\n').find((l) => l.includes('AMD')) ?? ''
    expect(amdLine).not.toContain('weight')
    expect(prompt).toContain('no FX rate')
  })

  it('insightSystemPrompt tiers the verb rule on the internal flag', async () => {
    const { insightSystemPrompt } = await import('./insights')
    const external = insightSystemPrompt(false)
    const internal = insightSystemPrompt(true)
    expect(external).toContain('No advice verbs')
    expect(internal).not.toContain('No advice verbs')
    expect(internal).toContain('@dutiva.ca')
    /* The output contract is identical either way. */
    for (const p of [external, internal]) {
      expect(p).toContain('"title_en","title_fr","body_en","body_fr"')
      expect(p).toContain('Max 2 items')
    }
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
    /* severity: 'warn' survives; anything else degrades to 'info'. */
    const sev = parseInsights(
      JSON.stringify([
        { title_en: 'A', title_fr: 'U', body_en: 'b', body_fr: 'b', severity: 'warn' },
        { title_en: 'B', title_fr: 'D', body_en: 'b', body_fr: 'b', severity: 'loud' },
      ]),
    )
    expect(sev[0].severity).toBe('warn')
    expect(sev[1].severity).toBe('info')
    expect(parseInsights('not json')).toEqual([])
    expect(parseInsights('{"a":1}')).toEqual([])
    expect(parseInsights('[]')).toEqual([])
  })
})
