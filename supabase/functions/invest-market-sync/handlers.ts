/**
 * Pure helpers for the invest-market-sync edge function — symbol mapping,
 * CSV/JSON parsing, and the moving-average math. Deno-free so Vitest can
 * run them; index.ts owns the network.
 *
 * Free sources only:
 *   crypto          → CoinGecko public API (no key; optional demo key via env)
 *   equities/etfs   → Yahoo Finance public endpoints (keyless): v8/chart
 *                     for quote + daily history, fundamentals-timeseries
 *                     for the valuation block. Stooq was the equity feed
 *                     until it went behind a JS anti-bot wall — removed
 *                     outright rather than kept as a fallback that can't
 *                     execute.
 *
 * Symbol conventions the portal documents:
 *   crypto   BTC, ETH, …          → CoinGecko id via COINGECKO_IDS (or the
 *                                  lowercased symbol, which often resolves)
 *   equity   SHOP.TO / TD.TO / …  → Yahoo keeps .TO/.V (CAD)
 *   etf      VFV.TO / VTI / …     → bare symbols are US listings (USD)
 */

export const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  LTC: 'litecoin',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  ATOM: 'cosmos',
  BNB: 'binancecoin',
  USDC: 'usd-coin',
  USDT: 'tether',
  TRX: 'tron',
  XLM: 'stellar',
  NEAR: 'near',
  HBAR: 'hedera-hashgraph',
}

export function coingeckoId(symbol: string): string {
  const sym = symbol.trim().toUpperCase()
  return COINGECKO_IDS[sym] ?? sym.toLowerCase()
}

/** Asset class for a bare scope symbol: crypto iff the ticker has an
    explicit CoinGecko id, else equity. Deliberately conservative — an
    unknown ticker is a Yahoo attempt, not a CoinGecko guess. */
export function scopeAssetClass(symbol: string): 'crypto' | 'equity' {
  return symbol.trim().toUpperCase() in COINGECKO_IDS ? 'crypto' : 'equity'
}

/**
 * Portal symbol → Yahoo ticker + assumed listing currency. Yahoo uses the
 * same .TO/.V suffixes for Canadian listings; bare symbols are US.
 * `parseYahooChart` trusts the response's own currency when it disagrees.
 */
export function yahooEquitySymbol(symbol: string): { symbol: string; currency: string } {
  const sym = symbol.trim().toUpperCase()
  if (sym.endsWith('.TO') || sym.endsWith('.V')) return { symbol: sym, currency: 'CAD' }
  if (sym.endsWith('.US')) return { symbol: sym.slice(0, -3), currency: 'USD' }
  return { symbol: sym, currency: 'USD' }
}

/** A plain browser UA — Yahoo's keyless endpoints answer datacenter
    clients far more reliably with one (the same lesson the Stooq wall
    already taught). */
export const YAHOO_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
}

export function yahooChartUrl(yahooSymbol: string): string {
  return (
    `https://query2.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(yahooSymbol)}?range=2y&interval=1d&includePrePost=false`
  )
}

export interface YahooChartResult {
  price: number | null
  currency: string | null
  dayChangePct: number | null
  name: string | null
  closes: number[]
}

/** v8/chart JSON → quote fields + the daily-close series (nulls dropped —
    Yahoo embeds them on halted days). One call feeds the whole technical
    pack AND the price fields. */
export function parseYahooChart(json: unknown): YahooChartResult {
  const empty: YahooChartResult = { price: null, currency: null, dayChangePct: null, name: null, closes: [] }
  const result = (json as Record<string, unknown> | null)?.['chart']
  const rows = (result as Record<string, unknown> | null)?.['result']
  const first = Array.isArray(rows) ? (rows[0] as Record<string, unknown> | undefined) : undefined
  if (!first) return empty
  const meta = (first['meta'] ?? {}) as Record<string, unknown>
  const num = (v: unknown): number | null => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const indicators = (first['indicators'] ?? {}) as Record<string, unknown>
  const quoteRows = Array.isArray(indicators['quote']) ? indicators['quote'] : []
  const quote = (quoteRows[0] ?? {}) as Record<string, unknown>
  const closes = Array.isArray(quote['close'])
    ? (quote['close'] as unknown[]).map(Number).filter((n) => Number.isFinite(n) && n > 0)
    : []
  return {
    price: num(meta['regularMarketPrice']) ?? closes[closes.length - 1] ?? null,
    currency: typeof meta['currency'] === 'string' ? (meta['currency'] as string) : null,
    dayChangePct: num(meta['regularMarketChangePercent']),
    name: typeof meta['longName'] === 'string' ? (meta['longName'] as string) : null,
    closes,
  }
}

export function yahooFundamentalsUrl(yahooSymbol: string): string {
  return (
    `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/` +
    `${encodeURIComponent(yahooSymbol)}?symbol=${encodeURIComponent(yahooSymbol)}` +
    `&type=trailingPeRatio,forwardPeRatio,marketCap,trailingEps,priceToBook,trailingAnnualDividendYield` +
    `&merge=false&period1=1700000000&period2=2000000000`
  )
}

const YAHOO_FUND_TYPES: [string, string][] = [
  ['trailingPeRatio', 'pe_trailing'],
  ['forwardPeRatio', 'pe_forward'],
  ['marketCap', 'market_cap'],
  ['trailingEps', 'eps_ttm'],
  ['priceToBook', 'price_to_book'],
  ['trailingAnnualDividendYield', 'dividend_yield'],
]

/** fundamentals-timeseries JSON → latest reportedValue.raw per type.
    dividend_yield comes back as a fraction (0.0165 = 1.65%) — stored as a
    percent. A missing type just stays absent — nulls are a missing fact,
    not a failure. */
export function parseYahooFundamentals(json: unknown): Record<string, number | string | null> {
  const out: Record<string, number | string | null> = {}
  const result = (json as Record<string, unknown> | null)?.['timeseries']
  const rows = (result as Record<string, unknown> | null)?.['result']
  if (!Array.isArray(rows)) return out
  for (const row of rows) {
    const r = row as Record<string, unknown>
    const meta = (r['meta'] ?? {}) as Record<string, unknown>
    const types = Array.isArray(meta['type']) ? (meta['type'] as unknown[]) : []
    const type = typeof types[0] === 'string' ? (types[0] as string) : null
    const label = YAHOO_FUND_TYPES.find(([t]) => t === type)?.[1]
    if (!type || !label) continue
    const series = r[type]
    if (!Array.isArray(series)) continue
    /* latest asOfDate with a numeric raw */
    let latest: number | null = null
    for (const point of series) {
      const raw = (point as Record<string, unknown>)?.['reportedValue']
      const value = Number((raw as Record<string, unknown> | null)?.['raw'])
      if (Number.isFinite(value)) latest = value
    }
    out[label] = label === 'dividend_yield' && latest !== null ? latest * 100 : latest
  }
  return out
}

/** Mean of the last `window` closes; null under 20 points — too thin to
    call a 50-day average. */
export function computeMa(closes: number[], window = 50): number | null {
  const tail = closes.slice(-window)
  if (tail.length < 20) return null
  return tail.reduce((a, b) => a + b, 0) / tail.length
}

/** CoinGecko /simple/price JSON → per-id {price, dayChangePct}, CAD preferred. */
export function parseCoingeckoSimple(
  json: unknown,
): Map<string, { price: number; currency: string; day_change_pct: number | null }> {
  const out = new Map<string, { price: number; currency: string; day_change_pct: number | null }>()
  if (json === null || typeof json !== 'object') return out
  for (const [id, v] of Object.entries(json as Record<string, unknown>)) {
    if (v === null || typeof v !== 'object') continue
    const o = v as Record<string, unknown>
    const cad = Number(o['cad'])
    const usd = Number(o['usd'])
    if (Number.isFinite(cad) && cad > 0) {
      const chg = Number(o['cad_24h_change'])
      out.set(id, {
        price: cad,
        currency: 'CAD',
        day_change_pct: Number.isFinite(chg) ? chg : null,
      })
    } else if (Number.isFinite(usd) && usd > 0) {
      const chg = Number(o['usd_24h_change'])
      out.set(id, {
        price: usd,
        currency: 'USD',
        day_change_pct: Number.isFinite(chg) ? chg : null,
      })
    }
  }
  return out
}

/** CoinGecko /market_chart JSON → closes array for computeMa. */
export function parseCoingeckoCloses(json: unknown): number[] {
  const prices = (json as Record<string, unknown> | null)?.['prices']
  if (!Array.isArray(prices)) return []
  return prices
    .map((p) => (Array.isArray(p) ? Number(p[1]) : NaN))
    .filter((n) => Number.isFinite(n) && n > 0)
}

/* --- The technical pack ------------------------------------------------
   Everything below is arithmetic over the same daily-close series MA50
   already comes from — the sync just kept throwing the rest away. Each
   helper returns null when the series is too thin to mean anything, and
   the snapshot stores NULL rather than a fake figure. */

/** Wilder's RSI over the trailing `period` closes. Needs period+1 points;
    100 when there is no down day in the window (avgLoss 0 → RSI 100). */
export function computeRsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null
  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1]
    if (d > 0) gain += d
    else loss -= d
  }
  let avgGain = gain / period
  let avgLoss = loss / period
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period
  }
  if (avgLoss === 0) return 100
  return 100 - 100 / (1 + avgGain / avgLoss)
}

const RETURN_WINDOWS = { m1: 21, m3: 63, y1: 252 } as const

function trailingReturn(closes: number[], days: number): number | null {
  if (closes.length <= days) return null
  const past = closes[closes.length - 1 - days]
  const now = closes[closes.length - 1]
  if (!(past > 0)) return null
  return ((now - past) / past) * 100
}

/** Trailing % returns over ~1/3/12 months of trading days, each null when
    the series is too short for that window. */
export function computeReturns(closes: number[]): {
  ret1m: number | null
  ret3m: number | null
  ret12m: number | null
} {
  return {
    ret1m: trailingReturn(closes, RETURN_WINDOWS.m1),
    ret3m: trailingReturn(closes, RETURN_WINDOWS.m3),
    ret12m: trailingReturn(closes, RETURN_WINDOWS.y1),
  }
}

/** Annualized volatility — stdev of daily simple returns over the last
    `window` days × √252, as a percent. Null under ~10 returns; thin
    series would report noise as signal. */
export function computeVolatility(closes: number[], window = 20): number | null {
  const tail = closes.slice(-(window + 1))
  const rets: number[] = []
  for (let i = 1; i < tail.length; i++) {
    if (tail[i - 1] > 0) rets.push((tail[i] - tail[i - 1]) / tail[i - 1])
  }
  if (rets.length < 10) return null
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1)
  return Math.sqrt(variance) * Math.sqrt(252) * 100
}

/** 52-week range over the last 252 closes (fewer when the series is
    shorter — a recent listing's range is still its real range). */
export function range52w(closes: number[]): { high: number | null; low: number | null } {
  const tail = closes.slice(-252)
  if (tail.length === 0) return { high: null, low: null }
  return { high: Math.max(...tail), low: Math.min(...tail) }
}

export interface TechnicalPack {
  ma50: number | null
  ma200: number | null
  rsi14: number | null
  ret1m: number | null
  ret3m: number | null
  ret12m: number | null
  vol20d: number | null
  high52w: number | null
  low52w: number | null
}

/** One call per symbol — everything invest-ai needs for "how has it been
    trading" from a single close series. */
export function technicalPack(closes: number[]): TechnicalPack {
  const { ret1m, ret3m, ret12m } = computeReturns(closes)
  const { high, low } = range52w(closes)
  return {
    ma50: computeMa(closes, 50),
    ma200: computeMa(closes, 200),
    rsi14: computeRsi(closes),
    ret1m,
    ret3m,
    ret12m,
    vol20d: computeVolatility(closes),
    high52w: high,
    low52w: low,
  }
}

/* --- Fundamentals --------------------------------------------------------
   Free, keyless, best-effort — every field nullable; a feed gap stores
   NULL and Tally says "nothing on file" rather than inventing a figure.
   Equities: Yahoo's public quote endpoint (trailing/forward P/E, market
   cap, EPS, book, yield, beta — the same fields its quote pages show).
   Crypto: CoinGecko /coins/markets (cap, volume, supply, ATH). */

export type Fundamentals = Record<string, number | string | null>

export function coingeckoMarketsUrl(ids: string[]): string {
  return (
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd` +
    `&ids=${ids.join(',')}&price_change_percentage=24h`
  )
}

/** CoinGecko /coins/markets JSON → fundamentals per coin id (denominated
    in USD — the blob's `currency` field says so explicitly). */
export function parseCoingeckoMarkets(json: unknown): Map<string, Fundamentals> {
  const out = new Map<string, Fundamentals>()
  if (!Array.isArray(json)) return out
  const num = (v: unknown): number | null => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  for (const row of json) {
    const c = row as Record<string, unknown>
    const id = typeof c['id'] === 'string' ? (c['id'] as string) : null
    if (!id) continue
    out.set(id, {
      market_cap: num(c['market_cap']),
      volume_24h: num(c['total_volume']),
      circulating_supply: num(c['circulating_supply']),
      ath: num(c['ath']),
      ath_change_pct: num(c['ath_change_percentage']),
      currency: 'USD',
    })
  }
  return out
}

export interface SyncTarget {
  user_id: string
  asset_class: string
  symbol: string
  /** Company/coin name when known — drives better headline queries. */
  name?: string
}

export type SyncAction = 'sync' | 'sync-all'

export function validateSyncAction(
  action: unknown,
): { ok: true; value: SyncAction } | { ok: false; error: string } {
  if (action === 'sync' || action === 'sync-all') return { ok: true, value: action }
  return { ok: false, error: `Unknown action: ${String(action)}` }
}

/* --- News (Google News RSS — free, keyless, delayed) ----------------------- */

export interface NewsItem {
  symbol: string
  asset_class: string
  title: string
  url: string
  source: string
  summary: string
  published_at: string | null
}

/* Google News indexes betting-market listing pages (Robinhood prediction
   markets, etc.) — a wager board is not a headline. Keep in sync with the
   client-side copy in InvestHomePage.tsx. */
export const JUNK_HEADLINE = /\bprediction markets?\b/i

/** The title or deck mentions the tracked asset — by symbol, or by the
    name the query ran under ('Solana' under SOL). A story Google News
    returned for a query but that never names the asset keeps its row but
    drops the symbol tag rather than claim a relation that isn't there. */
export function mentionsHolding(
  text: string,
  meta: { symbol: string; name?: string },
): boolean {
  const terms = [meta.symbol, meta.name]
    .map((t) => t?.trim().replace(/\.(TO|V|US)$/, ''))
    .filter((t): t is string => !!t && t.length >= 2)
  return terms.some((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text))
}

/** CA-edition Google News RSS for a query — free, unofficial, rate-limited. */
export function googleNewsUrl(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-CA&gl=CA&ceid=CA:en`
}

function xmlText(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
  if (!m) return ''
  const raw = m[1]
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/)
  const text = cdata ? cdata[1] : raw
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim()
}

/**
 * RSS `<item>` blocks → headline rows. Google News titles carry the source
 * as a " - Source" suffix; the `<source>` element carries it properly, so
 * prefer that and strip the suffix. Missing/malformed fields drop the item.
 */
export function parseRssItems(
  xml: string,
  meta: { symbol: string; asset_class: string; name?: string },
  maxItems = 12,
): NewsItem[] {
  const items: NewsItem[] = []
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1]
    let title = xmlText(block, 'title')
    const source = xmlText(block, 'source')
    const suffix = ` - ${source}`
    if (source && title.endsWith(suffix)) title = title.slice(0, -suffix.length)
    const url = xmlText(block, 'link')
    if (!title || !url || JUNK_HEADLINE.test(title)) continue
    const summary = xmlText(block, 'description').slice(0, 240)
    /* The query returned it, but the symbol tag is only honest when the
       story actually names the holding. */
    const symbol =
      meta.symbol && mentionsHolding(`${title} ${summary}`, meta) ? meta.symbol : ''
    const pub = xmlText(block, 'pubDate')
    const pubMs = pub ? Date.parse(pub) : NaN
    items.push({
      symbol,
      asset_class: meta.asset_class,
      title: title.slice(0, 300),
      url: url.slice(0, 500),
      source: source.slice(0, 120),
      summary,
      published_at: Number.isFinite(pubMs) ? new Date(pubMs).toISOString() : null,
    })
    if (items.length >= maxItems) break
  }
  return items
}

/**
 * News queries for a sync universe: one general market feed plus one feed
 * per distinct symbol (asset-class hint keeps "SHOP" from returning dress
 * shops). Names beat tickers for headline matching.
 */
export function newsQueries(
  targets: { asset_class: string; symbol: string; name?: string }[],
  maxSymbolFeeds = 8,
): { query: string; symbol: string; asset_class: string; name?: string }[] {
  const queries: { query: string; symbol: string; asset_class: string; name?: string }[] = [
    { query: 'stock market Canada', symbol: '', asset_class: '' },
  ]
  const seen = new Set<string>()
  for (const t of targets) {
    const sym = t.symbol.trim().toUpperCase()
    if (!sym || seen.has(sym)) continue
    seen.add(sym)
    const hint = t.asset_class === 'crypto' ? 'crypto' : 'stock'
    const name = t.name && t.name.trim() ? t.name.trim() : undefined
    const term = name ?? sym.replace(/\.(TO|V|US)$/, '')
    queries.push({ query: `${term} ${hint}`, symbol: sym, asset_class: t.asset_class, name })
    if (queries.length > maxSymbolFeeds) break
  }
  return queries
}
