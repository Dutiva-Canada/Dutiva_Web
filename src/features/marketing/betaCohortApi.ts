import { BETA_COHORT_LIMIT } from '@/config/beta'
import { supabase } from '@/lib/supabaseClient'

/**
 * Client for the public `beta-cohort-status` edge function — aggregate
 * seats taken out of {@link BETA_COHORT_LIMIT}. Powers the landing-page
 * spot counter without exposing signup PII.
 *
 * When Supabase isn't configured (prerender, local without env), returns
 * taken=0 so the counter still renders honestly as "0 of N".
 */

export interface BetaCohortStatus {
  taken: number
  limit: number
}

function fallback(): BetaCohortStatus {
  return { taken: 0, limit: BETA_COHORT_LIMIT }
}

interface CohortResponse {
  taken?: number
  limit?: number
}

/**
 * Fetch current cohort fill. Never throws — a failed or missing backend
 * falls back to zero taken (same posture as the edge function's fail-open).
 */
export async function getBetaCohortStatus(): Promise<BetaCohortStatus> {
  if (!supabase) return fallback()

  try {
    const { data, error } = await supabase.functions.invoke<CohortResponse>('beta-cohort-status', {
      method: 'GET',
    })
    if (error || !data || typeof data.taken !== 'number') return fallback()
    return {
      taken: Math.max(0, Math.floor(data.taken)),
      limit: typeof data.limit === 'number' ? data.limit : BETA_COHORT_LIMIT,
    }
  } catch {
    return fallback()
  }
}
