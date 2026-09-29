import type { Bi } from '@/i18n/core'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import type {
  CommsBrandClaim,
  CommsContentItem,
  CommsInteraction,
  CommsIssue,
  CommsPolicyFile,
  CommsSubmission,
} from './commsAnalyticsApi'
import type {
  GovernanceDecision,
  GovernanceOfficer,
  GovernanceRecord,
  GovernanceShareholder,
} from './governanceAnalyticsApi'
import type {
  OperationsLogistics,
  OperationsProject,
  OperationsQualityCheck,
  OperationsTechnology,
  OperationsVendor,
} from './operationsAnalyticsApi'
import type { RevenueInvoice, RevenueStream } from './revenueAnalyticsApi'
import type {
  SecurityAccessReview,
  SecurityAsset,
  SecurityIncident,
  SecurityRisk,
  SecurityVendorReview,
} from './securityAnalyticsApi'
import type { Specialist, SpecialistEngagement } from './specialistsAnalyticsApi'
import { addDaysISO } from './aggregation'
import { formatCurrency } from '@/lib/format'

/**
 * Derivations for the StatTile-grid cards. Each function takes already-
 * resolved module rows and returns whether the card has any data plus the
 * tiles to render — AnalyticsProductionView stays an orchestrator.
 */

export interface StatTileSpec {
  readonly value: string
  readonly label: string
  readonly alert?: boolean
}

export interface StatTiles {
  readonly hasData: boolean
  readonly tiles: readonly StatTileSpec[]
}

type X = (value: Bi) => string

export function securityTiles(
  input: {
    assets: readonly SecurityAsset[]
    accessReviews: readonly SecurityAccessReview[]
    incidents: readonly SecurityIncident[]
    risks: readonly SecurityRisk[]
    vendorReviews: readonly SecurityVendorReview[]
  },
  todayISO: string,
  x: X,
): StatTiles {
  const { assets: assetRows, accessReviews: accessReviewRows } = input
  const { incidents: incidentRows, risks: riskRows, vendorReviews: vendorReviewRows } = input
  const hasData =
    assetRows.length +
      accessReviewRows.length +
      incidentRows.length +
      riskRows.length +
      vendorReviewRows.length >
    0

  const today = new Date(todayISO)
  const in7Days = new Date(today)
  in7Days.setDate(today.getDate() + 7)
  const in7ISO = in7Days.toISOString().slice(0, 10)

  const atRisk = assetRows.filter((a) => a.status === 'at_risk').length
  const criticalAssets = assetRows.filter((a) => a.criticality === 'critical').length
  const openIncidents = incidentRows.filter(
    (i) => i.status === 'open' || i.status === 'contained',
  ).length
  const criticalIncidents = incidentRows.filter(
    (i) => (i.status === 'open' || i.status === 'contained') && i.severity === 'critical',
  ).length
  const openRisks = riskRows.filter((r) => r.status === 'open').length
  const overdueReviews = accessReviewRows.filter(
    (r) =>
      (r.status === 'pending' || r.status === 'in_progress') &&
      r.review_due_date !== null &&
      r.review_due_date < todayISO,
  ).length
  const reviewsDueSoon = accessReviewRows.filter(
    (r) =>
      (r.status === 'pending' || r.status === 'in_progress') &&
      r.review_due_date !== null &&
      r.review_due_date >= todayISO &&
      r.review_due_date <= in7ISO,
  ).length
  const vendorsDueSoon = vendorReviewRows.filter(
    (v) =>
      v.next_review_date !== null && v.next_review_date >= todayISO && v.next_review_date <= in7ISO,
  ).length

  return {
    hasData,
    tiles: [
      {
        value: String(atRisk),
        label: x(M.analytics_security_assets_at_risk),
        alert: atRisk > 0,
      },
      {
        value: String(criticalAssets),
        label: x(M.analytics_security_title),
        alert: criticalAssets > 0,
      },
      { value: String(openIncidents), label: x(M.analytics_security_open_incidents) },
      {
        value: String(criticalIncidents),
        label: x(M.analytics_security_critical_incidents),
        alert: criticalIncidents > 0,
      },
      { value: String(openRisks), label: x(M.analytics_security_open_risks) },
      {
        value: String(overdueReviews),
        label: x(M.analytics_security_overdue_reviews),
        alert: overdueReviews > 0,
      },
      { value: String(reviewsDueSoon), label: x(M.analytics_security_reviews_due) },
      { value: String(vendorsDueSoon), label: x(M.analytics_security_vendors_due) },
    ],
  }
}

export function operationsTiles(
  input: {
    projects: readonly OperationsProject[]
    vendors: readonly OperationsVendor[]
    qualityChecks: readonly OperationsQualityCheck[]
    technology: readonly OperationsTechnology[]
    logistics: readonly OperationsLogistics[]
  },
  todayISO: string,
  x: X,
): StatTiles {
  const { projects: projectRows, vendors: vendorRows } = input
  const { qualityChecks: qualityRows, technology: technologyRows } = input
  const { logistics: logisticsRows } = input
  const hasData =
    projectRows.length +
      vendorRows.length +
      qualityRows.length +
      technologyRows.length +
      logisticsRows.length >
    0

  const today = new Date(todayISO)
  const in7Days = new Date(today)
  in7Days.setDate(today.getDate() + 7)
  const in7ISO = in7Days.toISOString().slice(0, 10)

  const activeProjects = projectRows.filter((p) => p.status === 'active').length
  const activeVendors = vendorRows.filter((v) => v.status === 'active').length
  const overdueQuality = qualityRows.filter(
    (q) =>
      q.status === 'overdue' ||
      (q.status === 'pending' && q.due_date !== null && q.due_date < todayISO),
  ).length
  const techRenewals = technologyRows.filter(
    (t) => t.renewal_date !== null && t.renewal_date >= todayISO && t.renewal_date <= in7ISO,
  ).length
  const delayedLogistics = logisticsRows.filter((l) => l.status === 'delayed').length

  return {
    hasData,
    tiles: [
      { value: String(activeProjects), label: x(M.analytics_operations_active_projects) },
      { value: String(activeVendors), label: x(M.analytics_operations_active_vendors) },
      {
        value: String(overdueQuality),
        label: x(M.analytics_operations_overdue_quality),
        alert: overdueQuality > 0,
      },
      { value: String(techRenewals), label: x(M.analytics_operations_tech_renewals) },
      {
        value: String(delayedLogistics),
        label: x(M.analytics_operations_delayed_logistics),
        alert: delayedLogistics > 0,
      },
    ],
  }
}

export function governanceTiles(
  input: {
    records: readonly GovernanceRecord[]
    decisions: readonly GovernanceDecision[]
    officers: readonly GovernanceOfficer[]
    shareholders: readonly GovernanceShareholder[]
  },
  x: X,
): StatTiles {
  const { records: recordRows, decisions: decisionRows } = input
  const { officers: officerRows, shareholders: shareholderRows } = input
  const hasData =
    recordRows.length + decisionRows.length + officerRows.length + shareholderRows.length > 0

  const activeRecords = recordRows.filter((r) => r.status === 'active').length
  const pendingRecords = recordRows.filter((r) => r.status === 'pending_review').length
  const adoptedDecisions = decisionRows.filter((d) => d.status === 'adopted').length
  const activeOfficers = officerRows.filter((o) => o.is_active).length
  const totalShares = shareholderRows.reduce((sum, s) => sum + (s.shares_issued ?? 0), 0)

  return {
    hasData,
    tiles: [
      { value: String(activeRecords), label: x(M.analytics_governance_active_records) },
      {
        value: String(pendingRecords),
        label: x(M.analytics_governance_pending_records),
        alert: pendingRecords > 0,
      },
      { value: String(adoptedDecisions), label: x(M.analytics_governance_adopted_decisions) },
      { value: String(activeOfficers), label: x(M.analytics_governance_active_officers) },
      { value: String(totalShares), label: x(M.analytics_governance_total_shares) },
    ],
  }
}

export function revenueTiles(
  input: { streams: readonly RevenueStream[]; invoices: readonly RevenueInvoice[] },
  todayISO: string,
  x: X,
): StatTiles {
  const { streams: streamRows, invoices: invoiceRows } = input
  const hasData = streamRows.length + invoiceRows.length > 0

  const mrr = Math.round(
    streamRows
      .filter((s) => s.status === 'active' && s.stream_type === 'recurring' && s.frequency)
      .reduce((sum, s) => {
        const divisor = s.frequency === 'annually' ? 12 : s.frequency === 'quarterly' ? 4 : 1
        return sum + s.amount / divisor
      }, 0),
  )
  const mrrCurrency =
    streamRows.find((s) => s.status === 'active' && s.stream_type === 'recurring' && s.frequency)
      ?.currency ?? 'CAD'

  const openTotal = invoiceRows
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0)
  const openCurrency =
    invoiceRows.find((i) => i.status === 'sent' || i.status === 'overdue')?.currency ?? 'CAD'

  const paid = invoiceRows
    .filter(
      (i) => i.status === 'paid' && i.paid_date && i.paid_date.slice(0, 4) === todayISO.slice(0, 4),
    )
    .reduce((sum, i) => sum + i.amount, 0)
  const paidCurrency = invoiceRows.find((i) => i.status === 'paid')?.currency ?? 'CAD'

  const overdue = invoiceRows.filter(
    (i) => (i.status === 'sent' && i.due_date && i.due_date < todayISO) || i.status === 'overdue',
  ).length

  return {
    hasData,
    tiles: [
      { value: formatCurrency(mrr, mrrCurrency), label: x(M.analytics_revenue_mrr) },
      {
        value: formatCurrency(openTotal, openCurrency),
        label: x(M.analytics_revenue_open_invoices),
      },
      { value: formatCurrency(paid, paidCurrency), label: x(M.analytics_revenue_paid_ytd) },
      { value: String(overdue), label: x(M.analytics_revenue_overdue), alert: overdue > 0 },
    ],
  }
}

export function specialistsTiles(
  input: {
    specialists: readonly Specialist[]
    engagements: readonly SpecialistEngagement[]
  },
  todayISO: string,
  x: X,
): StatTiles {
  const { specialists: specialistRows, engagements: engagementRows } = input
  const hasData = specialistRows.length + engagementRows.length > 0

  const in7ISO = addDaysISO(todayISO, 7)
  const currentMonth = todayISO.slice(0, 7)

  const activeSpecialists = specialistRows.length
  const activeWorkspaceAccess = specialistRows.filter((s) => s.workspace_access).length
  const engagementsThisMonth = engagementRows.filter(
    (e) => e.engagement_date !== null && e.engagement_date.startsWith(currentMonth),
  ).length
  const followUpsDue = engagementRows.filter(
    (e) => e.follow_up_date !== null && e.follow_up_date >= todayISO && e.follow_up_date <= in7ISO,
  ).length
  const overdueFollowUps = engagementRows.filter(
    (e) => e.follow_up_date !== null && e.follow_up_date < todayISO,
  ).length

  return {
    hasData,
    tiles: [
      { value: String(activeSpecialists), label: x(M.analytics_specialists_active) },
      {
        value: String(activeWorkspaceAccess),
        label: x(M.analytics_specialists_workspace_access),
      },
      {
        value: String(engagementsThisMonth),
        label: x(M.analytics_specialists_engagements_month),
      },
      {
        value: String(followUpsDue),
        label: x(M.analytics_specialists_followups_due),
        alert: followUpsDue > 0,
      },
      {
        value: String(overdueFollowUps),
        label: x(M.analytics_specialists_overdue_followups),
        alert: overdueFollowUps > 0,
      },
    ],
  }
}

export function commsTiles(
  input: {
    contentItems: readonly CommsContentItem[]
    interactions: readonly CommsInteraction[]
    issues: readonly CommsIssue[]
    submissions: readonly CommsSubmission[]
    brandClaims: readonly CommsBrandClaim[]
    policyFiles: readonly CommsPolicyFile[]
  },
  x: X,
): StatTiles {
  const { contentItems: contentItemRows, interactions: interactionRows } = input
  const { issues: issueRows, submissions: submissionRows } = input
  const { brandClaims: brandClaimRows, policyFiles: policyFileRows } = input
  const hasData =
    contentItemRows.length +
      interactionRows.length +
      issueRows.length +
      submissionRows.length +
      brandClaimRows.length +
      policyFileRows.length >
    0

  return {
    hasData,
    tiles: [
      { value: String(contentItemRows.length), label: x(M.analytics_comms_content_items) },
      {
        value: String(contentItemRows.filter((c) => c.deliveryStatus === 'scheduled').length),
        label: x(M.analytics_comms_scheduled),
      },
      {
        value: String(contentItemRows.filter((c) => c.deliveryStatus === 'confirmed').length),
        label: x(M.analytics_comms_confirmed),
      },
      {
        value: String(
          issueRows.filter((i) => i.status === 'open' || i.status === 'monitoring').length,
        ),
        label: x(M.analytics_comms_open_issues),
      },
      {
        value: String(
          interactionRows.filter((i) => i.status === 'open' || i.status === 'pending').length,
        ),
        label: x(M.analytics_comms_open_interactions),
      },
      {
        value: String(brandClaimRows.filter((c) => c.status === 'active').length),
        label: x(M.analytics_comms_active_brand_claims),
      },
      { value: String(policyFileRows.length), label: x(M.analytics_comms_policy_files) },
    ],
  }
}
