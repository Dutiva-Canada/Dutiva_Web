import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'

/**
 * Updates one component's row in public.service_status (the /status board).
 * Admin-gated (is_admin) and executed with the service role — there is no write
 * policy on the table, so this is the only way status changes. Reads are public.
 * Keep the component/status vocab in sync with migration 0017 and src/config.
 */

const corsHeaders = makeCorsHeaders()
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

const COMPONENTS = ['platform', 'advisor', 'documents', 'support']
const STATUSES = ['operational', 'degraded', 'maintenance', 'outage']

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
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
  const { data: isAdmin } = await admin.rpc('is_admin', { check_user_id: user.id })
  if (isAdmin !== true) return json({ error: 'Admin access required.' }, 403)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const component = typeof body.component === 'string' ? body.component : ''
  const status = typeof body.status === 'string' ? body.status : ''
  if (!COMPONENTS.includes(component)) return json({ error: 'Unknown component' }, 422)
  if (!STATUSES.includes(status)) return json({ error: 'Unknown status' }, 422)
  let message: string | null = null
  if (typeof body.message === 'string') {
    const trimmed = body.message.trim()
    if (trimmed.length > 500) return json({ error: 'Message too long' }, 422)
    message = trimmed.length > 0 ? trimmed : null
  }

  const { error } = await admin
    .from('service_status')
    .update({ status, message, updated_at: new Date().toISOString() })
    .eq('component', component)
  if (error) return json({ error: error.message }, 500)

  return json({ data: { component, status } })
}

Deno.serve(async (req) => withCors(req, await handler(req)))