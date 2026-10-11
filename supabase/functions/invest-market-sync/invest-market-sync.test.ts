import { describe, expect, it } from 'vitest'
import {
  coingeckoId,
  computeMa,
  computeRsi,
  googleNewsUrl,
  newsQueries,
  parseCoingeckoCloses,
  parseCoingeckoMarkets,
  parseCoingeckoSimple,
  parseRssItems,
  parseYahooChart,
  parseYahooFundamentals,
  scopeAssetClass,
  technicalPack,
  validateSyncAction,
  yahooEquitySymbol,
} from './handlers'

describe('coingeckoId', () => {
  it('maps known symbols and falls back to the lowercased symbol', () => {
    expect(coingeckoId('BTC')).toBe('bitcoin')
    expect(coingeckoId(' eth ')).toBe('ethereum')
    expect(coingeckoId('PEPE')).toBe('pepe')
  })
})

describe('scopeAssetClass', () => {
  it('routes CoinGecko-known tickers to crypto, everything else to equity', () => {
    expect(scopeAssetClass('BTC')).toBe('crypto')
    expect(scopeAssetClass(' eth ')).toBe('crypto')
    expect(scopeAssetClass('SHOP')).toBe('equity')
    /* Explicit exchanges stay equity even on a name collision. */
    expect(scopeAssetClass('LINK.TO')).toBe('equity')
  })
})

describe('yahooEquitySymbol', () => {
  it('keeps Canadian exchange suffixes and treats bare symbols as US', () => {
    expect(yahooEquitySymbol('VFV.TO')).toEqual({ symbol: 'VFV.TO', currency: 'CAD' })
    expect(yahooEquitySymbol('TD.TO')).toEqual({ symbol: 'TD.TO', currency: 'CAD' })
    expect(yahooEquitySymbol('JOB.V')).toEqual({ symbol: 'JOB.V', currency: 'CAD' })
    expect(yahooEquitySymbol('AAPL.US')).toEqual({ symbol: 'AAPL', currency: 'USD' })
    expect(yahooEquitySymbol('VTI')).toEqual({ symbol: 'VTI', currency: 'USD' })
  })
})

describe('parseYahooChart', () => {
  const chartJson = {
    chart: {
      result: [{
        meta: {
          regularMarketPrice: 608.1,
          regularMarketChangePercent: -2.027,
          currency: 'USD',
          longName: 'Advanced Micro Devices, Inc.',
        },
        indicators: { quote: [{ close: [600.5, 612.3, null, 608.1] }] },
      }],
      error: null,
    },
  }
  it('reads the quote meta and a clean close series', () => {
    const r = parseYahooChart(chartJson)
    expect(r.price).toBe(608.1)
    expect(r.currency).toBe('USD')
    expect(r.dayChangePct).toBe(-2.027)
    expect(r.name).toContain('Advanced Micro Devices')
    expect(r.closes).toEqual([600.5, 612.3, 608.1])
  })
  it('falls back to the last close and tolerates junk', () => {
    const r = parseYahooChart({
      chart: { result: [{ meta: {}, indicators: { quote: [{ close: [10, 11] }] } }] },
    })
    expect(r.price).toBe(11)
    expect(parseYahooChart(null).closes).toEqual([])
    expect(parseYahooChart({ chart: { result: [] } }).price).toBeNull()
  })
})

describe('parseYahooFundamentals', () => {
  it('takes the latest reportedValue per type, yield as percent', () => {
    const json = {
      timeseries: {
        result: [
          {
            meta: { symbol: ['AMD'], type: ['trailingPeRatio'] },
            trailingPeRatio: [
              { asOfDate: '2025-10-02', reportedValue: { raw: 101.63 } },
              { asOfDate: '2026-09-23', reportedValue: { raw: 156.79 } },
            ],
          },
          {
            meta: { type: ['trailingAnnualDividendYield'] },
            trailingAnnualDividendYield: [
              { asOfDate: '2026-09-01', reportedValue: { raw: 0.0165 } },
            ],
          },
          {
            meta: { type: ['marketCap'] },
            marketCap: [{ asOfDate: '2026-09-23', reportedValue: { raw: 9.9e11 } }],
          },
        ],
      },
    }
    const f = parseYahooFundamentals(json)
    expect(f['pe_trailing']).toBe(156.79)
    expect(f['dividend_yield']).toBeCloseTo(1.65, 3)
    expect(f['market_cap']).toBe(9.9e11)
    expect(f['pe_forward']).toBeUndefined()
    expect(parseYahooFundamentals(null)).toEqual({})
  })
})

describe('computeMa', () => {
  it('averages the tail and returns null when history is too thin', () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + i + 1)
    /* last 50 closes: 111..160 → mean 135.5 */
    expect(computeMa(closes)).toBeCloseTo(135.5)
    expect(computeMa([100, 101, 102])).toBeNull()
  })
})

describe('parseCoingeckoSimple', () => {
  it('prefers CAD, falls back to USD, reads 24h change', () => {
    const map = parseCoingeckoSimple({
      bitcoin: { cad: 150000, usd: 110000, cad_24h_change: -2.5 },
      pepe: { usd: 0.00001 },
      junk: 'not-an-object',
    })
    expect(map.get('bitcoin')).toEqual({ price: 150000, currency: 'CAD', day_change_pct: -2.5 })
    expect(map.get('pepe')).toEqual({ price: 0.00001, currency: 'USD', day_change_pct: null })
    expect(map.has('junk')).toBe(false)
  })

  it('handles malformed payloads', () => {
    expect(parseCoingeckoSimple(null).size).toBe(0)
    expect(parseCoingeckoSimple({ bitcoin: {} }).size).toBe(0)
  })
})

describe('parseCoingeckoCloses', () => {
  it('pulls prices from the [ts, price] pairs', () => {
    const closes = parseCoingeckoCloses({ prices: [[1, 100], [2, 101], [3, 'x'], [4]] })
    expect(closes).toEqual([100, 101])
    expect(parseCoingeckoCloses({})).toEqual([])
  })
})

describe('validateSyncAction', () => {
  it('accepts sync and sync-all only', () => {
    expect(validateSyncAction('sync').ok).toBe(true)
    expect(validateSyncAction('sync-all').ok).toBe(true)
    expect(validateSyncAction('run').ok).toBe(false)
  })
})

const RSS = `<?xml version="1.0"?><rss><channel>
  <item>
    <title>Shopify posts record quarter - Reuters</title>
    <link>https://news.google.com/rss/articles/abc123</link>
    <source url="https://reuters.com">Reuters</source>
    <pubDate>Fri, 26 Sep 2026 12:00:00 GMT</pubDate>
    <description><![CDATA[<a href="#">Shopify posts record quarter</a> details here]]></description>
  </item>
  <item>
    <title><![CDATA[Second headline &amp; more]]></title>
    <link>https://news.google.com/rss/articles/def456</link>
    <pubDate>not a date</pubDate>
  </item>
  <item><title>no link — dropped</title></item>
</channel></rss>`

describe('parseRssItems', () => {
  it('parses items, strips the " - Source" suffix and CDATA', () => {
    const items = parseRssItems(RSS, { symbol: 'SHOP', asset_class: 'equity' })
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({
      symbol: 'SHOP',
      asset_class: 'equity',
      title: 'Shopify posts record quarter',
      source: 'Reuters',
      published_at: '2026-09-26T12:00:00.000Z',
    })
    expect(items[0].summary).not.toContain('<a')
    expect(items[1].title).toBe('Second headline & more')
    expect(items[1].published_at).toBeNull()
  })

  it('caps items and tolerates empty xml', () => {
    expect(parseRssItems(RSS, { symbol: 'X', asset_class: 'equity' }, 1)).toHaveLength(1)
    expect(parseRssItems('<rss></rss>', { symbol: 'X', asset_class: 'equity' })).toHaveLength(0)
  })
})

describe('newsQueries', () => {
  it('leads with the general feed and dedupes symbols', () => {
    const q = newsQueries([
      { asset_class: 'equity', symbol: 'SHOP.TO', name: 'Shopify' },
      { asset_class: 'crypto', symbol: 'BTC', name: 'Bitcoin' },
      { asset_class: 'equity', symbol: 'SHOP.TO' },
    ])
    expect(q[0]).toEqual({ query: 'stock market Canada', symbol: '', asset_class: '' })
    expect(q).toHaveLength(3)
    expect(q[1]).toEqual({ query: 'Shopify stock', symbol: 'SHOP.TO', asset_class: 'equity' })
    expect(q[2].query).toBe('Bitcoin crypto')
  })

  it('caps symbol feeds and falls back to the stripped symbol', () => {
    const targets = Array.from({ length: 15 }, (_, i) => ({
      asset_class: 'equity',
      symbol: `S${i}`,
      name: '',
    }))
    const q = newsQueries(targets)
    expect(q).toHaveLength(9) // 1 general + 8 symbols
    expect(newsQueries([{ asset_class: 'equity', symbol: 'VFV.TO' }])[1].query).toBe('VFV stock')
  })
})

describe('googleNewsUrl', () => {
  it('builds a CA-edition RSS url', () => {
    const url = googleNewsUrl('Shopify stock')
    expect(url).toContain('news.google.com/rss/search?q=Shopify%20stock')
    expect(url).toContain('hl=en-CA')
  })
})

describe('technicalPack — the analysis columns', () => {
  const ramp = (n: number): number[] => Array.from({ length: n }, (_, i) => 100 + i)

  it('computes the full pack on a long rising series', () => {
    const closes = ramp(300) // 100..399
    const t = technicalPack(closes)
    expect(t.ma50).toBeCloseTo((350 + 399) / 2, 1)
    expect(t.ma200).toBeCloseTo((200 + 399) / 2, 1)
    expect(t.rsi14).toBe(100) // every day up → no losses
    expect(t.ret1m).toBeGreaterThan(0)
    expect(t.ret12m).toBeGreaterThan(t.ret3m as number)
    expect(t.vol20d).toBeGreaterThanOrEqual(0)
    expect(t.high52w).toBe(399)
    expect(t.low52w).toBe(100 + 300 - 252)
  })

  it('returns nulls on thin history instead of noise', () => {
    const t = technicalPack([10, 11, 10, 11])
    expect(t.ma50).toBeNull()
    expect(t.ma200).toBeNull()
    expect(t.rsi14).toBeNull()
    expect(t.ret12m).toBeNull()
    expect(t.vol20d).toBeNull()
    /* The 52-week range still reports what little exists — a recent
       listing's range is its real range. */
    expect(t.high52w).toBe(11)
    expect(t.low52w).toBe(10)
  })
})

describe('computeRsi', () => {
  it('is 0 on an all-down series and ~50 on a balanced zigzag', () => {
    const down = Array.from({ length: 20 }, (_, i) => 100 - i)
    expect(computeRsi(down)).toBe(0)
    const zig = [100, 101, 100, 101, 100, 101, 100, 101, 100, 101, 100, 101, 100, 101, 100, 101]
    const rsi = computeRsi(zig)
    expect(rsi).not.toBeNull()
    expect(rsi!).toBeGreaterThan(40)
    expect(rsi!).toBeLessThan(60)
    expect(computeRsi([1, 2, 3])).toBeNull()
  })
})

describe('parseCoingeckoMarkets', () => {
  it('reads cap/volume/supply/ATH per coin id in USD', () => {
    const m = parseCoingeckoMarkets([
      { id: 'bitcoin', market_cap: 2e12, total_volume: 5e10, circulating_supply: 19.7e6, ath: 126000, ath_change_percentage: -18.2 },
    ])
    const btc = m.get('bitcoin')
    expect(btc?.market_cap).toBe(2e12)
    expect(btc?.circulating_supply).toBe(19.7e6)
    expect(btc?.ath_change_pct).toBe(-18.2)
    expect(btc?.currency).toBe('USD')
  })
})
