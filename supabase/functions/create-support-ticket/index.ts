import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Creates a support ticket for the signed-in user. All writes use the
 * service-role key and bypass RLS, so this is the ONLY path that inserts
 * tickets — the browser has no INSERT policy (see migration 0014). Everything
 * the client sends is re-validated here; priority and the `restricted` flag are
 * decided server-side (a customer can never force `critical`), and a
 * browser-supplied workspace_id is honoured only after membership is verified.
 *
 * Mirrors src/config/support.ts (enums) and src/features/support/triage.ts
 * (suggestPriority) — keep the three in sync. Diagnostic context is stripped to
 * an allowlist and stored in the audit trail, never anything sensitive.
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
  'account_access',
  'billing',
  'technical',
  'product_question',
  'privacy',
  'security',
  'accessibility',
  'complaint',
  'sales',
  'other',
] as const
type Category = (typeof CATEGORIES)[number]
const IMPACTS = ['blocking', 'major', 'minor', 'none'] as const
type Impact = (typeof IMPACTS)[number]
const URGENCIES = ['urgent', 'soon', 'whenever'] as const
type Urgency = (typeof URGENCIES)[number]
const RESPONSE_METHODS = ['email', 'in_app', 'scheduled_call'] as const
const LANGUAGES = ['en', 'fr'] as const

/** Categories handled off the ordinary product queue and hidden from workspace peers. */
const RESTRICTED_CATEGORIES = new Set<Category>([
  'privacy',
  'security',
  'accessibility',
  'complaint',
])

const OPERATOR_EMAIL = Deno.env.get('SUPPORT_OPERATOR_EMAIL') ?? 'support@dutiva.ca'

/** Customer acknowledgement kind by category (mirrors src/features/support/email/notifications.ts). */
function acknowledgementKind(category: Category): string {
  if (category === 'privacy') return 'privacy_ack'
  if (category === 'security') return 'security_ack'
  if (category === 'accessibility') return 'accessibility_ack'
  if (category === 'complaint') return 'complaint_ack'
  return 'ticket_received'
}

/** Allowlisted diagnostic keys — anything else the client sends is dropped. */
const DIAGNOSTIC_KEYS = [
  'plan',
  'route',
  'app_version',
  'browser',
  'os',
  'locale',
  'feature',
  'correlation_id',
  'error_code',
] as const

const PRIORITIES = ['low', 'standard', 'high', 'critical'] as const
const PAID_FLOOR_PLANS = new Set(['growth', 'pro'])
const RESTRICTED_FROM_PAID_FLOOR = new Set<Category>([
  'privacy',
  'security',
  'accessibility',
  'complaint',
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
      : category === 'account_access' ||
          category === 'accessibility' ||
          category === 'privacy' ||
          category === 'billing' ||
          category === 'complaint'
        ? 1
        : 0
  let rank = Math.max(impactRank, categoryFloor)
  if (urgency === 'urgent' && impact !== 'none') rank += 1
  return PRIORITIES[Math.min(rank, 2)]
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length >= 1 && trimmed.length <= max ? trimmed : null
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

function cleanDiagnostics(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {}
  const source = raw as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const key of DIAGNOSTIC_KEYS) {
    const v = source[key]
    if (typeof v === 'string' && v.length > 0 && v.length <= 400) out[key] = v
  }
  return out
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser(
    authHeader.replace('Bearer ', ''),
  )
  const user = userData?.user
  if (userError || !user) return json({ error: 'Invalid user token' }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const category = oneOf<Category>(body.category, CATEGORIES, 'other')
  const subject = str(body.subject, 200)
  const description = str(body.description, 20000)
  if (!subject) return json({ error: 'A subject is required.', field: 'subject' }, 422)
  if (!description) return json({ error: 'A description is required.', field: 'description' }, 422)
  const impact = oneOf<Impact>(body.impact, IMPACTS, 'none')
  const urgency = oneOf<Urgency>(body.urgency, URGENCIES, 'whenever')
  const language = oneOf(body.language, LANGUAGES, 'en')
  const preferredResponseMethod = oneOf(body.preferred_response_method, RESPONSE_METHODS, 'email')

  // Never trust a browser-supplied workspace_id: keep it only if the user is a
  // verified member of that workspace.
  let workspaceId: string | null = null
  if (typeof body.workspace_id === 'string' && body.workspace_id.length > 0) {
    const { data: isMember } = await admin.rpc('is_org_member', {
      check_org_id: body.workspace_id,
      check_user_id: user.id,
    })
    if (isMember === true) workspaceId = body.workspace_id
  }

  // Basic rate limit: cap tickets per user over a short window.
  const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('requester_user_id', user.id)
    .gte('created_at', windowStart)
  if ((count ?? 0) >= 5) {
    return json({ error: 'Too many requests in a short time. Please try again shortly.' }, 429)
  }

  const suggested = suggestPriority(category, impact, urgency)
  const { data: profile } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()
  const requesterPlan = normalizePlan(profile?.plan)
  const priority = applyPaidSupportFloor(suggested, requesterPlan, category)
  const restricted = RESTRICTED_CATEGORIES.has(category)

  const { data: ticket, error: insertError } = await admin
    .from('support_tickets')
    .insert({
      requester_user_id: user.id,
      requester_email: user.email ?? null,
      workspace_id: workspaceId,
      category,
      subject,
      description,
      impact,
      urgency,
      language,
      preferred_response_method: preferredResponseMethod,
      source: 'app_form',
      priority,
      restricted,
      status: 'new',
      requester_plan: requesterPlan,
    })
    .select('id, public_reference, status, priority')
    .single()
  if (insertError || !ticket) {
    return json({ error: insertError?.message ?? 'Could not create the request.' }, 500)
  }

  // First customer message + creation event (diagnostics live in the audit trail).
  await admin.from('support_messages').insert({
    ticket_id: ticket.id,
    author_user_id: user.id,
    author_role: 'customer',
    body: description,
    is_internal_note: false,
  })
  await admin.from('support_ticket_events').insert([
    {
      ticket_id: ticket.id,
      actor_user_id: user.id,
      event_type: 'created',
      data: { source: 'app_form' },
    },
    {
      ticket_id: ticket.id,
      actor_user_id: user.id,
      event_type: 'diagnostics',
      data: cleanDiagnostics(body.diagnostics),
    },
  ])

  // Enqueue notifications to the outbox — a future worker renders + sends them
  // (see docs/SUPPORT_ARCHITECTURE.md). A missing email provider never blocks
  // ticket creation. Payload is non-sensitive (reference + category only).
  const notifications: Record<string, unknown>[] = []
  if (user.email) {
    notifications.push({
      ticket_id: ticket.id,
      kind: acknowledgementKind(category),
      audience: 'customer',
      recipient: user.email,
      language,
      payload: { reference: ticket.public_reference, category },
    })
  }
  notifications.push({
    ticket_id: ticket.id,
    kind: 'operator_alert',
    audience: 'operator',
    recipient: OPERATOR_EMAIL,
    language: 'en',
    payload: { reference: ticket.public_reference, category, priority },
  })
  await admin.from('support_notifications').insert(notifications)

  return json({
    data: {
      id: ticket.id,
      public_reference: ticket.public_reference,
      status: ticket.status,
      priority: ticket.priority,
    },
  })
})
