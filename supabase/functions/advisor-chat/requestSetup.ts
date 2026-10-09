import { createClient } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../_shared/database.types.ts'
import { parseAttachments } from '../_shared/modelUpstream.ts'
import type {
  ActiveModelRoute,
  AuthenticatedRequest,
  ChatRequest,
  ModelProvider,
  ModelRoute,
  ServerConfig,
  SupabaseClient,
} from './chatTypes.ts'
import { json } from './respond.ts'

/**
 * Request setup — environment, auth, body parse, and the active model route.
 * Each stage returns either its value or a ready-to-send error Response; the
 * handler short-circuits on `instanceof Response`.
 */

export function serverConfig(): ServerConfig | Response {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }
  return { supabaseUrl, anonKey, serviceRoleKey }
}

export async function authenticateRequest(
  req: Request,
  config: ServerConfig,
): Promise<AuthenticatedRequest | Response> {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401)

  const userClient = createClient<Database>(config.supabaseUrl, config.anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const token = authHeader.replace('Bearer ', '')
  const { data: userData, error: userError } = await userClient.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) return json({ error: 'Invalid user token' }, 401)

  /* Invite-only — the admin account, or anyone on the beta list. Same
     check as the RLS layer for direct guidance_sources/law_updates reads
     (supabase/migrations/0026_open_workspace_to_beta_list.sql) and
     AuthProvider client-side: one Postgres function, called here through
     `userClient` so `auth.jwt()` inside it resolves to this caller's own
     token. This function otherwise uses a service-role client that bypasses
     RLS, so it needs its own check regardless. */
  const { data: isMember, error: membershipError } = await userClient.rpc(
    'current_user_is_workspace_member',
  )
  if (membershipError || isMember !== true) {
    return json({ error: 'Access to this workspace is invite-only.' }, 403)
  }

  return {
    user,
    adminClient: createClient<Database>(config.supabaseUrl, config.serviceRoleKey),
  }
}

export async function readChatRequest(req: Request): Promise<ChatRequest | Response> {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const parsed = parseAttachments(body.attachments)
  if ('error' in parsed) {
    return json({ error: `Invalid attachments (${parsed.error})`, code: 'bad_attachments' }, 400)
  }
  /* A turn can be only attachments — a photo of a job posting with no caption
     is a legitimate question. Substitute a minimal prompt so the message
     still has text for retrieval and history. */
  const effectiveMessage = message || (parsed.attachments.length > 0 ? 'See attached.' : '')
  if (!effectiveMessage) return json({ error: 'message is required' }, 400)
  return {
    message: effectiveMessage,
    conversationId: typeof body.conversation_id === 'string' ? body.conversation_id : null,
    organizationId: typeof body.organization_id === 'string' ? body.organization_id : null,
    timezone: typeof body.timezone === 'string' ? body.timezone : null,
    attachments: parsed.attachments,
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Org tenancy boundary. The workspace gate above is beta-wide — it says WHO
 * may chat, not WHICH org's context they may use. Everything downstream of
 * this check keys off `request.organizationId`: the org-pooled usage claim,
 * org plan, org memory injection (echoed back in the response payload) and
 * the memory-fact writes — all through a service-role client that bypasses
 * RLS. A caller who passed another org's id would read its memory, write
 * facts into it, and spend its budget. `is_org_member` (the same helper the
 * RLS policies and create-support-ticket use) is the check that closes that.
 * Fails closed: an unverifiable membership answer refuses rather than
 * silently widening scope. Runs before any org-scoped work.
 */
export async function verifyOrgMembership(
  adminClient: SupabaseClient,
  userId: string,
  organizationId: string | null,
): Promise<Response | null> {
  if (!organizationId) return null
  if (!UUID_RE.test(organizationId)) {
    return json({ error: 'Not a member of this organization.' }, 403)
  }
  const { data, error } = await adminClient.rpc('is_org_member', {
    check_org_id: organizationId,
    check_user_id: userId,
  })
  if (error) return json({ error: 'Organization membership could not be verified.' }, 500)
  if (data !== true) return json({ error: 'Not a member of this organization.' }, 403)
  return null
}

export async function activeModelRoute(
  adminClient: SupabaseClient,
): Promise<ActiveModelRoute | Response> {
  const { data: route, error: routeError } = await adminClient
    .from('ai_model_routes')
    .select(
      'id, model_name, config, provider:ai_model_providers(id, provider_key, base_url, secret_ref, status)',
    )
    .eq('route_key', 'advisor_chat')
    .eq('status', 'active')
    .order('priority', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (routeError) return json({ error: routeError.message }, 500)
  const provider = route?.provider as ModelProvider | null | undefined
  if (!route || !provider || provider.status !== 'active') {
    return json({ error: 'No active model route configured for advisor_chat' }, 503)
  }
  return { route: route as unknown as ModelRoute, provider }
}
