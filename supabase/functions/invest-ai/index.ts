import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  postChatCompletion,
  resolveApiKey,
} from '../_shared/modelUpstream.ts'
import {
  buildDraftPrompt,
  parseDraft,
  sanitizeGoal,
  SYSTEM_PROMPT,
  validateAiAction,
} from './handlers.ts'

/**
 * invest-ai — AI assistance for the invest portal. Deliberately narrow: the
 * model *authors* strategy drafts; the deterministic invest-bot engine
 * executes them. A draft is validated server-side, returned disabled, and
 * only reaches the book after the user reviews and saves it.
 *
 * Actions (POST body, portal JWT + invest_access grant required):
 *   { action: 'draft-strategy', goal: string, lang?: 'en'|'fr' }
 *     → { draft: { name, cadence, asset_classes, rules } }
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

type SupabaseClient = ReturnType<typeof createClient>

interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
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

async function authenticateInvestUser(
  req: Request,
  config: ServerConfig,
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

  return { userId: userData.user.id, adminClient }
}

/** Route lookup — `invest_ai` first, `advisor_chat` as the shared fallback
    (same contract as candidate-ai). */
async function activeModelRoute(adminClient: SupabaseClient) {
  for (const routeKey of ['invest_ai', 'advisor_chat']) {
    const { data: route, error } = await adminClient
      .from('ai_model_routes')
      .select(
        'id, model_name, config, provider:ai_model_providers(id, provider_key, base_url, secret_ref, status)',
      )
      .eq('route_key', routeKey)
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error) return json({ error: error.message }, 500)
    const provider = route?.provider as { status?: string } | null | undefined
    if (route && provider && provider.status === 'active') {
      return { route, provider }
    }
  }
  return json({ error: 'No active model route configured' }, 503)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config

  const authed = await authenticateInvestUser(req, config)
  if (authed instanceof Response) return authed
  const { adminClient } = authed

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const actionCheck = validateAiAction(body['action'])
  if (!actionCheck.ok) return json({ error: actionCheck.error }, 400)

  /* draft-strategy */
  const goal = sanitizeGoal(body['goal'])
  if (!goal) return json({ error: 'goal must be at least 10 characters' }, 400)
  const lang = body['lang'] === 'fr' ? 'fr' : 'en'

  const routed = await activeModelRoute(adminClient)
  if (routed instanceof Response) return routed
  const { route, provider } = routed

  const keyResult = resolveApiKey(provider.secret_ref, (name) => Deno.env.get(name))
  if ('missingSecret' in keyResult) {
    return json({ error: `Missing secret ${keyResult.missingSecret}` }, 500)
  }

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      provider,
      keyResult.apiKey,
      {
        model: route.model_name,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildDraftPrompt(goal, lang) },
        ],
        max_tokens: route.config?.max_tokens ?? 900,
        temperature: 0.3,
      },
      45_000,
    )
  } catch (error) {
    console.error('invest-ai: model call failed', error)
    return json({ error: 'The AI service is temporarily unavailable.' }, 502)
  }
  if (!upstream.ok) {
    const errText = await upstream.text()
    console.error('invest-ai: upstream error', upstream.status, errText.slice(0, 300))
    return json({ error: 'The AI service is temporarily unavailable.' }, 502)
  }

  const completion = await upstream.json()
  const content = completion?.choices?.[0]?.message?.content
  if (typeof content !== 'string') return json({ error: 'Empty response from model' }, 502)

  const draft = parseDraft(content)
  if (!draft) {
    return json({ error: 'Could not turn that goal into a strategy — try describing it differently.', code: 'no_draft' }, 422)
  }

  /* The draft ships disabled: the user reviews, then enables. */
  return json({ draft: { ...draft, enabled: false, autonomy: 'suggest', template: 'ai-draft' } })
})
