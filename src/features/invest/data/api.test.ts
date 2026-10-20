import { describe, expect, it } from 'vitest'
import { newsFilterSymbols } from './api'

/* Symbols reach the news query as raw text inside a PostgREST .or()
   string — a held or watched symbol carrying ", ( or ) would rewrite the
   filter and fail the whole state load. The helper drops anything outside
   the market-symbol charset instead of trusting the column. */
describe('newsFilterSymbols', () => {
  it('keeps real market symbols and drops filter-breaking values', () => {
    const symbols = newsFilterSymbols(
      [{ symbol: 'SHOP.TO' }, { symbol: 'bad",or("x' }, { symbol: 'x,y' }],
      [{ symbol: 'XEQT' }, { symbol: '(break)' }],
      [{ symbols: ['BRK-B', 'CASH', 'semi"colon;'] }],
    )
    expect(symbols).toEqual(['SHOP.TO', 'XEQT', 'BRK-B', 'CASH'])
    for (const s of symbols) expect(s).toMatch(/^[A-Z0-9.^=_-]+$/)
  })

  it('uppercases, dedupes across sources, and tolerates non-arrays', () => {
    expect(
      newsFilterSymbols(
        [{ symbol: 'shop.to' }],
        [{ symbol: 'SHOP.TO' }],
        [{ symbols: 'not-an-array' }, {}],
      ),
    ).toEqual(['SHOP.TO'])
  })
})
