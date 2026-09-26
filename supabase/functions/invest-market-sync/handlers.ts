/**
 * Pure helpers for the invest-market-sync edge function — symbol mapping,
 * CSV/JSON parsing, and the moving-average math. Deno-free so Vitest can
 * run them; index.ts owns the network.
 *
 * Free sources only:
 *   crypto          → CoinGecko public API (no key; optional demo key via env)
 *   equities/etfs   → Stooq CSV endpoints (no key; delayed quotes)
 *
 * Symbol conventions the portal documents:
 *   crypto   BTC, ETH, …          → CoinGecko id via COINGECKO_IDS (or the
 *                                  lowercased symbol, which often resolves)
 *   equity   SHOP.TO / TD.TO / …  → Stooq lowercase .to (CAD)
 *   etf      VFV.TO / VTI / …     → same rule; bare symbols are treated as
 *                                  US listings (.us, USD)
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

/**
 * Portal symbol → Stooq ticker. Explicit exchanges keep their suffix
 * (lowercased); bare symbols default to the US listing.
 */
export function stooqSymbol(symbol: string): { ticker: string; currency: string } {
  const sym = symbol.trim().toUpperCase()
  if (sym.endsWith('.TO')) return { ticker: `${sym.slice(0, -3).toLowerCase()}.to`, currency: 'CAD' }
  if (sym.endsWith('.V')) return { ticker: `${sym.slice(0, -2).toLowerCase()}.v`, currency: 'CAD' }
  if (sym.endsWith('.US')) return { ticker: `${sym.slice(0, -3).toLowerCase()}.us`, currency: 'USD' }
  return { ticker: `${sym.toLowerCase()}.us`, currency: 'USD' }
}

export interface StooqQuote {
  ticker: string
  open: number
  close: number
}

/** `q/l/?f=sd2t2ohlcv` CSV → one quote per known ticker; N/D rows drop. */
export function parseStooqQuotes(csv: string): StooqQuote[] {
  const out: StooqQuote[] = []
  const lines = csv.trim().split('\n')
  for (const line of lines.slice(1)) {
    const cols = line.split(',')
    if (cols.length < 8) continue
    const [ticker, , , open, , , close] = cols
    const o = Number(open)
    const c = Number(close)
    if (!ticker || !Number.isFinite(o) || !Number.isFinite(c) || c <= 0) continue
    out.push({ ticker: ticker.trim().toLowerCase(), open: o, close: c })
  }
  return out
}

/** `q/d/l/?i=d` CSV → daily closes, oldest first. */
export function parseStooqCloses(csv: string): number[] {
  const out: number[] = []
  const lines = csv.trim().split('\n')
  for (const line of lines.slice(1)) {
    const cols = line.split(',')
    const close = Number(cols[4])
    if (Number.isFinite(close) && close > 0) out.push(close)
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
      out.set(id, { price: cad, currency: 'CAD', day_change_pct: Number.isFinite(chg) ? chg : null })
    } else if (Number.isFinite(usd) && usd > 0) {
      const chg = Number(o['usd_24h_change'])
      out.set(id, { price: usd, currency: 'USD', day_change_pct: Number.isFinite(chg) ? chg : null })
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
  meta: { symbol: string; asset_class: string },
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
    if (!title || !url) continue
    const pub = xmlText(block, 'pubDate')
    const pubMs = pub ? Date.parse(pub) : NaN
    items.push({
      symbol: meta.symbol,
      asset_class: meta.asset_class,
      title: title.slice(0, 300),
      url: url.slice(0, 500),
      source: source.slice(0, 120),
      summary: xmlText(block, 'description').slice(0, 240),
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
): { query: string; symbol: string; asset_class: string }[] {
  const queries: { query: string; symbol: string; asset_class: string }[] = [
    { query: 'stock market Canada', symbol: '', asset_class: '' },
  ]
  const seen = new Set<string>()
  for (const t of targets) {
    const sym = t.symbol.trim().toUpperCase()
    if (!sym || seen.has(sym)) continue
    seen.add(sym)
    const hint = t.asset_class === 'crypto' ? 'crypto' : 'stock'
    const term = t.name && t.name.trim() ? t.name.trim() : sym.replace(/\.(TO|V|US)$/, '')
    queries.push({ query: `${term} ${hint}`, symbol: sym, asset_class: t.asset_class })
    if (queries.length > maxSymbolFeeds) break
  }
  return queries
}
