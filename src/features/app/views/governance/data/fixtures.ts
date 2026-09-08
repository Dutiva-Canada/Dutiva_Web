import type {
  GovernanceRecord,
  GovernanceDecision,
  GovernanceOfficer,
  GovernanceShareholder,
} from './types'

const DEMO_ORG_ID = 'org-northgate-demo'

export const governanceRecords: GovernanceRecord[] = [
  {
    id: 'rec-1',
    organization_id: DEMO_ORG_ID,
    title: 'Articles of Incorporation',
    record_type: 'articles',
    jurisdiction: 'Ontario',
    effective_date: '2019-03-15',
    review_due_date: '2029-03-15',
    status: 'active',
    viewer_visible: true,
    document_id: null,
    created_by: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'rec-2',
    organization_id: DEMO_ORG_ID,
    title: 'By-law No. 1 — Corporate Governance',
    record_type: 'bylaw',
    jurisdiction: 'Ontario',
    effective_date: '2021-06-10',
    review_due_date: '2026-06-10',
    status: 'active',
    viewer_visible: true,
    document_id: null,
    created_by: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const governanceDecisions: GovernanceDecision[] = [
  {
    id: 'dec-1',
    organization_id: DEMO_ORG_ID,
    title: 'Adopt 2024 fiscal year-end of December 31',
    decision_date: '2024-01-15',
    decided_by: 'Board of Directors',
    rationale: 'Aligned with tax reporting cycle.',
    status: 'adopted',
    viewer_visible: true,
    related_record_id: 'rec-2',
    created_by: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const governanceOfficers: GovernanceOfficer[] = [
  {
    id: 'off-1',
    organization_id: DEMO_ORG_ID,
    name: 'Riley Summers',
    role: 'officer_secretary',
    appointed_date: '2022-04-01',
    resigned_date: null,
    contact_email: 'riley@northgatelogistics.ca',
    is_active: true,
    viewer_visible: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'off-2',
    organization_id: DEMO_ORG_ID,
    name: 'Jordan Mensah',
    role: 'director',
    appointed_date: '2020-09-12',
    resigned_date: null,
    contact_email: 'jordan@northgatelogistics.ca',
    is_active: true,
    viewer_visible: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const governanceShareholders: GovernanceShareholder[] = [
  {
    id: 'sh-1',
    organization_id: DEMO_ORG_ID,
    name: 'Northgate Holdings Inc.',
    share_class: 'Class A Common',
    shares_issued: 1000,
    issue_date: '2019-03-15',
    contact_email: 'legal@northgateholdings.ca',
    viewer_visible: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const governanceSummary = {
  records: governanceRecords,
  decisions: governanceDecisions,
  officers: governanceOfficers,
  shareholders: governanceShareholders,
}
