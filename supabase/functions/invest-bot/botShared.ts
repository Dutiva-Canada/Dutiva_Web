import { createClient } from 'npm:@supabase/supabase-js@2'
import { makeCorsHeaders } from '../_shared/cors.ts'
import { secretEquals } from '../_shared/secretEqual.ts'

/**
 * Shared plumbing for the invest-bot handler and its extracted action
 * modules — server config, the two auth contracts, and the response
 * helpers. corsHeaders() emits the fallback origin; the real origin is
 * stamped by withCors at the Deno.serve boundary.
 */

export const CORS = {
  allowHeaders: 'authorization, x-client-info, apikey, content-type, x-trigger-secret',
}
export const corsHeaders = makeCorsHeaders(CORS)

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

export type SupabaseClient = ReturnType<typeof createClient>

export interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
}

export function serverConfig(): ServerConfig | Response {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server configuration missing' }, 500)
  }
  return { supabaseUrl, anonKey, serviceRoleKey }
}

/** Same contract as monitor-law-changes / candidate-job-agent. */
export function isAuthorizedTrigger(req: Request): boolean {
  const sharedSecret = Deno.env.get('SUPPORT_NOTIFY_SECRET') ?? ''
  if (sharedSecret !== '' && secretEquals(req.headers.get('x-trigger-secret') ?? '', sharedSecret)) return true

  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (token === '') return false

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
  return (serviceKey !== '' && secretEquals(token, serviceKey)) || (secretKey !== '' && secretEquals(token, secretKey))
}

/**
 * Portal JWT → the caller's user id, gated on the invest_access grant table
 * — access is invite-only; no row, no run.
 */
export async function authenticateInvestUser(
  req: Request,
  config: ServerConfig,
  options: { requireAdmin?: boolean } = {},
): Promise<{ userId: string; adminClient: SupabaseClient } | Response> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return json({ error: 'Missing bearer token' }, 401)

  const adminClient = createClient(config.supabaseUrl, config.serviceRoleKey)
  const { data: userData, error: userError } = await adminClient.auth.getUser(token)
  if (userError || !userData?.user) return json({ error: 'Invalid user token' }, 401)

  const { data: access, error: accessError } = await adminClient
    .from('invest_access')
    .select('user_id, role')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (accessError) return json({ error: accessError.message }, 500)
  if (!access) return json({ error: 'Invest access not granted', code: 'no_access' }, 403)
  if (options.requireAdmin && access.role !== 'admin') {
    return json({ error: 'Admin access required', code: 'not_admin' }, 403)
  }

  return { userId: userData.user.id, adminClient }
}
