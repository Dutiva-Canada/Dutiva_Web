import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'
import {
  acknowledgementKind,
  applyPaidSupportFloor,
  CAPTCHA_VERIFY_ENDPOINTS,
  CATEGORIES,
  type CaptchaResult,
  type Category,
  clientIp,
  EMAIL_RE,
  type Impact,
  IMPACTS,
  interpretSiteverify,
  LANGUAGES,
  normalizePlan,
  oneOf,
  PUBLIC_CATEGORIES,
  RESPONSE_METHODS,
  RESTRICTED_CATEGORIES,
  sha256hex,
  str,
  suggestPriority,
  type Urgency,
  URGENCIES,
} from './intakeLogic.ts'

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

const corsHeaders = makeCorsHeaders()
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

const IP_WINDOW_MIN = 15
const IP_LIMIT = 3
const EMAIL_WINDOW_MIN = 60
const EMAIL_LIMIT = 3

/* CAPTCHA env reads stay here — intakeLogic holds only the pure parts
   (endpoint table, verdict interpretation) so it runs in plain vitest. */
const CAPTCHA_SECRET = Deno.env.get('CAPTCHA_SECRET_KEY') ?? ''
const CAPTCHA_PROVIDER = (() => {
  const raw = (Deno.env.get('CAPTCHA_PROVIDER') ?? '').trim().toLowerCase()
  return raw === 'hcaptcha' ? 'hcaptcha' : 'turnstile'
})()

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

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
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
    return json(
      { error: 'This request type requires a signed-in account.', field: 'category' },
      400,
    )
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: 'A valid email address is required.', field: 'email' }, 422)
  }
  const subject = str(body.subject, 200)
  const description = str(body.description, 20000)
  if (!subject) return json({ error: 'A subject is required.', field: 'subject' }, 422)
  if (!description) return json({ error: 'A description is required.', field: 'description' }, 422)
  if (body.consent !== true)
    return json({ error: 'Please confirm to continue.', field: 'consent' }, 422)

  const impact = oneOf<Impact>(body.impact, IMPACTS, 'none')
  const urgency = oneOf<Urgency>(body.urgency, URGENCIES, 'whenever')
  const language = oneOf(body.language, LANGUAGES, 'en')
  const preferredResponseMethod = oneOf(body.preferred_response_method, RESPONSE_METHODS, 'email')

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Rate limiting on salted hashes (never the raw IP/email).
  const salt =
    Deno.env.get('PUBLIC_INTAKE_SALT') ?? Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? 'dutiva-intake'
  const ip = clientIp(req)
  const ipHash = await sha256hex(`${salt}:ip:${ip}`)
  const emailHash = await sha256hex(`${salt}:email:${email}`)

  const ipSince = new Date(Date.now() - IP_WINDOW_MIN * 60 * 1000).toISOString()
  const emailSince = new Date(Date.now() - EMAIL_WINDOW_MIN * 60 * 1000).toISOString()
  const [{ count: ipCount }, { count: emailCount }] = await Promise.all([
    admin
      .from('support_public_intake')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', ipSince),
    admin
      .from('support_public_intake')
      .select('id', { count: 'exact', head: true })
      .eq('email_hash', emailHash)
      .gte('created_at', emailSince),
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
        {
          error: 'Human verification failed. Please complete the check and try again.',
          code: verdict.reason,
        },
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
}

Deno.serve(async (req) => withCors(req, await handler(req)))