import type { OrgMemberRole } from '@/features/app/workspaceMode/roles'
import { roleAtLeast } from '@/features/app/workspaceMode/roles'
import type { PlanFeature } from '@/config/planEntitlements'
import { hasPlanFeature } from '@/config/planEntitlements'
import type { PlanId } from '@/config/plans'
import { PLAN_FEATURE_GATES_ENABLED } from '@/config/plans'

/**
 * Per-card visibility policy for the production Analytics dashboard — the
 * seam the rebuild brief asked for ("this page may be seen by non-admin
 * roles later; keep per-card data fetching separable so cards can be
 * hidden by role"). Fetching has been per-card since Phase 1; this makes
 * the visibility side declarative.
 *
 * Current policy: every card is visible to every active member — hiding a
 * card is a one-word change here, not a refactor. A membership row without
 * a readable role counts as the table's default ('member'); org admins and
 * the platform admin always see everything.
 *
 * Plan feature keys (Growth+) map onto pricing comparison rows so each
 * advertised insight is a real gate, not only a label on the full page.
 */

export type AnalyticsCardKey =
  | 'score'
  | 'attention'
  | 'headcount'
  | 'cases'
  | 'acks'
  | 'certifications'
  | 'serviceMilestones'
  | 'documents'
  | 'leave'
  | 'trend'

export const CARD_MIN_ROLE: Record<AnalyticsCardKey, OrgMemberRole> = {
  score: 'viewer',
  attention: 'viewer',
  headcount: 'viewer',
  cases: 'viewer',
  acks: 'viewer',
  certifications: 'viewer',
  serviceMilestones: 'viewer',
  documents: 'viewer',
  leave: 'viewer',
  trend: 'viewer',
}

/** Cards that map to a finer Growth entitlement; others use page-level gate only. */
export const CARD_PLAN_FEATURE: Partial<Record<AnalyticsCardKey, PlanFeature>> = {
  score: 'compliance_trends',
  trend: 'compliance_trends',
  attention: 'compliance_trends',
  cases: 'case_aging_insights',
  headcount: 'workforce_insights',
  serviceMilestones: 'workforce_insights',
  leave: 'workforce_insights',
  certifications: 'workforce_insights',
}

export function analyticsCardPlanFeature(card: AnalyticsCardKey): PlanFeature | null {
  return CARD_PLAN_FEATURE[card] ?? null
}

/** The comparison a card floor applies to a viewer. */
export function visibleAtFloor(
  floor: OrgMemberRole,
  memberRole: OrgMemberRole | null,
  isOrgAdmin: boolean,
): boolean {
  if (isOrgAdmin) return true
  return roleAtLeast(memberRole ?? 'member', floor)
}

export function analyticsCardVisible(
  card: AnalyticsCardKey,
  memberRole: OrgMemberRole | null,
  isOrgAdmin: boolean,
  plan?: PlanId,
  options?: { bypassPlanGates?: boolean },
): boolean {
  if (!visibleAtFloor(CARD_MIN_ROLE[card], memberRole, isOrgAdmin)) return false
  if (options?.bypassPlanGates || !PLAN_FEATURE_GATES_ENABLED || plan == null) return true
  const feature = analyticsCardPlanFeature(card)
  if (!feature) return true
  return hasPlanFeature(plan, feature)
}
