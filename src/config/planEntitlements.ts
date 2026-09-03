/**
 * Canonical plan entitlements — single source for pricing tables, upgrade
 * nudges, usage displays, and client-side feature checks.
 *
 * Server-side enforcement lives in SQL / Edge Functions and must mirror these
 * numbers. Drift tests in `planEntitlements.test.ts` and `canonicalFacts.test.ts`
 * keep the copies honest. `PLAN_FEATURE_GATES_ENABLED` is on only while those
 * paths are deployed.
 */
import type { PlanId } from './plans'
import { hasPlanAccess, PLAN_FEATURE_GATES_ENABLED } from './plans'
import {
  ADVISOR_OVERAGE_MONTHLY_REPLY_CAP,
  ADVISOR_OVERAGE_PER_REPLY_CAD,
  ADVISOR_PACK_50_PRICE_CAD,
  ADVISOR_PACK_50_REPLIES,
  ADVISOR_PACK_200_PRICE_CAD,
  ADVISOR_PACK_200_REPLIES,
} from './advisorUsage'

/** Sentinel for unlimited numeric capacity. Never advertise as unlimited when a finite limit exists. */
export const UNLIMITED = Number.POSITIVE_INFINITY

export type SupportQueuePriority = 'standard' | 'paid' | 'priority' | 'highest'

export type SupportResponseTarget = '2_business_days' | '1_business_day'

export type OnboardingEntitlement = 'none' | 'walkthrough_on_request' | 'walkthrough_and_call'

/**
 * Feature keys gated by plan. Capacity limits are separate (`PlanLimits`).
 * Ordinary security/privacy protections are never listed here.
 */
export type PlanFeature =
  | 'operational_dashboard'
  | 'operational_analytics'
  | 'compliance_trends'
  | 'case_aging_insights'
  | 'workforce_insights'
  | 'advisor_cross_record_memory'
  | 'communications_register'
  | 'compensation_register'
  | 'wellbeing_register'
  | 'word_compatible_export'
  | 'pdf_export'
  | 'document_repository'
  | 'reply_packs'
  | 'metered_overage'
  | 'all_workflows'
  | 'all_templates_visible'

export interface PlanLimits {
  /** Active workspace members (organization_members status = active). */
  workspaceUsers: number
  /** Active employees only — terminated/archived do not count. */
  activeEmployees: number
  /** Active HR cases. Free only; paid = unlimited. */
  activeCases: number
  /** Open tasks. Free only; paid = unlimited. */
  openTasks: number
  /**
   * Advisor included replies per UTC calendar month (organization-pooled).
   * Unused base-plan replies may roll over on paid plans (see rollover*).
   */
  advisorRepliesPerMonth: number
  /** Max banked rollover replies (one regular month of current plan). Free = 0. */
  advisorRolloverMax: number
  /** Days a rollover grant remains valid after it is earned. Free = 0. */
  advisorRolloverDays: number
  /**
   * Saved documents. Free = total during free access window; paid = per UTC month.
   * Count on first repository save only.
   */
  savedDocuments: number
  /** Whether document limit is lifetime (free) or monthly (paid). */
  savedDocumentsPeriod: 'lifetime' | 'month'
  /**
   * Signature envelopes. Free = total during free access; paid = per UTC month.
   * Count on first send only.
   */
  signatureEnvelopes: number
  signatureEnvelopesPeriod: 'lifetime' | 'month'
  /** Free: 3 selected workflows; paid: all 12. */
  workflowAccess: 'selected' | 'all'
}

export interface PlanEntitlements {
  plan: PlanId
  limits: PlanLimits
  features: ReadonlySet<PlanFeature>
  supportPriority: SupportQueuePriority
  supportResponseTarget: SupportResponseTarget
  onboarding: OnboardingEntitlement
}

/** Free-plan workflow ids — statutory notice tools only. */
export const FREE_WORKFLOW_IDS = [
  'statutory-notice-ontario',
  'statutory-notice-quebec',
  'statutory-notice-federal',
] as const

export type FreeWorkflowId = (typeof FREE_WORKFLOW_IDS)[number]

const GROWTH_FEATURES: PlanFeature[] = [
  'operational_dashboard',
  'operational_analytics',
  'compliance_trends',
  'case_aging_insights',
  'workforce_insights',
  'advisor_cross_record_memory',
  'communications_register',
  'compensation_register',
  'wellbeing_register',
]

const PAID_BASE_FEATURES: PlanFeature[] = [
  'pdf_export',
  'document_repository',
  'word_compatible_export',
  'reply_packs',
  'metered_overage',
  'all_workflows',
  'all_templates_visible',
]

function featureSet(...groups: PlanFeature[][]): ReadonlySet<PlanFeature> {
  return new Set(groups.flat())
}

const FREE_FEATURES = featureSet(['pdf_export', 'document_repository', 'all_templates_visible'])

export const PLAN_ENTITLEMENTS: Record<PlanId, PlanEntitlements> = {
  free: {
    plan: 'free',
    limits: {
      workspaceUsers: 1,
      activeEmployees: 5,
      activeCases: 3,
      openTasks: 10,
      advisorRepliesPerMonth: 20,
      advisorRolloverMax: 0,
      advisorRolloverDays: 0,
      savedDocuments: 5,
      savedDocumentsPeriod: 'lifetime',
      signatureEnvelopes: 1,
      signatureEnvelopesPeriod: 'lifetime',
      workflowAccess: 'selected',
    },
    features: FREE_FEATURES,
    supportPriority: 'standard',
    supportResponseTarget: '2_business_days',
    onboarding: 'none',
  },
  starter: {
    plan: 'starter',
    limits: {
      workspaceUsers: 2,
      activeEmployees: 10,
      activeCases: UNLIMITED,
      openTasks: UNLIMITED,
      advisorRepliesPerMonth: 80,
      advisorRolloverMax: 80,
      advisorRolloverDays: 90,
      savedDocuments: 20,
      savedDocumentsPeriod: 'month',
      signatureEnvelopes: 5,
      signatureEnvelopesPeriod: 'month',
      workflowAccess: 'all',
    },
    features: featureSet(PAID_BASE_FEATURES),
    supportPriority: 'paid',
    supportResponseTarget: '2_business_days',
    onboarding: 'none',
  },
  growth: {
    plan: 'growth',
    limits: {
      workspaceUsers: 5,
      activeEmployees: 50,
      activeCases: UNLIMITED,
      openTasks: UNLIMITED,
      advisorRepliesPerMonth: 200,
      advisorRolloverMax: 200,
      advisorRolloverDays: 90,
      savedDocuments: 100,
      savedDocumentsPeriod: 'month',
      signatureEnvelopes: 25,
      signatureEnvelopesPeriod: 'month',
      workflowAccess: 'all',
    },
    features: featureSet(PAID_BASE_FEATURES, GROWTH_FEATURES),
    supportPriority: 'priority',
    supportResponseTarget: '1_business_day',
    onboarding: 'walkthrough_on_request',
  },
  pro: {
    plan: 'pro',
    limits: {
      workspaceUsers: 10,
      activeEmployees: 100,
      activeCases: UNLIMITED,
      openTasks: UNLIMITED,
      advisorRepliesPerMonth: 400,
      advisorRolloverMax: 400,
      advisorRolloverDays: 90,
      savedDocuments: 300,
      savedDocumentsPeriod: 'month',
      signatureEnvelopes: 100,
      signatureEnvelopesPeriod: 'month',
      workflowAccess: 'all',
    },
    features: featureSet(PAID_BASE_FEATURES, GROWTH_FEATURES),
    supportPriority: 'highest',
    supportResponseTarget: '1_business_day',
    onboarding: 'walkthrough_and_call',
  },
}

/** Shared add-on catalogue (not plan features — sold separately). */
export const ADVISOR_ADDONS = {
  pack50: { replies: ADVISOR_PACK_50_REPLIES, priceCad: ADVISOR_PACK_50_PRICE_CAD },
  pack200: { replies: ADVISOR_PACK_200_REPLIES, priceCad: ADVISOR_PACK_200_PRICE_CAD },
  overagePerReplyCad: ADVISOR_OVERAGE_PER_REPLY_CAD,
  overageMonthlyCap: ADVISOR_OVERAGE_MONTHLY_REPLY_CAP,
} as const

export function getPlanEntitlements(plan: PlanId): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan]
}

export function hasPlanFeature(plan: PlanId, feature: PlanFeature): boolean {
  return PLAN_ENTITLEMENTS[plan].features.has(feature)
}

export type PlanLimitKey = keyof PlanLimits

export function getPlanLimit(
  plan: PlanId,
  key: Exclude<
    PlanLimitKey,
    'savedDocumentsPeriod' | 'signatureEnvelopesPeriod' | 'workflowAccess'
  >,
): number {
  return PLAN_ENTITLEMENTS[plan].limits[key]
}

export function isUnlimited(value: number): boolean {
  return !Number.isFinite(value)
}

/**
 * True when `used` is strictly below `limit`. Unlimited limits always pass.
 * Callers must count only the units that the commercial model bills.
 */
export function hasCapacity(used: number, limit: number): boolean {
  if (isUnlimited(limit)) return true
  return used < limit
}

/** Lowest plan that includes `feature`. Free features resolve to `free`. */
export function requiredPlanForFeature(feature: PlanFeature): PlanId {
  const order: PlanId[] = ['free', 'starter', 'growth', 'pro']
  for (const plan of order) {
    if (hasPlanFeature(plan, feature)) return plan
  }
  return 'pro'
}

/** Lowest plan whose numeric limit for `key` is at least `needed`. */
export function requiredPlanForLimit(
  key: Exclude<
    PlanLimitKey,
    'savedDocumentsPeriod' | 'signatureEnvelopesPeriod' | 'workflowAccess'
  >,
  needed: number,
): PlanId {
  const order: PlanId[] = ['free', 'starter', 'growth', 'pro']
  for (const plan of order) {
    const limit = getPlanLimit(plan, key)
    if (isUnlimited(limit) || limit >= needed) return plan
  }
  return 'pro'
}

export function planMeetsRequirement(current: PlanId, required: PlanId): boolean {
  return hasPlanAccess(current, required)
}

/** Whether Free may open this workflow id. Paid plans always may. */
export function canAccessWorkflow(plan: PlanId, workflowId: string): boolean {
  const entitlements = getPlanEntitlements(plan)
  if (entitlements.limits.workflowAccess === 'all') return true
  return (FREE_WORKFLOW_IDS as readonly string[]).includes(workflowId)
}

/**
 * Growth-or-higher module features. Used by nav/route gates in production mode
 * when `PLAN_FEATURE_GATES_ENABLED` is on.
 */
export const GROWTH_MODULE_FEATURES: readonly PlanFeature[] = GROWTH_FEATURES

/** Support priority rank for queue ordering (higher = sooner). */
export const SUPPORT_PRIORITY_RANK: Record<SupportQueuePriority, number> = {
  standard: 0,
  paid: 1,
  priority: 2,
  highest: 3,
}

/**
 * Queue sort key for admin lists: lower = sooner. Derived from
 * `supportPriority` / `SUPPORT_PRIORITY_RANK` (higher = sooner).
 */
export function supportQueueSortRank(plan: PlanId): number {
  const priority = PLAN_ENTITLEMENTS[plan].supportPriority
  return SUPPORT_PRIORITY_RANK.highest - SUPPORT_PRIORITY_RANK[priority]
}

/**
 * Whether the differentiated entitlement model is what we advertise publicly.
 * While gates are off, public pricing must keep the quiet-beta (support-only)
 * comparison — never the differentiated table.
 */
export function publicPricingUsesDifferentiatedTable(): boolean {
  return PLAN_FEATURE_GATES_ENABLED
}

/** Deno / SQL mirror: plan → advisor monthly included. Keep in sync with PLAN_ENTITLEMENTS. */
export const ADVISOR_MONTHLY_BY_PLAN: Record<PlanId, number> = {
  free: PLAN_ENTITLEMENTS.free.limits.advisorRepliesPerMonth,
  starter: PLAN_ENTITLEMENTS.starter.limits.advisorRepliesPerMonth,
  growth: PLAN_ENTITLEMENTS.growth.limits.advisorRepliesPerMonth,
  pro: PLAN_ENTITLEMENTS.pro.limits.advisorRepliesPerMonth,
}
