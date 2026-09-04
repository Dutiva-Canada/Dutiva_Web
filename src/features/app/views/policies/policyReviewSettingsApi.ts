import { supabase } from '@/lib/supabaseClient'

/** Org-level policy review cadence (migration 0117). Default 90 days. */

const MIN_DAYS = 30
const MAX_DAYS = 365
const DEFAULT_DAYS = 90

function clampPolicyReviewDays(days: number): number {
  if (!Number.isFinite(days)) return DEFAULT_DAYS
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.round(days)))
}

export async function getPolicyReviewDays(organizationId: string): Promise<number> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('organizations')
    .select('policy_review_days')
    .eq('id', organizationId)
    .maybeSingle()
  if (error) throw error
  const days = data?.policy_review_days
  if (typeof days !== 'number' || !Number.isFinite(days)) return DEFAULT_DAYS
  return clampPolicyReviewDays(days)
}

export async function setPolicyReviewDays(
  organizationId: string,
  days: number,
): Promise<number> {
  if (!supabase) throw new Error('Supabase is not configured')
  const clamped = clampPolicyReviewDays(days)
  const { data, error } = await supabase
    .from('organizations')
    .update({ policy_review_days: clamped })
    .eq('id', organizationId)
    .select('policy_review_days')
    .maybeSingle()
  if (error) throw error
  const saved = data?.policy_review_days
  if (typeof saved !== 'number') throw new Error('Could not save policy review interval')
  return saved
}

export { clampPolicyReviewDays, DEFAULT_DAYS as POLICY_REVIEW_DAYS_DEFAULT }
