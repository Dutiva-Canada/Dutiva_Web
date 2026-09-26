import { describe, expect, it } from 'vitest'
import {
  coingeckoId,
  computeMa,
  googleNewsUrl,
  newsQueries,
  parseCoingeckoCloses,
  parseCoingeckoSimple,
  parseRssItems,
  parseStooqCloses,
  parseStooqQuotes,
  stooqSymbol,
  validateSyncAction,
} from './handlers'

describe('coingeckoId', () => {
  it('maps known symbols and falls back to the lowercased symbol', () => {
    expect(coingeckoId('BTC')).toBe('bitcoin')
    expect(coingeckoId(' eth ')).toBe('ethereum')
    expect(coingeckoId('PEPE')).toBe('pepe')
  })
})

describe('stooqSymbol', () => {
  it('keeps explicit exchanges and defaults bare symbols to .us', () => {
    expect(stooqSymbol('VFV.TO')).toEqual({ ticker: 'vfv.to', currency: 'CAD' })
    expect(stooqSymbol('TD.TO')).toEqual({ ticker: 'td.to', currency: 'CAD' })
    expect(stooqSymbol('JOB.V')).toEqual({ ticker: 'job.v', currency: 'CAD' })
    expect(stooqSymbol('AAPL.US')).toEqual({ ticker: 'aapl.us', currency: 'USD' })
    expect(stooqSymbol('VTI')).toEqual({ ticker: 'vti.us', currency: 'USD' })
  })
})

describe('parseStooqQuotes', () => {
  it('parses batched quote CSV and drops N/D rows', () => {
    const csv = [
      'Symbol,Date,Time,Open,High,Low,Close,Volume',
      'VFV.TO,2026-09-25,16:00:00,140.00,141.00,139.50,140.80,12345',
      'NOPE.US,N/D,N/D,N/D,N/D,N/D,N/D,N/D',
      'AAPL.US,2026-09-25,16:00:00,250.10,252.00,249.90,251.40,999999',
    ].join('\n')
    const quotes = parseStooqQuotes(csv)
    expect(quotes).toHaveLength(2)
    expect(quotes[0]).toMatchObject({ ticker: 'vfv.to', open: 140, close: 140.8 })
    expect(quotes[1].ticker).toBe('aapl.us')
  })
})

describe('parseStooqCloses / computeMa', () => {
  it('extracts closes oldest-first and averages the tail', () => {
    const rows = ['Date,Open,High,Low,Close,Volume']
    for (let i = 1; i <= 60; i++) rows.push(`2026-08-${String(i % 28 + 1).padStart(2, '0')},0,0,0,${100 + i},0`)
    const closes = parseStooqCloses(rows.join('\n'))
    expect(closes).toHaveLength(60)
    /* last 50 closes: 111..160 → mean 135.5 */
    expect(computeMa(closes)).toBeCloseTo(135.5)
  })

  it('returns null when history is too thin', () => {
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
