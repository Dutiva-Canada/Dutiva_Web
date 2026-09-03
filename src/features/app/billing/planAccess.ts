/**
 * App-facing re-exports of plan entitlement helpers. Prefer importing from
 * here inside `/app` so call sites stay stable if the config module moves.
 */
export {
  getPlanEntitlements,
  hasPlanFeature,
  getPlanLimit,
  hasCapacity,
  requiredPlanForFeature,
  canAccessWorkflow,
  FREE_WORKFLOW_IDS,
  GROWTH_MODULE_FEATURES,
  UNLIMITED,
  isUnlimited,
  planMeetsRequirement,
  requiredPlanForLimit,
} from '@/config/planEntitlements'
export type {
  PlanFeature,
  PlanEntitlements,
  PlanLimits,
  PlanLimitKey,
  FreeWorkflowId,
} from '@/config/planEntitlements'
