/**
 * Usage guardrails for the generative AI surface — the policy half of
 * `claim_ai_usage` (0027 abuse rails + 0091 commercial included/packs/overage
 * + 0109 org-pooled rollover when `organization_id` is set + 0112
 * `@dutiva.ca` staff bypass).
 *
 * Two layers, kept separate on purpose:
 *
 *   * Abuse rails (burst / daily request / daily tokens / platform) — never
 *     for sale. A 429 here is a wait, not a buy path. These stay per-user.
 *   * Commercial budget — monthly Advisor-reply allowance on operation `chat`
 *     only. With an organization id, consumption is org-pooled: oldest
 *     unexpired rollover → monthly included → org packs → opted-in overage.
 *     Without an org (legacy), the user-scoped 0091 path still applies.
 *     Exhausted commercial budget is `scope = 'commercial'`, which the
 *     Advisor answers with a pack CTA.
 *   * Staff (`@dutiva.ca` via `user_is_dutiva_staff`) — always allowed; a
 *     telemetry row is still reserved (metadata `staff_bypass`) so usage UI
 *     can stay a manual budget signal without lockout.
 *
 * Numbers here are env fallbacks. Plan-specific monthly included limits live
 * in SQL (`advisor_monthly_included` / planEntitlements); the env fallback
 * below remains for legacy/null-org callers. The product catalogue also
 * lives in `src/config/advisorUsage.ts` (Deno cannot import `src/`); keep
 * the two in step — `canonicalFacts.test.ts` greps these fallbacks.
 *
 * Shape of the mechanism (limits here, enforcement in SQL — same split as
 * report-error / ingest_client_error_report):
 *
 *   1. `claimAiUsage()` BEFORE the model call — atomically checks every
 *      ceiling and reserves a `status = 'started'` telemetry row.
 *   2. `finalizeAiUsage()` AFTER it — stamps that same row with tokens,
 *      latency and outcome. One row per call, claimed up front, so a
 *      concurrent burst cannot race past the check the way a plain
 *      SELECT-then-call can.
 *
 * A claim that is never finalized (function timeout, cold-start kill) stays
 * 'started' and keeps counting against its caller. That is the fail-safe
 * direction: the guardrail over-counts rather than leaking free calls.
 *
 * No supabase-js import on purpose — this module is unit-tested under Vitest,
 * which cannot resolve the `npm:`/`jsr:` specifiers edge functions use, so the
 * client arrives as a narrow structural type instead.
 */

/** Operations that call a model and therefore draw on the budget. */
export type MeteredOperation = 'chat' | 'support_firstline'

/**
 * Passed to the RPC as the set it counts over. `safety_backstop` is
 * deliberately absent: it records that a deterministic gate fired
 * client-side, costs nothing upstream, and must never consume a user's
 * budget — being kept safe is not usage.
 */
export const METERED_OPERATIONS: MeteredOperation[] = ['chat', 'support_firstline']

/**
 * Operations that draw on the monthly included budget and pack credits.
 * Support first-line stays on abuse rails only — it is not a pack SKU.
 */
export const COMMERCIAL_OPERATIONS: MeteredOperation[] = ['chat']

export type CommercialSource = 'included' | 'pack' | 'overage' | 'rollover'

/** Which ceiling refused the call. Mirrors the RPC's `scope` values. */
export type UsageScope =
  'burst' | 'daily' | 'daily_tokens' | 'platform_daily' | 'commercial' | 'unauthenticated'

export interface UsagePolicy {
  operation: MeteredOperation
  burstWindowSeconds: number
  burstLimit: number
  dailyRequestLimit: number
  dailyTokenLimit: number
  platformDailyLimit: number
}

/** Reads a positive integer override from the function env; ignores junk. */
function envInt(name: string, fallback: number): number {
  const raw =
    typeof Deno !== 'undefined' && typeof Deno.env?.get === 'function'
      ? Deno.env.get(name)
      : undefined
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Per-user daily budget, shared across every metered operation. One budget
 * rather than one per surface: the Advisor and the support helper bill to the
 * same provider account, so a per-surface limit would just be the sum of both.
 *
 * 120 requests / 250k tokens a day is far past a working day of real HR
 * questions and still bounded; 2,000 platform requests a day is the stop on a
 * beta-wide surprise, whether that is one enthusiastic account or fifty
 * ordinary ones. Every number is env-overridable so tuning the beta is a
 * secret change, not a deploy.
 */
function sharedCeilings() {
  return {
    dailyRequestLimit: envInt('AI_DAILY_REQUEST_LIMIT', 120),
    dailyTokenLimit: envInt('AI_DAILY_TOKEN_LIMIT', 250_000),
    platformDailyLimit: envInt('AI_PLATFORM_DAILY_LIMIT', 2_000),
  }
}

/**
 * Monthly included Advisor replies passed to `claim_ai_usage` as
 * `p_monthly_chat_limit`. Plan-specific org limits come from SQL
 * (`advisor_monthly_included`); this env fallback (80) remains for
 * legacy/null-org callers and must match `ADVISOR_MONTHLY_INCLUDED` in
 * src/config/advisorUsage.ts.
 */
export function monthlyChatLimit(): number {
  return envInt('AI_MONTHLY_CHAT_LIMIT', 80)
}

function envFlag(name: string): boolean {
  const raw =
    typeof Deno !== 'undefined' && typeof Deno.env?.get === 'function'
      ? Deno.env.get(name)
      : undefined
  return Boolean(raw && raw.trim())
}

/**
 * Hard cap on extra billed replies this calendar month. Zero when the Stripe
 * meter event name is unset — packs still work; waitlist accounts cannot be
 * invoiced by accident. Fallback 500 must match `ADVISOR_OVERAGE_MONTHLY_REPLY_CAP`.
 */
export function overageMonthlyCap(): number {
  if (!envFlag('STRIPE_ADVISOR_METER_EVENT_NAME')) return 0
  return envInt('AI_OVERAGE_MONTHLY_CAP', 500)
}

/**
 * Burst is per-operation (the RPC's burst count filters by operation) and
 * exists for a different threat than the daily budget: a retry loop or a
 * script, which shows up as ten calls in a minute rather than many over a day.
 */
export function advisorChatPolicy(): UsagePolicy {
  return {
    operation: 'chat',
    burstWindowSeconds: envInt('AI_BURST_WINDOW_SECONDS', 300),
    burstLimit: envInt('AI_BURST_LIMIT_CHAT', 10),
    ...sharedCeilings(),
  }
}

export function supportFirstLinePolicy(): UsagePolicy {
  return {
    operation: 'support_firstline',
    burstWindowSeconds: envInt('AI_BURST_WINDOW_SECONDS', 300),
    burstLimit: envInt('AI_BURST_LIMIT_SUPPORT', 6),
    ...sharedCeilings(),
  }
}

export type UsageDecision =
  | { kind: 'allowed'; claimId: string; commercialSource?: CommercialSource }
  | {
      kind: 'denied'
      scope: UsageScope
      limit: number
      used: number
      retryAfterSeconds: number
    }
  /** The guardrail itself could not be evaluated — callers must fail closed. */
  | { kind: 'unavailable'; reason: string }

/** Minimal surface of the service-role client this module needs. */
export interface UsageDbClient {
  rpc(
    fn: string,
    params: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>
  from(table: string): {
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): PromiseLike<{ error: { message: string } | null }>
    }
  }
}

export interface ClaimInput {
  userId: string
  organizationId: string | null
  provider: string
  model: string
}

/** Coerces a jsonb number that may arrive as a string (bigint sums do). */
function toInt(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback
}

/**
 * Parses the RPC's jsonb verdict. Exported for its own tests — this is where a
 * shape change between SQL and TS would otherwise fail open, so it treats
 * anything it does not recognise as `unavailable` rather than as permission.
 */
export function decisionFromRpc(payload: unknown): UsageDecision {
  if (payload === null || typeof payload !== 'object') {
    return { kind: 'unavailable', reason: 'malformed guardrail verdict' }
  }
  const verdict = payload as Record<string, unknown>
  if (verdict.allowed === true) {
    if (typeof verdict.claim_id !== 'string' || verdict.claim_id.length === 0) {
      return { kind: 'unavailable', reason: 'guardrail allowed the call without a claim' }
    }
    const commercial = verdict.commercial
    const commercialSource: CommercialSource | undefined =
      commercial === 'included' ||
      commercial === 'pack' ||
      commercial === 'overage' ||
      commercial === 'rollover'
        ? commercial
        : undefined
    return commercialSource
      ? { kind: 'allowed', claimId: verdict.claim_id, commercialSource }
      : { kind: 'allowed', claimId: verdict.claim_id }
  }
  if (verdict.allowed !== false) {
    return { kind: 'unavailable', reason: 'malformed guardrail verdict' }
  }
  return {
    kind: 'denied',
    scope: (typeof verdict.scope === 'string' ? verdict.scope : 'daily') as UsageScope,
    limit: toInt(verdict.limit, 0),
    used: toInt(verdict.used, 0),
    /* Never 0 — a Retry-After of 0 invites an immediate retry, which is the
       behaviour the burst ceiling exists to stop. */
    retryAfterSeconds: Math.max(1, toInt(verdict.retry_after_seconds, 60)),
  }
}

/**
 * Checks every ceiling and reserves the slot. Call this before the model
 * request; on `allowed`, pass the claim id to `finalizeAiUsage()` when the
 * call resolves — however it resolves.
 */
export async function claimAiUsage(
  admin: UsageDbClient,
  policy: UsagePolicy,
  input: ClaimInput,
): Promise<UsageDecision> {
  try {
    const { data, error } = await admin.rpc('claim_ai_usage', {
      p_user_id: input.userId,
      p_operation: policy.operation,
      p_organization_id: input.organizationId,
      p_provider: input.provider,
      p_model: input.model,
      p_burst_window_seconds: policy.burstWindowSeconds,
      p_burst_limit: policy.burstLimit,
      p_daily_request_limit: policy.dailyRequestLimit,
      p_daily_token_limit: policy.dailyTokenLimit,
      p_platform_daily_limit: policy.platformDailyLimit,
      p_metered_operations: METERED_OPERATIONS,
      p_monthly_chat_limit: monthlyChatLimit(),
      p_commercial_operations: COMMERCIAL_OPERATIONS,
      p_overage_monthly_cap: overageMonthlyCap(),
    })
    if (error) return { kind: 'unavailable', reason: error.message }
    return decisionFromRpc(data)
  } catch (error) {
    return {
      kind: 'unavailable',
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

export interface UsageResult {
  status: 'completed' | 'failed'
  latencyMs: number
  promptTokens?: number | null
  completionTokens?: number | null
  totalTokens?: number | null
  metadata?: Record<string, unknown>
}

/**
 * Stamps the claimed row with the outcome — the same telemetry advisor-chat
 * always wrote, now an update of a row that already exists rather than a fresh
 * insert. Best-effort by design: a telemetry failure must never cost the user
 * a reply they already paid for, and the claim row is already counted either
 * way.
 */
export async function finalizeAiUsage(
  admin: UsageDbClient,
  claimId: string,
  result: UsageResult,
): Promise<void> {
  try {
    const { error } = await admin
      .from('ai_telemetry_events')
      .update({
        status: result.status,
        latency_ms: Math.max(0, Math.trunc(result.latencyMs)),
        prompt_tokens: result.promptTokens ?? null,
        completion_tokens: result.completionTokens ?? null,
        total_tokens: result.totalTokens ?? null,
        metadata: result.metadata ?? {},
      })
      .eq('id', claimId)
    if (error) console.error('aiUsage: finalize failed', error.message)
  } catch (error) {
    console.error('aiUsage: finalize threw', error)
  }
}

/** Machine-readable discriminator the client matches on; the prose is fallback. */
export const AI_USAGE_LIMIT_CODE = 'ai_usage_limit'

/**
 * The 429 body. `error` stays English here — every edge function in this repo
 * answers in English and the app never shows a server string to the user; the
 * client maps `code`/`scope` to its own {en, fr} copy (advisorView.ts). It is
 * worded for a developer reading a log, and as a safe last resort.
 */
export function usageLimitBody(decision: Extract<UsageDecision, { kind: 'denied' }>) {
  const error =
    decision.scope === 'platform_daily'
      ? 'Dutiva has reached its beta-wide AI usage ceiling for today. Please try again later.'
      : decision.scope === 'commercial'
        ? 'You have used this month’s included Advisor replies. Buy a prepaid pack to continue.'
        : 'You have reached the beta usage limit for Dutiva AI. Please try again later.'
  return {
    error,
    code: AI_USAGE_LIMIT_CODE,
    scope: decision.scope,
    retry_after_seconds: decision.retryAfterSeconds,
  }
}
