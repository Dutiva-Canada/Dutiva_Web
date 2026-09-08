import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  SYSTEM_PROMPTS,
  buildUserMessage,
  parseModelResponse,
  validateAuthHeader,
  validateFeature,
  validatePayload,
  type AiFeature,
} from './handlers.ts'

/**
 * Candidate-ai edge function — optional AI features for the candidate portal
 * (resume tailoring, cover letter generation, match scoring, interview prep).
 *
 * Unlike advisor-chat this is a free B2C surface: no usage metering, no
 * retrieval/grounding, no memory extraction. Auth follows the same bearer-JWT
 * pattern as the other dutiva-* functions. The model route is looked up in
 * ai_model_routes (route_key `candidate_ai`), falling back to `advisor_chat`
 * when the dedicated route is not configured.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
  })
}

type SupabaseClient = ReturnType<typeof createClient>

interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
}

interface ModelProvider {
  id: string
  provider_key: string
  base_url: string
  secret_ref: string
  status: string
}

interface ModelRoute {
  model_name: string
  config: { max_tokens?: number; temperature?: number } | null
}

interface ActiveModelRoute {
  route: ModelRoute
  provider: ModelProvider
}

interface Completion {
  choices?: { message?: { content?: string } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
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
): Promise<{ user: { id: string }; adminClient: SupabaseClient } | Response> {
  const authCheck = validateAuthHeader(req.headers.get('Authorization'))
  if (!authCheck.ok) return json({ error: authCheck.error }, 401)

  const userClient = createClient(config.supabaseUrl, config.anonKey, {
    global: { headers: { Authorization: `Bearer ${authCheck.value}` } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser(authCheck.value)
  const user = userData?.user
  if (userError || !user) return json({ error: 'Invalid user token' }, 401)

  return {
    user: { id: user.id },
    adminClient: createClient(config.supabaseUrl, config.serviceRoleKey),
  }
}

/**
 * Looks up the active model route. Tries `candidate_ai` first, then falls
 * back to `advisor_chat` so the feature works before a dedicated route is
 * configured. Returns a 503 with a clear message when neither is available.
 */
async function activeModelRoute(
  adminClient: SupabaseClient,
): Promise<ActiveModelRoute | Response> {
  for (const routeKey of ['candidate_ai', 'advisor_chat']) {
    const { data: route, error: routeError } = await adminClient
      .from('ai_model_routes')
      .select(
        'id, model_name, config, provider:ai_model_providers(id, provider_key, base_url, secret_ref, status)',
      )
      .eq('route_key', routeKey)
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (routeError) return json({ error: routeError.message }, 500)
    const provider = route?.provider as ModelProvider | null | undefined
    if (route && provider && provider.status === 'active') {
      return { route, provider }
    }
  }
  return json({ error: 'No active model route configured for candidate_ai' }, 503)
}

async function callModel(
  route: ModelRoute,
  provider: ModelProvider,
  systemPrompt: string,
  userMessage: string,
): Promise<{ completion: Completion } | Response> {
  const apiKey = Deno.env.get(provider.secret_ref)
  if (!apiKey) return json({ error: `Missing secret ${provider.secret_ref}` }, 500)

  try {
    const upstream = await fetch(`${provider.base_url}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: route.model_name,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: route.config?.max_tokens ?? 1024,
        ...(typeof route.config?.temperature === 'number'
          ? { temperature: route.config.temperature }
          : {}),
      }),
    })
    if (!upstream.ok) {
      const errText = await upstream.text()
      console.error('candidate-ai: upstream error', upstream.status, errText.slice(0, 500))
      return json({ error: 'The AI service is temporarily unavailable.' }, 502)
    }
    return { completion: await upstream.json() }
  } catch (error) {
    console.error('candidate-ai: model call failed', error)
    return json({ error: 'The AI service is temporarily unavailable.' }, 502)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config

  const authenticated = await authenticateRequest(req, config)
  if (authenticated instanceof Response) return authenticated

  /* Parse request body */
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const featureCheck = validateFeature(body['feature'])
  if (!featureCheck.ok) return json({ error: featureCheck.error }, 400)
  const feature: AiFeature = featureCheck.value

  const payloadCheck = validatePayload(feature, body['payload'])
  if (!payloadCheck.ok) return json({ error: payloadCheck.error }, 400)

  /* Look up model route */
  const activeRoute = await activeModelRoute(authenticated.adminClient)
  if (activeRoute instanceof Response) return activeRoute

  /* Build prompt and call model */
  const systemPrompt = SYSTEM_PROMPTS[feature]
  const userMessage = buildUserMessage(feature, payloadCheck.value)

  const modelResult = await callModel(activeRoute.route, activeRoute.provider, systemPrompt, userMessage)
  if (modelResult instanceof Response) return modelResult

  const content = modelResult.completion.choices?.[0]?.message?.content ?? ''
  if (!content) return json({ error: 'Empty response from model' }, 502)

  /* Parse the model response into the feature-specific shape */
  const parsed = parseModelResponse(feature, content)
  if (!parsed.ok) return json({ error: parsed.error }, 502)

  return json(parsed.value)
})
