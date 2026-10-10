import { finalizeAiUsage, type UsageDbClient } from '../_shared/aiUsage.ts'
import { reportAdvisorOverageMeter } from '../_shared/advisorOverageMeter.ts'
import { readStripeSecretKey } from '../_shared/stripeSecret.ts'
import { postChatCompletion, resolveApiKey } from '../_shared/modelUpstream.ts'
import type { UpstreamMessage } from '../_shared/modelUpstream.ts'
import type {
  ChatMessage,
  ChatRequest,
  Completion,
  Conversation,
  ModelProvider,
  ModelRoute,
  RetrievalResult,
  SupabaseClient,
} from './chatTypes.ts'
import { json } from './respond.ts'
import type { Json } from '../_shared/database.types.ts'

/**
 * The metered half of the turn — everything after request setup and
 * retrieval: the upstream completion call, conversation persistence, and
 * the telemetry/metering writes that close out the claimed usage row.
 */

/* The opening paragraph is tiered: external accounts get the standing
   "not a lawyer" boundary, a verified @dutiva.ca sign-in gets the direct-
   advice register. Everything after — factual grounding, statutory
   precision, formatting — is shared. */
const SYSTEM_PROMPT_OPENING =
  'You are the Dutiva AI Advisor, a compliance-oriented HR assistant for Canadian ' +
  'employers. Give practical, jurisdiction-aware HR guidance (Ontario, Quebec, and ' +
  'federally regulated workplaces). You are not a lawyer and do not provide legal ' +
  'advice — for high-risk employment decisions (termination, discipline, ' +
  'accommodation), tell the user to consult qualified legal counsel.\n\n'

const SYSTEM_PROMPT_OPENING_INTERNAL =
  'You are the Dutiva AI Advisor, a compliance-oriented HR assistant for Canadian ' +
  'employers. Give practical, jurisdiction-aware HR guidance (Ontario, Quebec, and ' +
  'federally regulated workplaces). You are not a lawyer and do not provide legal ' +
  'advice — for high-risk employment decisions (termination, discipline, ' +
  'accommodation), tell the user to consult qualified legal counsel. This account ' +
  'is internal Dutiva staff (@dutiva.ca) — advise directly: when they ask what to ' +
  'do, give your recommendation and the reasoning, not just a menu of options. A ' +
  'straight answer is the default register here, not a hedge.\n\n'

const SYSTEM_PROMPT_BODY =
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

export const SYSTEM_PROMPT = SYSTEM_PROMPT_OPENING + SYSTEM_PROMPT_BODY

/** Tiered opening — internal staff get the direct-advice register, everyone
    else the standing not-a-lawyer boundary. */
export function advisorSystemPrompt(advice: boolean): string {
  return (advice ? SYSTEM_PROMPT_OPENING_INTERNAL : SYSTEM_PROMPT_OPENING) + SYSTEM_PROMPT_BODY
}

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

export async function loadConversation(
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
    return data as unknown as Conversation
  }

  const { data, error } = await adminClient
    .from('conversations')
    .insert({ user_id: userId, organization_id: organizationId, messages: [] })
    .select('id, messages')
    .single()
  if (error) return json({ error: error.message }, 500)
  return data as unknown as Conversation
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
  await finalizeAiUsage(adminClient as unknown as UsageDbClient, claimId, {
    status: 'failed',
    latencyMs: Date.now() - started,
    metadata: { error: errorMessage },
  })
  return json({ error: 'The AI Advisor is temporarily unavailable. Try again shortly.' }, 502)
}

export async function requestCompletion(
  adminClient: SupabaseClient,
  claimId: string,
  request: ChatRequest,
  route: ModelRoute,
  provider: ModelProvider,
  history: ChatMessage[],
  userMessage: UpstreamMessage,
  guidance: string,
  advice: boolean,
): Promise<{ completion: Completion; latencyMs: number } | Response> {
  const keyResult = resolveApiKey(provider.secret_ref, (name) => Deno.env.get(name))
  if ('missingSecret' in keyResult) {
    await finalizeAiUsage(adminClient as unknown as UsageDbClient, claimId, {
      status: 'failed',
      latencyMs: 0,
    })
    return json({ error: `Missing secret ${keyResult.missingSecret}` }, 500)
  }

  const started = Date.now()
  try {
    const upstream = await postChatCompletion(
      provider,
      keyResult.apiKey,
      {
        model: route.model_name,
        messages: [
          {
            role: 'system',
            content: `${advisorSystemPrompt(advice)}\n\n${currentTimeLine(request.timezone)}${guidance}`,
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
      },
      typeof route.config?.timeout_ms === 'number' ? route.config.timeout_ms : undefined,
    )
    if (!upstream.ok) {
      const errText = await upstream.text()
      throw new Error(`Upstream ${upstream.status}: ${errText.slice(0, 500)}`)
    }
    return { completion: await upstream.json(), latencyMs: Date.now() - started }
  } catch (error) {
    return recordUpstreamError(adminClient, claimId, started, error)
  }
}

export async function saveConversation(
  adminClient: SupabaseClient,
  conversation: Conversation,
  messages: ChatMessage[],
  lastAdvisorResponse: unknown | null = null,
): Promise<Response | null> {
  const { error } = await adminClient
    .from('conversations')
    .update({
      messages: messages as unknown as Json,
      last_advisor_response: lastAdvisorResponse as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversation.id)
  return error ? json({ error: error.message }, 500) : null
}

/* Same telemetry this function has always written — now an update of the row
   the claim already reserved, so the token counts land on the row the daily
   token ceiling reads. */
export async function recordCompletion(
  adminClient: SupabaseClient,
  claimId: string,
  completion: Completion,
  latencyMs: number,
  retrieval: RetrievalResult,
  commercialSource?: string,
) {
  const usage = completion.usage ?? {}
  await finalizeAiUsage(adminClient as unknown as UsageDbClient, claimId, {
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

export async function reportOverageIfNeeded(
  adminClient: SupabaseClient,
  userId: string,
  organizationId: string | null,
  commercialSource: string | undefined,
) {
  if (commercialSource !== 'overage') return
  const eventName = (Deno.env.get('STRIPE_ADVISOR_METER_EVENT_NAME') ?? '').trim()
  const secret = readStripeSecretKey(Deno.env.get('STRIPE_SECRET_KEY'))
  if (!eventName || !secret) {
    console.error('advisor-chat: overage claimed but meter is not configured')
    return
  }
  /* Meter the customer whose budget the overage drew on: claim_ai_usage's
     org-pooled path checks organizations.stripe_customer_id for eligibility,
     so the meter event must land on that same customer — a member's own
     profile has no Stripe identity (silent no-bill) and must not be billed
     for the org's overage anyway. The legacy null-org path still meters the
     caller's profile, matching its own profiles.* eligibility check. */
  const { data } = organizationId
    ? await adminClient
        .from('organizations')
        .select('stripe_customer_id')
        .eq('id', organizationId)
        .maybeSingle()
    : await adminClient
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
