import { describe, expect, it } from 'vitest'
import {
  cadenceMismatch,
  defaultRuleTitleEn,
  estimateFrequency,
  normalizeRules,
  persistedRuleTitle,
  ruleFireCount,
  scopeIsEmpty,
  staleScopeSymbols,
  validateRules,
} from './strategyRules'
import type {
  InvestBotRun,
  InvestSignal,
  MarketSnapshot,
  SignalRule,
  StrategyRule,
} from './types'

describe('normalizeRules', () => {
  it('splits the new typed shapes cleanly', () => {
    const rules = normalizeRules([
      {
        type: 'signal',
        metric: 'day_change_pct',
        op: 'lt',
        value: -5,
        severity: 'alert',
        title: 'Dip',
      },
      {
        type: 'order_proposal',
        metric: 'vs_ma50',
        op: 'lt',
        value: 0,
        side: 'buy',
        qty: 2,
        qty_unit: 'percent_of_position',
        title: 'Accumulate',
      },
    ])
    expect(rules).toHaveLength(2)
    const signal = rules[0] as Extract<StrategyRule, { type: 'signal' }>
    const proposal = rules[1] as Extract<StrategyRule, { type: 'order_proposal' }>
    expect(signal.type).toBe('signal')
    expect(signal.severity).toBe('alert')
    expect('side' in signal).toBe(false) /* signals carry no order fields */
    expect(proposal).toMatchObject({ side: 'buy', qty: 2, qtyUnit: 'percent_of_position' })
    expect('severity' in proposal).toBe(false)
  })

  it('maps legacy {kind, side?, qty?} rows to the type split', () => {
    const rules = normalizeRules([
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
    expect(rules[1]).toMatchObject({ type: 'order_proposal', qtyUnit: 'shares' })
    expect(rules[2]).toMatchObject({ type: 'signal', severity: 'insight' })
  })

  it('drops malformed entries and invalid proposals', () => {
    expect(
      normalizeRules([
        'junk',
        { metric: 'bogus', op: 'lt', value: 1, title: 'x' },
        { metric: 'day_change_pct', op: 'lt', value: -5, title: '' },
        {
          type: 'order_proposal',
          metric: 'day_change_pct',
          op: 'lt',
          value: -5,
          title: 'no side',
          qty: 1,
        },
      ]),
    ).toEqual([])
    expect(normalizeRules(null)).toEqual([])
  })
})

describe('persistedRuleTitle', () => {
  const priceRule = (over: Partial<SignalRule> = {}): SignalRule => ({
    type: 'signal',
    metric: 'price',
    op: 'gt',
    value: 150,
    severity: 'alert',
    title: '',
    ...over,
  })

  it('generates the English auto-title for a blank label', () => {
    /* The wire fallback — the watchlist alert form saves title:''; both
       normalizeRules and the engine's parseRules would drop that rule
       silently, so the persisted title can never be blank. */
    expect(persistedRuleTitle(priceRule())).toBe('Price rises above 150')
    expect(persistedRuleTitle(priceRule({ op: 'lt', value: 95.5 }))).toBe(
      'Price falls below 95.5',
    )
    expect(persistedRuleTitle(priceRule({ title: '  ' }))).toBe(
      'Price rises above 150',
    )
  })

  it('keeps a user-typed label verbatim', () => {
    expect(persistedRuleTitle(priceRule({ title: 'My alert' }))).toBe('My alert')
  })

  it('formats percent and currency metrics like the accordion does', () => {
    const pct: StrategyRule = {
      type: 'signal',
      metric: 'day_change_pct',
      op: 'lt',
      value: -5,
      severity: 'insight',
      title: '',
    }
    expect(persistedRuleTitle(pct)).toBe('Day change falls below −5%')
    const money: StrategyRule = {
      type: 'signal',
      metric: 'value_floor',
      op: 'between',
      value: 5000,
      value2: 2000,
      severity: 'alert',
      title: '',
    }
    expect(persistedRuleTitle(money)).toBe(
      'Position value is between $2,000 CAD and $5,000 CAD',
    )
  })

  it('round-trips: a persisted title survives normalizeRules', () => {
    const rule = priceRule()
    const titled = { ...rule, title: persistedRuleTitle(rule) }
    const [parsed] = normalizeRules([titled])
    expect(parsed).toMatchObject({ title: 'Price rises above 150' })
  })

  it('covers every metric — no fallback can ever be blank', () => {
    for (const metric of [
      'day_change_pct',
      'vs_ma50',
      'price',
      'value_floor',
      'weight_pct',
      'unrealized_gain_pct',
      'cash_above',
    ] as const) {
      const t = defaultRuleTitleEn(priceRule({ metric }))
      expect(t.length).toBeGreaterThan(0)
      expect(t).not.toContain('undefined')
      expect(t).not.toContain('NaN')
    }
  })
})

describe('scopeIsEmpty', () => {
  it('blocks save when nothing is in scope', () => {
    expect(scopeIsEmpty({ watchlist: false, symbols: [] })).toBe(true)
    expect(scopeIsEmpty({ watchlist: true, symbols: [] })).toBe(false)
    expect(scopeIsEmpty({ watchlist: false, symbols: ['SHOP'] })).toBe(false)
  })
})

describe('validateRules', () => {
  it('names every problem a NaN clamp used to hide', () => {
    const base: StrategyRule = {
      type: 'signal',
      metric: 'day_change_pct',
      op: 'lt',
      value: -5,
      severity: 'insight',
      title: 'ok',
    }
    expect(validateRules([base])).toEqual([])
    expect(validateRules([{ ...base, value: NaN }])).toEqual([
      { index: 0, code: 'value_required' },
    ])
    expect(
      validateRules([{ ...base, op: 'between', value2: NaN }]),
    ).toEqual([{ index: 0, code: 'value2_required' }])
    const order: StrategyRule = {
      type: 'order_proposal',
      metric: 'day_change_pct',
      op: 'lt',
      value: -5,
      side: 'buy',
      qty: NaN,
      qtyUnit: 'shares',
      title: 'buy',
    }
    expect(validateRules([order])).toEqual([{ index: 0, code: 'qty_required' }])
    expect(validateRules([{ ...order, qty: 0 }])).toEqual([{ index: 0, code: 'qty_required' }])
    /* Position in the array is the name the user sees. */
    expect(validateRules([base, { ...base, value: NaN }])).toEqual([
      { index: 1, code: 'value_required' },
    ])
  })
})

describe('cadenceMismatch', () => {
  const dayRule: StrategyRule = {
    type: 'signal',
    metric: 'day_change_pct',
    op: 'lt',
    value: -5,
    severity: 'insight',
    title: 'x',
  }

  it('flags a day-change rule on slower cadences', () => {
    expect(cadenceMismatch(dayRule, 'monthly')).toBe('daily')
    expect(cadenceMismatch(dayRule, 'weekly')).toBe('daily')
    expect(cadenceMismatch(dayRule, 'daily')).toBeNull()
    expect(cadenceMismatch({ ...dayRule, metric: 'vs_ma50' }, 'monthly')).toBeNull()
  })
})

describe('ruleFireCount / estimateFrequency', () => {
  const rule: StrategyRule = {
    type: 'signal',
    metric: 'day_change_pct',
    op: 'lt',
    value: -5,
    severity: 'insight',
    title: 'Dip',
  }
  const now = new Date('2026-03-01T00:00:00Z')
  const runs: InvestBotRun[] = [
    {
      id: 'r1',
      ranAt: '2026-02-10T07:45:00Z',
      strategyId: 's1',
      signalsEmitted: 1,
      proposalsCreated: 0,
      symbolsScanned: ['SHOP'],
      ruleHits: { Dip: 2 },
      durationMs: 900,
      summary: '',
      status: 'ok',
    },
  ]
  const signals: InvestSignal[] = [
    {
      id: 'sig1',
      strategyId: 's1',
      ruleId: null,
      assetClass: 'equity',
      symbol: 'SHOP',
      name: 'Shopify',
      kind: 'insight',
      title: 'Dip',
      body: '',
      titleFr: null,
      bodyFr: null,
      score: null,
      status: 'new',
      inFeed: true,
      createdAt: '2026-02-11T12:00:00Z',
    },
  ]

  it('counts run rule_hits; signals are the fallback, not an add-on', () => {
    /* The diagnostic run already counts the hit that emitted the signal —
       adding both would double-count. */
    expect(ruleFireCount(rule, 's1', runs, signals, now)).toBe(2)
    /* Pre-0184 coverage: no diagnostic runs → signal rows stand in. */
    const bareRun: InvestBotRun = { ...runs[0]!, ruleHits: {} }
    expect(ruleFireCount(rule, 's1', [bareRun], signals, now)).toBe(1)
  })

  it('keys on rule id — and still reads its legacy title-keyed hits', () => {
    const idRule: StrategyRule = { ...rule, id: 'rule-abc' } /* title 'Dip' */
    const idRun: InvestBotRun = {
      ...runs[0]!,
      /* The rule's own post-0218 id key plus pre-0218 title-keyed hits
         written before the column existed — history survives the schema
         transition, not just the edit. */
      ruleHits: { 'rule-abc': 3, Dip: 1 },
    }
    expect(ruleFireCount(idRule, 's1', [idRun], [], now)).toBe(4)
    /* A second same-title rule reads only the title slot (its own id key
       is absent) — merged legacy hits are unattributable either way;
       dual-key dedupe accepts the same edge. */
    const sameTitle: StrategyRule = { ...rule, id: 'rule-xyz' }
    expect(ruleFireCount(sameTitle, 's1', [idRun], [], now)).toBe(1)
  })

  it('returns null (never a fake zero) when no history exists', () => {
    expect(ruleFireCount(rule, 's1', [], [], now)).toBeNull()
    expect(ruleFireCount(rule, null, runs, signals, now)).toBeNull()
    const old = new Date('2025-01-01T00:00:00Z')
    const staleRun: InvestBotRun = { ...runs[0]!, ranAt: old.toISOString() }
    expect(ruleFireCount(rule, 's1', [staleRun], [], now)).toBeNull()
  })

  it('estimates weekly frequency from the same history', () => {
    const f = estimateFrequency([rule], 's1', runs, signals, now)
    expect(f).not.toBeNull()
    expect(f!.perWeek).toBeCloseTo(0.2) /* 3 hits / (90/7 weeks) ≈ 0.2 */
    expect(estimateFrequency([rule], null, runs, signals, now)).toBeNull()
  })
})

describe('staleScopeSymbols', () => {
  const now = new Date('2026-03-01T12:00:00Z')
  const snap = (symbol: string, asOf: string): MarketSnapshot => ({
    assetClass: 'equity',
    symbol,
    price: 100,
    dayChangePct: 0,
    ma50: 95,
    currency: 'CAD',
    source: 'yahoo',
    asOf,
  })

  it('flags missing snapshots and prices older than 48 h', () => {
    const r = staleScopeSymbols(
      ['FRESH', 'OLD', 'NONE'],
      [snap('FRESH', '2026-03-01T00:00:00Z'), snap('OLD', '2026-02-26T00:00:00Z')],
      now,
    )
    expect(r.missing).toEqual(['NONE'])
    expect(r.stale).toEqual(['OLD'])
  })

  it('matches symbols case-insensitively and tolerates bad timestamps', () => {
    const r = staleScopeSymbols(['shop'], [snap('SHOP', 'not-a-date')], now)
    expect(r.missing).toEqual([])
    expect(r.stale).toEqual([])
  })
})
