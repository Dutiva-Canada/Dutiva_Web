import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildConsentRecord } from '../_shared/caslConsent.ts'

/**
 * PUBLIC (unauthenticated) beta waiting-list intake for the landing page's
 * #start form and the /beta page.
 *
 * Anti-abuse mirrors create-public-support-ticket, deliberately — this is the
 * other unauthenticated write path on the site, and having the two behave the
 * same way is what makes either of them reviewable:
 *   • a honeypot field real users never see;
 *   • a CAPTCHA (Turnstile/hCaptcha) once CAPTCHA_SECRET_KEY is set — inert
 *     until then, so this ships without it and turns on by config (the same
 *     two-halves rule as the support intake). Added 2026-08-08: without it
 *     the endpoint was an outbound-email amplification primitive (every new
 *     address enqueues a confirmation email).
 *   • per-IP and per-email rate limits backed by beta_signup_intake, which
 *     stores ONLY salted hashes (never a raw IP or email);
 *   • strict validation and length caps.
 *
 * All writes use the service role; there is no anon INSERT policy on
 * beta_signups.
 *
 * A repeat address is answered exactly like a new one. The unique index on
 * lower(email) makes the second insert fail, and that failure is reported as
 * success on purpose: a distinguishable "already signed up" response turns this
 * endpoint into an oracle for whether a given person is on the list.
 *
 * NOTE: this function ran deployed-only for months, with no copy in any repo.
 * It is committed here so it can be reviewed and changed like everything else
 * — see AGENTS.md on the two halves of a server-side change.
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

const PROVINCES = ['on', 'qc', 'fed', 'other'] as const
const LANGUAGES = ['en', 'fr'] as const
const SOURCES = ['landing', 'beta_page', 'campaign'] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Postgres unique-violation; the repeat-signup path. */
const UNIQUE_VIOLATION = '23505'

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

/** Optional free text: trimmed, capped, empty becomes null rather than ''. */
function optionalStr(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return trimmed.slice(0, max)
}

async function sha256hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── CAPTCHA (mirror of src/features/support/captcha.ts and the identical
// block in create-public-support-ticket). Turnstile and hCaptcha share one
// siteverify request/response shape, so the provider is a config value. ──
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
  if (typeof payload !== 'object' || payload === null)
    return { ok: false, reason: 'provider_error' }
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

/** Best-effort client IP from the usual proxy headers. */
function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? 'unknown'
}

/* Looser than the support intake: signing up is a lighter action than opening a
   ticket, and a shared office NAT should not lock colleagues out. Still tight
   enough that scripted list-stuffing is not worth the effort. */
const IP_WINDOW_MIN = 60
const IP_LIMIT = 5
const EMAIL_WINDOW_MIN = 60
const EMAIL_LIMIT = 3

/* The beta accepts 15 individuals/organizations to begin (founder decision,
   2026-08-07). Signup stays OPEN past that — later rows are the waiting list —
   but the workspace gate (0067_beta_cohort_capacity.sql) only admits the first
   15 eligible signups, so the response tells the form which of the two things
   just happened. Keep in sync with src/config/beta.ts BETA_COHORT_LIMIT;
   src/canonicalFacts.test.ts fails on drift. */
const BETA_COHORT_LIMIT = 5

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

  /* Honeypot: pretend success so bots do not learn they were caught. The
     cohort bit is a static false rather than the real count — this path must
     stay free of database work so bots can't generate unthrottled reads. */
  if (typeof body.contact_fax === 'string' && body.contact_fax.trim() !== '') {
    return json({ data: { ok: true, cohort_full: false } })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: 'A valid email address is required.', field: 'email' }, 422)
  }

  /* The form states the visitor will receive product updates; CASL makes that a
     consent event, so it has to be affirmative rather than implied by posting. */
  if (body.consent !== true) {
    return json({ error: 'Please confirm to continue.', field: 'consent' }, 422)
  }

  /* CAPTCHA once configured (mirror of the support intake). After the honeypot
     and the cheap field checks, before any database work — a bot without a
     valid token never reaches the rate-limit queries, the insert, or the
     outbound confirmation email. A hard gate: a configured CAPTCHA that
     quietly passes traffic is worse than none. */
  const ip = clientIp(req)
  if (CAPTCHA_SECRET) {
    const token = typeof body.captcha_token === 'string' ? body.captcha_token : ''
    const verdict = await verifyCaptcha(token, ip)
    if (!verdict.ok) {
      console.error('beta signup captcha rejected', { reason: verdict.reason })
      return json(
        {
          error: 'Human verification failed. Please complete the check and try again.',
          code: verdict.reason,
        },
        403,
      )
    }
  }

  const company = optionalStr(body.company, 200)
  const province =
    typeof body.province === 'string' && body.province.trim() !== ''
      ? oneOf(body.province, PROVINCES, 'other')
      : null
  const language = oneOf(body.language, LANGUAGES, 'en')
  const source = oneOf(body.source, SOURCES, 'landing')

  /* The wording comes from the server's own copy, never from the request:
     evidence a sender was handed by the party it is evidence about is not
     evidence. `language` selects which version was on screen. */
  const consent = buildConsentRecord(language, new Date().toISOString())

  const admin = createClient(supabaseUrl, serviceRoleKey)

  const salt =
    Deno.env.get('PUBLIC_INTAKE_SALT') ?? Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? 'dutiva-intake'
  const ipHash = await sha256hex(`${salt}:ip:${ip}`)
  const emailHash = await sha256hex(`${salt}:email:${email}`)

  const ipSince = new Date(Date.now() - IP_WINDOW_MIN * 60 * 1000).toISOString()
  const emailSince = new Date(Date.now() - EMAIL_WINDOW_MIN * 60 * 1000).toISOString()
  /* The cohort count is measured BEFORE this request's own insert, with one
     formula for every caller. That is what keeps the response oracle-free: a
     repeat address and a new one see the same bit for the same table state, so
     the answer reveals only "does the cohort have room", never whether the
     submitted address was already on the list. Measured-before also means the
     signup that takes the last seat is still told the cohort had room — which
     is what happened. Same eligibility filter as the workspace gate (0067):
     declined/bounced rows hold no seat. */
  const [{ count: ipCount }, { count: emailCount }, { count: cohortCount }] = await Promise.all([
    admin
      .from('beta_signup_intake')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', ipSince),
    admin
      .from('beta_signup_intake')
      .select('id', { count: 'exact', head: true })
      .eq('email_hash', emailHash)
      .gte('created_at', emailSince),
    admin
      .from('beta_signups')
      .select('id', { count: 'exact', head: true })
      .not('status', 'in', '(declined,bounced)'),
  ])
  if ((ipCount ?? 0) >= IP_LIMIT || (emailCount ?? 0) >= EMAIL_LIMIT) {
    return json(
      {
        error:
          'Too many requests in a short time. Please try again later, or email support@dutiva.ca.',
      },
      429,
    )
  }

  /* Null count (query failure) falls open to "room left": the bit only picks
     the form's success wording, while admission itself is enforced by the
     workspace gate — over-promising here mislabels one edge case, whereas
     failing the signup over it would lose a real lead. */
  const cohortFull = (cohortCount ?? 0) >= BETA_COHORT_LIMIT

  const { error: insertError } = await admin.from('beta_signups').insert({
    email,
    company,
    province,
    language,
    source,
    /* Recorded, not just checked (0037_beta_signups_consent_record.sql). CASL
       puts the burden of proof on the sender, so the answer has to outlive the
       request that carried it. */
    ...consent,
  })

  /* A repeat address is a success from the visitor's point of view, and saying
     so plainly would leak list membership. Anything else is a real failure. */
  const isDuplicate = insertError?.code === UNIQUE_VIOLATION
  if (insertError && !isDuplicate) {
    return json({ error: insertError.message ?? 'Could not record the signup.' }, 500)
  }

  /* Recorded after acceptance, so a rejected submission does not consume the
     visitor's own rate-limit budget. */
  await admin.from('beta_signup_intake').insert({ ip_hash: ipHash, email_hash: emailHash })

  /* Alert the operator through the existing outbox (support-notify drains it).
     Only for genuinely new signups — a repeat submission is not news, and
     alerting on it would leak that the address was already on the list to
     anyone watching the operator's inbox.

     ticket_id is null: a beta signup is not a support ticket. The payload
     carries jurisdiction and source only; the address stays in beta_signups.
     A failure here must not fail the signup — the row is already saved, and the
     visitor's confirmation should not depend on the operator's mail. */
  if (!isDuplicate) {
    const { error: notifyError } = await admin.from('support_notifications').insert([
      {
        ticket_id: null,
        kind: 'beta_signup',
        audience: 'operator',
        recipient: OPERATOR_EMAIL,
        language: 'en',
        payload: { province: province ?? undefined, source },
      },
      {
        /* Confirmation to the signer, in the language they used. Empty payload:
           the address is the recipient and nothing else is needed, so nothing
           else is stored. */
        ticket_id: null,
        kind: 'beta_confirmation',
        audience: 'customer',
        recipient: email,
        language,
        payload: {},
      },
    ])
    if (notifyError)
      console.error('create-beta-signup: could not enqueue alert', notifyError.message)
  }

  return json({ data: { ok: true, cohort_full: cohortFull } })
})
