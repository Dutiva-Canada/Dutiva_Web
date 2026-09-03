/**
 * Entitlement helpers for Advisor chat (Deno — cannot import src/).
 * Numbers must match src/config/planEntitlements.ts; drift is guarded by tests.
 */

export type OrgPlanId = 'free' | 'starter' | 'growth' | 'pro'

const PLAN_RANK: Record<OrgPlanId, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
}

export function normalizeOrgPlan(value: unknown): OrgPlanId {
  const plan = String(value ?? '').toLowerCase()
  if (plan === 'starter' || plan === 'growth' || plan === 'pro') return plan
  return 'free'
}

export function hasOrgPlanAccess(current: OrgPlanId, required: OrgPlanId): boolean {
  return PLAN_RANK[current] >= PLAN_RANK[required]
}

/** Cross-record Advisor memory — Growth and Professional only. */
export function planAllowsAdvisorMemory(plan: OrgPlanId): boolean {
  return hasOrgPlanAccess(plan, 'growth')
}

/**
 * Mirrors `PLAN_FEATURE_GATES_ENABLED` in src/config/plans.ts. Default false so
 * edge behavior stays product-parity until the flag and this secret flip together.
 */
export function planFeatureGatesEnabled(): boolean {
  const raw =
    typeof Deno !== 'undefined' && typeof Deno.env?.get === 'function'
      ? Deno.env.get('PLAN_FEATURE_GATES_ENABLED')
      : undefined
  if (!raw) return false
  const v = raw.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

export const ADVISOR_MONTHLY_BY_PLAN: Record<OrgPlanId, number> = {
  free: 20,
  starter: 80,
  growth: 200,
  pro: 400,
}
