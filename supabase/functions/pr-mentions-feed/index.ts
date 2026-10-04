import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { assertPublicHttpUrl } from '../pr-fetch-meta/handlers.ts'
import { parseFeedItems, toneCounts, type FeedItem } from './handlers.ts'
import { bilingualBody, sendPortalEmail } from '../_shared/portalNotify.ts'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { activeModelRoute, routeApiKey } from '../_shared/aiRoute.ts'
import { parseToneList, tonePrompt, type PrSentiment } from '../pr-ai/handlers.ts'

/**
 * pr-mentions-feed — poll the RSS/Atom feeds a user saved (Google Alerts,
 * outlet feeds) and log new items as coverage rows in pr_mentions.
 *
 *   POST {}                      → every feed (cron) or the caller's (JWT)
 *   POST { feedId?: string }     → one feed (JWT path only)
 *
 * Auth is dual, matching the monitor-law-changes contract:
 *   - x-trigger-secret === SUPPORT_NOTIFY_SECRET, or bearer === service key
 *     → scheduled sweep over all feeds (pg_cron, migration 0195)
 *   - otherwise a portal JWT with a pr_access grant → the caller's feeds
 *     only, so the "Sync now" button can never touch someone else's rows.
 *
 * Fresh items get a model-guessed tone tag when an AI route resolves —
 * stored with sentiment_auto=true so the UI marks it as machine-suggested.
 * A missing route, key, or flaky reply degrades to 'neutral' and never
 * blocks the insert. Dedupe is the stored URL (Google redirect wrappers are
 * unwrapped first), so repeated polls are no-ops.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-trigger-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FETCH_TIMEOUT_MS = 10_000
const MAX_BYTES = 1024 * 1024
const MAX_ITEMS_PER_FEED = 25
const CRON_LOCK_JOB = 'pr-mentions-sync'
const CRON_LOCK_TTL_SECONDS = 300

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Scheduled-trigger auth: shared secret or the service-role bearer. */
function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && req.headers.get('x-trigger-secret') === sharedSecret) return true
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (token === '') return false
  return token === (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
}

/** Portal auth: signed-in user + pr_access grant → returns the user id. */
async function portalUserId(
  admin: SupabaseClient,
  req: Request,
): Promise<{ userId: string } | { error: Response }> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return { error: json({ error: 'Missing bearer token' }, 401) }
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData?.user) return { error: json({ error: 'Invalid user token' }, 401) }
  const { data: access, error: accessError } = await admin
    .from('pr_access')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return { error: json({ error: accessError.message }, 500) }
  if (!access) return { error: json({ error: 'PR access not granted', code: 'no_access' }, 403) }
  return { userId: userData.user.id }
}

async function fetchFeedXml(url: URL): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'DutivaCoverageBot/1.0 (+https://dutiva.ca)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5',
      },
    })
    if (!res.ok) return null
    /* Redirects land on res.url — a feed must not bounce into a private host. */
    try {
      assertPublicHttpUrl(res.url)
    } catch {
      return null
    }
    const reader = res.body?.getReader()
    if (!reader) return null
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) return null
      chunks.push(value)
    }
    const buf = new Uint8Array(size)
    let off = 0
    for (const c of chunks) {
      buf.set(c, off)
      off += c.byteLength
    }
    return new TextDecoder().decode(buf)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

interface FeedRow {
  id: string
  user_id: string
  url: string
  label: string
}

interface SyncResult {
  feed: string
  added: number
  fresh: FeedItem[]
  error?: string
}

/* ---------- tone tagging ------------------------------------------------ */

type ToneClassifier = (titles: string[]) => Promise<PrSentiment[] | null>

/** One model call per feed batch — headlines go in numbered, one tone word
    per line comes back. Returns null when no route/key/upstream cooperates;
    callers treat that as "leave neutral", never an error. */
async function makeToneClassifier(admin: SupabaseClient): Promise<ToneClassifier | null> {
  const found = await activeModelRoute(admin, ['pr_ai', 'advisor_chat'])
  if ('error' in found) return null
  const key = routeApiKey(found)
  if ('missingSecret' in key) return null
  const { provider } = found
  const apiKey = key.apiKey
  const model = found.modelName
  return async (titles) => {
    if (titles.length === 0) return []
    try {
      const upstream = await postChatCompletion(
        provider,
        apiKey,
        {
          model,
          messages: [{ role: 'user', content: tonePrompt(titles) }],
          temperature: 0.2,
          max_tokens: Math.max(24, titles.length * 8),
        },
        30_000,
      )
      if (!upstream.ok) return null
      const payload = (await upstream.json()) as {
        choices?: { message?: { content?: string } }[]
      }
      return parseToneList(payload.choices?.[0]?.message?.content ?? '', titles.length)
    } catch {
      return null
    }
  }
}

async function syncFeed(
  admin: SupabaseClient,
  feed: FeedRow,
  classify: ToneClassifier | null,
): Promise<SyncResult> {
  let feedUrl: URL
  try {
    feedUrl = assertPublicHttpUrl(feed.url)
  } catch {
    return { feed: feed.id, added: 0, fresh: [], error: 'invalid_url' }
  }
  const xml = await fetchFeedXml(feedUrl)
  if (xml === null) return { feed: feed.id, added: 0, fresh: [], error: 'fetch_failed' }

  const items = parseFeedItems(xml).slice(0, MAX_ITEMS_PER_FEED)

  /* Dedupe: one select of this user's stored URLs, compared in memory. */
  const { data: existing } = await admin
    .from('pr_mentions')
    .select('url')
    .eq('user_id', feed.user_id)
  const known = new Set((existing ?? []).map((r: { url: string }) => r.url))
  const fresh = items.filter((i) => i.link !== '' && !known.has(i.link))

  if (fresh.length > 0) {
    /* Best-effort tone guess — tagged sentiment_auto so the desk shows it
       as a suggestion, not a read. null classifier → all neutral/manual. */
    const tones = classify ? await classify(fresh.map((i) => i.title || i.link)) : null
    fresh.forEach((i, idx) => {
      i.sentiment = tones?.[idx] ?? 'neutral'
      i.sentimentAuto = tones?.[idx] != null
    })
    const rows = fresh.map((i: FeedItem, idx: number) => ({
      user_id: feed.user_id,
      source: i.source || feed.label || 'Feed',
      title: i.title || i.link,
      url: i.link,
      sentiment: tones?.[idx] ?? 'neutral',
      sentiment_auto: tones !== null,
      published_at: i.publishedAt ?? new Date().toISOString(),
    }))
    const { error } = await admin.from('pr_mentions').insert(rows)
    if (error) return { feed: feed.id, added: 0, fresh: [], error: error.message }
  }

  await admin
    .from('pr_feeds')
    .update({ last_synced_at: new Date().toISOString(), last_item_count: fresh.length })
    .eq('id', feed.id)

  return { feed: feed.id, added: fresh.length, fresh }
}

/**
 * One coverage digest per user per day, bilingual (the portals store no
 * locale server-side). Pref/dedupe/provider rules live in sendPortalEmail.
 */
async function sendCoverageDigests(
  admin: SupabaseClient,
  byUser: Map<string, { items: FeedItem[] }>,
): Promise<Record<string, string>> {
  const outcomes: Record<string, string> = {}
  const refDate = new Date().toISOString().slice(0, 10)
  for (const [userId, { items }] of byUser) {
    const shown = items.slice(0, 10)
    /* Tone summary line — only when the model actually tagged this batch.
       No route/key/upstream → no line at all, rather than a fake all-neutral
       "machine" read. */
    const tone = toneCounts(shown)
    const enTone = tone.positive + tone.neutral + tone.negative > 0
      ? [`Tone at a glance: ${tone.positive} positive · ${tone.neutral} neutral · ${tone.negative} negative (auto-tagged — a first guess, not a read).`, '']
      : []
    const frTone = tone.positive + tone.neutral + tone.negative > 0
      ? [`Ton en un coup d’œil : ${tone.positive} positif · ${tone.neutral} neutre · ${tone.negative} négatif (étiquettes automatiques — une première estimation).`, '']
      : []
    const en = [
      `${items.length} new coverage item${items.length === 1 ? '' : 's'} landed in your Dutiva PR desk:`,
      '',
      ...enTone,
      ...shown.map((i) => `• ${i.title || i.link}\n  ${i.source || ''} — ${i.link}`),
      '',
      'Open the desk: https://dutiva.ca/pr/mentions',
    ]
    const fr = [
      `${items.length} nouvelle${items.length === 1 ? '' : 's'} retombée${items.length === 1 ? '' : 's'} dans votre bureau Dutiva PR :`,
      '',
      ...frTone,
      ...shown.map((i) => `• ${i.title || i.link}\n  ${i.source || ''} — ${i.link}`),
      '',
      'Ouvrir le bureau : https://dutiva.ca/pr/mentions',
    ]
    outcomes[userId] = await sendPortalEmail(admin, {
      userId,
      kind: 'pr_coverage',
      refDate,
      subject: `Dutiva PR — new coverage / nouvelles retombées (${items.length})`,
      text: bilingualBody(en, fr),
    })
  }
  return outcomes
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const scheduled = isAuthorizedTrigger(req)
  let userId: string | null = null
  if (!scheduled) {
    const portal = await portalUserId(admin, req)
    if ('error' in portal) return portal.error
    userId = portal.userId
  }

  let feedId: string | null = null
  try {
    const body = await req.json()
    if (typeof body?.feedId === 'string') feedId = body.feedId
  } catch {
    /* empty body = all feeds in scope */
  }

  /* Cron sweep takes a lease so a re-fired schedule doesn't double-run. */
  let instanceId: string | null = null
  if (scheduled) {
    instanceId = crypto.randomUUID()
    const { data: acquired, error: lockError } = await admin.rpc('acquire_cron_lock', {
      p_job_name: CRON_LOCK_JOB,
      p_instance_id: instanceId,
      p_ttl_seconds: CRON_LOCK_TTL_SECONDS,
    })
    if (lockError) {
      console.warn('[pr-mentions-feed] acquire_cron_lock failed; continuing without lock:', lockError.message)
    } else if (!acquired) {
      return json({ skipped: 'locked' })
    }
  }

  try {
    let q = admin.from('pr_feeds').select('id, user_id, url, label')
    if (userId) q = q.eq('user_id', userId)
    if (feedId) q = q.eq('id', feedId)
    const { data: feeds, error } = await q
    if (error) return json({ error: error.message }, 500)

    const classify = await makeToneClassifier(admin)
    const results = []
    const byUser = new Map<string, { items: FeedItem[] }>()
    for (const feed of (feeds ?? []) as FeedRow[]) {
      const r = await syncFeed(admin, feed, classify)
      results.push({ feed: r.feed, added: r.added, error: r.error })
      if (r.fresh.length > 0) {
        const bucket = byUser.get(feed.user_id) ?? { items: [] }
        bucket.items.push(...r.fresh)
        byUser.set(feed.user_id, bucket)
      }
    }
    const emails = await sendCoverageDigests(admin, byUser)
    return json({
      feeds: results.length,
      added: results.reduce((n, r) => n + r.added, 0),
      results,
      emails,
    })
  } finally {
    if (instanceId) {
      await admin.rpc('release_cron_lock', {
        p_job_name: CRON_LOCK_JOB,
        p_instance_id: instanceId,
      })
    }
  }
})
