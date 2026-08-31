import type { OrgMemberRole } from '@/features/app/workspaceMode/roles'
import { roleAtLeast } from '@/features/app/workspaceMode/roles'

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
): boolean {
  return visibleAtFloor(CARD_MIN_ROLE[card], memberRole, isOrgAdmin)
}
