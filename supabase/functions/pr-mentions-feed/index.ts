import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { assertPublicHttpUrl } from '../pr-fetch-meta/handlers.ts'
import { parseFeedItems, type FeedItem } from './handlers.ts'

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
 * New items land as neutral coverage; dedupe is the stored URL (Google
 * redirect wrappers are unwrapped first), so repeated polls are no-ops.
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

async function syncFeed(
  admin: SupabaseClient,
  feed: FeedRow,
): Promise<{ feed: string; added: number; error?: string }> {
  let feedUrl: URL
  try {
    feedUrl = assertPublicHttpUrl(feed.url)
  } catch {
    return { feed: feed.id, added: 0, error: 'invalid_url' }
  }
  const xml = await fetchFeedXml(feedUrl)
  if (xml === null) return { feed: feed.id, added: 0, error: 'fetch_failed' }

  const items = parseFeedItems(xml).slice(0, MAX_ITEMS_PER_FEED)

  /* Dedupe: one select of this user's stored URLs, compared in memory. */
  const { data: existing } = await admin
    .from('pr_mentions')
    .select('url')
    .eq('user_id', feed.user_id)
  const known = new Set((existing ?? []).map((r: { url: string }) => r.url))
  const fresh = items.filter((i) => i.link !== '' && !known.has(i.link))

  if (fresh.length > 0) {
    const rows = fresh.map((i: FeedItem) => ({
      user_id: feed.user_id,
      source: i.source || feed.label || 'Feed',
      title: i.title || i.link,
      url: i.link,
      sentiment: 'neutral',
      published_at: i.publishedAt ?? new Date().toISOString(),
    }))
    const { error } = await admin.from('pr_mentions').insert(rows)
    if (error) return { feed: feed.id, added: 0, error: error.message }
  }

  await admin
    .from('pr_feeds')
    .update({ last_synced_at: new Date().toISOString(), last_item_count: fresh.length })
    .eq('id', feed.id)

  return { feed: feed.id, added: fresh.length }
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

    const results = []
    for (const feed of (feeds ?? []) as FeedRow[]) {
      results.push(await syncFeed(admin, feed))
    }
    return json({
      feeds: results.length,
      added: results.reduce((n, r) => n + r.added, 0),
      results,
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
