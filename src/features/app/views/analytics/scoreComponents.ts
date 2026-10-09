import type { ProductionTask } from '@/features/app/views/tasks/productionApi'
import type {
  ProductionFinding,
  ProductionObligation,
} from '@/features/app/views/compliance/productionApi'
import type { ProductionPolicy } from '@/features/app/views/policies/productionApi'
import type {
  CommsBrandClaim,
  CommsIssue,
  CommsPolicyFile,
  CommsSubmission,
} from './commsAnalyticsApi'
import type { SecurityIncident, SecurityRisk } from './securityAnalyticsApi'
import type { OperationsProject } from './operationsAnalyticsApi'
import type { GovernanceDecision } from './governanceAnalyticsApi'
import type { RevenueInvoice } from './revenueAnalyticsApi'
import type { SpecialistEngagement } from './specialistsAnalyticsApi'
import {
  FINDING_SEVERITY_WEIGHTS,
  isProvenancedTask,
  scoreComponent,
  weightedComponent,
  type ScoreComponent,
} from './aggregation'

/**
 * Per-module compliance-score inputs for the live production dashboard —
 * split from AnalyticsProductionView.tsx to stay within the 800-line
 * architecture budget. Pure function: the view passes `rowsOf(state)` rows
 * inside its own useMemo so memoization behaviour is unchanged.
 */

export interface ScoreComponentInputs {
  policies: readonly ProductionPolicy[]
  tasks: readonly ProductionTask[]
  findings: readonly ProductionFinding[]
  obligations: readonly ProductionObligation[]
  commsIssues: readonly CommsIssue[]
  commsSubmissions: readonly CommsSubmission[]
  commsBrandClaims: readonly CommsBrandClaim[]
  commsPolicyFiles: readonly CommsPolicyFile[]
  securityIncidents: readonly SecurityIncident[]
  securityRisks: readonly SecurityRisk[]
  operationsProjects: readonly OperationsProject[]
  governanceDecisions: readonly GovernanceDecision[]
  revenueInvoices: readonly RevenueInvoice[]
  specialistEngagements: readonly SpecialistEngagement[]
}

export function buildScoreComponents(
  inputs: ScoreComponentInputs,
  todayISO: string,
): ScoreComponent[] {
  /* v3 scope: provenanced rows only (a hand-added to-do is real work but
     not compliance posture); cancelled tasks are neither done nor pending
     work — the same exclusion the backend's own overdue count applies. */
  const taskRows = inputs.tasks.filter(
    (t) => isProvenancedTask(t.category, t.linkedKind) && t.status !== 'cancelled',
  )
  return [
    scoreComponent(
      'policies',
      inputs.policies.filter((p) => p.status === 'up_to_date').length,
      inputs.policies.length,
    ),
    scoreComponent('tasks', taskRows.filter((t) => t.done).length, taskRows.length),
    weightedComponent(
      'findings',
      inputs.findings.map((f) => ({
        done: f.resolved,
        weight: FINDING_SEVERITY_WEIGHTS[f.severity],
      })),
    ),
    scoreComponent(
      'obligations',
      inputs.obligations.filter((o) => o.status === 'ok').length,
      inputs.obligations.length,
    ),
    scoreComponent(
      'comms_issues',
      inputs.commsIssues.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
      inputs.commsIssues.length,
    ),
    scoreComponent(
      'comms_submissions',
      inputs.commsSubmissions.filter(
        (s) => s.status === 'submitted' || s.status === 'recorded',
      ).length,
      inputs.commsSubmissions.length,
    ),
    scoreComponent(
      'comms_brand_claims',
      inputs.commsBrandClaims.filter((c) => c.status === 'active').length,
      inputs.commsBrandClaims.length,
    ),
    scoreComponent(
      'comms_policy_files',
      inputs.commsPolicyFiles.filter(
        (p) => p.stage === 'in_force' || p.stage === 'consultation_closed',
      ).length,
      inputs.commsPolicyFiles.length,
    ),
    scoreComponent(
      'security',
      inputs.securityIncidents.filter((i) => i.status === 'resolved').length +
        inputs.securityRisks.filter((r) => r.status === 'mitigated' || r.status === 'closed')
          .length,
      inputs.securityIncidents.length + inputs.securityRisks.length,
    ),
    scoreComponent(
      'operations',
      inputs.operationsProjects.filter((p) => p.status === 'completed').length,
      inputs.operationsProjects.length,
    ),
    scoreComponent(
      'governance',
      inputs.governanceDecisions.filter((d) => d.status !== 'proposed').length,
      inputs.governanceDecisions.length,
    ),
    scoreComponent(
      'revenue',
      inputs.revenueInvoices.filter((i) => i.status === 'paid').length,
      inputs.revenueInvoices.length,
    ),
    scoreComponent(
      'specialists',
      inputs.specialistEngagements.filter(
        (e) => !(e.follow_up_date !== null && e.follow_up_date < todayISO),
      ).length,
      inputs.specialistEngagements.length,
    ),
  ]
}
