import type {
  SecurityAsset,
  SecurityAccessReview,
  SecurityIncident,
  SecurityRisk,
  SecurityVendorReview,
} from './types'

const DEMO_ORG_ID = 'org-northgate-demo'

export const securityAssets: SecurityAsset[] = [
  {
    id: 'sa-1',
    organization_id: DEMO_ORG_ID,
    name: 'Laptop fleet — Dell Latitude',
    asset_type: 'hardware',
    owner_id: null,
    status: 'active',
    criticality: 'high',
    renewal_date: null,
    notes: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'sa-2',
    organization_id: DEMO_ORG_ID,
    name: 'Google Workspace',
    asset_type: 'cloud_service',
    owner_id: null,
    status: 'active',
    criticality: 'critical',
    renewal_date: '2025-06-30',
    notes: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const securityAccessReviews: SecurityAccessReview[] = [
  {
    id: 'sar-1',
    organization_id: DEMO_ORG_ID,
    title: 'Q3 admin access review',
    assigned_to: null,
    reviewer_id: null,
    review_due_date: '2025-10-15',
    completed_date: null,
    status: 'pending',
    findings: null,
    created_by: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const securityIncidents: SecurityIncident[] = [
  {
    id: 'si-1',
    organization_id: DEMO_ORG_ID,
    title: 'Suspicious login from unrecognized IP',
    severity: 'medium',
    status: 'contained',
    reported_by: null,
    assigned_to: null,
    reported_at: '2025-08-02T09:00:00Z',
    resolved_at: null,
    summary: 'Login flagged by identity provider.',
    impact: 'No data exposure.',
    remediation: 'Password reset and MFA review.',
    created_by: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const securityRisks: SecurityRisk[] = [
  {
    id: 'sr-1',
    organization_id: DEMO_ORG_ID,
    title: 'Key vendor has no signed privacy agreement',
    likelihood: 'high',
    impact: 'medium',
    owner: null,
    mitigation: 'Request updated DPA.',
    status: 'open',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const securityVendorReviews: SecurityVendorReview[] = [
  {
    id: 'svr-1',
    organization_id: DEMO_ORG_ID,
    vendor_name: 'IT Guardians Inc.',
    vendor_type: 'it_security',
    privacy_agreement: true,
    security_review_date: '2024-11-20',
    next_review_date: '2025-11-20',
    notes: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const securitySummary = {
  assets: securityAssets,
  accessReviews: securityAccessReviews,
  incidents: securityIncidents,
  risks: securityRisks,
  vendorReviews: securityVendorReviews,
}
