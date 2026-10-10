import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import type { SupabaseClient as SbClient } from 'npm:@supabase/supabase-js@2'
import type { Database } from '../_shared/database.types.ts'
import {
  postChatCompletion,
  readUpstreamText,
  resolveApiKey,
} from '../_shared/modelUpstream.ts'
import { createReplyDeltaExtractor } from '../_shared/replyDelta.ts'
import { isInternalDutivaAccount } from '../_shared/adminAccess.ts'
import {
  SYSTEM_PROMPTS,
  buildUserMessage,
  candidateChatPrompt,
  parseCandidateChatReply,
  parseModelResponse,
  validateAuthHeader,
  validateFeature,
  validatePayload,
  type AiFeature,
  type CandidateChatContext,
} from './handlers.ts'
import { makeCorsHeaders, withCors } from '../_shared/cors.ts'

/**
 * Candidate-ai edge function — optional AI features for the candidate portal
 * (resume tailoring, cover letter generation, match scoring, interview prep)
 * plus the conversational surface (kind 'chat') — Claire, the search coach.
 *
 *   { kind: 'chat', message, lang? }        → { reply, assistantId }
 *   { kind: 'chat_history', limit?, before? }   → { turns }
 *   { kind: 'chat_clear' }                  → { cleared: true }
 *   { kind: 'chat_feedback', messageId, rating } → { ok }
 *
 * `stream: true` on chat switches the response to text/event-stream — same
 * contract as the other portal functions: delta events carry reply text,
 * one done event carries the parsed payload + persisted row id.
 *
 * Unlike advisor-chat this is a free B2C surface: no retrieval/grounding, no
 * memory extraction, no commercial metering — but it still calls a paid model,
 * so each user gets a fixed number of calls per UTC day via
 * claim_candidate_ai_call (migration 0165). Auth follows the same bearer-JWT
 * pattern as the other dutiva-* functions. The model route is looked up in
 * ai_model_routes (route_key `candidate_ai`), falling back to `advisor_chat`
 * when the dedicated route is not configured.
 */

const corsHeaders = makeCorsHeaders()

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json', ...extraHeaders },
  })
}

type SupabaseClient = SbClient<Database>

interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
}

interface ModelProvider {
  id: string
  provider_key: string
  base_url: string
  secret_ref: string | null
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
): Promise<{ user: { id: string; email: string | null }; adminClient: SupabaseClient } | Response> {
  const authCheck = validateAuthHeader(req.headers.get('Authorization'))
  if (!authCheck.ok) return json({ error: authCheck.error }, 401)

  const userClient = createClient<Database>(config.supabaseUrl, config.anonKey, {
    global: { headers: { Authorization: `Bearer ${authCheck.value}` } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser(authCheck.value)
  const user = userData?.user
  if (userError || !user) return json({ error: 'Invalid user token' }, 401)

  return {
    user: { id: user.id, email: user.email ?? null },
    adminClient: createClient<Database>(config.supabaseUrl, config.serviceRoleKey),
  }
}

/**
 * Looks up the active model route. Tries `candidate_ai` first, then falls
 * back to `advisor_chat` so the feature works before a dedicated route is
 * configured. Returns a 503 with a clear message when neither is available.
 */
async function activeModelRoute(adminClient: SupabaseClient): Promise<ActiveModelRoute | Response> {
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
      /* `config` is Json in the generated row type — narrow it to the shape
         the completion layer actually reads. */
      return {
        route: { model_name: route.model_name, config: route.config as ModelRoute['config'] },
        provider,
      }
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
  const keyResult = resolveApiKey(provider.secret_ref, (name) => Deno.env.get(name))
  if ('missingSecret' in keyResult) {
    return json({ error: `Missing secret ${keyResult.missingSecret}` }, 500)
  }

  try {
    const upstream = await postChatCompletion(provider, keyResult.apiKey, {
      model: route.model_name,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: route.config?.max_tokens ?? 1024,
      ...(typeof route.config?.temperature === 'number'
        ? { temperature: route.config.temperature }
        : {}),
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

/** One Server-Sent-Events channel: send() emits `data: {…}` events, close()
    ends the stream. The pump runs after the Response is already returned —
    same helper the other portal functions carry locally. */
function sseChannel() {
  const ts = new TransformStream<Uint8Array, Uint8Array>()
  const writer = ts.writable.getWriter()
  const encoder = new TextEncoder()
  return {
    response: new Response(ts.readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    }),
    send: (event: Record<string, unknown>) => {
      void writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    },
    close: () => {
      void writer.close()
    },
  }
}

/* ── kind 'chat' ──────────────────────────────────────────────────────────
   Claire, the search coach — answers over the caller's own portal rows plus
   the last CHAT_HISTORY turns, and writes nothing: applying stays on the
   apply page, profile edits on the profile page, agent settings on the
   agent card. Both turns persist to candidate_chat_messages. */

const CHAT_HISTORY = 20
const UPSTREAM_TIMEOUT_MS = 45_000

/** The candidate's own rows, flattened to the shape the prompt builder
    wants. Applications join their posting title/org through
    public_job_postings — the same two-step the client API does, since the
    FK there points at the internal table and the view is the public face. */
async function loadChatContext(
  adminClient: SupabaseClient,
  userId: string,
): Promise<CandidateChatContext> {
  const { data: profile } = await adminClient
    .from('candidate_profiles')
    .select(
      'id, name, headline, current_role, summary, location, years_experience, work_authorization, resume_text',
    )
    .eq('user_id', userId)
    .maybeSingle()

  const [appsRes, jobsRes, agentRes] = await Promise.all([
    profile
      ? adminClient
          .from('candidate_applications')
          .select('job_posting_id, status, ai_match_score, applied_at')
          .eq('candidate_id', profile.id)
          .order('applied_at', { ascending: false })
          .limit(15)
      : Promise.resolve({ data: [] }),
    profile
      ? adminClient
          .from('candidate_discovered_jobs')
          .select('title, company, location, match_score, status')
          .eq('candidate_id', profile.id)
          .order('discovered_at', { ascending: false })
          .limit(15)
      : Promise.resolve({ data: [] }),
    adminClient
      .from('candidate_agent_settings')
      .select('enabled, autonomy, keywords, locations')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const appRows = appsRes.data ?? []
  const postingIds = [...new Set(appRows.map((r) => r.job_posting_id))]
  const postings = new Map<string, { title: string | null; organization_name: string | null; location: string | null }>()
  if (postingIds.length > 0) {
    const { data: postingRows } = await adminClient
      .from('public_job_postings')
      .select('id, title, organization_name, location')
      .in('id', postingIds)
    for (const p of postingRows ?? []) {
      if (p.id) {
        postings.set(p.id, {
          title: p.title,
          organization_name: p.organization_name,
          location: p.location,
        })
      }
    }
  }

  return {
    profile: profile
      ? {
          name: profile.name,
          headline: profile.headline,
          current_role: profile.current_role,
          summary: profile.summary,
          location: profile.location,
          years_experience: profile.years_experience,
          work_authorization: profile.work_authorization,
          resume_text: profile.resume_text,
        }
      : null,
    applications: appRows.map((r) => ({
      title: postings.get(r.job_posting_id)?.title ?? null,
      organization: postings.get(r.job_posting_id)?.organization_name ?? null,
      location: postings.get(r.job_posting_id)?.location ?? null,
      status: r.status,
      match_score: r.ai_match_score,
      applied_at: r.applied_at,
    })),
    discoveredJobs: (jobsRes.data ?? []).map((j) => ({
      title: j.title,
      company: j.company,
      location: j.location,
      match_score: j.match_score,
      status: j.status,
    })),
    agent: agentRes.data
      ? {
          enabled: agentRes.data.enabled === true,
          autonomy: agentRes.data.autonomy,
          keywords: agentRes.data.keywords,
          locations: agentRes.data.locations,
        }
      : null,
  }
}

/* Persist both turns — history is server-side so the next device/session
   sees the same conversation. The assistant id goes back so the client can
   attach feedback to it. */
async function persistChatTurns(
  adminClient: SupabaseClient,
  userId: string,
  message: string,
  reply: string,
): Promise<{ assistantId: string | null }> {
  const nowIso = new Date().toISOString()
  await adminClient
    .from('candidate_chat_messages')
    .insert({ user_id: userId, role: 'user', content: message, created_at: nowIso })
  const { data: assistantRow } = await adminClient
    .from('candidate_chat_messages')
    .insert({
      user_id: userId,
      role: 'assistant',
      content: reply,
      created_at: new Date(Date.parse(nowIso) + 1).toISOString(),
    })
    .select('id')
    .single()
  return { assistantId: assistantRow?.id ?? null }
}

/** One conversational turn. The reply contract is the portal-standard
    {"reply":"…"} JSON object so createReplyDeltaExtractor can stream the
    text without the envelope. */
async function runChat(
  adminClient: SupabaseClient,
  userId: string,
  message: string,
  lang: 'en' | 'fr',
  stream: boolean,
  advice: boolean,
): Promise<Response> {
  const activeRoute = await activeModelRoute(adminClient)
  if (activeRoute instanceof Response) return activeRoute

  const [ctx, { data: historyRows, error: histError }] = await Promise.all([
    loadChatContext(adminClient, userId),
    adminClient
      .from('candidate_chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(CHAT_HISTORY),
  ])
  if (histError) return json({ error: histError.message }, 500)

  const history = ((historyRows ?? []) as { role: string; content: string }[])
    .reverse()
    .map((r) => ({
      role: r.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: r.content.slice(0, 1500),
    }))

  const keyResult = resolveApiKey(activeRoute.provider.secret_ref, (name) => Deno.env.get(name))
  if ('missingSecret' in keyResult) {
    return json({ error: `Missing secret ${keyResult.missingSecret}` }, 500)
  }

  let upstream: Response
  try {
    upstream = await postChatCompletion(
      activeRoute.provider,
      keyResult.apiKey,
      {
        model: activeRoute.route.model_name,
        messages: [
          candidateChatPrompt(ctx, lang, { advice }),
          ...history,
          { role: 'user', content: message },
        ],
        max_tokens: activeRoute.route.config?.max_tokens ?? 600,
        temperature: 0.4,
        stream,
      },
      UPSTREAM_TIMEOUT_MS,
    )
  } catch (error) {
    console.error('candidate-ai chat: model call failed', error)
    return json({ error: 'The AI service is temporarily unavailable.' }, 502)
  }
  if (!upstream.ok) {
    const errText = await upstream.text()
    console.error('candidate-ai chat: upstream error', upstream.status, errText.slice(0, 500))
    return json({ error: 'The AI service is temporarily unavailable.' }, 502)
  }

  if (stream) {
    /* SSE out, SSE in — only the reply text streams through; the JSON
       envelope never reaches the bubble. The done event carries the reply
       + the persisted assistant row id. */
    const sse = sseChannel()
    const extractor = createReplyDeltaExtractor()
    void (async () => {
      try {
        const fullText = await readUpstreamText(upstream, (piece) => {
          const visible = extractor.push(piece)
          if (visible) sse.send({ type: 'delta', text: visible })
        })
        const reply = parseCandidateChatReply(fullText)
        if (!reply) {
          sse.send({ type: 'error', error: 'Model returned no usable reply', code: 'unparseable' })
          return
        }
        const { assistantId } = await persistChatTurns(adminClient, userId, message, reply)
        sse.send({ type: 'done', reply, assistantId })
      } catch (e) {
        sse.send({ type: 'error', error: e instanceof Error ? e.message : 'stream failed' })
      } finally {
        sse.close()
      }
    })()
    return sse.response
  }

  const completion = (await upstream.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const reply = parseCandidateChatReply(completion?.choices?.[0]?.message?.content)
  if (!reply) return json({ error: 'Model returned no usable reply', code: 'unparseable' }, 502)
  const { assistantId } = await persistChatTurns(adminClient, userId, message, reply)
  return json({ reply, assistantId })
}

/* Daily rail — one atomic counter row per user per day, claimed before the
   model call so a timed-out call still counts. A refusal is a wait, not a
   paywall: the client maps the 429 to a localized "try again tomorrow".
   Internal @dutiva.ca accounts skip it, same as every other staff surface
   (see _shared/adminAccess.ts). Returns a Response on failure, null on a
   successful claim or an uncapped internal caller. */
async function claimDailyCall(
  adminClient: SupabaseClient,
  userId: string,
  internal: boolean,
): Promise<Response | null> {
  if (internal) return null
  const { data: underLimit, error: claimError } = await adminClient.rpc('claim_candidate_ai_call', {
    p_user_id: userId,
  })
  if (claimError) {
    console.error('candidate-ai: usage claim failed', claimError)
    return json({ error: 'Usage check failed' }, 500)
  }
  if (!underLimit) {
    return json({ error: 'Daily AI limit reached', code: 'daily_limit' }, 429)
  }
  return null
}

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config

  const authenticated = await authenticateRequest(req, config)
  if (authenticated instanceof Response) return authenticated

  /* Internal-staff tier — a verified @dutiva.ca sign-in loosens the chat
     register from generic coaching to direct advice, and skips the daily
     rail. It changes what the model may say and how often, never what rows
     it may write — Claire has no write surface at all. */
  const internal = isInternalDutivaAccount(authenticated.user.email)

  /* Parse request body */
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const lang = body['lang'] === 'fr' ? 'fr' : 'en'
  const stream = body['stream'] === true
  const kind = typeof body['kind'] === 'string' ? body['kind'] : ''

  /* History read/clear/feedback need no model and cost no rail — they run
     through this function so the table's only writer is this code path (a
     client can't file its own 'assistant' rows under the owner policy). */
  if (kind === 'chat_history') {
    const limit =
      typeof body['limit'] === 'number' && Number.isInteger(body['limit'])
        ? Math.min(Math.max(body['limit'], 1), 120)
        : 60
    /* `before` pages older turns — the client passes the oldest loaded
       turn's created_at; without it the newest `limit` rows come back. */
    const before = typeof body['before'] === 'string' && body['before'] ? body['before'] : null
    let q = authenticated.adminClient
      .from('candidate_chat_messages')
      .select('id, role, content, feedback, created_at')
      .eq('user_id', authenticated.user.id)
    if (before) q = q.lt('created_at', before)
    const { data, error } = await q.order('created_at', { ascending: false }).limit(limit)
    if (error) return json({ error: error.message }, 500)
    return json({ turns: (data ?? []).reverse() })
  }
  if (kind === 'chat_clear') {
    const { error } = await authenticated.adminClient
      .from('candidate_chat_messages')
      .delete()
      .eq('user_id', authenticated.user.id)
    if (error) return json({ error: error.message }, 500)
    return json({ cleared: true })
  }
  if (kind === 'chat_feedback') {
    const messageId = typeof body['messageId'] === 'string' ? body['messageId'] : ''
    const rating = body['rating']
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId) ||
      (rating !== 1 && rating !== -1 && rating !== 0 && rating !== null)
    ) {
      return json({ error: 'messageId (uuid) and rating (-1|0|1) required' }, 400)
    }
    const { error } = await authenticated.adminClient
      .from('candidate_chat_messages')
      .update({ feedback: rating === 0 ? null : rating })
      .eq('id', messageId)
      .eq('user_id', authenticated.user.id)
      .eq('role', 'assistant')
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }
  if (kind === 'chat') {
    const message =
      typeof body['message'] === 'string' ? body['message'].trim().slice(0, 1200) : ''
    if (!message) return json({ error: 'message is required' }, 400)
    const railRefusal = await claimDailyCall(
      authenticated.adminClient,
      authenticated.user.id,
      internal,
    )
    if (railRefusal) return railRefusal
    return await runChat(
      authenticated.adminClient,
      authenticated.user.id,
      message,
      lang,
      stream,
      internal,
    )
  }

  const featureCheck = validateFeature(body['feature'])
  if (!featureCheck.ok) return json({ error: featureCheck.error }, 400)
  const feature: AiFeature = featureCheck.value

  const payloadCheck = validatePayload(feature, body['payload'])
  if (!payloadCheck.ok) return json({ error: payloadCheck.error }, 400)

  const railRefusal = await claimDailyCall(
    authenticated.adminClient,
    authenticated.user.id,
    internal,
  )
  if (railRefusal) return railRefusal

  /* Look up model route */
  const activeRoute = await activeModelRoute(authenticated.adminClient)
  if (activeRoute instanceof Response) return activeRoute

  /* Build prompt and call model */
  const systemPrompt = SYSTEM_PROMPTS[feature]
  const userMessage = buildUserMessage(feature, payloadCheck.value)

  const modelResult = await callModel(
    activeRoute.route,
    activeRoute.provider,
    systemPrompt,
    userMessage,
  )
  if (modelResult instanceof Response) return modelResult

  const content = modelResult.completion.choices?.[0]?.message?.content ?? ''
  if (!content) return json({ error: 'Empty response from model' }, 502)

  /* Parse the model response into the feature-specific shape */
  const parsed = parseModelResponse(feature, content)
  if (!parsed.ok) return json({ error: parsed.error }, 502)

  return json(parsed.value)
}

Deno.serve(async (req) => withCors(req, await handler(req)))