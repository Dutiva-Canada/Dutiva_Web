import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
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
  type SyncTarget,
} from './handlers.ts'

/**
 * invest-market-sync — refreshes invest_market_snapshots from free public
 * feeds so strategies always evaluate fresh prices instead of manual entry,
 * and stores shared market headlines in invest_market_news.
 *
 *   crypto            → CoinGecko simple/price (+ market_chart for ma50)
 *   equity/etf/other  → Stooq daily CSV (delayed quotes; .to/.v = CAD,
 *                       .us/bare = USD)
 *   headlines         → Google News RSS (CA edition; free, unofficial)
 *
 * Actions (POST body):
 *   { action: 'sync' }      — invest-portal JWT; syncs the caller's book
 *                             and refreshes the shared news table.
 *   { action: 'sync-all' }  — trigger secret / service key (the 07:20 UTC
 *                             pg_cron sweep), or an admin-role portal JWT.
 *
 * A user's universe is snapshot rows ∪ held positions ∪ watchlist symbols.
 * Unknown tickers are skipped and reported, never fatal.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trigger-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type SupabaseClient = ReturnType<typeof createClient>

interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
}

function serverConfig(): ServerConfig | Response {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }
  return { supabaseUrl, anonKey, serviceRoleKey }
}

/** Same contract as invest-bot / candidate-job-agent. */
function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && req.headers.get('x-trigger-secret') === sharedSecret) return true

  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (token === '') return false

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
  return (serviceKey !== '' && token === serviceKey) || (secretKey !== '' && token === secretKey)
}

/** Portal JWT → user id, gated on invest_access; admin tier for sync-all. */
async function authenticateInvestUser(
  req: Request,
  config: ServerConfig,
  options: { requireAdmin?: boolean } = {},
): Promise<{ userId: string; adminClient: SupabaseClient } | Response> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return json({ error: 'Missing bearer token' }, 401)

  const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey)
  const { data: userData, error: userError } = await adminClient.auth.getUser(token)
  if (userError || !userData?.user) return json({ error: 'Invalid user token' }, 401)

  const { data: access, error: accessError } = await adminClient
    .from('invest_access')
    .select('user_id, role')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return json({ error: accessError.message }, 500)
  if (!access) return json({ error: 'Invest access not granted', code: 'no_access' }, 403)
  if (options.requireAdmin && access.role !== 'admin') {
    return json({ error: 'Admin access required', code: 'not_admin' }, 403)
  }

  return { userId: userData.user.id, adminClient }
}

/* ── Feed fetches ──────────────────────────────────────────────────────── */

const HISTORY_STAGGER_MS = 250
const MAX_PER_CLASS = 30

function pause(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchText(url: string, headers: Record<string, string> = {}): Promise<string | null> {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

interface SnapshotPatch {
  user_id: string
  asset_class: string
  symbol: string
  price: number
  day_change_pct: number | null
  ma50: number | null
  currency: string
  source: string
  as_of: string
}

/** CoinGecko: one batched price call + per-coin history for the MA. */
async function syncCrypto(
  targets: SyncTarget[],
  patches: SnapshotPatch[],
  failed: string[],
): Promise<void> {
  if (targets.length === 0) return
  const ids = [...new Set(targets.map((t) => coingeckoId(t.symbol)))]
  const cgHeaders: Record<string, string> = {}
  const demoKey = Deno.env.get('COINGECKO_API_KEY') ?? ''
  if (demoKey) cgHeaders['x-cg-demo-api-key'] = demoKey

  const simpleUrl =
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}` +
    `&vs_currencies=cad,usd&include_24hr_change=true`
  const raw = await fetchText(simpleUrl, cgHeaders)
  const prices = raw ? parseCoingeckoSimple(JSON.parse(raw)) : new Map()

  const byId = new Map<string, SyncTarget[]>()
  for (const t of targets) {
    const id = coingeckoId(t.symbol)
    byId.set(id, [...(byId.get(id) ?? []), t])
  }

  let historyCalls = 0
  for (const [id, group] of byId) {
    const quote = prices.get(id)
    if (!quote) {
      for (const t of group) failed.push(t.symbol)
      continue
    }
    let ma50: number | null = null
    if (historyCalls < MAX_PER_CLASS) {
      historyCalls += 1
      const histRaw = await fetchText(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${quote.currency.toLowerCase()}&days=55&interval=daily`,
        cgHeaders,
      )
      if (histRaw) ma50 = computeMa(parseCoingeckoCloses(JSON.parse(histRaw)))
      await pause(HISTORY_STAGGER_MS)
    }
    for (const t of group) {
      patches.push({
        user_id: t.user_id,
        asset_class: t.asset_class,
        symbol: t.symbol,
        price: quote.price,
        day_change_pct: quote.day_change_pct,
        ma50,
        currency: quote.currency,
        source: 'coingecko',
        as_of: new Date().toISOString(),
      })
    }
  }
}

/** Stooq: one batched quote call + per-symbol history for the MA. */
async function syncStooq(
  targets: SyncTarget[],
  patches: SnapshotPatch[],
  failed: string[],
): Promise<void> {
  if (targets.length === 0) return
  const mapped = targets.map((t) => ({ target: t, ...stooqSymbol(t.symbol) }))
  const tickers = [...new Set(mapped.map((m) => m.ticker))]
  const raw = await fetchText(
    `https://stooq.com/q/l/?s=${tickers.join(',')}&f=sd2t2ohlcv&h&e=csv`,
  )
  const quotes = new Map((raw ? parseStooqQuotes(raw) : []).map((q) => [q.ticker, q]))

  let historyCalls = 0
  for (const m of mapped) {
    const quote = quotes.get(m.ticker)
    if (!quote) {
      failed.push(m.target.symbol)
      continue
    }
    let ma50: number | null = null
    if (historyCalls < MAX_PER_CLASS) {
      historyCalls += 1
      const histRaw = await fetchText(`https://stooq.com/q/d/l/?s=${m.ticker}&i=d`)
      if (histRaw) ma50 = computeMa(parseStooqCloses(histRaw))
      await pause(HISTORY_STAGGER_MS)
    }
    patches.push({
      user_id: m.target.user_id,
      asset_class: m.target.asset_class,
      symbol: m.target.symbol,
      price: quote.close,
      day_change_pct: quote.open > 0 ? ((quote.close - quote.open) / quote.open) * 100 : null,
      ma50,
      currency: m.currency,
      source: 'stooq',
      as_of: new Date().toISOString(),
    })
  }
}

/** One user's universe: snapshot rows ∪ held-position ∪ watchlist symbols. */
async function syncUser(adminClient: SupabaseClient, userId: string) {
  const [snapsRes, positionsRes, watchRes] = await Promise.all([
    adminClient.from('invest_market_snapshots').select('asset_class, symbol').eq('user_id', userId),
    adminClient.from('invest_positions').select('asset_class, symbol, name').eq('user_id', userId),
    adminClient.from('invest_watchlist').select('asset_class, symbol, name').eq('user_id', userId),
  ])
  const seen = new Set<string>()
  const targets: SyncTarget[] = []
  for (const r of [
    ...(snapsRes.data ?? []),
    ...(positionsRes.data ?? []),
    ...(watchRes.data ?? []),
  ]) {
    const key = `${r.asset_class}:${r.symbol}`
    if (seen.has(key) || !r.symbol) continue
    seen.add(key)
    targets.push({
      user_id: userId,
      asset_class: r.asset_class as string,
      symbol: r.symbol as string,
      name: (r as { name?: string }).name ?? '',
    })
  }

  const crypto = targets.filter((t) => t.asset_class === 'crypto').slice(0, MAX_PER_CLASS)
  const rest = targets.filter((t) => t.asset_class !== 'crypto' && t.asset_class !== 'cash').slice(0, MAX_PER_CLASS)

  const patches: SnapshotPatch[] = []
  const failed: string[] = []
  await syncCrypto(crypto, patches, failed)
  await syncStooq(rest, patches, failed)

  for (const p of patches) {
    const { error } = await adminClient
      .from('invest_market_snapshots')
      .upsert(p, { onConflict: 'user_id,asset_class,symbol' })
    if (error) failed.push(`${p.symbol} (upsert)`)
  }

  return { symbols: targets.length, synced: patches.length, failed, targets }
}

const NEWS_STAGGER_MS = 300
const NEWS_MAX_ITEMS_STORED = 40

/**
 * Shared market headlines — one row per (symbol, url), deduped by the
 * table's unique constraint. The table is global, so repeats across users
 * and runs cost one upsert round-trip, not duplicate rows.
 */
async function refreshNews(adminClient: SupabaseClient, targets: SyncTarget[]): Promise<number> {
  const queries = newsQueries(targets)
  const rows: Record<string, unknown>[] = []
  const seenUrls = new Set<string>()
  for (const q of queries) {
    const xml = await fetchText(googleNewsUrl(q.query))
    if (!xml) continue
    for (const item of parseRssItems(xml, { symbol: q.symbol, asset_class: q.asset_class })) {
      const key = `${item.symbol}:${item.url}`
      if (seenUrls.has(key)) continue
      seenUrls.add(key)
      rows.push(item)
      if (rows.length >= NEWS_MAX_ITEMS_STORED) break
    }
    if (rows.length >= NEWS_MAX_ITEMS_STORED) break
    await pause(NEWS_STAGGER_MS)
  }
  if (rows.length === 0) return 0
  const { error } = await adminClient
    .from('invest_market_news')
    .upsert(rows, { onConflict: 'symbol,url', ignoreDuplicates: true })
  return error ? 0 : rows.length
}

/* ── Handler ─────────────────────────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const actionCheck = validateSyncAction(body['action'])
  if (!actionCheck.ok) return json({ error: actionCheck.error }, 400)

  if (actionCheck.value === 'sync-all') {
    if (!isAuthorizedTrigger(req)) {
      const authed = await authenticateInvestUser(req, config, { requireAdmin: true })
      if (authed instanceof Response) return authed
    }
    const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey)
    /* Users who have anything invested/tracked/watched — cheaper than
       sweeping all. */
    const [snapsUsers, positionsUsers, watchUsers] = await Promise.all([
      adminClient.from('invest_market_snapshots').select('user_id'),
      adminClient.from('invest_positions').select('user_id'),
      adminClient.from('invest_watchlist').select('user_id'),
    ])
    const userIds = [
      ...new Set([
        ...(snapsUsers.data ?? []).map((r) => r.user_id as string),
        ...(positionsUsers.data ?? []).map((r) => r.user_id as string),
        ...(watchUsers.data ?? []).map((r) => r.user_id as string),
      ]),
    ]
    const results: Record<string, unknown>[] = []
    const allTargets: SyncTarget[] = []
    for (const userId of userIds) {
      try {
        const r = await syncUser(adminClient, userId)
        allTargets.push(...r.targets)
        results.push({ userId, symbols: r.symbols, synced: r.synced, failed: r.failed })
      } catch (error) {
        console.error('invest-market-sync: user failed', userId, error)
        results.push({ userId, error: String(error).slice(0, 200) })
      }
    }
    const news = await refreshNews(adminClient, allTargets)
    return json({ scanned: results.length, news, results })
  }

  /* sync — caller's book only */
  const authed = await authenticateInvestUser(req, config)
  if (authed instanceof Response) return authed
  const result = await syncUser(authed.adminClient, authed.userId)
  const news = await refreshNews(authed.adminClient, result.targets)
  return json({ symbols: result.symbols, synced: result.synced, failed: result.failed, news })
})
