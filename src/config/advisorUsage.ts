/**
 * Commercial Advisor-reply budget catalogue.
 *
 * Live included replies are plan-tiered (20 / 80 / 200 / 400) in
 * `planEntitlements.ts` and SQL `advisor_monthly_included`.
 * `ADVISOR_MONTHLY_INCLUDED` (80) remains the env fallback for legacy
 * null-org `claim_ai_usage` callers (`AI_MONTHLY_CHAT_LIMIT`).
 *
 * Abuse rails (burst / daily / platform) live in
 * `supabase/functions/_shared/aiUsage.ts` and are never for sale.
 *
 * Deno edge functions cannot import `src/`, so fallbacks are duplicated there.
 * `canonicalFacts.test.ts` greps those fallbacks so they cannot drift.
 */

/** Quiet-beta / gates-off included replies (UTC calendar month). */
export const ADVISOR_MONTHLY_INCLUDED = 80

export const ADVISOR_PACK_50_REPLIES = 50
export const ADVISOR_PACK_50_PRICE_CAD = 5
export const ADVISOR_PACK_200_REPLIES = 200
export const ADVISOR_PACK_200_PRICE_CAD = 15

/** Phase 2: billed on an active paid subscription after included + pack balance. */
export const ADVISOR_OVERAGE_PER_REPLY_CAD = 0.12
export const ADVISOR_OVERAGE_MONTHLY_REPLY_CAP = 500

export type AdvisorPackSize = typeof ADVISOR_PACK_50_REPLIES | typeof ADVISOR_PACK_200_REPLIES

export function isAdvisorPackSize(value: unknown): value is AdvisorPackSize {
  return value === ADVISOR_PACK_50_REPLIES || value === ADVISOR_PACK_200_REPLIES
}
