import { describe, expect, it } from 'vitest'
import {
  coingeckoId,
  computeMa,
  computeRsi,
  googleNewsUrl,
  newsQueries,
  newsThemeQueries,
  parseCoingeckoCloses,
  parseCoingeckoMarkets,
  parseCoingeckoNames,
  parseCoingeckoSimple,
  parseRssItems,
  parseThemeLinkVerdicts,
  parseYahooChart,
  parseYahooFundamentals,
  scopeAssetClass,
  technicalPack,
  validateSyncAction,
  yahooChartUrl,
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
    const items = parseRssItems(RSS, { symbol: 'SHOP', asset_class: 'equity', name: 'Shopify' })
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({
      symbol: 'SHOP',
      asset_class: 'equity',
      title: 'Shopify posts record quarter',
      source: 'Reuters',
      published_at: '2026-09-26T12:00:00.000Z',
    })
    expect(items[0].summary).not.toContain('<a')
    /* 'Second headline & more' never names Shopify — the row stays but
       the symbol tag doesn't claim a relation that isn't there. */
    expect(items[1]).toMatchObject({ title: 'Second headline & more', symbol: '' })
    expect(items[1].published_at).toBeNull()
  })

  it('drops prediction-market listings — a wager board is not a headline', () => {
    const xml = `<rss><channel>
      <item><title>SOL price on Oct 13, 2026 at 4am EDT Crypto Prediction Market - Robinhood</title>
        <link>https://robinhood.example/sol-pm</link><source>Robinhood</source></item>
      <item><title>Solana slips on thin liquidity</title>
        <link>https://news.example/sol-slips</link><source>CoinDesk</source></item>
    </channel></rss>`
    const items = parseRssItems(xml, { symbol: 'SOL', asset_class: 'crypto', name: 'Solana' })
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ title: 'Solana slips on thin liquidity', symbol: 'SOL' })
  })

  it('caps items and tolerates empty xml', () => {
    expect(parseRssItems(RSS, { symbol: 'X', asset_class: 'equity' }, 1)).toHaveLength(1)
    expect(parseRssItems('<rss></rss>', { symbol: 'X', asset_class: 'equity' })).toHaveLength(0)
  })

  it('tags theme-query rows to declared symbols — no text-match needed', () => {
    const items = parseRssItems(RSS, {
      symbol: '',
      asset_class: '',
      linked: [
        { symbol: 'AMAT', asset_class: 'equity' },
        { symbol: 'ARM', asset_class: 'equity' },
      ],
      viaTheme: 'US-China trade restrictions',
    })
    /* 2 kept items × 2 declared symbols — tagged by linkage even though
       neither headline mentions them (that's the point of a theme),
       and every row carries the theme as its provenance. */
    expect(items).toHaveLength(4)
    expect(new Set(items.map((i) => i.symbol))).toEqual(new Set(['AMAT', 'ARM']))
    expect(items.every((i) => i.asset_class === 'equity')).toBe(true)
    expect(items.every((i) => i.via_theme === 'US-China trade restrictions')).toBe(true)
  })

  it('leaves via_theme unset on symbol-feed rows', () => {
    const items = parseRssItems(RSS, { symbol: 'SHOP', asset_class: 'equity' })
    expect(items.every((i) => i.via_theme === undefined)).toBe(true)
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
    expect(q[1]).toEqual({ query: 'Shopify stock', symbol: 'SHOP.TO', asset_class: 'equity', name: 'Shopify' })
    expect(q[2]).toMatchObject({ query: 'Bitcoin crypto', name: 'Bitcoin' })
  })

  it('caps symbol feeds and falls back to the stripped symbol', () => {
    const targets = Array.from({ length: 15 }, (_, i) => ({
      asset_class: 'equity',
      symbol: `S${i}`,
      name: '',
    }))
    const q = newsQueries(targets)
    expect(q).toHaveLength(13) // 1 general + 12 symbols
    expect(newsQueries([{ asset_class: 'equity', symbol: 'VFV.TO' }])[1].query).toBe('VFV stock')
  })

  it('feeds held positions before watch-only symbols under the cap', () => {
    const targets = [
      /* 12 watch/strategy names first — order alone would starve HELD. */
      ...Array.from({ length: 12 }, (_, i) => ({
        asset_class: 'equity',
        symbol: `W${i}`,
        name: '',
      })),
      { asset_class: 'equity', symbol: 'HELD', name: '', held: true },
    ]
    const q = newsQueries(targets)
    expect(q).toHaveLength(13)
    /* The held row takes a feed slot; the twelfth watch name drops out. */
    expect(q.some((x) => x.symbol === 'HELD')).toBe(true)
    expect(q.some((x) => x.symbol === 'W11')).toBe(false)
    expect(q[1]?.symbol).toBe('HELD')
  })
})

describe('newsThemeQueries', () => {
  it('merges symbol links when users watch the same theme', () => {
    const q = newsThemeQueries([
      { title: 'US-China trade restrictions', symbols: ['amat', 'ARM'] },
      { title: 'US-China trade restrictions ', symbols: ['QUBT'] },
      { title: 'Whole-book watch', symbols: [] },
    ])
    expect(q).toEqual([
      { query: 'US-China trade restrictions', symbols: ['AMAT', 'ARM', 'QUBT'] },
      /* Whole-book items still get a feed — rows land unscoped. */
      { query: 'Whole-book watch', symbols: [] },
    ])
  })

  it('caps theme feeds', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      title: `Theme ${i}`,
      symbols: ['S'],
    }))
    expect(newsThemeQueries(items)).toHaveLength(8)
  })

  it('a symbol-less item yields unscoped rows carrying its theme', () => {
    const [tq] = newsThemeQueries([{ title: 'Fed rate path', symbols: [] }])
    expect(tq).toBeDefined()
    const rows = parseRssItems(RSS, {
      symbol: '',
      asset_class: '',
      linked: [],
      viaTheme: tq!.query,
    })
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(r.symbol).toBe('')
      expect(r.via_theme).toBe('Fed rate path')
    }
  })
})

describe('parseThemeLinkVerdicts', () => {
  const cands = [
    { theme: 'US-China trade restrictions', title: 'A', summary: '', symbols: ['AMAT', 'ARM'] },
    { theme: 'Uranium demand', title: 'B', summary: '', symbols: ['CCJ'] },
  ]

  it('keeps only the symbols the verdict names', () => {
    const v = parseThemeLinkVerdicts(
      '{"links":[{"i":1,"keep":["AMAT"]},{"i":2,"keep":[]}]}',
      cands,
    )
    expect(v?.get(0)).toEqual(new Set(['AMAT']))
    expect(v?.get(1)).toEqual(new Set())
  })

  it('drops keeps that were never candidates — the model cannot invent links', () => {
    const v = parseThemeLinkVerdicts(
      '{"links":[{"i":1,"keep":["AMAT","TSLA"]},{"i":2,"keep":["ccj"]}]}',
      cands,
    )
    expect(v?.get(0)).toEqual(new Set(['AMAT']))
    expect(v?.get(1)).toEqual(new Set(['CCJ']))
  })

  it('rejects a partial answer — a missing index is indistinguishable from truncation', () => {
    expect(parseThemeLinkVerdicts('{"links":[{"i":1,"keep":["AMAT"]}]}', cands)).toBeNull()
    expect(parseThemeLinkVerdicts('{"links":[{"i":1,"keep":[]},{"i":2,"keep":[]},{"i":3,"keep":[]}]}', cands)).toBeNull()
  })

  it('rejects malformed output outright', () => {
    expect(parseThemeLinkVerdicts('no json here', cands)).toBeNull()
    expect(parseThemeLinkVerdicts('{"links":"AMAT"}', cands)).toBeNull()
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

describe('yahooChartUrl', () => {
  it('defaults to the full-history range; light runs pass 5d', () => {
    expect(yahooChartUrl('SHOP.TO')).toContain('range=2y')
    expect(yahooChartUrl('SHOP.TO', '5d')).toContain('range=5d')
  })
})

describe('parseCoingeckoNames', () => {
  it('maps coin id → display name', () => {
    const m = parseCoingeckoNames([
      { id: 'bitcoin', name: 'Bitcoin' },
      { id: 'solana', name: 'Solana' },
      { id: 'junk' },
    ])
    expect(m.get('bitcoin')).toBe('Bitcoin')
    expect(m.get('solana')).toBe('Solana')
    expect(m.has('junk')).toBe(false)
    expect(parseCoingeckoNames(null).size).toBe(0)
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
