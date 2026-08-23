import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * PUBLIC (unauthenticated) client error telemetry sink. Deploy with
 * `verify_jwt` off — like resend-webhook / create-public-support-ticket — so
 * `navigator.sendBeacon` can reach it with no auth header (beacons cannot set
 * headers). Storage goes through the ingest_client_error_report() RPC under the
 * service role (migration 0019); there is no anon INSERT policy on the tables.
 *
 * The client (src/lib/errorReporting) already scrubs the payload: route
 * PATTERNS not resolved paths, a coarse user-agent, no DOM/input/token/storage
 * data, and no persistent per-user id. This function re-validates and caps every
 * field defensively — it trusts nothing from the wire.
 *
 * IP handling: the source IP is only ever used to rate-limit this open endpoint.
 * It is keyed with HMAC-SHA256 under a REQUIRED secret pepper (never a committed
 * default) and stored in a separate short-retention limiter table that the RPC
 * purges down to the window — so IPv4's low entropy can't be brute-forced from
 * table access without also holding the secret, and no retained report is
 * linkable to a network beyond the limiter window. The function fails closed if
 * the pepper is unset.
 *
 * Bodies arrive as text/plain (a beacon string), CORS-safelisted so no preflight.
 * Responses are ignored by the beacon: 204 on accept-or-drop, 500 on server
 * misconfiguration or a storage failure (so operational logs expose it).
 *
 * See docs/ERROR_REPORTING.md.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const KINDS = ['route-boundary', 'window-error', 'unhandled-rejection', 'recoverable-error']
const ENVS = ['production', 'preview']
const LOCALES = ['en-CA', 'fr-CA']

/**
 * Allowed scrubbed route labels — mirrors the ROUTE_PATTERNS output set in
 * src/lib/errorReporting/scrubRoute.ts, plus the two unknown sentinels. A route
 * not in this set is coerced to '/unknown', so a client regression or a direct
 * caller can never persist a resolved path like `/app/employees/jane-doe` and
 * defeat the scrubbing control. Keep in sync with scrubRoute.ts (drift only
 * over-scrubs a new pattern to '/unknown' — privacy-safe).
 */
const KNOWN_ROUTES = new Set<string>([
  '/', '/about', '/faq', '/blog', '/pricing', '/templates', '/guides',
  '/guides/template-usage', '/known-limitations', '/legal', '/legal/:slug',
  '/help', '/help/:slug', '/contact', '/status',
  '/fr', '/fr/a-propos', '/fr/faq', '/fr/blogue', '/fr/tarifs', '/fr/modeles',
  '/fr/guides', '/fr/guides/utilisation-des-modeles', '/fr/limites-connues',
  '/fr/juridique', '/fr/juridique/:slug', '/fr/aide', '/fr/aide/:slug',
  '/fr/contact', '/fr/etat',
  '/sign/:token', '/fr/sign/:token',
  '/app/welcome', '/app/auth/confirm', '/app', '/app/home', '/app/advisor',
  '/app/workflows', '/app/cases', '/app/cases/:id', '/app/employees',
  '/app/employees/:id', '/app/compliance', '/app/policies', '/app/templates',
  '/app/reports', '/app/knowledge', '/app/support', '/app/support/requests',
  '/app/support/requests/:id', '/app/support/admin', '/app/support/admin/:id',
  '/app/communications', '/app/compensation', '/app/wellbeing', '/app/tasks',
  '/app/calendar', '/app/memory', '/app/planning', '/app/planning/tasks',
  '/app/planning/calendar', '/app/settings', '/app/settings/memory',
  '/app/settings/memory/people/:id', '/app/settings/memory/cases/:id',
  '/app/settings/memory/conversations/:id', '/app/documents',
  '/app/documents/hr-library', '/app/documents/studio',
  '/app/documents/templates/:id', '/app/documents/generate/:id',
  '/app/documents/:id',
  '/unknown', '/app/:unknown',
])

/**
 * The coarse user-agent format coarseUserAgent() produces (`Chrome/120 macOS`,
 * `Other iOS`, `unknown`, …). Anything else — e.g. a full raw UA slipping
 * through a future client bug — is dropped, so a length cap alone never lets the
 * high-entropy string be persisted.
 */
const COARSE_UA_RE =
  /^(?:(?:Edge|Opera|Samsung|Firefox|Chrome|Safari)\/\d{1,4}|Other)(?: (?:Windows|iOS|macOS|Android|ChromeOS|Linux))?$|^unknown$/

/** Accept only a known scrubbed route label; coerce anything else to '/unknown'. */
function knownRoute(value: unknown): string | null {
  const route = str(value, 200)
  if (route === null) return null
  return KNOWN_ROUTES.has(route) ? route : '/unknown'
}

/** Accept only a coarse UA label; drop anything that isn't already minimized. */
function coarseUa(value: unknown): string | null {
  const ua = str(value, 200)
  return ua && COARSE_UA_RE.test(ua) ? ua : null
}

/**
 * Max accepted request body. The client caps message/stack by UTF-16 code
 * units, but JSON.stringify can encode one unit as up to 6 bytes (control chars
 * → `\uXXXX`), so the reporter's ~5,000 capped units plus the other fields can
 * exceed a tight limit and silently drop valid crash reports. 64 KiB comfortably
 * covers that worst case while still bounding abuse of the open endpoint.
 */
const MAX_BODY_BYTES = 64 * 1024

/**
 * Read the request body incrementally, cancelling the stream as soon as the
 * byte budget is exceeded — so this open, unauthenticated endpoint never buffers
 * or decodes an oversized body (Content-Length can be absent on chunked/HTTP2
 * traffic, and text length would count UTF-16 units, not wire bytes). Returns
 * the decoded text, or null if the body is over budget or unreadable.
 */
async function readCappedText(req: Request, maxBytes: number): Promise<string | null> {
  const body = req.body
  if (!body) return ''
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
  } catch {
    try {
      await reader.cancel()
    } catch {
      /* already closed */
    }
    return null
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

/* Per-IP rate limit, enforced atomically in the RPC. One broken render loop is
   already deduped/capped client-side; this bounds abuse of the open endpoint. */
const RATE_WINDOW_SECONDS = 60
const RATE_LIMIT = 60

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed.slice(0, max)
}

function oneOf(value: unknown, allowed: string[]): string | null {
  return typeof value === 'string' && allowed.includes(value) ? value : null
}

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

const noContent = () => new Response(null, { status: 204, headers: corsHeaders })
const serverError = () => new Response(null, { status: 500, headers: corsHeaders })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  // Required secret pepper for the IP hash — fail closed if absent (never a
  // committed default an attacker could reproduce).
  const pepper = Deno.env.get('ERROR_REPORT_SALT') ?? Deno.env.get('SUPPORT_NOTIFY_SECRET')
  if (!supabaseUrl || !serviceRoleKey || !pepper) {
    console.error('report-error: missing configuration (url/service-role/pepper)')
    return serverError()
  }

  // Read the body with a hard byte cap, cancelling the stream if exceeded, so
  // an oversized body is never fully buffered or decoded (see readCappedText).
  const raw = await readCappedText(req, MAX_BODY_BYTES)
  if (!raw) return noContent()

  let body: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return noContent()
    body = parsed as Record<string, unknown>
  } catch {
    return noContent()
  }

  // Re-validate and cap every field. Anything invalid drops to null; a report
  // with no message is noise.
  const message = str(body.message, 2000)
  if (!message) return noContent()

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const ipHash = await hmacHex(pepper, clientIp(req))

  // Atomic check-and-insert: the RPC takes a per-IP advisory lock, enforces the
  // window, and stores the report in one transaction (see migration 0019).
  const { error } = await admin.rpc('ingest_client_error_report', {
    p_ip_hash: ipHash,
    p_env: oneOf(body.env, ENVS),
    p_release: str(body.release, 64),
    p_route: knownRoute(body.route),
    p_locale: oneOf(body.locale, LOCALES),
    p_kind: oneOf(body.kind, KINDS),
    p_message: message,
    p_stack: str(body.stack, 8000),
    p_user_agent: coarseUa(body.ua),
    p_window_seconds: RATE_WINDOW_SECONDS,
    p_limit: RATE_LIMIT,
  })

  if (error) {
    // Log only non-payload context so a real failure is visible in the function
    // logs rather than silently swallowed behind a 204.
    console.error('report-error: ingest failed', { code: error.code, message: error.message })
    return serverError()
  }

  // The RPC returns 'ok' (stored) or 'rate_limited' (dropped) — both are a 204
  // to the beacon, which ignores the response either way.
  return noContent()
})
