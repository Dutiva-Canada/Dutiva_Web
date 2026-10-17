import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import type { SupabaseClient as SbClient } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../_shared/database.types.ts'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'
import { activeModelRoute, routeApiKey } from '../_shared/aiRoute.ts'
import { postChatCompletion, routeBodyExtras, routeMaxTokens } from '../_shared/modelUpstream.ts'
import {
  coingeckoId,
  coingeckoMarketsUrl,
  googleNewsUrl,
  interleaveNewsFeeds,
  newsKindPrompt,
  newsQueries,
  newsThemeQueries,
  parseNewsKindVerdicts,
  parseThemeLinkVerdicts,
  themeLinkPrompt,
  parseCoingeckoCloses,
  parseCoingeckoMarkets,
  parseCoingeckoNames,
  parseCoingeckoSimple,
  parseRssItems,
  parseYahooChart,
  parseYahooFundamentals,
  scopeAssetClass,
  technicalPack,
  validateSyncAction,
  YAHOO_HEADERS,
  yahooChartUrl,
  yahooEquitySymbol,
  yahooFundamentalsUrl,
  type Fundamentals,
  type NewsItem,
  type NewsKind,
  type SyncTarget,
  type ThemeLinkCandidate,
} from './handlers.ts'
import { secretEquals } from '../_shared/secretEqual.ts'

/**
 * invest-market-sync — refreshes invest_market_snapshots from free public
 * feeds so strategies always evaluate fresh prices instead of manual entry,
 * and stores shared market headlines in invest_market_news.
 *
 *   crypto            → CoinGecko simple/price + /coins/markets; daily
 *                       history (365d) → the technical pack (MA50/200,
 *                       RSI-14, returns, vol, 52-week range)
 *   equity/etf/other  → Yahoo v8/chart (quote + 1y closes → the same
 *                       technical pack; .TO/.V = CAD, bare = USD) and
 *                       fundamentals-timeseries (P/E, cap, EPS, yield)
 *   headlines         → Google News RSS (CA edition; free, unofficial)
 *
 * The technical + fundamentals columns are what Tally analyzes with —
 * NULL means "nothing on file", which the chat prompt says plainly.
 *
 * Actions (POST body):
 *   { action: 'sync' }      — invest-portal JWT; syncs the caller's book
 *                             and refreshes the shared news table.
 *   { action: 'sync-all' }  — trigger secret / service key (the 07:20 UTC
 *                             pg_cron sweep), or an admin-role portal JWT.
 *   { action: 'sync-all', light: true } — the quarter-hour market-hours job
 *                             (0235): price + day-change only. No news, no
 *                             fundamentals, no close-series history — the
 *                             patch omits those columns so existing rows
 *                             keep the daily run's technicals.
 *
 * A user's universe is snapshot rows ∪ held positions ∪ watchlist ∪
 * symbols explicitly scoped into an enabled strategy.
 * Unknown tickers are skipped and reported, never fatal.
 */

const CORS = { allowHeaders: 'authorization, x-client-info, apikey, content-type, x-trigger-secret' }
const corsHeaders = makeCorsHeaders(CORS)

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

type SupabaseClient = SbClient<Database>

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
  if (sharedSecret !== '' && secretEquals(req.headers.get('x-trigger-secret') ?? '', sharedSecret)) return true

  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (token === '') return false

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
  return (serviceKey !== '' && secretEquals(token, serviceKey)) || (secretKey !== '' && secretEquals(token, secretKey))
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

  const adminClient = createClient<Database>(config.supabaseUrl, config.serviceRoleKey)
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

async function fetchText(
  url: string,
  headers: Record<string, string> = {},
): Promise<string | null> {
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
  currency: string
  source: string
  as_of: string
  /* Set only by a full sync — a light run omits these keys entirely so
     the upsert preserves the daily run's technicals and fundamentals on
     existing rows instead of overwriting them with NULL. */
  ma50?: number | null
  ma200?: number | null
  rsi14?: number | null
  ret_1m?: number | null
  ret_3m?: number | null
  ret_12m?: number | null
  vol_20d?: number | null
  high_52w?: number | null
  low_52w?: number | null
  fundamentals?: Fundamentals | null
  fundamentals_as_of?: string | null
  /* Feed-resolved listing name (0235) — written whenever the call that
     carries it produced one; never cleared by a failed lookup. */
  quote_name?: string
}

/** CoinGecko: one batched price call + per-coin history for the MA.
    Light runs stop at the price call — history and the markets
    fundamentals payload are the full sync's job. */
async function syncCrypto(
  targets: SyncTarget[],
  patches: SnapshotPatch[],
  failed: string[],
  light: boolean,
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
    let tech: ReturnType<typeof technicalPack> | null = null
    if (!light && historyCalls < MAX_PER_CLASS) {
      historyCalls += 1
      /* 365 days of closes — enough for MA200, the 52-week range, and the
         12-month return; the 55-day pull only ever fed MA50. */
      const histRaw = await fetchText(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${quote.currency.toLowerCase()}&days=365&interval=daily`,
        cgHeaders,
      )
      if (histRaw) tech = technicalPack(parseCoingeckoCloses(JSON.parse(histRaw)))
      await pause(HISTORY_STAGGER_MS)
    }
    for (const t of group) {
      const p: SnapshotPatch = {
        user_id: t.user_id,
        asset_class: t.asset_class,
        symbol: t.symbol,
        price: quote.price,
        day_change_pct: quote.day_change_pct,
        currency: quote.currency,
        source: 'coingecko',
        as_of: new Date().toISOString(),
      }
      if (!light) {
        p.ma50 = tech?.ma50 ?? null
        p.ma200 = tech?.ma200 ?? null
        p.rsi14 = tech?.rsi14 ?? null
        p.ret_1m = tech?.ret1m ?? null
        p.ret_3m = tech?.ret3m ?? null
        p.ret_12m = tech?.ret12m ?? null
        p.vol_20d = tech?.vol20d ?? null
        p.high_52w = tech?.high52w ?? null
        p.low_52w = tech?.low52w ?? null
        p.fundamentals = null
        p.fundamentals_as_of = null
      }
      patches.push(p)
    }
  }

  /* Crypto fundamentals — one batched /coins/markets call for every id
     this pass touched (USD-denominated; the blob says so). Also carries
     the display names that become quote_name. */
  if (light) return
  const fundRaw = await fetchText(coingeckoMarketsUrl(ids), cgHeaders)
  if (fundRaw) {
    const fundJson: unknown = JSON.parse(fundRaw)
    const funds = parseCoingeckoMarkets(fundJson)
    const names = parseCoingeckoNames(fundJson)
    const asOf = new Date().toISOString()
    for (const p of patches) {
      if (p.asset_class !== 'crypto') continue
      const f = funds.get(coingeckoId(p.symbol))
      if (f) {
        p.fundamentals = f
        p.fundamentals_as_of = asOf
      }
      const name = names.get(coingeckoId(p.symbol))
      if (name) p.quote_name = name
    }
  }
}

/** Yahoo: per-symbol v8/chart (quote + a year of closes → the whole
    technical pack) + fundamentals-timeseries (valuation block). Two
    keyless calls per symbol, staggered; a refused call leaves NULLs.
    Light runs take the chart only, at a 5d range — enough for price and
    day-change without paying for the history a 15-minute cadence can't
    meaningfully move. */
async function syncEquities(
  targets: SyncTarget[],
  patches: SnapshotPatch[],
  failed: string[],
  light: boolean,
): Promise<void> {
  if (targets.length === 0) return
  const mapped = targets.map((t) => ({ target: t, ...yahooEquitySymbol(t.symbol) }))
  /* Users can hold the same Yahoo listing under different portal symbols —
     fetch each distinct listing once and share the result. */
  const uniqueSymbols = [...new Set(mapped.map((m) => m.symbol))]
  const chartBySymbol = new Map<string, ReturnType<typeof parseYahooChart>>()
  const fundBySymbol = new Map<string, Fundamentals>()
  for (const ys of uniqueSymbols.slice(0, MAX_PER_CLASS)) {
    const [chartRaw, fundRaw] = light
      ? [await fetchText(yahooChartUrl(ys, '5d'), YAHOO_HEADERS), null]
      : await Promise.all([
          fetchText(yahooChartUrl(ys), YAHOO_HEADERS),
          fetchText(yahooFundamentalsUrl(ys), YAHOO_HEADERS),
        ])
    if (chartRaw) chartBySymbol.set(ys, parseYahooChart(JSON.parse(chartRaw)))
    if (fundRaw) fundBySymbol.set(ys, parseYahooFundamentals(JSON.parse(fundRaw)))
    await pause(HISTORY_STAGGER_MS)
  }

  for (const m of mapped) {
    const chart = chartBySymbol.get(m.symbol)
    if (!chart || chart.price === null) {
      failed.push(m.target.symbol)
      continue
    }
    const p: SnapshotPatch = {
      user_id: m.target.user_id,
      asset_class: m.target.asset_class,
      symbol: m.target.symbol,
      price: chart.price,
      day_change_pct: chart.dayChangePct,
      currency: chart.currency ?? m.currency,
      source: 'yahoo',
      as_of: new Date().toISOString(),
    }
    /* The chart meta's longName is free even on light runs — persist it
       so a mistyped or renamed symbol shows what it resolved to. */
    if (chart.name) p.quote_name = chart.name
    if (!light) {
      const tech = chart.closes.length > 0 ? technicalPack(chart.closes) : null
      const fund = fundBySymbol.get(m.symbol)
      const fundamentals: Fundamentals | null =
        fund && Object.keys(fund).length > 0
          ? { ...fund, currency: chart.currency ?? m.currency }
          : null
      p.ma50 = tech?.ma50 ?? null
      p.ma200 = tech?.ma200 ?? null
      p.rsi14 = tech?.rsi14 ?? null
      p.ret_1m = tech?.ret1m ?? null
      p.ret_3m = tech?.ret3m ?? null
      p.ret_12m = tech?.ret12m ?? null
      p.vol_20d = tech?.vol20d ?? null
      p.high_52w = tech?.high52w ?? null
      p.low_52w = tech?.low52w ?? null
      p.fundamentals = fundamentals
      p.fundamentals_as_of = fundamentals ? new Date().toISOString() : null
    }
    patches.push(p)
  }
}

/** One user's universe: snapshot rows ∪ held positions ∪ watchlist ∪
    symbols explicitly scoped into an enabled strategy (0184). Light runs
    refresh price/change only (0235 quarter-hour job). */
async function syncUser(adminClient: SupabaseClient, userId: string, light = false) {
  const [snapsRes, positionsRes, watchRes, stratRes] = await Promise.all([
    adminClient
      .from('invest_market_snapshots')
      .select('asset_class, symbol, quote_name')
      .eq('user_id', userId),
    adminClient.from('invest_positions').select('asset_class, symbol, name').eq('user_id', userId),
    adminClient.from('invest_watchlist').select('asset_class, symbol, name').eq('user_id', userId),
    adminClient.from('invest_strategies').select('scope').eq('user_id', userId).eq('enabled', true),
  ])
  /* Held symbols get the news feeds first under the cap — a position you
     own must never lose headline coverage to a watch-only name. */
  const heldSet = new Set(
    (positionsRes.data ?? []).map((p) => `${p.asset_class}:${p.symbol}`),
  )
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
      /* The feed-resolved name ("Rocket Lab Corporation") beats a raw
         user entry for headline matching; a held-but-unsnapshotted row
         falls back to its own name field. */
      name:
        (r as { quote_name?: string }).quote_name ??
        (r as { name?: string }).name ??
        '',
      held: heldSet.has(key),
    })
  }

  /* Strategy-scoped symbols (scope.symbols, 0184) are bare tickers —
     route a ticker CoinGecko knows to the crypto feed, default the rest
     to equity, and skip any symbol a position/watchlist row already
     covers under its real asset class. A pre-0184 project has no `scope`
     column, so a query error is tolerated. */
  const covered = new Set(targets.map((t) => t.symbol.toUpperCase()))
  if (!stratRes.error) {
    for (const row of stratRes.data ?? []) {
      const scope = (row as { scope?: { symbols?: unknown } | null }).scope
      if (!Array.isArray(scope?.symbols)) continue
      for (const raw of scope.symbols) {
        const symbol = String(raw).toUpperCase().trim()
        if (!symbol || covered.has(symbol)) continue
        covered.add(symbol)
        const assetClass = scopeAssetClass(symbol)
        seen.add(`${assetClass}:${symbol}`)
        targets.push({ user_id: userId, asset_class: assetClass, symbol, name: '' })
      }
    }
  }

  const crypto = targets.filter((t) => t.asset_class === 'crypto').slice(0, MAX_PER_CLASS)
  const rest = targets
    .filter((t) => t.asset_class !== 'crypto' && t.asset_class !== 'cash')
    .slice(0, MAX_PER_CLASS)

  const patches: SnapshotPatch[] = []
  const failed: string[] = []
  await syncCrypto(crypto, patches, failed, light)
  await syncEquities(rest, patches, failed, light)

  for (const p of patches) {
    const { error } = await adminClient
      .from('invest_market_snapshots')
      .upsert(p, { onConflict: 'user_id,asset_class,symbol' })
    if (error) {
      console.error('snapshot upsert failed', p.symbol, error)
      failed.push(`${p.symbol} (upsert: ${error.message ?? 'unknown'})`)
      continue
    }
    /* Mirror the fresh quote onto any matching positions so the book — and
       Tally's context — carry a real priced-at time instead of silently
       leaning on cost basis. */
    const { error: posErr } = await adminClient
      .from('invest_positions')
      .update({ last_price: p.price, last_price_at: p.as_of })
      .eq('user_id', userId)
      .eq('asset_class', p.asset_class)
      .eq('symbol', p.symbol)
    if (posErr) console.error('position price write-back failed', p.symbol, posErr)
  }

  await checkAgentHealth(adminClient, userId)

  return { symbols: targets.length, synced: patches.length, failed, targets }
}

const AGENT_RUN_STALE_MS = 26 * 3_600_000
const AGENT_HEALTH_TITLE = 'Agent sweep overdue'

/* Watchdog — this job runs far more often than the agent, so it
   carries the liveness check. One open alert at a time; the row stays
   for the user to triage even after recovery — the outage was real. */
async function checkAgentHealth(adminClient: SupabaseClient, userId: string) {
  const { data: lastRun } = await adminClient
    .from('invest_bot_runs')
    .select('ran_at')
    .eq('user_id', userId)
    .order('ran_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lastRun && Date.now() - Date.parse(lastRun.ran_at) <= AGENT_RUN_STALE_MS) return
  const { data: openAlert } = await adminClient
    .from('invest_signals')
    .select('id')
    .eq('user_id', userId)
    .eq('title', AGENT_HEALTH_TITLE)
    .neq('status', 'dismissed')
    .limit(1)
  if ((openAlert ?? []).length > 0) return
  const { error } = await adminClient.from('invest_signals').insert({
    user_id: userId,
    asset_class: 'equity',
    symbol: '',
    name: '',
    kind: 'alert',
    title: AGENT_HEALTH_TITLE,
    title_fr: 'Balayage de l’agent en retard',
    body: `No agent run has landed in over a day — signals, marks and suggestions may be stale until the daily sweep recovers. Last run: ${lastRun?.ran_at ?? 'never'}.`,
    body_fr: 'Aucun balayage de l’agent depuis plus d’un jour — signaux, valorisations et suggestions peuvent être périmés jusqu’au prochain passage.',
    score: null,
    status: 'new',
  })
  if (error) console.error('agent-health signal insert failed', error)
}

const NEWS_STAGGER_MS = 300
const NEWS_MAX_ITEMS_STORED = 40

/* Benchmark closes for the track-record overlay — global public data,
   one (symbol, date) row each. Hourly runs refresh a month of tail;
   the daily full sync refreshes 2y so gaps heal themselves. */
const BENCHMARK_SYMBOLS = ['XEQT.TO', 'SPY'] as const

async function syncBenchmarks(adminClient: SupabaseClient, deep: boolean): Promise<number> {
  let written = 0
  for (const sym of BENCHMARK_SYMBOLS) {
    const raw = await fetchText(yahooChartUrl(sym, deep ? '2y' : '1mo'), YAHOO_HEADERS)
    if (!raw) continue
    let parsed: ReturnType<typeof parseYahooChart>
    try {
      parsed = parseYahooChart(JSON.parse(raw))
    } catch {
      continue
    }
    const rows = parsed.daily.map((d) => ({ symbol: sym, mark_date: d.date, close: d.close }))
    if (rows.length === 0) continue
    const { error } = await adminClient
      .from('invest_benchmark_marks')
      .upsert(rows, { onConflict: 'symbol,mark_date' })
    if (error) console.error('benchmark upsert failed', sym, error)
    else written += rows.length
    await pause(NEWS_STAGGER_MS)
  }
  return written
}

/**
 * Shared market headlines — one row per (symbol, url), deduped by the
 * table's unique constraint. The table is global, so repeats across users
 * and runs cost one upsert round-trip, not duplicate rows.
 */
/* Thematic headlines get their own budget — symbol feeds alone could
   fill the shared cap and starve the board's coverage. */
const NEWS_MAX_THEME_ITEMS = 24

/* Theme-feed link check — a small model decides which declared symbols
   each thematic headline plausibly touches. invest-bot's precedent for
   model calls in the invest pipeline: unmetered, quiet degrade — any
   missing route/key/upstream returns null and callers keep every
   declared link, which is exactly the pre-verifier behavior. A dropped
   link never deletes the story: the headline still lands unscoped. */
async function makeThemeLinkVerifier(
  admin: SupabaseClient,
): Promise<((cands: ThemeLinkCandidate[]) => Promise<Map<number, Set<string>> | null>) | null> {
  const found = await activeModelRoute(admin, ['invest_news_verify', 'invest_ai', 'advisor_chat'])
  if ('error' in found) return null
  const key = routeApiKey(found)
  if ('missingSecret' in key) return null
  const { provider, modelName: model, config } = found
  return async (cands) => {
    if (cands.length === 0) return new Map()
    try {
      const upstream = await postChatCompletion(
        provider,
        key.apiKey,
        {
          model,
          messages: [{ role: 'user', content: themeLinkPrompt(cands) }],
          temperature: 0.1,
          /* A reasoning route (invest_ai carries reasoning_effort high)
             can spend most of a tight budget thinking and truncate the
             JSON — the route's own ceiling is the honest budget. */
          max_tokens: routeMaxTokens(config, 80 + cands.length * 40),
          ...routeBodyExtras(config),
        },
        45_000,
      )
      if (!upstream.ok) return null
      const payload = (await upstream.json()) as {
        choices?: { message?: { content?: string } }[]
      }
      return parseThemeLinkVerdicts(payload.choices?.[0]?.message?.content ?? '', cands)
    } catch {
      return null
    }
  }
}

/* Headline-kind classification — what each story IS (event / news /
   view / move), never whether it matters. One batched call per run over
   the run's unique titles; same unmetered, quiet-degrade contract as
   makeThemeLinkVerifier — no route, key, or usable reply means every row
   stores null and the portal's title heuristic stays the fallback. */
async function makeNewsKindClassifier(
  admin: SupabaseClient,
): Promise<((items: { title: string; summary: string }[]) => Promise<Map<number, NewsKind> | null>) | null> {
  const found = await activeModelRoute(admin, [
    'invest_news_classify',
    'invest_news_verify',
    'invest_ai',
    'advisor_chat',
  ])
  if ('error' in found) return null
  const key = routeApiKey(found)
  if ('missingSecret' in key) return null
  const { provider, modelName: model, config } = found
  return async (items) => {
    if (items.length === 0) return new Map()
    try {
      const upstream = await postChatCompletion(
        provider,
        key.apiKey,
        {
          model,
          messages: [{ role: 'user', content: newsKindPrompt(items) }],
          temperature: 0.1,
          max_tokens: routeMaxTokens(config, 80 + items.length * 8),
          ...routeBodyExtras(config),
        },
        45_000,
      )
      if (!upstream.ok) return null
      const payload = (await upstream.json()) as {
        choices?: { message?: { content?: string } }[]
      }
      return parseNewsKindVerdicts(payload.choices?.[0]?.message?.content ?? '', items.length)
    } catch {
      return null
    }
  }
}

async function refreshNews(adminClient: SupabaseClient, targets: SyncTarget[]): Promise<number> {
  const queries = newsQueries(targets)
  const rows: Database['public']['Tables']['invest_market_news']['Insert'][] = []
  const seenUrls = new Set<string>()
  const pushRow = (item: (typeof rows)[number], cap: number) => {
    const key = `${item.symbol}:${item.url}`
    if (seenUrls.has(key)) {
      /* Same symbol+url arrived again via a theme feed — record the
         second provenance on the row that won the dedupe. */
      if (item.via_theme) {
        const won = rows.find((r) => r.symbol === item.symbol && r.url === item.url)
        if (won && !won.via_theme) won.via_theme = item.via_theme
      }
      return false
    }
    if (rows.length >= cap) return false
    seenUrls.add(key)
    rows.push(item)
    return true
  }
  /* Fetch every feed first, then round-robin the items — consuming the
     budget in query order would let an early feed drain it and starve
     the same symbols on every run. pushRow returns false for a same-run
     duplicate too, so the loop breaks on the count itself, never on a
     skipped push. */
  const perFeed: NewsItem[][] = []
  for (const q of queries) {
    const xml = await fetchText(googleNewsUrl(q.query))
    perFeed.push(
      xml ? parseRssItems(xml, { symbol: q.symbol, asset_class: q.asset_class, name: q.name }) : [],
    )
    await pause(NEWS_STAGGER_MS)
  }
  for (const item of interleaveNewsFeeds(perFeed)) {
    if (rows.length >= NEWS_MAX_ITEMS_STORED) break
    pushRow(item, NEWS_MAX_ITEMS_STORED)
  }

  /* Watch-board themes drive their own feeds: "US-China trade
     restrictions" never names AMAT, but the item's declared symbols say
     where the headline belongs. Rows tag by linkage, not text-match —
     and when a model route is live, a verifier pass keeps only the
     links the story actually supports. */
  const { data: scanRows } = await adminClient
    .from('invest_scan_items')
    .select('title, symbols')
  const classOf = new Map(targets.map((t) => [t.symbol.toUpperCase(), t.asset_class]))
  const themeCap = NEWS_MAX_ITEMS_STORED + NEWS_MAX_THEME_ITEMS
  const themeRowsByKey = new Map<string, NewsItem[]>()
  const candidates: ThemeLinkCandidate[] = []
  const candidateIndex = new Map<string, number>()
  const keysByTheme = new Map<string, string[]>()
  for (const tq of newsThemeQueries((scanRows ?? []) as { title: string; symbols: string[] }[])) {
    const linked = tq.symbols.map((s) => ({ symbol: s, asset_class: classOf.get(s) ?? 'equity' }))
    const xml = await fetchText(googleNewsUrl(tq.query))
    if (xml) {
      for (const item of parseRssItems(xml, { symbol: '', asset_class: '', linked, viaTheme: tq.query })) {
        const key = `${tq.query}|${item.url}`
        let list = themeRowsByKey.get(key)
        if (!list) {
          list = []
          themeRowsByKey.set(key, list)
          /* Keys are tracked per theme (the title is free text, so the
             key isn't parsed back apart) so emission can round-robin
             across themes rather than spending the theme budget on the
             first one. */
          const themeKeys = keysByTheme.get(tq.query) ?? []
          themeKeys.push(key)
          keysByTheme.set(tq.query, themeKeys)
          /* Whole-book themes emit unscoped rows — nothing for the
             verifier to judge (index -1 marks 'no candidate'). */
          candidateIndex.set(key, item.symbol === '' ? -1 : candidates.length)
          if (item.symbol !== '') {
            candidates.push({ theme: tq.query, title: item.title, summary: item.summary, symbols: [] })
          }
        }
        const ci = candidateIndex.get(key) ?? -1
        const c = ci >= 0 ? candidates[ci] : undefined
        if (c && !c.symbols.includes(item.symbol)) c.symbols.push(item.symbol)
        list.push(item)
      }
    }
    await pause(NEWS_STAGGER_MS)
  }

  const verify = candidates.length > 0 ? await makeThemeLinkVerifier(adminClient) : null
  const verdicts = verify ? await verify(candidates) : null
  for (const key of interleaveNewsFeeds([...keysByTheme.values()])) {
    const ci = candidateIndex.get(key) ?? -1
    const list = themeRowsByKey.get(key) ?? []
    const keep = verdicts?.get(ci)
    if (!verdicts) {
      for (const r of list) pushRow(r, themeCap)
    } else if (keep && keep.size > 0) {
      for (const r of list) {
        if (keep.has(r.symbol)) pushRow(r, themeCap)
      }
    } else {
      /* Every declared link rejected — the story still lands, just
         without a symbol claim it can't support. */
      const first = list[0]
      if (first) pushRow({ ...first, symbol: '' }, themeCap)
    }
  }

  /* One batched kind pass over the run's unique titles — duplicate titles
     across symbol copies classify once and share the verdict. null kind
     stays null: the row keeps the portal's title heuristic as fallback. */
  const classify = await makeNewsKindClassifier(adminClient)
  if (rows.length > 0) {
    const uniqueTitles = [...new Set(rows.map((r) => r.title))]
    const kindItems = uniqueTitles.map((t) => ({
      title: t,
      summary: rows.find((r) => r.title === t)?.summary ?? '',
    }))
    const kindVerdicts = classify ? await classify(kindItems) : null
    if (kindVerdicts) {
      const indexOf = new Map(uniqueTitles.map((t, i) => [t, i]))
      for (const r of rows) {
        const k = kindVerdicts.get(indexOf.get(r.title) ?? -1)
        if (k) r.kind = k
      }
    }

    const { error } = await adminClient
      .from('invest_market_news')
      .upsert(rows, { onConflict: 'symbol,url', ignoreDuplicates: true })
    if (error) return 0
    /* The card offers up to a 30-day window — anything older is dead
       storage, so the feed prunes on the same bound it displays. */
    const { error: pruneError } = await adminClient
      .from('invest_market_news')
      .delete()
      .lt('published_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
    if (pruneError) console.error('news prune failed', pruneError)
  }

  /* Backfill the backlog the classifier missed — pre-column rows and
     every degraded pass. Each run reclassifies a bounded batch of the
     newest kind:null rows, so the visible surface converges to model
     verdicts over a few sweeps without a one-off job. The update is
     still null-guarded: a row another run just classified is left
     alone rather than re-judged. */
  if (classify) {
    const { data: backlog } = await adminClient
      .from('invest_market_news')
      .select('id, title, summary')
      .is('kind', null)
      .order('published_at', { ascending: false })
      .limit(24)
    if (backlog && backlog.length > 0) {
      const verdicts = await classify(
        backlog.map((r) => ({ title: r.title, summary: r.summary ?? '' })),
      )
      if (verdicts) {
        const byKind = new Map<NewsKind, number[]>()
        backlog.forEach((r, i) => {
          const k = verdicts.get(i)
          if (k) byKind.set(k, [...(byKind.get(k) ?? []), r.id])
        })
        for (const [kind, ids] of byKind) {
          const { error: backfillError } = await adminClient
            .from('invest_market_news')
            .update({ kind })
            .in('id', ids)
            .is('kind', null)
          if (backfillError) console.error('news kind backfill failed', backfillError)
        }
      }
    }
  }
  return rows.length
}

/* ── Handler ─────────────────────────────────────────────────────────────── */

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
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
    /* The quarter-hour cron passes light:true — headline queries stay
       out of every run. The hour-news cron adds news:true for a
       once-hourly light run that does refresh headlines; the daily job
       does a full pass either way. */
    const light = body['light'] === true
    const withNews = body['news'] === true
    const adminClient = createClient<Database>(config.supabaseUrl, config.serviceRoleKey)
    /* Users who have anything invested/tracked/watched — cheaper than
       sweeping all. */
    const [snapsUsers, positionsUsers, watchUsers, stratUsers] = await Promise.all([
      adminClient.from('invest_market_snapshots').select('user_id'),
      adminClient.from('invest_positions').select('user_id'),
      adminClient.from('invest_watchlist').select('user_id'),
      /* A user whose only footprint is an enabled strategy with explicit
         scope symbols has no rows anywhere yet — without this branch the
         sweep never visits them and their symbols never get a first
         snapshot, so scheduled scans can never fire. */
      adminClient.from('invest_strategies').select('user_id').eq('enabled', true),
    ])
    const userIds = [
      ...new Set([
        ...(snapsUsers.data ?? []).map((r) => r.user_id as string),
        ...(positionsUsers.data ?? []).map((r) => r.user_id as string),
        ...(watchUsers.data ?? []).map((r) => r.user_id as string),
        ...(stratUsers.data ?? []).map((r) => r.user_id as string),
      ]),
    ]
    const results: Record<string, unknown>[] = []
    const allTargets: SyncTarget[] = []
    for (const userId of userIds) {
      try {
        const r = await syncUser(adminClient, userId, light)
        allTargets.push(...r.targets)
        results.push({ userId, symbols: r.symbols, synced: r.synced, failed: r.failed })
      } catch (error) {
        console.error('invest-market-sync: user failed', userId, error)
        results.push({ userId, error: String(error).slice(0, 200) })
      }
    }
    const news = light && !withNews ? 0 : await refreshNews(adminClient, allTargets)
    /* Quarter-hour price runs skip benchmarks — a daily close changes
       once a day, not four times an hour. */
    const benchmarks = light && !withNews ? 0 : await syncBenchmarks(adminClient, !light)
    return json({ scanned: results.length, news, benchmarks, results })
  }

  /* sync — caller's book only */
  const authed = await authenticateInvestUser(req, config)
  if (authed instanceof Response) return authed
  const result = await syncUser(authed.adminClient, authed.userId)
  const news = await refreshNews(authed.adminClient, result.targets)
  const benchmarks = await syncBenchmarks(authed.adminClient, false)
  return json({ symbols: result.symbols, synced: result.synced, failed: result.failed, news, benchmarks })
}

Deno.serve(async (req) => withCors(req, await handler(req), CORS))