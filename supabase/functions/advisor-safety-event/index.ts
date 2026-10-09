import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'

/**
 * Records when the client-side Advisor safety backstop fired
 * (src/features/app/advisor/safety, docs/AI_USAGE_STRATEGY.md §5) so the gates
 * are observable in production — "how often does the crisis intercept or the
 * jurisdiction/figure gate actually catch something?".
 *
 * It writes one `ai_telemetry_events` row per gated turn with
 * `operation = 'safety_backstop'`, mirroring the exact insert shape the
 * advisor-chat function already uses (same columns, same active-route lookup for
 * provider/model), so it inherits whatever constraints that proven insert
 * satisfies. Auth follows the same invite-only bearer-JWT pattern; the call is
 * best-effort from the client and never blocks or breaks a reply.
 */

const corsHeaders = makeCorsHeaders()

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

/** The only actions the client backstop can emit (safety/safetyBackstop.ts). */
const ALLOWED_ACTIONS = new Set(['crisis-intercept', 'legal-basis-withheld', 'figure-mismatch'])

type SupabaseClient = ReturnType<typeof createClient>

interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
}

interface AuthenticatedRequest {
  adminClient: SupabaseClient
  user: { id: string; email?: string }
}

interface SafetyEventRequest {
  actions: string[]
  conversationId: string | null
  organizationId: string | null
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

async function authenticateRequest(
  req: Request,
  config: ServerConfig,
): Promise<AuthenticatedRequest | Response> {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401)

  const userClient = createClient(config.supabaseUrl, config.anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const token = authHeader.replace('Bearer ', '')
  const { data: userData, error: userError } = await userClient.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) return json({ error: 'Invalid user token' }, 401)

  // Invite-only — the admin account, or anyone on the beta list. Same
  // check as advisor-chat, via the caller's own JWT client.
  const { data: isMember, error: membershipError } = await userClient.rpc(
    'current_user_is_workspace_member',
  )
  if (membershipError || isMember !== true) {
    return json({ error: 'Access to this workspace is invite-only.' }, 403)
  }

  return { user, adminClient: createClient(config.supabaseUrl, config.serviceRoleKey) }
}

async function readSafetyEventRequest(req: Request): Promise<SafetyEventRequest | Response> {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const rawActions = Array.isArray(body.actions) ? body.actions : []
  // Validate against the known set and cap length — trust nothing from the wire.
  const actions = rawActions
    .filter((a): a is string => typeof a === 'string' && ALLOWED_ACTIONS.has(a))
    .slice(0, 8)
  if (actions.length === 0) return json({ error: 'actions is required' }, 400)
  return {
    actions,
    conversationId: typeof body.conversation_id === 'string' ? body.conversation_id : null,
    organizationId: typeof body.organization_id === 'string' ? body.organization_id : null,
  }
}

/** Active advisor_chat provider/model, used to attribute the telemetry row. */
async function activeRouteAttribution(
  adminClient: SupabaseClient,
): Promise<{ provider: string; model: string }> {
  try {
    const { data } = await adminClient
      .from('ai_model_routes')
      .select('model_name, provider:ai_model_providers(provider_key)')
      .eq('route_key', 'advisor_chat')
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .limit(1)
      .maybeSingle()
    const provider = data?.provider as { provider_key?: string } | null | undefined
    return {
      provider: provider?.provider_key ?? 'unknown',
      model: (data?.model_name as string | undefined) ?? 'unknown',
    }
  } catch {
    return { provider: 'unknown', model: 'unknown' }
  }
}

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config
  const authenticated = await authenticateRequest(req, config)
  if (authenticated instanceof Response) return authenticated
  const request = await readSafetyEventRequest(req)
  if (request instanceof Response) return request

  const attribution = await activeRouteAttribution(authenticated.adminClient)

  /* The org id on a telemetry row is caller-supplied attribution: keep it
     only when the caller is a verified member of that org (same posture as
     create-support-ticket's workspace_id — silently dropped, never an
     error, telemetry stays best-effort). */
  let organizationId: string | null = null
  if (request.organizationId) {
    const { data: isMember } = await authenticated.adminClient.rpc('is_org_member', {
      check_org_id: request.organizationId,
      check_user_id: authenticated.user.id,
    })
    if (isMember === true) organizationId = request.organizationId
  }

  const { error } = await authenticated.adminClient.from('ai_telemetry_events').insert({
    organization_id: organizationId,
    user_id: authenticated.user.id,
    provider: attribution.provider,
    model: attribution.model,
    operation: 'safety_backstop',
    status: 'completed',
    latency_ms: 0,
    metadata: { actions: request.actions, conversation_id: request.conversationId },
  })
  if (error) return json({ error: error.message }, 500)

  return json({ data: { recorded: request.actions.length } }, 202)
}

Deno.serve(async (req) => withCors(req, await handler(req)))