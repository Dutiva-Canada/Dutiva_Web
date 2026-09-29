import { describe, expect, it } from 'vitest'
import {
  cadenceMismatch,
  estimateFrequency,
  normalizeRules,
  ruleFireCount,
  ruleSentence,
  scopeIsEmpty,
  staleScopeSymbols,
} from './strategyRules'
import type { InvestBotRun, InvestSignal, MarketSnapshot, StrategyRule } from './types'

const en = (m: string) => ({ en: m, fr: m })

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

describe('scopeIsEmpty', () => {
  it('blocks save when nothing is in scope', () => {
    expect(scopeIsEmpty({ watchlist: false, symbols: [] })).toBe(true)
    expect(scopeIsEmpty({ watchlist: true, symbols: [] })).toBe(false)
    expect(scopeIsEmpty({ watchlist: false, symbols: ['SHOP'] })).toBe(false)
  })
})

describe('ruleSentence', () => {
  it('reads as plain English', () => {
    const rule: StrategyRule = {
      type: 'signal',
      metric: 'day_change_pct',
      op: 'gt',
      value: 15,
      severity: 'alert',
      title: 'x',
    }
    expect(ruleSentence(rule, en).en).toBe('day_change_pct is above 15')
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
    source: 'stooq',
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
