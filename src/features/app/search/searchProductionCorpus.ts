import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'
import { knowledgeItems } from '@/data'
import { allTemplates } from '@/features/app/documents/catalogue'
import { listDocuments } from '@/features/app/documents/productionApi'
import { referenceGuides } from '@/features/app/reference/data'
import { listCases } from '@/features/app/views/cases/productionApi'
import { listCommunications } from '@/features/app/views/communications/productionApi'
import { listSegments } from '@/features/app/views/comms/data/segmentsApi'
import { listContacts } from '@/features/app/views/comms/data/stakeholdersApi'
import { sensitiveCaseTypes } from '@/features/app/views/cases/caseModel'
import { listFindings } from '@/features/app/views/compliance/productionApi'
import { listEmployees } from '@/features/app/views/employees/productionApi'
import { listOwnConversations } from '@/features/app/views/memory/conversationsApi'
import {
  listGovernanceRecords,
  listGovernanceDecisions,
  listGovernanceOfficers,
  listGovernanceShareholders,
} from '@/features/app/views/governance/data/productionApi'
import {
  listOperationsProjects,
  listOperationsVendors,
  listOperationsQualityChecks,
  listOperationsTechnology,
  listOperationsLogistics,
} from '@/features/app/views/operations/data/productionApi'
import { listPolicies } from '@/features/app/views/policies/productionApi'
import {
  listSecurityAssets,
  listSecurityIncidents,
  listSecurityRisks,
} from '@/features/app/views/security/data/productionApi'
import {
  listRevenueStreams,
  listRevenueInvoices,
} from '@/features/app/views/revenue/data/productionApi'
import {
  listSpecialists,
  listSpecialistEngagements,
} from '@/features/app/views/specialists/data/productionApi'
import { listTasks } from '@/features/app/views/tasks/productionApi'
import { searchMessages as M } from '@/i18n/messages/search'
import { shellMessages as S } from '@/i18n/messages/shell'
import { flowSearchEntries } from './searchCorpus'
import type { SearchEntry } from './searchCorpus'

const DOT = ' · '

function joinBi(parts: Bi[], separator = DOT): Bi {
  return bi(parts.map((p) => p.en).join(separator), parts.map((p) => p.fr).join(separator))
}

function neutral(text: string): Bi {
  return bi(text, text)
}

function conversationTitle(messages: { role: string; content: string }[]): Bi {
  const firstUser = messages.find((m) => m.role === 'user')?.content?.trim()
  if (!firstUser) return bi('Advisor conversation', 'Conversation du Conseiller')
  const clipped = firstUser.length > 72 ? `${firstUser.slice(0, 69)}…` : firstUser
  return neutral(clipped)
}

/**
 * Build the global-search corpus from live org data (production mode).
 * Client-side filter reuses filterSearchEntriesFrom in searchCorpus.ts.
 */
export async function buildProductionSearchEntries(organizationId: string): Promise<SearchEntry[]> {
  const [
    employees,
    cases,
    conversations,
    documents,
    comms,
    commsSegments,
    commsContacts,
    tasks,
    findings,
    policies,
    securityAssets,
    securityIncidents,
    securityRisks,
    operationsProjects,
    operationsVendors,
    operationsQualityChecks,
    operationsTechnology,
    operationsLogistics,
    governanceRecords,
    governanceDecisions,
    governanceOfficers,
    governanceShareholders,
    revenueStreams,
    revenueInvoices,
    specialists,
    specialistEngagements,
  ] = await Promise.all([
    listEmployees(organizationId),
    listCases(organizationId),
    listOwnConversations(24),
    listDocuments(organizationId),
    listCommunications(organizationId),
    listSegments(organizationId),
    listContacts(organizationId),
    listTasks(organizationId),
    listFindings(organizationId),
    listPolicies(organizationId),
    listSecurityAssets(organizationId),
    listSecurityIncidents(organizationId),
    listSecurityRisks(organizationId),
    listOperationsProjects(organizationId),
    listOperationsVendors(organizationId),
    listOperationsQualityChecks(organizationId),
    listOperationsTechnology(organizationId),
    listOperationsLogistics(organizationId),
    listGovernanceRecords(organizationId),
    listGovernanceDecisions(organizationId),
    listGovernanceOfficers(organizationId),
    listGovernanceShareholders(organizationId),
    listRevenueStreams(organizationId),
    listRevenueInvoices(organizationId),
    listSpecialists(organizationId),
    listSpecialistEngagements(organizationId),
  ])

  const personEntries: SearchEntry[] = employees.map((e) => ({
    id: `emp-${e.id}`,
    kind: 'person',
    kindLabel: M.search_kind_person,
    title: neutral(e.name),
    sub: joinBi([neutral(e.title ?? ''), neutral(e.jurisdiction)]),
    restricted: false,
    match: joinBi([neutral(e.name), neutral(e.title ?? ''), neutral(e.jurisdiction)]),
    nav: { kind: 'employee', employeeId: e.id },
  }))

  const caseEntries: SearchEntry[] = cases.map((c) => ({
    id: `case-${c.id}`,
    kind: 'case',
    kindLabel: M.search_kind_case,
    title: neutral(c.title),
    sub: joinBi([neutral(c.caseType), neutral(c.jurisdiction), neutral(c.status)]),
    restricted: sensitiveCaseTypes.includes(c.caseType),
    match: joinBi([neutral(c.title), neutral(c.caseType)]),
    nav: { kind: 'case', caseId: c.id },
  }))

  const chatEntries: SearchEntry[] = conversations.map((c) => {
    const title = conversationTitle(c.messages)
    return {
      id: c.id,
      kind: 'chat',
      kindLabel: M.search_kind_conversation,
      title,
      restricted: false,
      match: title,
      nav: { kind: 'chat', chatId: c.id },
    }
  })

  const templateEntries: SearchEntry[] = allTemplates.map((d) => ({
    id: `doc-${d.tid}`,
    kind: 'document',
    kindLabel: M.search_kind_document,
    title: d.name,
    sub: d.risk === 'high' ? joinBi([d.name, M.search_doc_high_risk_suffix]) : d.name,
    restricted: d.risk === 'high',
    match: d.name,
    nav: { kind: 'document', docKey: d.tid },
  }))

  const generatedEntries: SearchEntry[] = documents.map((d) => ({
    id: `gen-${d.id}`,
    kind: 'document',
    kindLabel: M.search_kind_document,
    title: d.title,
    sub: joinBi([neutral(d.ref), neutral(d.status)]),
    restricted: d.reviewStatus === 'hr_review_required' || d.reviewStatus === 'not_reviewed',
    match: joinBi([d.title, neutral(d.ref)]),
    nav: { kind: 'generatedDocument', docId: d.id },
  }))

  const commsEntries: SearchEntry[] = comms.map((c) => ({
    id: `comm-${c.id}`,
    kind: 'comms',
    kindLabel: M.search_kind_comms,
    title: neutral(c.title),
    sub: joinBi([neutral(c.audience ?? ''), neutral(c.status)]),
    restricted: false,
    match: neutral(c.title),
    nav: { kind: 'view', view: 'communications' },
  }))

  const commsSegmentEntries: SearchEntry[] = commsSegments.map((s) => ({
    id: `seg-${s.id}`,
    kind: 'comms',
    kindLabel: M.search_kind_comms,
    title: s.name,
    sub: s.description,
    restricted: false,
    match: s.description ? joinBi([s.name, s.description]) : s.name,
    nav: { kind: 'view', view: 'comms/segments' },
  }))

  const commsContactEntries: SearchEntry[] = commsContacts.map((c) => ({
    id: `comm-contact-${c.id}`,
    kind: 'comms',
    kindLabel: M.search_kind_comms,
    title: neutral(c.name),
    sub: c.role,
    restricted: false,
    match: c.role ? joinBi([neutral(c.name), c.role]) : neutral(c.name),
    nav: { kind: 'view', view: 'comms/relationships' },
  }))

  const taskEntries: SearchEntry[] = tasks.map((t) => ({
    id: `task-${t.id}`,
    kind: 'task',
    kindLabel: M.search_kind_task,
    title: neutral(t.title),
    sub: t.dueDate ? neutral(t.dueDate) : undefined,
    restricted: false,
    match: neutral(t.title),
    nav: { kind: 'view', view: 'tasks' },
  }))

  const complianceEntries: SearchEntry[] = findings
    .filter((f) => !f.resolved)
    .map((f) => ({
      id: `ci-${f.id}`,
      kind: 'compliance',
      kindLabel: M.search_kind_compliance,
      title: neutral(f.title),
      sub: joinBi([neutral(f.severity), neutral(f.status)]),
      restricted: false,
      match: neutral(f.title),
      nav: { kind: 'view', view: 'compliance' },
    }))

  const policyEntries: SearchEntry[] = policies.map((p) => ({
    id: `pol-${p.id}`,
    kind: 'policy',
    kindLabel: M.search_kind_policy,
    title: neutral(p.name),
    sub: joinBi([neutral(p.status), neutral(p.lastReviewed ?? '')]),
    restricted: false,
    match: neutral(p.name),
    nav: { kind: 'view', view: 'policies' },
  }))

  const securityAssetEntries: SearchEntry[] = securityAssets.map((a) => ({
    id: `sec-asset-${a.id}`,
    kind: 'security',
    kindLabel: M.search_kind_security,
    title: neutral(a.name),
    sub: joinBi([neutral(a.asset_type), neutral(a.status), neutral(a.criticality ?? '')]),
    restricted: a.criticality === 'critical',
    match: joinBi([neutral(a.name), neutral(a.asset_type)]),
    nav: { kind: 'view', view: 'security/assets' },
  }))

  const securityIncidentEntries: SearchEntry[] = securityIncidents.map((i) => ({
    id: `sec-incident-${i.id}`,
    kind: 'security',
    kindLabel: M.search_kind_security,
    title: neutral(i.title),
    sub: joinBi([neutral(i.severity), neutral(i.status)]),
    restricted: i.severity === 'critical',
    match: joinBi([neutral(i.title), neutral(i.severity)]),
    nav: { kind: 'view', view: 'security/incidents' },
  }))

  const securityRiskEntries: SearchEntry[] = securityRisks.map((r) => ({
    id: `sec-risk-${r.id}`,
    kind: 'security',
    kindLabel: M.search_kind_security,
    title: neutral(r.title),
    sub: joinBi([neutral(r.likelihood ?? ''), neutral(r.impact ?? ''), neutral(r.status)]),
    restricted: false,
    match: joinBi([neutral(r.title), neutral(r.status)]),
    nav: { kind: 'view', view: 'security/risks' },
  }))

  const operationsProjectEntries: SearchEntry[] = operationsProjects.map((p) => ({
    id: `ops-project-${p.id}`,
    kind: 'operations',
    kindLabel: M.search_kind_operations,
    title: neutral(p.title),
    sub: joinBi([neutral(p.status), neutral(p.target_date ?? '')]),
    restricted: false,
    match: joinBi([neutral(p.title), neutral(p.status)]),
    nav: { kind: 'view', view: 'operations/projects' },
  }))

  const operationsVendorEntries: SearchEntry[] = operationsVendors.map((v) => ({
    id: `ops-vendor-${v.id}`,
    kind: 'operations',
    kindLabel: M.search_kind_operations,
    title: neutral(v.name),
    sub: joinBi([neutral(v.vendor_type ?? ''), neutral(v.status)]),
    restricted: false,
    match: joinBi([neutral(v.name), neutral(v.vendor_type ?? '')]),
    nav: { kind: 'view', view: 'operations/vendors' },
  }))

  const operationsQualityCheckEntries: SearchEntry[] = operationsQualityChecks.map((q) => ({
    id: `ops-quality-${q.id}`,
    kind: 'operations',
    kindLabel: M.search_kind_operations,
    title: neutral(q.title),
    sub: joinBi([neutral(q.status), neutral(q.due_date ?? '')]),
    restricted: false,
    match: joinBi([neutral(q.title), neutral(q.status)]),
    nav: { kind: 'view', view: 'operations/quality' },
  }))

  const operationsTechnologyEntries: SearchEntry[] = operationsTechnology.map((t) => ({
    id: `ops-tech-${t.id}`,
    kind: 'operations',
    kindLabel: M.search_kind_operations,
    title: neutral(t.name),
    sub: joinBi([neutral(t.system_type ?? ''), neutral(t.status), neutral(t.renewal_date ?? '')]),
    restricted: false,
    match: joinBi([neutral(t.name), neutral(t.system_type ?? '')]),
    nav: { kind: 'view', view: 'operations/technology' },
  }))

  const operationsLogisticsEntries: SearchEntry[] = operationsLogistics.map((l) => ({
    id: `ops-logistics-${l.id}`,
    kind: 'operations',
    kindLabel: M.search_kind_operations,
    title: neutral(l.title),
    sub: joinBi([neutral(l.status), neutral(l.expected_date ?? '')]),
    restricted: false,
    match: joinBi([neutral(l.title), neutral(l.status)]),
    nav: { kind: 'view', view: 'operations/logistics' },
  }))

  const governanceRecordEntries: SearchEntry[] = governanceRecords.map((r) => ({
    id: `gov-record-${r.id}`,
    kind: 'governance',
    kindLabel: M.search_kind_governance,
    title: neutral(r.title),
    sub: joinBi([neutral(r.record_type), neutral(r.status), neutral(r.jurisdiction ?? '')]),
    restricted: false,
    match: joinBi([neutral(r.title), neutral(r.record_type)]),
    nav: { kind: 'view', view: 'governance/records' },
  }))

  const governanceDecisionEntries: SearchEntry[] = governanceDecisions.map((d) => ({
    id: `gov-decision-${d.id}`,
    kind: 'governance',
    kindLabel: M.search_kind_governance,
    title: neutral(d.title),
    sub: joinBi([neutral(d.status), neutral(d.decision_date ?? '')]),
    restricted: false,
    match: joinBi([neutral(d.title), neutral(d.status)]),
    nav: { kind: 'view', view: 'governance/decisions' },
  }))

  const governanceOfficerEntries: SearchEntry[] = governanceOfficers.map((o) => ({
    id: `gov-officer-${o.id}`,
    kind: 'governance',
    kindLabel: M.search_kind_governance,
    title: neutral(o.name),
    sub: joinBi([neutral(o.role), neutral(o.is_active ? 'active' : 'inactive')]),
    restricted: false,
    match: joinBi([neutral(o.name), neutral(o.role)]),
    nav: { kind: 'view', view: 'governance/officers' },
  }))

  const governanceShareholderEntries: SearchEntry[] = governanceShareholders.map((s) => ({
    id: `gov-shareholder-${s.id}`,
    kind: 'governance',
    kindLabel: M.search_kind_governance,
    title: neutral(s.name),
    sub: joinBi([
      neutral(s.share_class ?? ''),
      neutral(s.shares_issued !== null ? String(s.shares_issued) : ''),
    ]),
    restricted: false,
    match: neutral(s.name),
    nav: { kind: 'view', view: 'governance/shareholders' },
  }))

  const revenueStreamEntries: SearchEntry[] = revenueStreams.map((s) => ({
    id: `rev-stream-${s.id}`,
    kind: 'revenue',
    kindLabel: M.search_kind_revenue,
    title: neutral(s.name),
    sub: joinBi([neutral(s.stream_type), neutral(s.status)]),
    restricted: false,
    match: joinBi([neutral(s.name), neutral(s.stream_type)]),
    nav: { kind: 'view', view: 'revenue/streams' },
  }))

  const revenueInvoiceEntries: SearchEntry[] = revenueInvoices.map((i) => ({
    id: `rev-invoice-${i.id}`,
    kind: 'revenue',
    kindLabel: M.search_kind_revenue,
    title: neutral(i.customer_name),
    sub: i.due_date
      ? joinBi([neutral(i.status), neutral(i.due_date)])
      : joinBi([neutral(i.status)]),
    restricted: i.status === 'overdue',
    match: joinBi([neutral(i.customer_name), neutral(i.status)]),
    nav: { kind: 'view', view: 'revenue/invoices' },
  }))

  const specialistById = new Map(specialists.map((s) => [s.id, s]))

  const specialistEntries: SearchEntry[] = specialists.map((s) => ({
    id: `spec-${s.id}`,
    kind: 'specialists',
    kindLabel: M.search_kind_specialists,
    title: neutral(s.name),
    sub: joinBi([neutral(s.specialty), neutral(s.company ?? '')]),
    restricted: false,
    match: joinBi([neutral(s.name), neutral(s.specialty), neutral(s.company ?? '')]),
    nav: { kind: 'view', view: 'specialists/directory' },
  }))

  const specialistEngagementEntries: SearchEntry[] = specialistEngagements.map((e) => {
    const specialist = specialistById.get(e.specialist_id)
    const name = specialist?.name ?? 'Unknown'
    return {
      id: `spec-eng-${e.id}`,
      kind: 'specialists',
      kindLabel: M.search_kind_specialists,
      title: neutral(name),
      sub: joinBi([
        neutral(e.engagement_type ?? ''),
        neutral(e.engagement_date ?? ''),
        neutral(e.summary ?? ''),
      ]),
      restricted: false,
      match: joinBi([
        neutral(name),
        neutral(e.engagement_type ?? ''),
        neutral(e.summary ?? ''),
      ]),
      nav: { kind: 'view', view: 'specialists/engagements' },
    }
  })

  const knowledgeEntries: SearchEntry[] = [
    ...knowledgeItems.map((k) => ({
      id: `kb-${k.id}`,
      kind: 'knowledge' as const,
      kindLabel: M.search_kind_knowledge,
      title: k.title,
      restricted: false,
      match: k.title,
      nav: { kind: 'view' as const, view: 'knowledge' as const },
    })),
    ...referenceGuides.map((g) => ({
      id: `ref-${g.slug}`,
      kind: 'knowledge' as const,
      kindLabel: M.search_kind_knowledge,
      title: g.title,
      restricted: false,
      match: g.title,
      nav: { kind: 'view' as const, view: 'knowledge' as const },
    })),
  ]

  const moduleEntries: SearchEntry[] = [
    {
      id: 'mod-governance',
      kind: 'governance',
      kindLabel: M.search_kind_governance,
      title: S.shell_v_governance,
      restricted: false,
      match: S.shell_v_governance,
      nav: { kind: 'view', view: 'governance/overview' },
    },
    {
      id: 'mod-security',
      kind: 'security',
      kindLabel: M.search_kind_security,
      title: S.shell_v_security,
      restricted: false,
      match: S.shell_v_security,
      nav: { kind: 'view', view: 'security/overview' },
    },
    {
      id: 'mod-operations',
      kind: 'operations',
      kindLabel: M.search_kind_operations,
      title: S.shell_v_operations,
      restricted: false,
      match: S.shell_v_operations,
      nav: { kind: 'view', view: 'operations/overview' },
    },
    {
      id: 'mod-specialists',
      kind: 'specialists',
      kindLabel: M.search_kind_specialists,
      title: S.shell_v_specialists,
      restricted: false,
      match: S.shell_v_specialists,
      nav: { kind: 'view', view: 'specialists/overview' },
    },
    {
      id: 'mod-revenue',
      kind: 'revenue',
      kindLabel: M.search_kind_revenue,
      title: S.shell_v_revenue,
      restricted: false,
      match: S.shell_v_revenue,
      nav: { kind: 'view', view: 'revenue/overview' },
    },
  ]

  return [
    ...personEntries,
    ...caseEntries,
    ...chatEntries,
    ...templateEntries,
    ...generatedEntries,
    ...commsEntries,
    ...commsSegmentEntries,
    ...commsContactEntries,
    ...taskEntries,
    ...complianceEntries,
    ...policyEntries,
    ...securityAssetEntries,
    ...securityIncidentEntries,
    ...securityRiskEntries,
    ...operationsProjectEntries,
    ...operationsVendorEntries,
    ...operationsQualityCheckEntries,
    ...operationsTechnologyEntries,
    ...operationsLogisticsEntries,
    ...governanceRecordEntries,
    ...governanceDecisionEntries,
    ...governanceOfficerEntries,
    ...governanceShareholderEntries,
    ...revenueStreamEntries,
    ...revenueInvoiceEntries,
    ...specialistEntries,
    ...specialistEngagementEntries,
    ...knowledgeEntries,
    ...moduleEntries,
    ...flowSearchEntries,
  ]
}

/** Pinned chats in production — most recent three conversations. */
export function pinnedProductionChats(entries: readonly SearchEntry[]): SearchEntry[] {
  return entries
    .filter((e) => e.kind === 'chat')
    .slice(0, 3)
    .map((e) => ({ ...e, kindLabel: M.search_pinned }))
}
