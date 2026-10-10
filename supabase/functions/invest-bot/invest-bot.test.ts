import { describe, expect, it } from 'vitest'
import {
  applyFill,
  buildSignalEmail,
  draftExpiryCutoff,
  DRAFT_EXPIRY_DAYS,
  parseRules,
  planRun,
  resolveQuantity,
  ruleMatches,
  signalKey,
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

  it('skips disabled strategies and empty scopes', () => {
    const strategy: Strategy = { ...baseStrategy, rules: [signalRule()] }
    expect(planRun([{ ...strategy, enabled: false }], [snap], [], new Set()).evaluated).toBe(0)
    expect(planRun([{ ...strategy, scope_symbols: [] }], [snap], [], new Set()).evaluated).toBe(0)
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

describe('validateBotAction', () => {
  it('accepts the four actions', () => {
    for (const action of ['run', 'run-all', 'execute-order', 'test-scan']) {
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
    expect(parseInsights('not json')).toEqual([])
    expect(parseInsights('{"a":1}')).toEqual([])
    expect(parseInsights('[]')).toEqual([])
  })
})
