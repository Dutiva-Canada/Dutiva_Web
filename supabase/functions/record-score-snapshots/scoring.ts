/**
 * Compliance-score formula v2 — the scheduled job's copy.
 *
 * MIRROR of the scoring section of
 * src/features/app/views/analytics/aggregation.ts (SCORE_FORMULA_VERSION,
 * FINDING_SEVERITY_WEIGHTS, CRITICAL_SCORE_CEILING, isProvenancedTask,
 * weightedComponent, scoreComponent, blendScore, applyCriticalCeiling)
 * plus the row→component mapping AnalyticsProductionView applies
 * (provenanced non-cancelled tasks, resolved-or-dismissed findings closed,
 * up_to_date policies current, 'ok' obligations evidenced).
 * The app cannot import across the src/ ↔ supabase/functions/ boundary
 * (each side bundles for a different runtime), so — same as the crisis
 * phrase list — the two copies are kept identical by a drift test:
 * scoring.test.ts here imports both and asserts equal outputs. Change the
 * two together, and bump the version when the formula changes.
 *
 * Pure and dependency-free so it runs in Deno (the edge function) and
 * under vitest.
 */

export const SCORE_FORMULA_VERSION = 4

export const FINDING_SEVERITY_WEIGHTS: Record<string, number> = {
  info: 1,
  low: 2,
  medium: 3,
  high: 5,
  critical: 8,
}

export const CRITICAL_SCORE_CEILING = 69

/** v3 task scoping — mirror of aggregation.ts#isProvenancedTask. */
export function isProvenancedTask(category: string, linkedKind: string | null): boolean {
  return category !== 'general' || linkedKind !== null
}

export interface ScoreComponent {
  key: string
  done: number
  total: number
  pct: number | null
  weightedDone?: number
  weightedTotal?: number
}

export function scoreComponent(key: string, done: number, total: number): ScoreComponent {
  return {
    key,
    done,
    total,
    pct: total > 0 ? Math.round((done / total) * 100) : null,
  }
}

export function weightedComponent(
  key: string,
  items: readonly { done: boolean; weight: number }[],
): ScoreComponent {
  const weightedTotal = items.reduce((sum, i) => sum + i.weight, 0)
  const weightedDone = items.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0)
  return {
    key,
    done: items.filter((i) => i.done).length,
    total: items.length,
    weightedDone,
    weightedTotal,
    pct: weightedTotal > 0 ? Math.round((weightedDone / weightedTotal) * 100) : null,
  }
}

export function blendScore(components: readonly ScoreComponent[]): number | null {
  const present = components.filter((c): c is ScoreComponent & { pct: number } => c.pct !== null)
  if (present.length === 0) return null
  return Math.round(present.reduce((sum, c) => sum + c.pct, 0) / present.length)
}

export function applyCriticalCeiling(
  score: number | null,
  openCriticalCount: number,
): { score: number | null; capped: boolean } {
  if (score === null || openCriticalCount === 0 || score <= CRITICAL_SCORE_CEILING) {
    return { score, capped: false }
  }
  return { score: CRITICAL_SCORE_CEILING, capped: true }
}

/* ── Row → component mapping (the view's semantics, mirrored) ──────────── */

export interface OrgScoreRows {
  /** hr_policies.status values. */
  policyStatuses: readonly string[]
  /** compliance_tasks rows: status, category, metadata.kind. */
  tasks: readonly { status: string; category: string; linkedKind: string | null }[]
  /** compliance_findings (severity, status) pairs. */
  findings: readonly { severity: string; status: string }[]
  /** hr_obligations.status values. */
  obligationStatuses: readonly string[]
  /** comms_issues.status values. */
  commsIssueStatuses: readonly string[]
  /** comms_submissions.status values. */
  commsSubmissionStatuses: readonly string[]
  /** comms_brand_claims.status values. */
  commsBrandClaimStatuses: readonly string[]
  /** comms_policy_files.stage values. */
  commsPolicyFileStages: readonly string[]
}

export interface OrgScore {
  score: number | null
  components: ScoreComponent[]
}

/** A finding is closed when resolved or dismissed (compliance productionApi). */
function isClosed(status: string): boolean {
  return status === 'resolved' || status === 'dismissed'
}

export function computeOrgScore(rows: OrgScoreRows): OrgScore {
  /* v3 scope: provenanced rows only; cancelled tasks are neither done nor
     pending work. */
  const tasks = rows.tasks.filter(
    (t) => isProvenancedTask(t.category, t.linkedKind) && t.status !== 'cancelled',
  )
  const components = [
    scoreComponent(
      'policies',
      rows.policyStatuses.filter((s) => s === 'up_to_date').length,
      rows.policyStatuses.length,
    ),
    scoreComponent('tasks', tasks.filter((t) => t.status === 'completed').length, tasks.length),
    weightedComponent(
      'findings',
      rows.findings.map((f) => ({
        done: isClosed(f.status),
        weight: FINDING_SEVERITY_WEIGHTS[f.severity] ?? 1,
      })),
    ),
    scoreComponent(
      'obligations',
      rows.obligationStatuses.filter((s) => s === 'ok').length,
      rows.obligationStatuses.length,
    ),
    scoreComponent(
      'comms_issues',
      rows.commsIssueStatuses.filter((s) => s === 'resolved' || s === 'closed').length,
      rows.commsIssueStatuses.length,
    ),
    scoreComponent(
      'comms_submissions',
      rows.commsSubmissionStatuses.filter((s) => s === 'submitted' || s === 'recorded').length,
      rows.commsSubmissionStatuses.length,
    ),
    scoreComponent(
      'comms_brand_claims',
      rows.commsBrandClaimStatuses.filter((s) => s === 'active').length,
      rows.commsBrandClaimStatuses.length,
    ),
    scoreComponent(
      'comms_policy_files',
      rows.commsPolicyFileStages.filter((s) => s === 'in_force' || s === 'consultation_closed').length,
      rows.commsPolicyFileStages.length,
    ),
  ]
  const openCritical = rows.findings.filter(
    (f) => !isClosed(f.status) && f.severity === 'critical',
  ).length
  return { score: applyCriticalCeiling(blendScore(components), openCritical).score, components }
}
