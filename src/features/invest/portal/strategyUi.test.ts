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
  fmtDay,
  fmtNum,
  fmtPct,
  formatDuration,
  mentionedSymbols,
  pl,
  qtyPreview,
  ruleTitle,
  runLine,
  scopeSymbols,
  storedRuleTitle,
  strategyMeta,
  tallyNoticed,
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

describe('fmtNum / fmtPct', () => {
  /* fr-CA separates % and thousands with U+00A0 — a non-breaking space is
     required French typography, not a test fudge. */
  const NB = '\u00a0'

  it('formats percents locale-aware — FR gets a no-break space, ASCII minus becomes typographic', () => {
    expect(fmtPct('en', 20.74, 1)).toBe('20.7%')
    expect(fmtPct('fr', 20.74, 1)).toBe(`20,7${NB}%`)
    expect(fmtPct('en', -8.7, 1)).toBe('−8.7%')
    expect(fmtPct('fr', -8.7, 1)).toBe(`−8,7${NB}%`)
  })

  it('fixed digits pad; { max } trims whole-number zeroes', () => {
    expect(fmtPct('en', 20, 1)).toBe('20.0%')
    expect(fmtPct('en', 20, { max: 1 })).toBe('20%')
    expect(fmtPct('en', 20.7, { max: 1 })).toBe('20.7%')
    expect(fmtPct('fr', 20, { max: 1 })).toBe(`20${NB}%`)
  })

  it('fmtNum localizes separators without a currency', () => {
    expect(fmtNum('en', 1500.5, { max: 4 })).toBe('1,500.5')
    expect(fmtNum('fr', 1500.5, { max: 4 })).toBe(`1${NB}500,5`)
    expect(fmtNum('fr', 1.3856, 4)).toBe('1,3856')
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
    /* Money thresholds denominate in the book currency, not always CAD. */
    expect(ruleTitle('en', cash, 'USD')).toContain('$500 USD')
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
    expect(qtyPreview('en', { ...order, qtyUnit: 'currency', qty: 1000 })).toBe(
      'Buys $1,000 CAD worth',
    )
    /* The currency follows the book — a USD-base account labels USD. */
    expect(qtyPreview('en', { ...order, qtyUnit: 'currency', qty: 1000 }, 'USD')).toBe(
      'Buys $1,000 USD worth',
    )
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
    expect(line).toContain('1 symbol scanned')
    /* Sweep rows label their output observations — AI book insights are
       not rule signals and must not masquerade as them. */
    expect(line).toContain('1 observation')
    expect(line).toContain('2 proposals')
    expect(line).toContain('0.4s')
    expect(line).not.toContain('(s)')
    expect(runLine('fr', { ...run, signalsEmitted: 0 })).toContain('0 observation')
    /* A strategy row keeps the signal noun. */
    expect(runLine('en', { ...run, strategyId: 's1' })).toContain('1 signal')
  })

  it('labels book-only runs instead of claiming "0 symbols scanned"', () => {
    const line = runLine('en', {
      ...run,
      strategyId: 's1',
      symbolsScanned: [],
      signalsEmitted: 0,
      proposalsCreated: 0,
    })
    expect(line).toContain('book metrics only')
    expect(line).not.toContain('0 symbols scanned')
    expect(line).toContain('0 signals')
  })

  it('humanizes minute-scale durations', () => {
    expect(formatDuration('en', 60_400)).toBe('1 min')
    expect(formatDuration('fr', 120_000)).toBe('2 min')
    expect(formatDuration('en', 400)).toBe('0.4s')
  })

  it('omits the scanned segment and duration on pre-0184 rows', () => {
    const line = runLine('en', {
      ...run,
      strategyId: 's1',
      symbolsScanned: [],
      durationMs: null,
    })
    expect(line).not.toContain('scanned')
    expect(line).not.toContain('· —')
    expect(line).toContain('1 signal')
  })
})

describe('fmtDay', () => {
  it('renders a YYYY-MM-DD as a localized medium date — never raw ISO', () => {
    expect(fmtDay('en', '2026-10-13')).toBe('Oct 13, 2026')
    expect(fmtDay('fr', '2026-10-13')).toMatch(/13.*oct.*2026/i)
  })

  it('passes a malformed value through unchanged rather than printing Invalid Date', () => {
    expect(fmtDay('en', 'not-a-date')).toBe('not-a-date')
    expect(fmtDay('en', '')).toBe('')
  })
})

describe('tallyNoticed', () => {
  const base = { watchlist: [], orders: [], signals: [] }

  it('reports its kind so callers can dedupe the same fact elsewhere', () => {
    const r = tallyNoticed(
      { ...base, orders: [{ status: 'queued' }, { status: 'draft' }] },
      'en',
    )
    expect(r?.kind).toBe('orders')
    expect(r?.text).toContain('2 orders')
  })

  it('singularizes in both languages — no "1 orders"', () => {
    expect(tallyNoticed({ ...base, orders: [{ status: 'queued' }] }, 'en')?.text).toContain('1 order')
    expect(tallyNoticed({ ...base, orders: [{ status: 'queued' }] }, 'fr')?.text).toContain('1 ordre')
    expect(tallyNoticed({ ...base, signals: [{ status: 'new' }] }, 'en')?.text).toContain('1 open signal')
    expect(tallyNoticed({ ...base, watchlist: [{}] }, 'en')?.text).toContain('1 symbol')
  })

  it('falls through to signals, then the watchlist, then nothing', () => {
    expect(
      tallyNoticed({ ...base, signals: [{ status: 'new' }] }, 'en')?.kind,
    ).toBe('signals')
    expect(tallyNoticed({ ...base, watchlist: [{}] }, 'en')?.kind).toBe('watch')
    expect(tallyNoticed(base, 'en')).toBeNull()
    expect(tallyNoticed(undefined, 'en')).toBeNull()
  })

  it('dismissed signals do not count', () => {
    expect(
      tallyNoticed({ ...base, signals: [{ status: 'dismissed' }] }, 'en'),
    ).toBeNull()
  })
})

describe('mentionedSymbols', () => {
  it('links a held ticker the text names uppercase', () => {
    expect(mentionedSymbols('SHOP fell 6.9% while AMD held flat.', ['SHOP', 'VFV'])).toEqual([
      'SHOP',
    ])
  })

  it('does not chip English prose — held tickers that are also words', () => {
    /* Case-insensitive matching turned "fell on Friday" into an ON
       Semiconductor mention; the fix is strict case. */
    const prose = 'The book drifted off pace and the slide can now be on hold.'
    expect(mentionedSymbols(prose, ['ON', 'CAN', 'NOW', 'BE', 'IT', 'ARE'])).toEqual([])
  })

  it('does not chip a lowercase ticker either — sentence-case words are prose', () => {
    expect(mentionedSymbols('Shop the dip while it lasts.', ['SHOP', 'IT'])).toEqual([])
  })

  it('still matches tickers inside dotted symbols like VFV.TO', () => {
    expect(mentionedSymbols('VFV.TO led the day.', ['VFV', 'TO'])).toEqual(['VFV'])
  })
})
