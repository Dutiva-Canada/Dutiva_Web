import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { assertPublicHttpUrl } from '../pr-fetch-meta/handlers.ts'
import { dedupeFeedItems, negativeAutoItems, parseFeedItems, toneCounts, type FeedItem } from './handlers.ts'
import { bilingualBody, sendPortalEmail } from '../_shared/portalNotify.ts'
import { postChatCompletion } from '../_shared/modelUpstream.ts'
import { activeModelRoute, routeApiKey } from '../_shared/aiRoute.ts'
import {
  claimAiUsage,
  finalizeAiUsage,
  prAiPolicy,
  type UsageDbClient,
} from '../_shared/aiUsage.ts'
import { parseToneList, tonePrompt, type PrSentiment } from '../pr-ai/handlers.ts'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'
import { secretEquals } from '../_shared/secretEqual.ts'

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

const CORS = { allowHeaders: 'authorization, x-client-info, apikey, content-type, x-trigger-secret' }
const corsHeaders = makeCorsHeaders(CORS)

const FETCH_TIMEOUT_MS = 10_000
const MAX_BYTES = 1024 * 1024
const MAX_ITEMS_PER_FEED = 25
const CRON_LOCK_JOB = 'pr-mentions-sync'
const CRON_LOCK_TTL_SECONDS = 300

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

/** Scheduled-trigger auth: shared secret or the service-role bearer. */
function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && secretEquals(req.headers.get('x-trigger-secret') ?? '', sharedSecret)) return true
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (token === '') return false
  return secretEquals(token, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
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
    /* Manual redirect loop — every hop re-validates through
       assertPublicHttpUrl, so a feed can't bounce into a private host on
       an intermediate leg. */
    let target = url
    let res: Response | null = null
    for (let hops = 0; hops < 5; hops++) {
      const r = await fetch(target, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'DutivaCoverageBot/1.0 (+https://dutiva.ca)',
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5',
        },
      })
      const loc = r.headers.get('location')
      if (r.status >= 300 && r.status < 400 && loc) {
        await r.body?.cancel()
        try {
          target = assertPublicHttpUrl(new URL(loc, target).toString())
        } catch {
          return null
        }
        continue
      }
      res = r
      break
    }
    if (!res || !res.ok) return null
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

type ToneClassifier = (userId: string, titles: string[]) => Promise<(PrSentiment | null)[] | null>

/** One model call per feed batch — headlines go in numbered, one tone word
    per line comes back. Returns null when no route/key/upstream cooperates;
    callers treat that as "leave neutral", never an error. Each classify call
   claims a pr_ai usage slot — a denied or unreachable guardrail degrades
   the same way (untagged ingest beats an unmetered call). */
async function makeToneClassifier(admin: SupabaseClient): Promise<ToneClassifier | null> {
  const found = await activeModelRoute(admin, ['pr_ai', 'advisor_chat'])
  if ('error' in found) return null
  const key = routeApiKey(found)
  if ('missingSecret' in key) return null
  const { provider, providerKey } = found
  const apiKey = key.apiKey
  const model = found.modelName
  return async (userId, titles) => {
    if (titles.length === 0) return []
    const decision = await claimAiUsage(admin as unknown as UsageDbClient, prAiPolicy(), {
      userId,
      organizationId: null,
      provider: providerKey,
      model,
    })
    if (decision.kind !== 'allowed') {
      if (decision.kind === 'unavailable') {
        console.error('[pr-mentions-feed] usage guardrail unavailable:', decision.reason)
      }
      return null
    }
    const t0 = Date.now()
    let ok = false
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
      const tones = parseToneList(payload.choices?.[0]?.message?.content ?? '', titles.length)
      ok = true
      return tones
    } catch {
      return null
    } finally {
      void finalizeAiUsage(admin as unknown as UsageDbClient, decision.claimId, {
        status: ok ? 'completed' : 'failed',
        latencyMs: Date.now() - t0,
      })
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

  /* Dedupe: one select of this user's stored urls + linkless titles,
     compared in memory; dedupeFeedItems also drops dupes inside the batch
     itself (two items sharing a link or a linkless title). */
  const { data: existing } = await admin
    .from('pr_mentions')
    .select('url, title')
    .eq('user_id', feed.user_id)
  const urls = new Set<string>()
  const linklessTitles = new Set<string>()
  for (const r of (existing ?? []) as { url: string; title: string }[]) {
    if (r.url !== '') urls.add(r.url)
    else linklessTitles.add(r.title.trim().toLowerCase())
  }
  const fresh = dedupeFeedItems(items, { urls, linklessTitles })

  const landed: FeedItem[] = []
  let syncError: string | undefined
  if (fresh.length > 0) {
    /* Best-effort tone guess — tagged sentiment_auto so the desk shows it
       as a suggestion, not a read. null classifier or a null slot → neutral
       and NOT auto-tagged: a padded guess is not a machine read. */
    const tones = classify
      ? await classify(feed.user_id, fresh.map((i) => i.title || i.link))
      : null
    fresh.forEach((i, idx) => {
      i.sentiment = tones?.[idx] ?? 'neutral'
      i.sentimentAuto = tones?.[idx] != null
    })
    for (const [idx, i] of fresh.entries()) {
      const { error } = await admin.from('pr_mentions').insert({
        user_id: feed.user_id,
        source: i.source || feed.label || 'Feed',
        title: i.title || i.link,
        url: i.link,
        sentiment: tones?.[idx] ?? 'neutral',
        sentiment_auto: tones?.[idx] != null,
        published_at: i.publishedAt ?? new Date().toISOString(),
      })
      if (error) {
        /* A racing sync (manual "Sync now" vs the cron sweep) can land the
           same URL after the dedupe read — the unique index rejects it;
           skip the row rather than failing the feed. */
        if (error.code === '23505') continue
        syncError = error.message
        break
      }
      landed.push(i)
    }
  }

  await admin
    .from('pr_feeds')
    .update({ last_synced_at: new Date().toISOString(), last_item_count: landed.length })
    .eq('id', feed.id)

  return { feed: feed.id, added: landed.length, fresh: landed, error: syncError }
}

/**
 * Negative-coverage interrupt — fires in the same run that ingested the
 * item, not in tomorrow's digest. Kind 'pr_coverage_alert' shares the 'pr'
 * surface opt-out but dedupes on its own log row, so a hostile piece can
 * reach the desk even when the daily digest already went out. Only fires
 * on auto-tagged negatives: an untagged batch never claims a machine read.
 */
async function sendNegativeAlerts(
  admin: SupabaseClient,
  byUser: Map<string, { items: FeedItem[] }>,
): Promise<Record<string, string>> {
  const outcomes: Record<string, string> = {}
  for (const [userId, { items }] of byUser) {
    const negatives = negativeAutoItems(items)
    if (negatives.length === 0) continue
    const shown = negatives.slice(0, 5)
    const itemLine = (i: FeedItem) =>
      `• ${i.title || i.link}\n  ${i.source || ''}${i.link ? ` — ${i.link}` : ''}`
    const en = [
      `${negatives.length} coverage item${negatives.length === 1 ? '' : 's'} just landed that the desk tagged negative:`,
      '',
      ...shown.map(itemLine),
      '',
      'Auto-tagged — a first guess, not a read. Worth a look now rather than in tomorrow\'s digest.',
      'Review it: https://dutiva.ca/pr/mentions',
    ]
    const fr = [
      `${negatives.length} retombée${negatives.length === 1 ? '' : 's'} vient${negatives.length === 1 ? '' : 'nent'} d’arriver, étiquetée${negatives.length === 1 ? '' : 's'} négative${negatives.length === 1 ? '' : 's'} par le bureau :`,
      '',
      ...shown.map(itemLine),
      '',
      'Étiquette automatique — une première estimation, pas un verdict. À regarder maintenant plutôt que dans le résumé de demain.',
      'Voir le bureau : https://dutiva.ca/pr/mentions',
    ]
    outcomes[userId] = await sendPortalEmail(admin, {
      userId,
      kind: 'pr_coverage_alert',
      subject: `Dutiva PR — coverage to check now / retombées à regarder (${negatives.length})`,
      text: bilingualBody(en, fr),
    })
  }
  return outcomes
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
    const itemLine = (i: FeedItem) =>
      `• ${i.title || i.link}\n  ${i.source || ''}${i.link ? ` — ${i.link}` : ''}`
    const en = [
      `${items.length} new coverage item${items.length === 1 ? '' : 's'} landed in your Dutiva PR desk:`,
      '',
      ...enTone,
      ...shown.map(itemLine),
      '',
      'Open the desk: https://dutiva.ca/pr/mentions',
    ]
    const fr = [
      `${items.length} nouvelle${items.length === 1 ? '' : 's'} retombée${items.length === 1 ? '' : 's'} dans votre bureau Dutiva PR :`,
      '',
      ...frTone,
      ...shown.map(itemLine),
      '',
      'Ouvrir le bureau : https://dutiva.ca/pr/mentions',
    ]
    outcomes[userId] = await sendPortalEmail(admin, {
      userId,
      kind: 'pr_coverage',
      subject: `Dutiva PR — new coverage / nouvelles retombées (${items.length})`,
      text: bilingualBody(en, fr),
    })
  }
  return outcomes
}

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
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
    /* Emails only fire on the cron sweep, never on "Sync now" — the person
       pressing it is already looking at the desk, and a 1-item manual
       digest would burn the day's dedupe slot before the sweep can report
       coverage they haven't seen. */
    const alerts = scheduled ? await sendNegativeAlerts(admin, byUser) : {}
    const emails = scheduled ? await sendCoverageDigests(admin, byUser) : {}
    return json({
      feeds: results.length,
      added: results.reduce((n, r) => n + r.added, 0),
      results,
      alerts,
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
}

Deno.serve(async (req) => withCors(req, await handler(req), CORS))