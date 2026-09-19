import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { advisorResponseSchema, memoryCreatedItemSchema } from './contract'
import type { AdvisorResponse, MemoryCreatedItem } from './contract'
import { toWireAttachments } from './attachments'
import type { AdvisorAttachment } from './attachments'
import { applySafetyBackstop } from './safety'
import { reportSafetyEvent } from './safetyTelemetry'

/**
 * Real AI Advisor replies — calls the `advisor-chat` edge function (bearer
 * JWT via the current Supabase session). See supabase/functions/advisor-chat
 * for the server side: route lookup, engine call, conversation persistence,
 * telemetry.
 *
 * The engine contract (`POST /api/advisor/respond`, Engineering Roadmap P0)
 * adds a structured `advisor_response` payload alongside the conversational
 * reply. It is optional here so the app keeps working against an engine that
 * only returns text: when present and valid it feeds the Compliance
 * Workspace; when absent or malformed the reply still renders and the
 * workspace shows nothing rather than an unvalidated payload.
 *
 * A validated payload is then passed through the deterministic safety backstop
 * (`./safety`, docs/AI_USAGE_STRATEGY.md §5) before it reaches the workspace —
 * client-side defense-in-depth that can only tighten gates (crisis intercept,
 * jurisdiction/statutory-figure gate), never loosen them.
 *
 * One server refusal is not a failure and must not read like one: during the
 * beta the AI surface is metered (supabase/functions/_shared/aiUsage.ts), and a
 * turn refused by that guardrail comes back as a 429 the caller should explain
 * rather than offer to retry. It surfaces here as `AdvisorUsageLimitError`.
 */

/** Which ceiling refused the turn; mirrors the edge function's `scope`. */
export type AdvisorUsageScope = 'burst' | 'daily' | 'daily_tokens' | 'platform_daily' | 'commercial'

export class AdvisorUsageLimitError extends Error {
  constructor(
    readonly scope: AdvisorUsageScope,
    /** Seconds until the ceiling frees up; always ≥ 1. */
    readonly retryAfterSeconds: number,
  ) {
    super(`advisor usage limit reached (${scope})`)
    this.name = 'AdvisorUsageLimitError'
  }
}

const USAGE_SCOPES: AdvisorUsageScope[] = [
  'burst',
  'daily',
  'daily_tokens',
  'platform_daily',
  'commercial',
]

/**
 * The routed model refused the turn's attachments (422 with
 * `code: 'modality_unsupported'` — e.g. an image sent to a text-only route).
 * Distinct from a failure: nothing was spent and the fix is a different
 * model or removing the attachment, so it should read that way.
 */
export class AdvisorModalityError extends Error {
  constructor(readonly modality: string) {
    super(`active model does not accept ${modality} input`)
    this.name = 'AdvisorModalityError'
  }
}

async function modalityErrorFrom(error: unknown): Promise<AdvisorModalityError | null> {
  const context = (error as { context?: { status?: number; json?: () => Promise<unknown> } })
    ?.context
  if (context?.status !== 422) return null
  try {
    const body = (await context.json?.()) as Record<string, unknown> | undefined
    if (body?.code !== 'modality_unsupported') return null
    return new AdvisorModalityError(typeof body.modality === 'string' ? body.modality : 'input')
  } catch {
    return new AdvisorModalityError('input')
  }
}

/**
 * supabase-js surfaces a non-2xx as a `FunctionsHttpError` carrying the raw
 * `Response`. A 429 from this endpoint is always the guardrail, so an
 * unreadable or unexpected body still resolves to a usage limit — degrading to
 * the generic outage message would tell the user something untrue.
 */
async function usageLimitFrom(error: unknown): Promise<AdvisorUsageLimitError | null> {
  const context = (error as { context?: { status?: number; json?: () => Promise<unknown> } })
    ?.context
  if (context?.status !== 429) return null

  let scope: AdvisorUsageScope = 'daily'
  let retryAfterSeconds = 60
  try {
    const body = (await context.json?.()) as Record<string, unknown> | undefined
    const rawScope = body?.scope
    if (typeof rawScope === 'string' && (USAGE_SCOPES as string[]).includes(rawScope)) {
      scope = rawScope as AdvisorUsageScope
    }
    const rawRetry = Number(body?.retry_after_seconds)
    if (Number.isFinite(rawRetry) && rawRetry > 0) retryAfterSeconds = Math.ceil(rawRetry)
  } catch {
    /* Body already consumed or not JSON — the status alone is enough. */
  }
  return new AdvisorUsageLimitError(scope, retryAfterSeconds)
}

const advisorChatResponseSchema = z.object({
  data: z.object({
    reply: z.string(),
    conversation_id: z.string(),
    advisor_response: z.unknown().optional(),
    memory_created: z.array(memoryCreatedItemSchema).optional(),
  }),
})

export interface AdvisorChatResult {
  reply: string
  conversationId: string
  /** Validated structured payload, or null if the engine didn't send one. */
  response: AdvisorResponse | null
  /** Facts newly persisted from this turn (inferred), for Review toasts. */
  memoryCreated: MemoryCreatedItem[]
}

export async function sendAdvisorMessage(
  message: string,
  conversationId: string | null,
  organizationId: string | null = null,
  attachments: readonly AdvisorAttachment[] = [],
): Promise<AdvisorChatResult> {
  if (!supabase) {
    throw new Error('Real AI Advisor replies are not configured in this environment.')
  }
  /* The edge function stamps the current date/time into the system prompt so
     the model knows morning from evening — that only works in the user's own
     timezone, which the server can't infer. organization_id unlocks confirmed
     org memory injection (hr_advisor_memory_facts) when production mode has
     provisioned a tenant. Attachments ride along as image data URLs /
     pre-extracted document text (see ./attachments.ts); the server re-validates
     and modality-gates them against the active route. */
  const { data, error } = await supabase.functions.invoke('advisor-chat', {
    body: {
      message,
      conversation_id: conversationId,
      organization_id: organizationId,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(attachments.length > 0 ? { attachments: toWireAttachments(attachments) } : {}),
    },
  })
  if (error) throw (await usageLimitFrom(error)) ?? (await modalityErrorFrom(error)) ?? error
  const parsed = advisorChatResponseSchema.parse(data)
  let response: AdvisorResponse | null = null
  if (parsed.data.advisor_response !== undefined) {
    const structured = advisorResponseSchema.safeParse(parsed.data.advisor_response)
    if (structured.success) {
      const backstop = applySafetyBackstop({
        userMessage: message,
        reply: parsed.data.reply,
        response: structured.data,
      })
      response = backstop.response
      // Fire-and-forget: record which gate(s) fired, never block the reply.
      if (backstop.actions.length > 0) {
        void reportSafetyEvent({
          conversationId: parsed.data.conversation_id,
          actions: backstop.actions,
        })
      }
    } else {
      console.warn('advisor: structured payload failed contract validation', structured.error)
    }
  }
  return {
    reply: parsed.data.reply,
    conversationId: parsed.data.conversation_id,
    response,
    memoryCreated: parsed.data.memory_created ?? [],
  }
}
