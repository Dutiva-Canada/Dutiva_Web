export type SpecialistSpecialty =
  | 'lawyer'
  | 'accountant'
  | 'tax'
  | 'insurance'
  | 'it_security'
  | 'hr_consultant'
  | 'bookkeeper'
  | 'other'

export type SpecialistWorkspaceRole = 'consultant' | 'viewer'

export interface Specialist {
  id: string
  organization_id: string
  name: string
  specialty: SpecialistSpecialty
  company: string | null
  email: string | null
  phone: string | null
  crm_contact_id: string | null
  finance_party_id: string | null
  workspace_access: boolean
  workspace_role: SpecialistWorkspaceRole
  granted_modules: string[]
  access_expires_at: string | null
  organization_member_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type SpecialistEngagementType = 'call' | 'email' | 'meeting' | 'contract' | 'task' | null

export interface SpecialistEngagement {
  id: string
  organization_id: string
  specialist_id: string
  engagement_date: string | null
  engagement_type: SpecialistEngagementType
  summary: string | null
  follow_up_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}
