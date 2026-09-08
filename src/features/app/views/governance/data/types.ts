export type GovernanceRecordType = 'articles' | 'bylaw' | 'resolution' | 'minutes' | 'register'
export type GovernanceRecordStatus = 'active' | 'superseded' | 'pending_review'

export interface GovernanceRecord {
  id: string
  organization_id: string
  title: string
  record_type: GovernanceRecordType
  jurisdiction: string | null
  effective_date: string | null
  review_due_date: string | null
  status: GovernanceRecordStatus
  viewer_visible: boolean
  document_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type GovernanceDecisionStatus = 'proposed' | 'adopted' | 'rescinded'

export interface GovernanceDecision {
  id: string
  organization_id: string
  title: string
  decision_date: string | null
  decided_by: string | null
  rationale: string | null
  status: GovernanceDecisionStatus
  viewer_visible: boolean
  related_record_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type GovernanceOfficerRole = 'director' | 'officer_president' | 'officer_secretary' | 'officer_treasurer'

export interface GovernanceOfficer {
  id: string
  organization_id: string
  name: string
  role: GovernanceOfficerRole
  appointed_date: string | null
  resigned_date: string | null
  contact_email: string | null
  is_active: boolean
  viewer_visible: boolean
  created_at: string
  updated_at: string
}

export interface GovernanceShareholder {
  id: string
  organization_id: string
  name: string
  share_class: string | null
  shares_issued: number | null
  issue_date: string | null
  contact_email: string | null
  viewer_visible: boolean
  created_at: string
  updated_at: string
}

export interface GovernanceSummary {
  records: GovernanceRecord[]
  decisions: GovernanceDecision[]
  officers: GovernanceOfficer[]
  shareholders: GovernanceShareholder[]
}
