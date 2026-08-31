import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { parseEvent } from '../_shared/supportAnalytics.ts'

/**
 * Support analytics event sink (TODO.md D2). Receives fire-and-forget
 * analytics events from the client (helpfulness votes, Help Centre searches,
 * article views, ticket submissions, ticket status changes) and inserts them
 * into `support_analytics_events` (raw, 90-day retention).
 *
 * Same inert-unless-configured discipline as report-error: the function
 * requires SUPABASE_SERVICE_ROLE_KEY to insert (RLS blocks all client
 * access), and the client module gates on VERCEL_ENV so nothing is sent in
 * dev, tests, or a development deploy. Pinned to ca-central-1 via
 * `forceFunctionRegion` on the client side (same as report-error).
 *
 * Privacy model: see docs/SUPPORT_ANALYTICS.md §2. No user_id is ever
 * stored — only workspace_id (the organization) for authenticated events,
 * and a daily-rotated opaque visitor id for anonymous Help Centre events.
 *
 * The function accepts an array of events (batch) or a single event, to
 * support the client's fire-and-forget queue without N round-trips per page.
 * A batch that contains some invalid events inserts the valid ones and
 * silently drops the invalid ones — analytics is best-effort, never blocking.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Limiter window, per source. Matches report-error's shape (migration 0051). */
const RATE_WINDOW_SECONDS = 60
/**
 * Events — not requests — permitted per window per source. A request may carry
 * 50, so counting requests would permit 50x this. 120/minute is far above real
 * browsing (a page view is one event) and far below anything worth flooding.
 */
const RATE_LIMIT = 120

/** Keyed hash of the IP: HMAC-SHA256(pepper, ip). Requires a real secret. */
async function hmacHex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Best-effort client IP from the usual proxy headers. */
function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? 'unknown'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  // Required pepper for the IP hash. Fail closed rather than fall back to a
  // committed default an attacker could reproduce — the raw IP is never stored,
  // so without a secret there is no honest way to key the limiter.
  const pepper = Deno.env.get('ERROR_REPORT_SALT') ?? Deno.env.get('SUPPORT_NOTIFY_SECRET')
  if (!supabaseUrl || !serviceRoleKey || !pepper) {
    console.error('[support-analytics-event] missing configuration (url/service-role/pepper)')
    return json({ error: 'Server configuration missing' }, 500)
  }
  const ipHash = await hmacHex(pepper, clientIp(req))

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  // Accept either a single event object or { events: [...] }
  let rawEvents: unknown[]
  if (Array.isArray(payload)) {
    rawEvents = payload
  } else if (
    typeof payload === 'object' &&
    payload !== null &&
    Array.isArray((payload as Record<string, unknown>).events)
  ) {
    rawEvents = (payload as Record<string, unknown>).events as unknown[]
  } else if (typeof payload === 'object' && payload !== null) {
    rawEvents = [payload]
  } else {
    return json({ error: 'Expected an event or array of events' }, 400)
  }

  if (rawEvents.length === 0) return json({ data: { inserted: 0 } })
  if (rawEvents.length > 50) return json({ error: 'Too many events in one batch (max 50)' }, 413)

  const now = new Date()
  const rows = rawEvents
    .map((raw) => parseEvent(raw, now))
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .map((e) => ({
      event_type: e.event_type,
      workspace_id: e.workspace_id ?? null,
      anonymous_visitor_id: e.anonymous_visitor_id ?? null,
      article_slug: e.article_slug ?? null,
      search_query: e.search_query ?? null,
      search_result_count: e.search_result_count ?? null,
      vote_value: e.vote_value ?? null,
      ticket_reference: e.ticket_reference ?? null,
      ticket_category: e.ticket_category ?? null,
      ticket_source: e.ticket_source ?? null,
      locale: e.locale ?? null,
      web_vital_name: e.web_vital_name ?? null,
      web_vital_value: e.web_vital_value ?? null,
      web_vital_rating: e.web_vital_rating ?? null,
      page_path: e.page_path ?? null,
      occurred_at: e.occurred_at,
    }))

  if (rows.length === 0) return json({ data: { inserted: 0 } })

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Rate-limit check + insert in one transaction (migration 0051). Counts
  // EVENTS rather than requests: a request may carry 50, so a request-counted
  // limit would permit 50x the intended write volume.
  const { data: outcome, error } = await admin.rpc('ingest_support_analytics_events', {
    p_ip_hash: ipHash,
    p_events: rows,
    p_window_seconds: RATE_WINDOW_SECONDS,
    p_limit: RATE_LIMIT,
  })
  if (error) {
    console.error('[support-analytics-event] ingest failed:', error.message)
    return json({ error: 'Insert failed' }, 500)
  }

  // 'rate_limited' is not an error the caller can act on — the client is
  // fire-and-forget and swallows everything anyway. Report it as accepted-but-
  // dropped so the shape stays stable, and log it so a real flood is visible.
  if (outcome === 'rate_limited') {
    console.warn('[support-analytics-event] rate limited a batch of', rows.length)
    return json({ data: { inserted: 0, rate_limited: true } })
  }

  return json({ data: { inserted: rows.length } })
})
