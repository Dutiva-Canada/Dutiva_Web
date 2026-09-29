import { useEffect, useMemo, useRef } from 'react'
import { ChartNoAxesColumn } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { usePlan } from '@/features/app/billing/planContext'
import { analyticsCardVisible } from './cardVisibility'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import {
  listEmployees,
  listExpiryRecords,
  listLeaves,
} from '@/features/app/views/employees/productionApi'
import type {
  ProductionEmployee,
  ProductionExpiryRecord,
  ProductionLeave,
} from '@/features/app/views/employees/productionApi'
import { listCases } from '@/features/app/views/cases/productionApi'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'
import { listTasks } from '@/features/app/views/tasks/productionApi'
import type { ProductionTask } from '@/features/app/views/tasks/productionApi'
import { listFindings, listObligations } from '@/features/app/views/compliance/productionApi'
import type {
  ProductionFinding,
  ProductionObligation,
} from '@/features/app/views/compliance/productionApi'
import { listPolicies } from '@/features/app/views/policies/productionApi'
import type { ProductionPolicy } from '@/features/app/views/policies/productionApi'
import {
  listCommsBrandClaims,
  listCommsContentItems,
  listCommsInteractions,
  listCommsIssues,
  listCommsPolicyFiles,
  listCommsSubmissions,
} from './commsAnalyticsApi'
import type {
  CommsBrandClaim,
  CommsContentItem,
  CommsInteraction,
  CommsIssue,
  CommsPolicyFile,
  CommsSubmission,
} from './commsAnalyticsApi'
import {
  listSecurityAssets,
  listSecurityAccessReviews,
  listSecurityIncidents,
  listSecurityRisks,
  listSecurityVendorReviews,
} from './securityAnalyticsApi'
import type {
  SecurityAsset,
  SecurityAccessReview,
  SecurityIncident,
  SecurityRisk,
  SecurityVendorReview,
} from './securityAnalyticsApi'
import {
  listOperationsProjects,
  listOperationsVendors,
  listOperationsQualityChecks,
  listOperationsTechnology,
  listOperationsLogistics,
} from './operationsAnalyticsApi'
import type {
  OperationsProject,
  OperationsVendor,
  OperationsQualityCheck,
  OperationsTechnology,
  OperationsLogistics,
} from './operationsAnalyticsApi'
import {
  listGovernanceRecords,
  listGovernanceDecisions,
  listGovernanceOfficers,
  listGovernanceShareholders,
} from './governanceAnalyticsApi'
import type {
  GovernanceRecord,
  GovernanceDecision,
  GovernanceOfficer,
  GovernanceShareholder,
} from './governanceAnalyticsApi'
import { listRevenueStreams, listRevenueInvoices } from './revenueAnalyticsApi'
import type { RevenueStream, RevenueInvoice } from './revenueAnalyticsApi'
import { listSpecialists, listSpecialistEngagements } from './specialistsAnalyticsApi'
import type { Specialist, SpecialistEngagement } from './specialistsAnalyticsApi'
import { listScoreSnapshots, recordScoreSnapshot } from './productionApi'
import type { ScoreSnapshot } from './productionApi'
import { rowsOf, useModuleRows } from './moduleRows'
import { AcknowledgmentsCard } from './AcknowledgmentsCard'
import { AttentionCard } from './AttentionCard'
import {
  attentionRowsOf,
  breakdownRowsOf,
  headcountRowsOf,
  leaveRowsOf,
  serviceMilestoneRowsOf,
  turnoverOf,
} from './cardRows'
import { ExpiryBucketsCard } from './ExpiryBucketsCard'
import type { ExpiryDisplayRow } from './ExpiryBucketsSection'
import { HeadcountCard } from './HeadcountCard'
import { HeadcountTrendCard } from './HeadcountTrendCard'
import { LeaveOverviewCard } from './LeaveOverviewCard'
import { OpenCasesCard } from './OpenCasesCard'
import { ScoreCard } from './ScoreCard'
import { ServiceMilestonesCard } from './ServiceMilestonesCard'
import { StatTilesCard } from './StatTilesCard'
import {
  commsTiles,
  governanceTiles,
  operationsTiles,
  revenueTiles,
  securityTiles,
  specialistsTiles,
} from './statTiles'
import {
  FINDING_SEVERITY_WEIGHTS,
  SCORE_FORMULA_VERSION,
  applyCriticalCeiling,
  blendScore,
  caseAging,
  daysBetweenISO,
  expiryBuckets,
  flattenBuckets,
  isProvenancedTask,
  monthStartISO,
  scoreComponent,
  scoreDelta,
  weightedComponent,
} from './aggregation'
import { formatDayISO, intlLocale } from './format'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Analytics in production mode. The monthly snapshot table
 * (compliance_score_snapshots) persists the two aggregates that can't be
 * recomputed later — the blended score and the headcount; everything else
 * aggregates live from the modules already on real persistence, through
 * their own productionApi boundaries.
 *
 * Each card fetches only the modules it needs and carries its own skeleton,
 * empty state and retry — so a failing module degrades one card, and cards
 * can later be hidden per role without entangling the rest of the page.
 * Phase 2 cards whose underlying records don't exist in this workspace yet
 * (certifications, probation dates, document expiries, leave detail) say so
 * plainly instead of hiding.
 */

const HISTORY_WINDOW_MONTHS = 6

export function AnalyticsProductionView() {
  const { x, lang } = useI18n()
  const locale = intlLocale(lang)
  const { organizationId, memberRole, isOrgAdmin } = useWorkspaceMode()
  const { plan, isAdmin: isBillingAdmin } = usePlan()

  const todayISO = new Date().toISOString().slice(0, 10)
  const currentMonthISO = monthStartISO(todayISO)

  const employees = useModuleRows<ProductionEmployee>(organizationId, listEmployees)
  const hrCases = useModuleRows<ProductionCase>(organizationId, listCases)
  const tasks = useModuleRows<ProductionTask>(organizationId, listTasks)
  const findings = useModuleRows<ProductionFinding>(organizationId, listFindings)
  const obligations = useModuleRows<ProductionObligation>(organizationId, listObligations)
  const policies = useModuleRows<ProductionPolicy>(organizationId, listPolicies)
  const snapshots = useModuleRows<ScoreSnapshot>(organizationId, listScoreSnapshots)
  const expiryRecords = useModuleRows<ProductionExpiryRecord>(organizationId, listExpiryRecords)
  const leaves = useModuleRows<ProductionLeave>(organizationId, listLeaves)
  const commsIssues = useModuleRows<CommsIssue>(organizationId, listCommsIssues)
  const commsSubmissions = useModuleRows<CommsSubmission>(organizationId, listCommsSubmissions)
  const commsBrandClaims = useModuleRows<CommsBrandClaim>(organizationId, listCommsBrandClaims)
  const commsPolicyFiles = useModuleRows<CommsPolicyFile>(organizationId, listCommsPolicyFiles)
  const commsContentItems = useModuleRows<CommsContentItem>(organizationId, listCommsContentItems)
  const commsInteractions = useModuleRows<CommsInteraction>(organizationId, listCommsInteractions)
  const securityAssets = useModuleRows<SecurityAsset>(organizationId, listSecurityAssets)
  const securityAccessReviews = useModuleRows<SecurityAccessReview>(
    organizationId,
    listSecurityAccessReviews,
  )
  const securityIncidents = useModuleRows<SecurityIncident>(organizationId, listSecurityIncidents)
  const securityRisks = useModuleRows<SecurityRisk>(organizationId, listSecurityRisks)
  const securityVendorReviews = useModuleRows<SecurityVendorReview>(
    organizationId,
    listSecurityVendorReviews,
  )
  const operationsProjects = useModuleRows<OperationsProject>(
    organizationId,
    listOperationsProjects,
  )
  const operationsVendors = useModuleRows<OperationsVendor>(organizationId, listOperationsVendors)
  const operationsQualityChecks = useModuleRows<OperationsQualityCheck>(
    organizationId,
    listOperationsQualityChecks,
  )
  const operationsTechnology = useModuleRows<OperationsTechnology>(
    organizationId,
    listOperationsTechnology,
  )
  const operationsLogistics = useModuleRows<OperationsLogistics>(
    organizationId,
    listOperationsLogistics,
  )
  const governanceRecords = useModuleRows<GovernanceRecord>(organizationId, listGovernanceRecords)
  const governanceDecisions = useModuleRows<GovernanceDecision>(
    organizationId,
    listGovernanceDecisions,
  )
  const governanceOfficers = useModuleRows<GovernanceOfficer>(
    organizationId,
    listGovernanceOfficers,
  )
  const governanceShareholders = useModuleRows<GovernanceShareholder>(
    organizationId,
    listGovernanceShareholders,
  )
  const revenueStreams = useModuleRows<RevenueStream>(organizationId, listRevenueStreams)
  const revenueInvoices = useModuleRows<RevenueInvoice>(organizationId, listRevenueInvoices)
  const specialists = useModuleRows<Specialist>(organizationId, listSpecialists)
  const specialistEngagements = useModuleRows<SpecialistEngagement>(
    organizationId,
    listSpecialistEngagements,
  )

  /* ── Score: live components + snapshot history ─────────────────────────── */
  const scoreReady =
    policies.state.status === 'ready' &&
    tasks.state.status === 'ready' &&
    findings.state.status === 'ready' &&
    obligations.state.status === 'ready' &&
    commsIssues.state.status === 'ready' &&
    commsSubmissions.state.status === 'ready' &&
    commsBrandClaims.state.status === 'ready' &&
    commsPolicyFiles.state.status === 'ready' &&
    securityIncidents.state.status === 'ready' &&
    securityRisks.state.status === 'ready' &&
    operationsProjects.state.status === 'ready' &&
    governanceDecisions.state.status === 'ready' &&
    revenueInvoices.state.status === 'ready' &&
    specialistEngagements.state.status === 'ready'

  const components = useMemo(() => {
    const policyRows = rowsOf(policies.state)
    /* v3 scope: provenanced rows only (a hand-added to-do is real work but
       not compliance posture); cancelled tasks are neither done nor pending
       work — the same exclusion the backend's own overdue count applies. */
    const taskRows = rowsOf(tasks.state).filter(
      (t) => isProvenancedTask(t.category, t.linkedKind) && t.status !== 'cancelled',
    )
    const findingRows = rowsOf(findings.state)
    const obligationRows = rowsOf(obligations.state)
    const issueRows = rowsOf(commsIssues.state)
    const submissionRows = rowsOf(commsSubmissions.state)
    const brandClaimRows = rowsOf(commsBrandClaims.state)
    const policyFileRows = rowsOf(commsPolicyFiles.state)
    const securityIncidentRows = rowsOf(securityIncidents.state)
    const securityRiskRows = rowsOf(securityRisks.state)
    const operationsProjectRows = rowsOf(operationsProjects.state)
    const governanceDecisionRows = rowsOf(governanceDecisions.state)
    const revenueInvoiceRows = rowsOf(revenueInvoices.state)
    const specialistEngagementRows = rowsOf(specialistEngagements.state)
    return [
      scoreComponent(
        'policies',
        policyRows.filter((p) => p.status === 'up_to_date').length,
        policyRows.length,
      ),
      scoreComponent('tasks', taskRows.filter((t) => t.done).length, taskRows.length),
      weightedComponent(
        'findings',
        findingRows.map((f) => ({
          done: f.resolved,
          weight: FINDING_SEVERITY_WEIGHTS[f.severity],
        })),
      ),
      scoreComponent(
        'obligations',
        obligationRows.filter((o) => o.status === 'ok').length,
        obligationRows.length,
      ),
      scoreComponent(
        'comms_issues',
        issueRows.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
        issueRows.length,
      ),
      scoreComponent(
        'comms_submissions',
        submissionRows.filter((s) => s.status === 'submitted' || s.status === 'recorded').length,
        submissionRows.length,
      ),
      scoreComponent(
        'comms_brand_claims',
        brandClaimRows.filter((c) => c.status === 'active').length,
        brandClaimRows.length,
      ),
      scoreComponent(
        'comms_policy_files',
        policyFileRows.filter((p) => p.stage === 'in_force' || p.stage === 'consultation_closed')
          .length,
        policyFileRows.length,
      ),
      scoreComponent(
        'security',
        securityIncidentRows.filter((i) => i.status === 'resolved').length +
          securityRiskRows.filter((r) => r.status === 'mitigated' || r.status === 'closed').length,
        securityIncidentRows.length + securityRiskRows.length,
      ),
      scoreComponent(
        'operations',
        operationsProjectRows.filter((p) => p.status === 'completed').length,
        operationsProjectRows.length,
      ),
      scoreComponent(
        'governance',
        governanceDecisionRows.filter((d) => d.status !== 'proposed').length,
        governanceDecisionRows.length,
      ),
      scoreComponent(
        'revenue',
        revenueInvoiceRows.filter((i) => i.status === 'paid').length,
        revenueInvoiceRows.length,
      ),
      scoreComponent(
        'specialists',
        specialistEngagementRows.filter(
          (e) => !(e.follow_up_date !== null && e.follow_up_date < todayISO),
        ).length,
        specialistEngagementRows.length,
      ),
    ]
  }, [
    policies.state,
    tasks.state,
    findings.state,
    obligations.state,
    commsIssues.state,
    commsSubmissions.state,
    commsBrandClaims.state,
    commsPolicyFiles.state,
    securityIncidents.state,
    securityRisks.state,
    operationsProjects.state,
    governanceDecisions.state,
    revenueInvoices.state,
    specialistEngagements.state,
    todayISO,
  ])

  const openCriticalCount = useMemo(
    () => rowsOf(findings.state).filter((f) => !f.resolved && f.severity === 'critical').length,
    [findings.state],
  )
  const ceiling = applyCriticalCeiling(
    scoreReady ? blendScore(components) : null,
    openCriticalCount,
  )
  const liveScore = ceiling.score

  const activeEmployees = useMemo(
    () => rowsOf(employees.state).filter((e) => e.status !== 'terminated'),
    [employees.state],
  )
  const liveHeadcount = employees.state.status === 'ready' ? activeEmployees.length : null

  /* Record this month's snapshot once per page view — score and headcount
     history are written as a side effect of computing the live numbers.
     Waits for the employees module to settle so headcount isn't dropped by
     a race; a module error records what is known. Failure is dropped:
     history is an enhancement, never a reason to degrade the dashboard. */
  const recordedRef = useRef(false)
  useEffect(() => {
    if (recordedRef.current || !organizationId || liveScore === null) return
    if (employees.state.status === 'loading') return
    recordedRef.current = true
    recordScoreSnapshot(
      organizationId,
      currentMonthISO,
      liveScore,
      components.map((c) => ({
        key: c.key,
        done: c.done,
        total: c.total,
        weightedDone: c.weightedDone,
        weightedTotal: c.weightedTotal,
      })),
      liveHeadcount,
    ).catch(() => {})
  }, [organizationId, liveScore, components, currentMonthISO, employees.state, liveHeadcount])

  const history = useMemo(() => {
    if (liveScore === null) return []
    const past = rowsOf(snapshots.state).filter((s) => s.monthISO < currentMonthISO)
    return [...past, { monthISO: currentMonthISO, score: liveScore }].slice(-HISTORY_WINDOW_MONTHS)
  }, [snapshots.state, liveScore, currentMonthISO])

  /* A trend crossing formula versions is labeled, not silently mixed: true
     when any charted past month was frozen under an older formula. */
  const hasOlderFormulaPoints = useMemo(() => {
    const windowStart = history[0]?.monthISO
    if (windowStart === undefined) return false
    return rowsOf(snapshots.state).some(
      (s) =>
        s.monthISO >= windowStart &&
        s.monthISO < currentMonthISO &&
        s.formulaVersion < SCORE_FORMULA_VERSION,
    )
  }, [snapshots.state, history, currentMonthISO])

  const headcountTrend = useMemo(() => {
    if (liveHeadcount === null) return []
    const past = rowsOf(snapshots.state)
      .filter((s) => s.headcount !== null && s.monthISO < currentMonthISO)
      .map((s) => ({ monthISO: s.monthISO, value: s.headcount! }))
    return [...past, { monthISO: currentMonthISO, value: liveHeadcount }].slice(
      -HISTORY_WINDOW_MONTHS,
    )
  }, [snapshots.state, liveHeadcount, currentMonthISO])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.analytics_prod_empty_title)} />
  }

  /* ── Whole-page empty state: brand-new workspace with no records at all ── */
  const coreReady =
    scoreReady && employees.state.status === 'ready' && hrCases.state.status === 'ready'
  const hasAnyData =
    rowsOf(employees.state).length +
      rowsOf(hrCases.state).length +
      rowsOf(tasks.state).length +
      rowsOf(findings.state).length +
      rowsOf(obligations.state).length +
      rowsOf(policies.state).length +
      rowsOf(commsIssues.state).length +
      rowsOf(commsSubmissions.state).length +
      rowsOf(commsBrandClaims.state).length +
      rowsOf(commsPolicyFiles.state).length >
    0
  if (coreReady && !hasAnyData) {
    return (
      <AppPage width="default" responsivePad>
        <div className="rounded-[12px] border border-border bg-surface px-[24px] py-[40px] text-center">
          <div className="mx-auto mb-[14px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-inset">
            <ChartNoAxesColumn
              size={20}
              strokeWidth={1.7}
              className="text-text-muted"
              aria-hidden="true"
            />
          </div>
          <div className="mb-[6px] text-[15px] font-semibold text-text">
            {x(M.analytics_prod_empty_title)}
          </div>
          <p className="m-0 text-[13px] text-text-muted">{x(M.analytics_prod_empty_body)}</p>
        </div>
      </AppPage>
    )
  }

  /* ── Card data ─────────────────────────────────────────────────────────── */
  const scoreDeltaValue = scoreDelta(history)
  const breakdownRows = breakdownRowsOf(components, x)

  /* ── Expiry records: certification / document buckets ──────────────────── */
  const allRecords = rowsOf(expiryRecords.state).map((r) => ({ ...r, expiryISO: r.expiryDate }))
  const certRecords = allRecords.filter((r) => r.kind === 'certification')
  const docRecords = allRecords.filter((r) => r.kind === 'document')
  const certBuckets = expiryBuckets(certRecords, todayISO)
  const docBuckets = expiryBuckets(docRecords, todayISO)

  const toExpiryRow = (
    record: ProductionExpiryRecord & { expiryISO: string },
  ): ExpiryDisplayRow => ({
    key: record.id,
    title: record.name,
    secondary: [record.employeeName, record.employeeJurisdiction].filter(Boolean).join(' · '),
    dateLabel: formatDayISO(record.expiryISO, locale),
    expired: daysBetweenISO(todayISO, record.expiryISO) < 0,
    href: `/app/employees/${record.employeeId}`,
  })

  const { rows: attentionRows, totalCount: attentionTotal } = attentionRowsOf(
    {
      tasks: rowsOf(tasks.state),
      cases: rowsOf(hrCases.state),
      obligations: rowsOf(obligations.state),
      certBuckets,
      docBuckets,
    },
    todayISO,
    x,
    locale,
  )

  const headcountRows = headcountRowsOf(activeEmployees)

  const openCases = rowsOf(hrCases.state).filter((c) => c.status !== 'resolved')
  const aging = caseAging(
    openCases.map((c) => ({ ...c, openedISO: c.createdAt.slice(0, 10) })),
    todayISO,
  )

  const { hasProbationDates: anyProbationDates, rows: serviceMilestoneRows } =
    serviceMilestoneRowsOf(rowsOf(employees.state), rowsOf(tasks.state), todayISO, locale)

  const { rows: leaveRows, bareCount: bareOnLeaveCount } = leaveRowsOf(
    rowsOf(leaves.state),
    activeEmployees,
    todayISO,
    x,
    locale,
  )

  const {
    now: turnoverNow,
    delta: turnoverDelta,
    priorWindowEndISO,
  } = turnoverOf(
    {
      employees: rowsOf(employees.state),
      snapshots: rowsOf(snapshots.state),
      headcountTrend,
      liveHeadcount,
    },
    todayISO,
    currentMonthISO,
  )

  const show = (card: Parameters<typeof analyticsCardVisible>[0]) =>
    analyticsCardVisible(card, memberRole, isOrgAdmin, plan, {
      bypassPlanGates: isBillingAdmin,
    })

  return (
    <AppPage width="default" responsivePad>
      <div className="mb-[14px] text-[13px] text-text-muted">{x(M.analytics_live_note)}</div>

      <div className="grid grid-cols-1 gap-[14px] min-[900px]:grid-cols-2 min-[900px]:gap-[16px]">
        {/* Compliance score */}
        <ScoreCard
          hidden={!show('score')}
          deps={[policies, tasks, findings, obligations, snapshots]}
          liveScore={liveScore}
          delta={scoreDeltaValue}
          capped={ceiling.capped}
          history={history}
          hasOlderFormulaPoints={hasOlderFormulaPoints}
          breakdownRows={breakdownRows}
        />

        {/* Needs attention */}
        <AttentionCard
          hidden={!show('attention')}
          deps={[tasks, hrCases, obligations]}
          rows={attentionRows}
          totalCount={attentionTotal}
        />

        {/* Headcount by jurisdiction */}
        <HeadcountCard
          hidden={!show('headcount')}
          deps={[employees]}
          activeCount={activeEmployees.length}
          rows={headcountRows}
        />

        {/* Open cases */}
        <OpenCasesCard hidden={!show('cases')} deps={[hrCases]} aging={aging} />

        {/* Policy acknowledgments — no tracking data source in production
            yet; the card states that plainly instead of hiding. */}
        <AcknowledgmentsCard hidden={!show('acks')} />

        {/* A · Certifications & training — from hr_expiry_records. */}
        <ExpiryBucketsCard
          title={x(M.analytics_certs_title)}
          subtitle={x(M.analytics_certs_sub)}
          hidden={!show('certifications')}
          deps={[expiryRecords]}
          hasRecords={certRecords.length > 0}
          counts={{
            expired: certBuckets.expired.length,
            within30: certBuckets.within30.length,
            within60: certBuckets.within60.length,
            within90: certBuckets.within90.length,
          }}
          rows={flattenBuckets(certBuckets).map(toExpiryRow)}
          prodEmptyText={x(M.analytics_certs_prod_empty)}
          emptyText={x(M.analytics_certs_empty)}
        />

        {/* C · Service milestones due — employees.probation_end_date,
            with the review-task linkage checked exactly (task metadata). */}
        <ServiceMilestonesCard
          hidden={!show('serviceMilestones')}
          deps={[employees, tasks]}
          hasProbationDates={anyProbationDates}
          rows={serviceMilestoneRows}
        />

        {/* D · Document expiries — from hr_expiry_records. */}
        <ExpiryBucketsCard
          title={x(M.analytics_docs_title)}
          subtitle={x(M.analytics_docs_sub)}
          hidden={!show('documents')}
          deps={[expiryRecords]}
          hasRecords={docRecords.length > 0}
          counts={{
            expired: docBuckets.expired.length,
            within30: docBuckets.within30.length,
            within60: docBuckets.within60.length,
            within90: docBuckets.within90.length,
          }}
          rows={flattenBuckets(docBuckets).map(toExpiryRow)}
          prodEmptyText={x(M.analytics_docs_prod_empty)}
          emptyText={x(M.analytics_docs_empty)}
        />

        {/* E · Leave overview — hr_leaves records, with a bare row for
            anyone marked on_leave who has no record yet. */}
        <LeaveOverviewCard
          hidden={!show('leave')}
          deps={[employees, leaves]}
          rows={leaveRows}
          bareCount={bareOnLeaveCount}
        />

        {/* F · Security posture */}
        <StatTilesCard
          title={x(M.analytics_security_title)}
          subtitle={x(M.analytics_security_sub)}
          hidden={!show('security')}
          deps={[
            securityAssets,
            securityAccessReviews,
            securityIncidents,
            securityRisks,
            securityVendorReviews,
          ]}
          emptyText={x(M.analytics_security_empty)}
          stats={securityTiles(
            {
              assets: rowsOf(securityAssets.state),
              accessReviews: rowsOf(securityAccessReviews.state),
              incidents: rowsOf(securityIncidents.state),
              risks: rowsOf(securityRisks.state),
              vendorReviews: rowsOf(securityVendorReviews.state),
            },
            todayISO,
            x,
          )}
        />

        {/* G · Operations — projects, vendors, quality, technology, logistics */}
        <StatTilesCard
          title={x(M.analytics_operations_title)}
          subtitle={x(M.analytics_operations_sub)}
          hidden={!show('operations')}
          deps={[
            operationsProjects,
            operationsVendors,
            operationsQualityChecks,
            operationsTechnology,
            operationsLogistics,
          ]}
          emptyText={x(M.analytics_operations_empty)}
          stats={operationsTiles(
            {
              projects: rowsOf(operationsProjects.state),
              vendors: rowsOf(operationsVendors.state),
              qualityChecks: rowsOf(operationsQualityChecks.state),
              technology: rowsOf(operationsTechnology.state),
              logistics: rowsOf(operationsLogistics.state),
            },
            todayISO,
            x,
          )}
        />

        {/* H · Governance — records, decisions, officers, shareholders */}
        <StatTilesCard
          title={x(M.analytics_governance_title)}
          subtitle={x(M.analytics_governance_sub)}
          hidden={!show('governance')}
          deps={[
            governanceRecords,
            governanceDecisions,
            governanceOfficers,
            governanceShareholders,
          ]}
          emptyText={x(M.analytics_governance_empty)}
          stats={governanceTiles(
            {
              records: rowsOf(governanceRecords.state),
              decisions: rowsOf(governanceDecisions.state),
              officers: rowsOf(governanceOfficers.state),
              shareholders: rowsOf(governanceShareholders.state),
            },
            x,
          )}
        />

        {/* I · Revenue — streams, invoices, and collections */}
        <StatTilesCard
          title={x(M.analytics_revenue_title)}
          subtitle={x(M.analytics_revenue_sub)}
          hidden={!show('revenue')}
          deps={[revenueStreams, revenueInvoices]}
          emptyText={x(M.analytics_revenue_empty)}
          stats={revenueTiles(
            {
              streams: rowsOf(revenueStreams.state),
              invoices: rowsOf(revenueInvoices.state),
            },
            todayISO,
            x,
          )}
        />

        {/* J · Specialists */}
        <StatTilesCard
          title={x(M.analytics_specialists_title)}
          subtitle={x(M.analytics_specialists_sub)}
          hidden={!show('specialists')}
          deps={[specialists, specialistEngagements]}
          emptyText={x(M.analytics_specialists_empty)}
          stats={specialistsTiles(
            {
              specialists: rowsOf(specialists.state),
              engagements: rowsOf(specialistEngagements.state),
            },
            todayISO,
            x,
          )}
        />

        {/* J · Comms & PR overview */}
        <StatTilesCard
          title={x(M.analytics_comms_title)}
          subtitle={x(M.analytics_comms_sub)}
          hidden={!show('comms')}
          deps={[
            commsContentItems,
            commsInteractions,
            commsIssues,
            commsSubmissions,
            commsBrandClaims,
            commsPolicyFiles,
          ]}
          emptyText={x(M.analytics_comms_empty)}
          stats={commsTiles(
            {
              contentItems: rowsOf(commsContentItems.state),
              interactions: rowsOf(commsInteractions.state),
              issues: rowsOf(commsIssues.state),
              submissions: rowsOf(commsSubmissions.state),
              brandClaims: rowsOf(commsBrandClaims.state),
              policyFiles: rowsOf(commsPolicyFiles.state),
            },
            x,
          )}
        />

        {/* K · Headcount & turnover — headcount history accumulates via the
            monthly snapshot; turnover awaits termination history. */}
        <HeadcountTrendCard
          hidden={!show('trend')}
          deps={[employees, snapshots]}
          liveHeadcount={liveHeadcount}
          turnoverNow={turnoverNow}
          turnoverDelta={turnoverDelta}
          priorWindowEndISO={priorWindowEndISO}
          headcountTrend={headcountTrend}
        />
      </div>
    </AppPage>
  )
}
