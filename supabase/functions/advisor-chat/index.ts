import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildAdvisorResponse, detectJurisdictions } from './responsePayload.ts'
import { noticeScheduleBlock } from './noticeSchedule.ts'
import { buildRetrievalQuery } from './retrievalQuery.ts'
import { memoryBlock, selectMemoryFactsForPrompt } from './memoryFacts.ts'
import type { MemoryFactForPrompt } from './memoryFacts.ts'
import { memoryExtractionPromptAppendix, extractMemoryCandidates } from './memoryExtract.ts'
import type { ExtractedMemoryCandidate } from './memoryExtract.ts'
import {
  advisorChatPolicy,
  claimAiUsage,
  finalizeAiUsage,
  usageLimitBody,
} from '../_shared/aiUsage.ts'
import { reportAdvisorOverageMeter } from '../_shared/advisorOverageMeter.ts'
import { readStripeSecretKey } from '../_shared/stripeSecret.ts'

/**
 * Real AI Advisor replies. Looks up the active `advisor_chat` route in
 * ai_model_routes/ai_model_providers, calls it, persists the turn to
 * `conversations`, and logs `ai_telemetry_events`. Auth follows the same
 * bearer-JWT pattern as the other dutiva-* functions.
 *
 * The reply is grounded in the curated corpus (advisor_guidance_chunks) and
 * accompanied by a deterministic `advisor_response` payload for the
 * Compliance Workspace — see responsePayload.ts.
 *
 * Every turn is metered before the model is called (../_shared/aiUsage.ts):
 * during the beta the workspace is open to the whole beta list and nothing is
 * sold, so this endpoint is the one place a signed-in account becomes an
 * upstream bill. The claim it takes is also the turn's telemetry row — it is
 * stamped with tokens, latency and outcome when the call resolves.
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

const SYSTEM_PROMPT =
  'You are the Dutiva AI Advisor, a compliance-oriented HR assistant for Canadian ' +
  'employers. Give practical, jurisdiction-aware HR guidance (Ontario, Quebec, and ' +
  'federally regulated workplaces). You are not a lawyer and do not provide legal ' +
  'advice — for high-risk employment decisions (termination, discipline, ' +
  'accommodation), tell the user to consult qualified legal counsel.\n\n' +
  'Be factual and grounded at all times. Do not go along with statements just to be ' +
  'agreeable: if the user says something inaccurate — even something small, like ' +
  'greeting you with "Good evening" when it is morning — respond with the correct ' +
  'fact (e.g., "Good morning") rather than echoing the mistake, then continue ' +
  'helping. When you are unsure of a fact, say so instead of guessing.\n\n' +
  'Statutory precision: never cite bill numbers, section or regulation numbers, or ' +
  'court cases from memory — name the governing law in general terms instead (e.g., ' +
  '"the Ontario Employment Standards Act", "the Loi sur les normes du travail", ' +
  '"the Canada Labour Code"). Only state a specific statutory figure (weeks of ' +
  'notice, dollar thresholds, percentages) when you are confident it is current; ' +
  'otherwise say you are not certain and point the user to the official source ' +
  '(Ontario.ca, the CNESST, or Canada.ca). When the jurisdiction is unknown and it ' +
  'changes the answer, ask for it before giving figures. Employment rules change — ' +
  'when giving figures, remind the user to verify against the official source.\n\n' +
  /* The client renders replies with GitHub-flavored Markdown (see
     src/components/advisor/ChatMarkdown.tsx), so tables, lists and a fenced
     `chart` block all become real elements. Formatting only improves if the
     model reaches for it, hence this section. Raw HTML is deliberately not
     rendered (no rehype-raw), which is why the last line matters. */
  'Formatting\n' +
  '- Use a Markdown table whenever you compare three or more items across two or ' +
  'more attributes (jurisdictions, thresholds, deadlines, entitlements).\n' +
  '- Keep table cells to a short phrase. Put reasoning and caveats in prose before ' +
  'or after the table, never inside a cell.\n' +
  '- Give every table a bold lead-in line saying what it compares.\n' +
  '- Put the entity being compared in the first column — it becomes the row title ' +
  'on mobile.\n' +
  '- For four or more numeric values that invite comparison, add a chart after the ' +
  'table using a ```chart fenced block: {"type","title","x","format",' +
  '"series":[{"key","label"}],"data":[…]}. type is bar, hbar, line, area, or donut. ' +
  'Emit the chart in addition to the table, never instead of it.\n' +
  '- Never emit raw HTML — it is not rendered.'

/* The model has no clock — without an explicit timestamp it can only infer the
   time of day from what the user says, which is how "Good evening" gets
   mirrored back in the morning. The client sends its IANA timezone; anything
   invalid falls back to UTC (Intl throws on bad zone names, which also keeps
   unvetted client input out of the prompt). */
function currentTimeLine(timezone: string | null): string {
  let tz = 'UTC'
  if (timezone) {
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: timezone })
      tz = timezone
    } catch {
      /* invalid timezone from client — keep UTC */
    }
  }
  const formatted = new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: tz,
  }).format(new Date())
  return `Current date and time for the user: ${formatted} (${tz}).`
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

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

interface ChatRequest {
  message: string
  conversationId: string | null
  organizationId: string | null
  timezone: string | null
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

interface Conversation {
  id: string
  messages: ChatMessage[]
}

interface Completion {
  choices?: { message?: { content?: string } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

interface GuidanceChunk {
  title: string
  content: string
  source_url: string
  source_name: string
  jurisdiction: string
  effective_note: string | null
  topic?: string
  review_status?: string
  /** Set when the law monitor saw the chunk's jurisdiction change (0071). */
  source_changed_at?: string | null
}

interface RetrievalResult {
  chunks: GuidanceChunk[]
  /** True when the RPC errored — distinct from a genuine zero-hit, so the
   *  payload and telemetry can say "retrieval was unavailable" instead of
   *  "nothing matched" (the 0058 tsquery bug hid behind exactly this
   *  conflation for ten days). */
  failed: boolean
}

/**
 * Ranked full-text retrieval over the curated grounding corpus — the
 * match_advisor_guidance RPC (migration 0023: OR-ed lexemes ordered by
 * ts_rank; strict websearch matching returns zero rows on conversational
 * questions). Additive: any failure returns no chunks and the reply
 * proceeds under the prompt's statutory-precision fallback rules —
 * retrieval must never take the Advisor down. Failures are still
 * distinguished from zero-hits for telemetry and the structured payload.
 */
async function retrieveGuidance(
  adminClient: SupabaseClient,
  query: string,
): Promise<RetrievalResult> {
  try {
    const { data, error } = await adminClient.rpc('match_advisor_guidance', {
      q: query,
      k: 4,
    })
    if (error) {
      console.error('advisor-chat: retrieval failed —', error.message)
      return { chunks: [], failed: true }
    }
    return { chunks: (data as GuidanceChunk[] | null) ?? [], failed: false }
  } catch (error) {
    console.error('advisor-chat: retrieval failed —', error)
    return { chunks: [], failed: true }
  }
}

function guidanceBlock(chunks: GuidanceChunk[]): string {
  if (chunks.length === 0) return ''
  const items = chunks
    .map((c) => {
      const effective = c.effective_note ? `; ${c.effective_note}` : ''
      return `- [${c.jurisdiction}] ${c.title}: ${c.content} (Source: ${c.source_name}, ${c.source_url}${effective})`
    })
    .join('\n')
  return (
    "\n\nRetrieved guidance from Dutiva's curated corpus — each entry carries its official " +
    'source. Treat these entries as the ONLY authoritative basis for statutory figures this ' +
    'turn: when they cover the question, answer from them and name the source; when they do ' +
    'not cover it, follow the statutory-precision rules above.\n' +
    items
  )
}

/**
 * Load confirmed org memory for prompt injection. Failures return [] — memory
 * must never take the Advisor down (same posture as corpus retrieval).
 */
async function loadOrgMemoryFacts(
  adminClient: SupabaseClient,
  organizationId: string | null,
): Promise<MemoryFactForPrompt[]> {
  if (!organizationId) return []
  try {
    const { data, error } = await adminClient
      .from('hr_advisor_memory_facts')
      .select(
        'id, scope, entity_id, category, statement_en, statement_fr, source_type, visibility, sensitive, confidence',
      )
      .eq('organization_id', organizationId)
      .eq('confidence', 'confirmed')
      .eq('sensitive', false)
      .is('forgotten_at', null)
      .order('learned_at', { ascending: false })
      .limit(40)
    if (error) {
      console.error('advisor-chat: memory facts load failed —', error.message)
      return []
    }
    const rows = (data ?? []) as Array<{
      id: string
      scope: MemoryFactForPrompt['scope']
      entity_id: string
      category: string
      statement_en: string
      statement_fr: string
      source_type: string
      visibility: MemoryFactForPrompt['visibility']
      sensitive: boolean
      confidence: MemoryFactForPrompt['confidence']
    }>
    return rows.map((r) => ({
      id: r.id,
      scope: r.scope,
      entityId: r.entity_id,
      category: r.category,
      statementEn: r.statement_en,
      statementFr: r.statement_fr,
      sourceType: r.source_type,
      visibility: r.visibility,
      sensitive: r.sensitive,
      confidence: r.confidence,
    }))
  } catch (error) {
    console.error('advisor-chat: memory facts load failed —', error)
    return []
  }
}

/**
 * Persist inferred candidates from a dutiva-memory fence. Dedupes exact
 * statement_en matches for the same org+scope+entity. Failures are logged
 * and swallowed — extraction must never fail the user-visible reply.
 */
async function persistExtractedFacts(
  adminClient: SupabaseClient,
  organizationId: string,
  conversationId: string,
  actorUserId: string,
  candidates: readonly ExtractedMemoryCandidate[],
): Promise<void> {
  if (candidates.length === 0) return
  try {
    const { data: existing, error: readError } = await adminClient
      .from('hr_advisor_memory_facts')
      .select('statement_en, scope, entity_id')
      .eq('organization_id', organizationId)
      .is('forgotten_at', null)
      .limit(200)
    if (readError) {
      console.error('advisor-chat: extract dedupe read failed —', readError.message)
      return
    }
    const seen = new Set(
      ((existing ?? []) as Array<{ statement_en: string; scope: string; entity_id: string }>).map(
        (r) => `${r.scope}:${r.entity_id}:${r.statement_en.trim().toLowerCase()}`,
      ),
    )
    const now = new Date().toISOString()
    for (const c of candidates) {
      const key = `${c.scope}:${c.entityId}:${c.statementEn.trim().toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      const { data: inserted, error: insertError } = await adminClient
        .from('hr_advisor_memory_facts')
        .insert({
          organization_id: organizationId,
          scope: c.scope,
          entity_id: c.entityId || conversationId,
          category: c.category,
          statement_en: c.statementEn,
          statement_fr: c.statementFr || c.statementEn,
          confidence: 'inferred',
          source_type: 'chat',
          source_detail_en: 'Extracted from Advisor conversation',
          source_detail_fr: 'Extrait d’une conversation avec le Conseiller',
          learned_at: now,
          confirmed_at: null,
          visibility: c.sensitive ? 'restricted' : 'hr',
          sensitive: c.sensitive,
          created_by: actorUserId,
          updated_by: actorUserId,
        })
        .select('id, statement_en, statement_fr')
        .single()
      if (insertError || !inserted) {
        console.error('advisor-chat: extract insert failed —', insertError?.message)
        continue
      }
      const row = inserted as { id: string; statement_en: string; statement_fr: string }
      await adminClient.from('hr_advisor_memory_audit').insert({
        organization_id: organizationId,
        fact_id: row.id,
        actor_user_id: actorUserId,
        action: 'create',
        statement_en: row.statement_en,
        statement_fr: row.statement_fr,
      })
    }
  } catch (error) {
    console.error('advisor-chat: extract persist failed —', error)
  }
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

  return { user, adminClient: createClient(config.supabaseUrl, config.serviceRoleKey) }
}

async function readChatRequest(req: Request): Promise<ChatRequest | Response> {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) return json({ error: 'message is required' }, 400)
  return {
    message,
    conversationId: typeof body.conversation_id === 'string' ? body.conversation_id : null,
    organizationId: typeof body.organization_id === 'string' ? body.organization_id : null,
    timezone: typeof body.timezone === 'string' ? body.timezone : null,
  }
}

async function activeModelRoute(adminClient: SupabaseClient): Promise<ActiveModelRoute | Response> {
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
  return { route, provider }
}

async function loadConversation(
  adminClient: SupabaseClient,
  userId: string,
  organizationId: string | null,
  conversationId: string | null,
): Promise<Conversation | Response> {
  if (conversationId) {
    const { data, error } = await adminClient
      .from('conversations')
      .select('id, messages')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()
    if (error || !data) return json({ error: 'Conversation not found' }, 404)
    return data as Conversation
  }

  const { data, error } = await adminClient
    .from('conversations')
    .insert({ user_id: userId, organization_id: organizationId, messages: [] })
    .select('id, messages')
    .single()
  if (error) return json({ error: error.message }, 500)
  return data as Conversation
}

/* Closes out the claimed telemetry row on an upstream failure. The claim is
   deliberately NOT refunded: a client hammering a broken provider is exactly
   what the burst ceiling is for, and a refund path is a way to spend the
   budget for free. */
async function recordUpstreamError(
  adminClient: SupabaseClient,
  claimId: string,
  started: number,
  error: unknown,
): Promise<Response> {
  const errorMessage = error instanceof Error ? error.message : String(error)
  await finalizeAiUsage(adminClient, claimId, {
    status: 'failed',
    latencyMs: Date.now() - started,
    metadata: { error: errorMessage },
  })
  return json({ error: 'The AI Advisor is temporarily unavailable. Try again shortly.' }, 502)
}

async function requestCompletion(
  adminClient: SupabaseClient,
  claimId: string,
  request: ChatRequest,
  route: ModelRoute,
  provider: ModelProvider,
  history: ChatMessage[],
  userMessage: ChatMessage,
  guidance: string,
): Promise<{ completion: Completion; latencyMs: number } | Response> {
  const apiKey = Deno.env.get(provider.secret_ref)
  if (!apiKey) {
    await finalizeAiUsage(adminClient, claimId, { status: 'failed', latencyMs: 0 })
    return json({ error: `Missing secret ${provider.secret_ref}` }, 500)
  }

  const started = Date.now()
  try {
    const upstream = await fetch(`${provider.base_url}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: route.model_name,
        messages: [
          {
            role: 'system',
            content: `${SYSTEM_PROMPT}\n\n${currentTimeLine(request.timezone)}${guidance}`,
          },
          ...history,
          userMessage,
        ],
        max_tokens: route.config?.max_tokens ?? 800,
        /* DB-tunable so a model that pins sampling (some reasoning models
           reject temperature != 1) needs a config change, not a deploy. The
           typeof guard keeps a jsonb null or string from reaching the wire. */
        ...(typeof route.config?.temperature === 'number'
          ? { temperature: route.config.temperature }
          : {}),
      }),
    })
    if (!upstream.ok) {
      const errText = await upstream.text()
      throw new Error(`Upstream ${upstream.status}: ${errText.slice(0, 500)}`)
    }
    return { completion: await upstream.json(), latencyMs: Date.now() - started }
  } catch (error) {
    return recordUpstreamError(adminClient, claimId, started, error)
  }
}

async function saveConversation(
  adminClient: SupabaseClient,
  conversation: Conversation,
  messages: ChatMessage[],
  lastAdvisorResponse: unknown | null = null,
): Promise<Response | null> {
  const { error } = await adminClient
    .from('conversations')
    .update({
      messages,
      last_advisor_response: lastAdvisorResponse,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversation.id)
  return error ? json({ error: error.message }, 500) : null
}

/* Same telemetry this function has always written — now an update of the row
   the claim already reserved, so the token counts land on the row the daily
   token ceiling reads. */
async function recordCompletion(
  adminClient: SupabaseClient,
  claimId: string,
  completion: Completion,
  latencyMs: number,
  retrieval: RetrievalResult,
  commercialSource?: string,
) {
  const usage = completion.usage ?? {}
  await finalizeAiUsage(adminClient, claimId, {
    status: 'completed',
    latencyMs,
    promptTokens: usage.prompt_tokens ?? null,
    completionTokens: usage.completion_tokens ?? null,
    totalTokens: usage.total_tokens ?? null,
    /* retrieval_failed distinguishes an infrastructure failure from a
       genuine no-match — `retrieved_chunks: 0` alone cannot. */
    metadata: {
      retrieved_chunks: retrieval.chunks.length,
      retrieval_failed: retrieval.failed,
      ...(commercialSource ? { commercial: commercialSource } : {}),
    },
  })
}

async function reportOverageIfNeeded(
  adminClient: SupabaseClient,
  userId: string,
  commercialSource: string | undefined,
) {
  if (commercialSource !== 'overage') return
  const eventName = (Deno.env.get('STRIPE_ADVISOR_METER_EVENT_NAME') ?? '').trim()
  const secret = readStripeSecretKey(Deno.env.get('STRIPE_SECRET_KEY'))
  if (!eventName || !secret) {
    console.error('advisor-chat: overage claimed but meter is not configured')
    return
  }
  const { data } = await adminClient
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()
  const customerId = typeof data?.stripe_customer_id === 'string' ? data.stripe_customer_id : ''
  const result = await reportAdvisorOverageMeter({
    stripeCustomerId: customerId,
    secretKey: secret,
    eventName,
  })
  if (!result.ok) console.error('advisor-chat: overage meter failed', result.reason)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config
  const authenticated = await authenticateRequest(req, config)
  if (authenticated instanceof Response) return authenticated
  const request = await readChatRequest(req)
  if (request instanceof Response) return request
  const activeRoute = await activeModelRoute(authenticated.adminClient)
  if (activeRoute instanceof Response) return activeRoute
  const conversation = await loadConversation(
    authenticated.adminClient,
    authenticated.user.id,
    request.organizationId,
    request.conversationId,
  )
  if (conversation instanceof Response) return conversation

  const fullHistory = Array.isArray(conversation.messages) ? conversation.messages : []
  /* Cap what goes upstream: the full transcript persists in `conversations`,
     but an unbounded prompt grows cost/latency every turn and eventually
     overflows the context window. 20 messages = 10 user/assistant
     exchanges — far beyond real usage. */
  const history = fullHistory.slice(-20)
  const userMessage: ChatMessage = { role: 'user', content: request.message }
  /* Retrieval sees the previous user turn too, so a follow-up ("and after
     5 years?") still carries the lexemes that found the right chunk. */
  const retrieval = await retrieveGuidance(
    authenticated.adminClient,
    buildRetrievalQuery(history, request.message),
  )
  const guidanceChunks = retrieval.chunks

  /* Meter as late as possible — right before the only step that costs money.
     Everything above is Postgres work, and a turn that dies loading its own
     conversation should not spend the caller's beta budget. */
  const decision = await claimAiUsage(authenticated.adminClient, advisorChatPolicy(), {
    userId: authenticated.user.id,
    organizationId: request.organizationId,
    provider: activeRoute.provider.provider_key,
    model: activeRoute.route.model_name,
  })
  if (decision.kind === 'denied') {
    /* Not stored as a row (see the migration): denials belong in the function
       log, where tuning the beta ceilings can read them without them counting
       against the person who hit one. */
    console.warn(
      `advisor-chat: usage limit reached (scope=${decision.scope}, used=${decision.used}/${decision.limit})`,
    )
    return json(usageLimitBody(decision), 429, {
      'Retry-After': String(decision.retryAfterSeconds),
    })
  }
  if (decision.kind === 'unavailable') {
    /* Fail closed. An unmetered call is the one outcome the guardrail exists
       to prevent, so a guardrail that cannot be evaluated stops the request
       rather than waving it through. */
    console.error('advisor-chat: usage guardrail unavailable —', decision.reason)
    return json({ error: 'The AI Advisor is temporarily unavailable. Try again shortly.' }, 503)
  }

  /* Grounding: retrieved corpus entries, plus the encoded statutory notice
     schedule when the turn is recognizably an Ontario notice question — so
     the one figure the product has a table for is looked up, not generated
     (§5.2's grounding half, finally wired into the chat path). Confirmed
     org memory (hr_advisor_memory_facts) is appended separately — workplace
     context, never statute. */
  const memoryFacts = selectMemoryFactsForPrompt(
    await loadOrgMemoryFacts(authenticated.adminClient, request.organizationId),
    conversation.id,
  )
  const extractionAppendix = request.organizationId ? memoryExtractionPromptAppendix() : ''
  const guidance =
    guidanceBlock(guidanceChunks) +
    noticeScheduleBlock(request.message, detectJurisdictions(request.message)) +
    memoryBlock(memoryFacts) +
    extractionAppendix

  const completionResult = await requestCompletion(
    authenticated.adminClient,
    decision.claimId,
    request,
    activeRoute.route,
    activeRoute.provider,
    history,
    userMessage,
    guidance,
  )
  if (completionResult instanceof Response) return completionResult

  const rawReply = completionResult.completion.choices?.[0]?.message?.content ?? ''
  const extracted = request.organizationId
    ? extractMemoryCandidates(rawReply, request.message, conversation.id)
    : { cleanReply: rawReply, candidates: [] as ExtractedMemoryCandidate[] }
  const reply = extracted.cleanReply
  if (request.organizationId && extracted.candidates.length > 0) {
    await persistExtractedFacts(
      authenticated.adminClient,
      request.organizationId,
      conversation.id,
      authenticated.user.id,
      extracted.candidates,
    )
  }
  const nextMessages = [...fullHistory, userMessage, { role: 'assistant' as const, content: reply }]
  /* Close the claim before persisting the turn: the tokens are already spent
     upstream, so they must be recorded even if the conversation write fails. */
  await recordCompletion(
    authenticated.adminClient,
    decision.claimId,
    completionResult.completion,
    completionResult.latencyMs,
    retrieval,
    decision.commercialSource,
  )
  await reportOverageIfNeeded(
    authenticated.adminClient,
    authenticated.user.id,
    decision.commercialSource,
  )

  /* The structured contract the Compliance Workspace renders — computed
     deterministically from the message, the retrieved chunks and the reply
     (responsePayload.ts); the model is never asked for it. Never let a
     payload failure cost the user their reply. Persisted on the conversation
     so reopen can restore the right panel (UI only — next turn still rebuilds). */
  let advisorResponse: unknown = null
  try {
    advisorResponse = buildAdvisorResponse({
      message: request.message,
      reply,
      chunks: guidanceChunks,
      retrievalFailed: retrieval.failed,
      memoryFacts: memoryFacts.map((f) => ({
        id: f.id,
        statementEn: f.statementEn,
        statementFr: f.statementFr,
      })),
    })
  } catch (error) {
    console.error('advisor-chat: response payload build failed', error)
  }

  const updateResponse = await saveConversation(
    authenticated.adminClient,
    conversation,
    nextMessages,
    advisorResponse,
  )
  if (updateResponse) return updateResponse

  return json({
    data: { reply, conversation_id: conversation.id, advisor_response: advisorResponse },
  })
})
