import { describe, expect, it } from 'vitest'
import { investMessages as IM } from '@/i18n/messages/invest'
import type {
  InvestBotRun,
  InvestStrategy,
  OrderProposalRule,
  SignalRule,
} from '../data/types'
import {
  actionChip,
  channelHelper,
  fmtCad,
  pl,
  qtyPreview,
  ruleTitle,
  runLine,
  scopeSymbols,
  storedRuleTitle,
  strategyMeta,
  trackedUniverse,
} from './strategyUi'

const signal: SignalRule = {
  type: 'signal',
  metric: 'day_change_pct',
  op: 'lt',
  value: -12,
  severity: 'alert',
  title: '',
}

const order: OrderProposalRule = {
  type: 'order_proposal',
  metric: 'vs_ma50',
  op: 'lt',
  value: -10,
  side: 'buy',
  qty: 1,
  qtyUnit: 'shares',
  title: '',
}

describe('pl', () => {
  it('pluralizes like the prototype (FR singular covers 0 and 1)', () => {
    const one = IM.invest_sb_signal_one
    const many = IM.invest_sb_signal_many
    expect(pl('en', 0, one, many)).toBe('0 signals')
    expect(pl('en', 1, one, many)).toBe('1 signal')
    expect(pl('en', 2, one, many)).toBe('2 signals')
    expect(pl('fr', 0, one, many)).toBe('0 signal')
    expect(pl('fr', 1, one, many)).toBe('1 signal')
    expect(pl('fr', 2, one, many)).toBe('2 signaux')
  })
})

describe('fmtCad / ruleTitle', () => {
  it('puts the currency unit on money thresholds', () => {
    expect(fmtCad('en', 1000)).toBe('$1,000 CAD')
    expect(fmtCad('fr', 1000)).toBe('1 000 $ CAD')
  })

  it('generates titles from metric + condition + threshold', () => {
    expect(ruleTitle('en', signal)).toContain('falls below')
    expect(ruleTitle('en', signal)).toContain('−12%')
    expect(ruleTitle('fr', signal)).toContain('sous')
    expect(ruleTitle('fr', signal)).toContain('−12 %')
    const cash: SignalRule = { ...signal, metric: 'cash_above', op: 'gt', value: 500 }
    expect(ruleTitle('en', cash)).toContain('$500 CAD')
    expect(ruleTitle('fr', cash)).toContain('500 $ CAD')
  })

  it('renders between titles with normalized bounds', () => {
    const range: SignalRule = { ...signal, op: 'between', value: -3, value2: -10 }
    expect(ruleTitle('en', range)).toBe('Day change is between −10% and −3%')
    expect(ruleTitle('fr', range)).toBe('Variation du jour est entre −10 % et −3 %')
  })

  it('falls back to the EN generated title when the label is blank', () => {
    expect(storedRuleTitle(signal)).toBe(ruleTitle('en', signal))
    expect(storedRuleTitle({ ...signal, title: ' Dip ' })).toBe('Dip')
  })
})

describe('qtyPreview', () => {
  it('renders each unit in plain language', () => {
    expect(qtyPreview('en', order)).toBe('Buys 1 share')
    expect(qtyPreview('en', { ...order, qty: 3, side: 'sell' })).toBe('Sells 3 shares')
    expect(qtyPreview('en', { ...order, qtyUnit: 'percent_of_position', qty: 5 })).toBe(
      'Adds 5% to your existing position',
    )
    expect(qtyPreview('en', { ...order, qtyUnit: 'currency', qty: 1000 })).toContain('1,000')
    expect(qtyPreview('fr', { ...order, qtyUnit: 'currency', qty: 1000 })).toContain('1 000')
  })
})

describe('actionChip', () => {
  it('distinguishes order proposals from notify severities', () => {
    expect(actionChip('en', order).label).toBe('Propose an order')
    expect(actionChip('en', signal).label).toBe('Notify · Alert')
    expect(actionChip('en', { ...signal, severity: 'insight' }).label).toBe('Notify · Insight')
    expect(actionChip('fr', signal).label).toContain('Alerte')
  })
})

describe('channelHelper', () => {
  it('recomputes from the actual selection', () => {
    expect(channelHelper('en', { inApp: true, email: true })).toContain('in-app')
    expect(channelHelper('en', { inApp: false, email: false })).not.toBe(
      channelHelper('en', { inApp: true, email: false }),
    )
    expect(channelHelper('fr', { inApp: true, email: false })).not.toBe(
      channelHelper('en', { inApp: true, email: false }),
    )
  })
})

describe('scope helpers', () => {
  it('unions held and watched symbols, deduped and sorted', () => {
    const universe = trackedUniverse(
      [{ symbol: 'aapl' }, { symbol: 'RY' }],
      [{ symbol: 'btc' }, { symbol: 'AAPL' }],
    )
    expect(universe).toEqual(['AAPL', 'BTC', 'RY'])
  })

  it('resolves watchlist scope to the full universe plus explicit symbols', () => {
    const u = ['AAPL', 'RY']
    expect(scopeSymbols({ watchlist: true, symbols: ['msft'] }, u)).toEqual([
      'AAPL',
      'MSFT',
      'RY',
    ])
    expect(scopeSymbols({ watchlist: false, symbols: ['msft', 'aapl'] }, u)).toEqual([
      'AAPL',
      'MSFT',
    ])
  })
})

describe('strategyMeta / runLine', () => {
  const strategy = {
    rules: [signal, order],
    cadence: 'daily',
  } as InvestStrategy

  it('joins rule count, cadence, and tracked count', () => {
    const meta = strategyMeta('en', strategy, 12)
    expect(meta).toBe('2 rules · Daily · 12 tracked symbols')
    expect(strategyMeta('fr', { ...strategy, rules: [signal] }, 1)).toContain('1 règle')
  })

  const run: InvestBotRun = {
    id: 'r1',
    ranAt: '2026-01-20T21:15:00Z',
    strategyId: null,
    signalsEmitted: 1,
    proposalsCreated: 2,
    symbolsScanned: ['AAPL'],
    ruleHits: {},
    durationMs: 400,
    summary: '',
    status: 'ok',
  }

  it('renders the run row with real plurals and duration', () => {
    const line = runLine('en', run)
    expect(line).toContain('1 signal')
    expect(line).toContain('2 proposals')
    expect(line).toContain('0.4s')
    expect(line).not.toContain('(s)')
    expect(runLine('fr', { ...run, signalsEmitted: 0 })).toContain('0 signal')
  })
})
