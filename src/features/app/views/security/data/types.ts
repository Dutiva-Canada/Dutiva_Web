export type SecurityAssetType = 'hardware' | 'software' | 'cloud_service' | 'domain' | 'data_store'
export type SecurityAssetStatus = 'active' | 'decommissioned' | 'at_risk'
export type SecurityCriticality = 'critical' | 'high' | 'medium' | 'low' | null

export interface SecurityAsset {
  id: string
  organization_id: string
  name: string
  asset_type: SecurityAssetType
  owner_id: string | null
  status: SecurityAssetStatus
  criticality: SecurityCriticality
  renewal_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type SecurityAccessReviewStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'

export interface SecurityAccessReview {
  id: string
  organization_id: string
  title: string
  assigned_to: string | null
  reviewer_id: string | null
  review_due_date: string | null
  completed_date: string | null
  status: SecurityAccessReviewStatus
  findings: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low'
export type SecurityIncidentStatus = 'open' | 'contained' | 'resolved' | 'closed'

export interface SecurityIncident {
  id: string
  organization_id: string
  title: string
  severity: SecuritySeverity
  status: SecurityIncidentStatus
  reported_by: string | null
  assigned_to: string | null
  reported_at: string
  resolved_at: string | null
  summary: string | null
  impact: string | null
  remediation: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type SecurityRiskLikelihood = 'high' | 'medium' | 'low' | null
export type SecurityRiskImpact = 'high' | 'medium' | 'low' | null
export type SecurityRiskStatus = 'open' | 'mitigated' | 'accepted' | 'closed'

export interface SecurityRisk {
  id: string
  organization_id: string
  title: string
  likelihood: SecurityRiskLikelihood
  impact: SecurityRiskImpact
  owner: string | null
  mitigation: string | null
  status: SecurityRiskStatus
  created_at: string
  updated_at: string
}

export type SecurityVendorType = 'lawyer' | 'accountant' | 'insurance' | 'it_security' | 'other' | null

export interface SecurityVendorReview {
  id: string
  organization_id: string
  vendor_name: string
  vendor_type: SecurityVendorType
  privacy_agreement: boolean | null
  security_review_date: string | null
  next_review_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
