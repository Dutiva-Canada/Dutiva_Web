import type {
  OperationsProject,
  OperationsVendor,
  OperationsQualityCheck,
  OperationsTechnology,
  OperationsLogistics,
} from './types'

const DEMO_ORG_ID = 'org-northgate-demo'

export const operationsProjects: OperationsProject[] = [
  {
    id: 'op-1',
    organization_id: DEMO_ORG_ID,
    title: 'Office relocation — Q1 2026',
    owner_id: null,
    status: 'active',
    start_date: '2025-09-01',
    target_date: '2026-02-28',
    description: 'Move to the new building.',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const operationsVendors: OperationsVendor[] = [
  {
    id: 'ov-1',
    organization_id: DEMO_ORG_ID,
    finance_party_id: null,
    name: 'Staples Business Advantage',
    vendor_type: 'supplier',
    status: 'active',
    contract_expiry: '2025-12-31',
    notes: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const operationsQualityChecks: OperationsQualityCheck[] = [
  {
    id: 'oq-1',
    organization_id: DEMO_ORG_ID,
    title: 'Monthly invoice review',
    assigned_to: null,
    reviewer_id: null,
    checklist: [],
    due_date: '2025-10-05',
    completed_date: null,
    status: 'pending',
    non_conformance: null,
    created_by: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const operationsTechnology: OperationsTechnology[] = [
  {
    id: 'ot-1',
    organization_id: DEMO_ORG_ID,
    name: 'CRM Sync pipeline',
    system_type: 'integration',
    owner_id: null,
    status: 'active',
    renewal_date: null,
    integration_notes: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const operationsLogistics: OperationsLogistics[] = [
  {
    id: 'ol-1',
    organization_id: DEMO_ORG_ID,
    title: 'New workstation shipment',
    owner_id: null,
    assigned_to: null,
    status: 'in_transit',
    expected_date: '2025-10-02',
    delivered_date: null,
    notes: null,
    created_by: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const operationsSummary = {
  projects: operationsProjects,
  vendors: operationsVendors,
  qualityChecks: operationsQualityChecks,
  technology: operationsTechnology,
  logistics: operationsLogistics,
}
