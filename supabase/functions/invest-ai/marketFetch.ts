import {
  coingeckoId,
  coingeckoMarketsUrl,
  googleNewsUrl,
  parseCoingeckoCloses,
  parseCoingeckoMarkets,
  parseCoingeckoSimple,
  parseRssItems,
  parseYahooChart,
  parseYahooFundamentals,
  scopeAssetClass,
  technicalPack,
  YAHOO_HEADERS,
  yahooChartUrl,
  yahooEquitySymbol,
  yahooFundamentalsUrl,
  type Fundamentals,
} from '../invest-market-sync/handlers.ts'
import type { MarketContextEntry } from './handlers.ts'

/* On-demand market pull for tickers the book doesn't track — "What about
   AMD?" must not bounce off the snapshot table. Same feeds and parsers as
   invest-market-sync, fetched live into the chat context and never
   persisted: once the symbol lands on a watchlist or a strategy the
   scheduled sync owns its row. Bounded hard — the chat turn still has a
   model call to make. */

const ONDEMAND_SYMBOL_CAP = 2
const ONDEMAND_HEADLINES = 3

async function fetchText(
  url: string,
  headers: Record<string, string> = {},
): Promise<string | null> {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

const cgHeaders = (): Record<string, string> => {
  const key = Deno.env.get('COINGECKO_API_KEY') ?? ''
  return key ? { 'x-cg-demo-api-key': key } : {}
}

async function headlinesFor(symbol: string, assetClass: string): Promise<MarketContextEntry['headlines']> {
  const hint = assetClass === 'crypto' ? 'crypto' : 'stock'
  const xml = await fetchText(googleNewsUrl(`${symbol} ${hint}`))
  if (!xml) return []
  return parseRssItems(xml, { symbol, asset_class: assetClass }, ONDEMAND_HEADLINES)
    .map((n) => ({ title: n.title, source: n.source, publishedAt: n.published_at, url: n.url }))
}

async function equityEntry(symbol: string): Promise<MarketContextEntry> {
  const { symbol: ys, currency } = yahooEquitySymbol(symbol)
  const [chartRaw, fundRaw, headlines] = await Promise.all([
    fetchText(yahooChartUrl(ys), YAHOO_HEADERS),
    fetchText(yahooFundamentalsUrl(ys), YAHOO_HEADERS),
    headlinesFor(symbol, 'equity'),
  ])
  const chart = chartRaw ? parseYahooChart(JSON.parse(chartRaw)) : null
  const tech = chart && chart.closes.length > 0 ? technicalPack(chart.closes) : null
  const parsed = fundRaw ? parseYahooFundamentals(JSON.parse(fundRaw)) : {}
  const fundamentals: Fundamentals | null =
    Object.keys(parsed).length > 0
      ? { ...parsed, currency: chart?.currency ?? currency }
      : null
  return {
    symbol,
    assetClass: 'equity',
    price: chart?.price ?? null,
    currency: chart?.currency ?? currency,
    dayChangePct: chart?.dayChangePct ?? null,
    ma50: tech?.ma50 ?? null,
    ma200: tech?.ma200 ?? null,
    rsi14: tech?.rsi14 ?? null,
    ret1m: tech?.ret1m ?? null,
    ret3m: tech?.ret3m ?? null,
    ret12m: tech?.ret12m ?? null,
    vol20d: tech?.vol20d ?? null,
    high52w: tech?.high52w ?? null,
    low52w: tech?.low52w ?? null,
    fundamentals,
    asOf: new Date().toISOString(),
    headlines,
  }
}

async function cryptoEntry(
  symbol: string,
  prices: Map<string, { price: number; currency: string; day_change_pct: number | null }>,
  fundamentals: Map<string, Fundamentals>,
): Promise<MarketContextEntry> {
  const id = coingeckoId(symbol)
  const quote = prices.get(id)
  const currency = quote?.currency ?? 'USD'
  const [histRaw, headlines] = await Promise.all([
    fetchText(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${currency.toLowerCase()}&days=365&interval=daily`,
      cgHeaders(),
    ),
    headlinesFor(symbol, 'crypto'),
  ])
  const tech = histRaw ? technicalPack(parseCoingeckoCloses(JSON.parse(histRaw))) : null
  return {
    symbol,
    assetClass: 'crypto',
    price: quote?.price ?? null,
    currency,
    dayChangePct: quote?.day_change_pct ?? null,
    ma50: tech?.ma50 ?? null,
    ma200: tech?.ma200 ?? null,
    rsi14: tech?.rsi14 ?? null,
    ret1m: tech?.ret1m ?? null,
    ret3m: tech?.ret3m ?? null,
    ret12m: tech?.ret12m ?? null,
    vol20d: tech?.vol20d ?? null,
    high52w: tech?.high52w ?? null,
    low52w: tech?.low52w ?? null,
    fundamentals: fundamentals.get(id) ?? null,
    asOf: new Date().toISOString(),
    headlines,
  }
}

/** Live rows for symbols with no stored snapshot — same shape the context
    builder produces, so the prompt never knows the difference. */
export async function fetchOnDemandMarket(symbols: string[]): Promise<MarketContextEntry[]> {
  const capped = symbols.slice(0, ONDEMAND_SYMBOL_CAP)
  if (capped.length === 0) return []
  const crypto = capped.filter((s) => scopeAssetClass(s) === 'crypto')
  const equities = capped.filter((s) => scopeAssetClass(s) !== 'crypto')

  const out: MarketContextEntry[] = []

  if (crypto.length > 0) {
    const ids = [...new Set(crypto.map(coingeckoId))]
    const headers = cgHeaders()
    const [priceRaw, marketsRaw] = await Promise.all([
      fetchText(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}` +
          '&vs_currencies=cad,usd&include_24hr_change=true',
        headers,
      ),
      fetchText(coingeckoMarketsUrl(ids), headers),
    ])
    const prices = priceRaw ? parseCoingeckoSimple(JSON.parse(priceRaw)) : new Map()
    const markets = marketsRaw ? parseCoingeckoMarkets(JSON.parse(marketsRaw)) : new Map()
    for (const s of crypto) out.push(await cryptoEntry(s, prices, markets))
  }

  if (equities.length > 0) {
    for (const s of equities) out.push(await equityEntry(s))
  }

  return out
}
