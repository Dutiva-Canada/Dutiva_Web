import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * PUBLIC (unauthenticated) support intake. This is the signed-out path for the
 * flows that must not sit behind a login — accessibility feedback, privacy
 * requests, security reports — plus general product/sales questions. It is a
 * separate function from create-support-ticket precisely because it is
 * unauthenticated: it accepts only the `allowPublic` categories, has its own
 * anti-abuse controls, and never touches workspace or diagnostic context.
 *
 * Anti-abuse:
 *   • a honeypot field that real users never see;
 *   • a CAPTCHA (Turnstile/hCaptcha) once CAPTCHA_SECRET_KEY is set — inert
 *     until then, so merging this did not change the live endpoint;
 *   • per-IP and per-email rate limits backed by support_public_intake, which
 *     stores ONLY salted hashes (never the raw IP or email);
 *   • strict field validation and length caps.
 *
 * All writes use the service role (there is no anon INSERT policy on
 * support_tickets). A public ticket has no requester_user_id and no workspace,
 * so under RLS it is visible to admins only — the requester is updated by email.
 *
 * Mirrors src/config/support.ts (public categories, restricted set),
 * src/features/support/triage.ts (suggestPriority), and
 * src/features/support/captcha.ts (siteverify handling) — keep in sync.
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

const CATEGORIES = [
  'account_access', 'billing', 'technical', 'product_question', 'privacy',
  'security', 'accessibility', 'complaint', 'sales', 'other',
] as const
type Category = (typeof CATEGORIES)[number]

/** Only these may be submitted without an account (mirror allowPublic in config). */
const PUBLIC_CATEGORIES = new Set<Category>([
  'product_question', 'privacy', 'security', 'accessibility', 'sales',
])
/** Restricted handling: requester + admin only, off the ordinary product queue. */
const RESTRICTED_CATEGORIES = new Set<Category>(['privacy', 'security', 'accessibility', 'complaint'])

const IMPACTS = ['blocking', 'major', 'minor', 'none'] as const
type Impact = (typeof IMPACTS)[number]
const URGENCIES = ['urgent', 'soon', 'whenever'] as const
type Urgency = (typeof URGENCIES)[number]
const RESPONSE_METHODS = ['email', 'scheduled_call'] as const
const LANGUAGES = ['en', 'fr'] as const

const PRIORITIES = ['low', 'standard', 'high', 'critical'] as const
const PAID_FLOOR_PLANS = new Set(['growth', 'pro'])
const RESTRICTED_FROM_PAID_FLOOR = new Set<Category>([
  'privacy', 'security', 'accessibility', 'complaint',
])

function applyPaidSupportFloor(priority: string, plan: string | null, category: Category): string {
  if (!plan || !PAID_FLOOR_PLANS.has(plan)) return priority
  if (RESTRICTED_FROM_PAID_FLOOR.has(category)) return priority
  if (priority === 'high' || priority === 'critical') return priority
  return 'high'
}

function normalizePlan(value: unknown): string | null {
  const plan = String(value ?? '').toLowerCase()
  return plan === 'free' || plan === 'starter' || plan === 'growth' || plan === 'pro' ? plan : null
}

/** Server-side priority — capped at 'high'; 'critical' is a human triage call. */
function suggestPriority(category: Category, impact: Impact, urgency: Urgency): string {
  const impactRank = impact === 'blocking' ? 2 : impact === 'major' || impact === 'minor' ? 1 : 0
  const categoryFloor =
    category === 'security'
      ? 2
      : category === 'account_access' || category === 'accessibility' ||
          category === 'privacy' || category === 'billing' || category === 'complaint'
        ? 1
        : 0
  let rank = Math.max(impactRank, categoryFloor)
  if (urgency === 'urgent' && impact !== 'none') rank += 1
  return PRIORITIES[Math.min(rank, 2)]
}

/** Customer acknowledgement kind by category (mirror notifications.ts). */
function acknowledgementKind(category: Category): string {
  if (category === 'privacy') return 'privacy_ack'
  if (category === 'security') return 'security_ack'
  if (category === 'accessibility') return 'accessibility_ack'
  if (category === 'complaint') return 'complaint_ack'
  return 'ticket_received'
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length >= 1 && trimmed.length <= max ? trimmed : null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function sha256hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Best-effort client IP from the usual proxy headers. */
function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? 'unknown'
}

const IP_WINDOW_MIN = 15
const IP_LIMIT = 3
const EMAIL_WINDOW_MIN = 60
const EMAIL_LIMIT = 3

// ── CAPTCHA (mirror of src/features/support/captcha.ts) ──────────────────
// Turnstile and hCaptcha share one siteverify request/response shape, so the
// provider is a config value rather than a second code path.

const CAPTCHA_VERIFY_ENDPOINTS: Record<string, string> = {
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  hcaptcha: 'https://api.hcaptcha.com/siteverify',
}

const CAPTCHA_SECRET = Deno.env.get('CAPTCHA_SECRET_KEY') ?? ''
const CAPTCHA_PROVIDER = (() => {
  const raw = (Deno.env.get('CAPTCHA_PROVIDER') ?? '').trim().toLowerCase()
  return raw === 'hcaptcha' ? 'hcaptcha' : 'turnstile'
})()

type CaptchaResult = { ok: true } | { ok: false; reason: string }

function interpretSiteverify(payload: unknown): CaptchaResult {
  if (typeof payload !== 'object' || payload === null) return { ok: false, reason: 'provider_error' }
  const record = payload as { success?: unknown; 'error-codes'?: unknown }
  if (record.success === true) return { ok: true }
  const codes = Array.isArray(record['error-codes'])
    ? record['error-codes'].filter((c): c is string => typeof c === 'string')
    : []
  // Our own misconfiguration ranks above the caller's token — a wrong secret
  // makes every token "fail", and blaming the token hides the real cause.
  if (codes.includes('missing-input-secret') || codes.includes('invalid-input-secret')) {
    return { ok: false, reason: 'bad_secret' }
  }
  if (codes.includes('missing-input-response')) return { ok: false, reason: 'missing_token' }
  if (codes.includes('timeout-or-duplicate')) return { ok: false, reason: 'duplicate_token' }
  if (codes.includes('invalid-input-response')) return { ok: false, reason: 'invalid_token' }
  if (codes.includes('bad-request') || codes.includes('internal-error')) {
    return { ok: false, reason: 'provider_error' }
  }
  return { ok: false, reason: 'invalid_token' }
}

async function verifyCaptcha(token: string, remoteIp: string): Promise<CaptchaResult> {
  if (!CAPTCHA_SECRET) return { ok: false, reason: 'bad_secret' }
  if (!token) return { ok: false, reason: 'missing_token' }
  const form = new URLSearchParams({ secret: CAPTCHA_SECRET, response: token })
  if (remoteIp && remoteIp !== 'unknown') form.set('remoteip', remoteIp)
  try {
    const response = await fetch(CAPTCHA_VERIFY_ENDPOINTS[CAPTCHA_PROVIDER]!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    if (!response.ok) return { ok: false, reason: 'provider_error' }
    return interpretSiteverify(await response.json())
  } catch {
    return { ok: false, reason: 'provider_error' }
  }
}

const OPERATOR_EMAIL = Deno.env.get('SUPPORT_OPERATOR_EMAIL') ?? 'support@dutiva.ca'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  // Honeypot: a hidden field real users never fill. Pretend success so bots
  // don't learn they were caught, but write nothing.
  if (typeof body.contact_fax === 'string' && body.contact_fax.trim() !== '') {
    return json({ data: { ok: true } })
  }

  const category = oneOf<Category>(body.category, CATEGORIES, 'other')
  if (!PUBLIC_CATEGORIES.has(category)) {
    return json({ error: 'This request type requires a signed-in account.', field: 'category' }, 400)
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: 'A valid email address is required.', field: 'email' }, 422)
  }
  const subject = str(body.subject, 200)
  const description = str(body.description, 20000)
  if (!subject) return json({ error: 'A subject is required.', field: 'subject' }, 422)
  if (!description) return json({ error: 'A description is required.', field: 'description' }, 422)
  if (body.consent !== true) return json({ error: 'Please confirm to continue.', field: 'consent' }, 422)

  const impact = oneOf<Impact>(body.impact, IMPACTS, 'none')
  const urgency = oneOf<Urgency>(body.urgency, URGENCIES, 'whenever')
  const language = oneOf(body.language, LANGUAGES, 'en')
  const preferredResponseMethod = oneOf(body.preferred_response_method, RESPONSE_METHODS, 'email')

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Rate limiting on salted hashes (never the raw IP/email).
  const salt = Deno.env.get('PUBLIC_INTAKE_SALT') ?? Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? 'dutiva-intake'
  const ip = clientIp(req)
  const ipHash = await sha256hex(`${salt}:ip:${ip}`)
  const emailHash = await sha256hex(`${salt}:email:${email}`)

  const ipSince = new Date(Date.now() - IP_WINDOW_MIN * 60 * 1000).toISOString()
  const emailSince = new Date(Date.now() - EMAIL_WINDOW_MIN * 60 * 1000).toISOString()
  const [{ count: ipCount }, { count: emailCount }] = await Promise.all([
    admin.from('support_public_intake').select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash).gte('created_at', ipSince),
    admin.from('support_public_intake').select('id', { count: 'exact', head: true })
      .eq('email_hash', emailHash).gte('created_at', emailSince),
  ])
  if ((ipCount ?? 0) >= IP_LIMIT || (emailCount ?? 0) >= EMAIL_LIMIT) {
    return json({ error: 'Too many requests in a short time. Please try again later, or email support@dutiva.ca.' }, 429)
  }

  // CAPTCHA last among the gates, because it is the only one that costs a
  // network round-trip: anyone already over the per-IP/per-email limit is
  // turned away above without us calling the provider. Note this does not bound
  // *failed* attempts — support_public_intake only records accepted ones — so a
  // script can still burn siteverify calls. That is acceptable (siteverify is
  // free and unmetered) and no worse than the validation failures that were
  // already unlimited; it is not a claim that this endpoint is flood-proof.
  //
  // Skipped entirely when no secret is configured — that is how this shipped,
  // and the honeypot + rate limits remain in force. Once the secret IS set it
  // is a hard gate: a configured CAPTCHA that quietly passes traffic is worse
  // than none, because the operator believes they are protected.
  if (CAPTCHA_SECRET) {
    const token = typeof body.captcha_token === 'string' ? body.captcha_token : ''
    const verdict = await verifyCaptcha(token, ip)
    if (!verdict.ok) {
      // 403 is reserved for exactly this, so the client can tell the customer
      // to redo the check rather than showing a generic failure.
      console.error('public intake captcha rejected', { reason: verdict.reason })
      return json(
        { error: 'Human verification failed. Please complete the check and try again.', code: verdict.reason },
        403,
      )
    }
  }

  const suggested = suggestPriority(category, impact, urgency)
  let requesterPlan: string | null = null
  if (email) {
    const { data: profile } = await admin
      .from('profiles')
      .select('plan')
      .ilike('account_email', email)
      .maybeSingle()
    requesterPlan = normalizePlan(profile?.plan)
  }
  const priority = applyPaidSupportFloor(suggested, requesterPlan, category)
  const restricted = RESTRICTED_CATEGORIES.has(category)

  const { data: ticket, error: insertError } = await admin
    .from('support_tickets')
    .insert({
      requester_user_id: null,
      requester_email: email,
      workspace_id: null,
      category,
      subject,
      description,
      impact,
      urgency,
      language,
      preferred_response_method: preferredResponseMethod,
      source: 'public_form',
      priority,
      restricted,
      status: 'new',
      requester_plan: requesterPlan,
    })
    .select('id, public_reference')
    .single()
  if (insertError || !ticket) {
    return json({ error: insertError?.message ?? 'Could not create the request.' }, 500)
  }

  await admin.from('support_messages').insert({
    ticket_id: ticket.id,
    author_user_id: null,
    author_role: 'customer',
    body: description,
    is_internal_note: false,
  })
  await admin.from('support_ticket_events').insert({
    ticket_id: ticket.id,
    actor_user_id: null,
    event_type: 'created',
    data: { source: 'public_form' },
  })

  // Record the rate-limit row (hashes only) after acceptance.
  await admin.from('support_public_intake').insert({ ip_hash: ipHash, email_hash: emailHash })

  // Enqueue notifications to the outbox (support-notify sends them). The
  // acknowledgement goes to the address the requester supplied.
  await admin.from('support_notifications').insert([
    {
      ticket_id: ticket.id,
      kind: acknowledgementKind(category),
      audience: 'customer',
      recipient: email,
      language,
      payload: { reference: ticket.public_reference, category },
    },
    {
      ticket_id: ticket.id,
      kind: 'operator_alert',
      audience: 'operator',
      recipient: OPERATOR_EMAIL,
      language: 'en',
      payload: { reference: ticket.public_reference, category, priority },
    },
  ])

  return json({ data: { public_reference: ticket.public_reference } })
})
