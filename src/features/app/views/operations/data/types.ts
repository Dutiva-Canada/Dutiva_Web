export type OperationsProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'

export interface OperationsProject {
  id: string
  organization_id: string
  title: string
  owner_id: string | null
  status: OperationsProjectStatus
  start_date: string | null
  target_date: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export type OperationsVendorType = 'supplier' | 'logistics' | 'technology' | 'professional_service' | null
export type OperationsVendorStatus = 'active' | 'inactive' | 'under_review'

export interface OperationsVendor {
  id: string
  organization_id: string
  finance_party_id: string | null
  name: string
  vendor_type: OperationsVendorType
  status: OperationsVendorStatus
  contract_expiry: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type OperationsQualityStatus = 'pending' | 'passed' | 'failed' | 'overdue'

export interface OperationsQualityCheck {
  id: string
  organization_id: string
  title: string
  assigned_to: string | null
  reviewer_id: string | null
  checklist: unknown
  due_date: string | null
  completed_date: string | null
  status: OperationsQualityStatus
  non_conformance: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type OperationsTechnologyType = 'internal' | 'customer_facing' | 'integration' | 'infrastructure' | null
export type OperationsTechnologyStatus = 'active' | 'deprecated' | 'planned'

export interface OperationsTechnology {
  id: string
  organization_id: string
  name: string
  system_type: OperationsTechnologyType
  owner_id: string | null
  status: OperationsTechnologyStatus
  renewal_date: string | null
  integration_notes: string | null
  created_at: string
  updated_at: string
}

export type OperationsLogisticsStatus = 'in_transit' | 'delivered' | 'delayed' | 'returned'

export interface OperationsLogistics {
  id: string
  organization_id: string
  title: string
  owner_id: string | null
  assigned_to: string | null
  status: OperationsLogisticsStatus
  expected_date: string | null
  delivered_date: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}
