import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { buildAdvisorResponse, detectJurisdictions } from './responsePayload.ts'
import type { AdvisorResponsePayload } from './responsePayload.ts'
import { agentActionsEnabled, extractActions, looksActionable } from './agentPropose.ts'
import { noticeScheduleBlock } from './noticeSchedule.ts'
import { buildRetrievalQuery } from './retrievalQuery.ts'
import { memoryBlock, selectMemoryFactsForPrompt } from './memoryFacts.ts'
import { memoryExtractionPromptAppendix, extractMemoryCandidates } from './memoryExtract.ts'
import type { ExtractedMemoryCandidate } from './memoryExtract.ts'
import { planAllowsAdvisorMemory, planFeatureGatesEnabled } from './planEntitlements.ts'
import {
  advisorChatPolicy,
  claimAiUsage,
  usageLimitBody,
  type UsageDbClient,
} from '../_shared/aiUsage.ts'
import {
  missingModality,
  persistedUserContent,
  routeModalities,
  userMessageContent,
} from '../_shared/modelUpstream.ts'
import type { UpstreamMessage } from '../_shared/modelUpstream.ts'
import { withCors } from '../_shared/cors.ts'
import type { ChatMessage } from './chatTypes.ts'
import { guidanceBlock, retrieveGuidance } from './guidance.ts'
import {
  loadOrganizationPlan,
  loadOrgMemoryFacts,
  persistExtractedFacts,
} from './memoryPersistence.ts'
import {
  activeModelRoute,
  authenticateRequest,
  readChatRequest,
  serverConfig,
  verifyOrgMembership,
} from './requestSetup.ts'
import {
  loadConversation,
  recordCompletion,
  reportOverageIfNeeded,
  requestCompletion,
  saveConversation,
} from './completion.ts'
import { corsHeaders, json } from './respond.ts'

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

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const config = serverConfig()
  if (config instanceof Response) return config
  const authenticated = await authenticateRequest(req, config)
  if (authenticated instanceof Response) return authenticated
  const request = await readChatRequest(req)
  if (request instanceof Response) return request
  /* Tenant boundary before any org-scoped work — the request's
     organization_id is caller-supplied. */
  const orgCheck = await verifyOrgMembership(
    authenticated.adminClient,
    authenticated.user.id,
    request.organizationId,
  )
  if (orgCheck) return orgCheck
  const activeRoute = await activeModelRoute(authenticated.adminClient)
  if (activeRoute instanceof Response) return activeRoute
  /* Modality gate — refuse before metering: a turn the routed model cannot
     even see (an image sent to a text-only route) must not spend budget.
     Documents inline to text, so only images can trip this. */
  const missing = missingModality(request.attachments, routeModalities(activeRoute.route.config))
  if (missing) {
    return json(
      {
        error: `The active model for this route does not accept ${missing} input.`,
        code: 'modality_unsupported',
        modality: missing,
      },
      422,
    )
  }
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
  /* Two faces of the same turn: `upstreamUserMessage` carries multimodal
     content parts to the model; `persistedUserMessage` is the text-only
     manifest + message stored in conversations.messages. */
  const upstreamUserMessage: UpstreamMessage = {
    role: 'user',
    content: userMessageContent(request.message, request.attachments),
  }
  const persistedUserMessage: ChatMessage = {
    role: 'user',
    content: persistedUserContent(request.message, request.attachments),
  }
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
  const decision = await claimAiUsage(
    authenticated.adminClient as unknown as UsageDbClient,
    advisorChatPolicy(),
    {
      userId: authenticated.user.id,
      organizationId: request.organizationId,
      provider: activeRoute.provider.provider_key,
      model: activeRoute.route.model_name,
    },
  )
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
     context, never statute. Injection is Growth+ when plan feature gates are
     on; while gates are off every admitted org keeps current parity. */
  const orgPlan = await loadOrganizationPlan(authenticated.adminClient, request.organizationId)
  const memoryAllowed = !planFeatureGatesEnabled() || planAllowsAdvisorMemory(orgPlan)
  const memoryFacts = selectMemoryFactsForPrompt(
    await loadOrgMemoryFacts(authenticated.adminClient, request.organizationId, memoryAllowed),
    conversation.id,
  )
  const extractionAppendix =
    request.organizationId && memoryAllowed ? memoryExtractionPromptAppendix() : ''
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
    upstreamUserMessage,
    guidance,
  )
  if (completionResult instanceof Response) return completionResult

  const rawReply = completionResult.completion.choices?.[0]?.message?.content ?? ''
  const extracted =
    request.organizationId && memoryAllowed
      ? extractMemoryCandidates(rawReply, request.message, conversation.id)
      : { cleanReply: rawReply, candidates: [] as ExtractedMemoryCandidate[] }
  const reply = extracted.cleanReply
  let memoryCreated: Array<{
    factId: string
    scope: 'person' | 'case' | 'thread'
    entityId: string
    statementEn: string
    statementFr: string
  }> = []
  if (request.organizationId && memoryAllowed && extracted.candidates.length > 0) {
    memoryCreated = await persistExtractedFacts(
      authenticated.adminClient,
      request.organizationId,
      conversation.id,
      authenticated.user.id,
      extracted.candidates,
    )
  }
  const nextMessages = [
    ...fullHistory,
    persistedUserMessage,
    { role: 'assistant' as const, content: reply },
  ]
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
    request.organizationId,
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
        scope: f.scope,
        entityId: f.entityId,
      })),
    })
  } catch (error) {
    console.error('advisor-chat: response payload build failed', error)
  }

  /* Agent proposals — opt-in via ADVISOR_AGENT_ACTIONS, hr turns only, and
     only when the message plausibly asks for a workspace change (the
     heuristic is a cost gate; validation happens in the extractor). The
     proposals go on the wire copy only — the persisted envelope below
     never carries them, so a reopened conversation can't resurface a
     stale confirm card. The model proposes; the client executor still
     gates execution behind human confirmation. */
  let wireAdvisorResponse: unknown = advisorResponse
  if (advisorResponse !== null && agentActionsEnabled() && looksActionable(request.message)) {
    const payload = advisorResponse as AdvisorResponsePayload
    if (payload.route.responseMode === 'hr' && payload.isCrisis !== true) {
      const proposedActions = await extractActions(
        activeRoute.provider,
        activeRoute.route,
        request.message,
        history,
      )
      if (proposedActions.length > 0) {
        wireAdvisorResponse = {
          ...payload,
          route: { ...payload.route, actionsAllowed: true },
          proposedActions,
        }
      }
    }
  }

  const updateResponse = await saveConversation(
    authenticated.adminClient,
    conversation,
    nextMessages,
    advisorResponse,
  )
  if (updateResponse) return updateResponse

  return json({
    data: {
      reply,
      conversation_id: conversation.id,
      /* Index of the assistant turn just persisted in messages[] — the key
         advisor_turn_feedback rates against. Only user/assistant rows are
         ever appended, so the raw index equals the client's filtered
         transcript index (productionTranscript). */
      turn_index: nextMessages.length - 1,
      advisor_response: wireAdvisorResponse,
      memory_created:
        memoryCreated.length > 0
          ? memoryCreated.map((f) => ({
              factId: f.factId,
              scope: f.scope,
              entityId: f.entityId,
              label: { en: f.statementEn, fr: f.statementFr || f.statementEn },
            }))
          : undefined,
    },
  })
}

Deno.serve(async (req) => withCors(req, await handler(req)))
