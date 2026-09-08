import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type {
  SecurityAsset,
  SecurityAccessReview,
  SecurityIncident,
  SecurityRisk,
  SecurityVendorReview,
} from './types'

const assetRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  asset_type: z.enum(['hardware', 'software', 'cloud_service', 'domain', 'data_store']),
  owner_id: z.string().nullable(),
  status: z.enum(['active', 'decommissioned', 'at_risk']),
  criticality: z.enum(['critical', 'high', 'medium', 'low']).nullable(),
  renewal_date: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const accessReviewRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  title: z.string(),
  assigned_to: z.string().nullable(),
  reviewer_id: z.string().nullable(),
  review_due_date: z.string().nullable(),
  completed_date: z.string().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']),
  findings: z.string().nullable(),
  created_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const incidentRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  title: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  status: z.enum(['open', 'contained', 'resolved', 'closed']),
  reported_by: z.string().nullable(),
  assigned_to: z.string().nullable(),
  reported_at: z.string(),
  resolved_at: z.string().nullable(),
  summary: z.string().nullable(),
  impact: z.string().nullable(),
  remediation: z.string().nullable(),
  created_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const riskRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  title: z.string(),
  likelihood: z.enum(['high', 'medium', 'low']).nullable(),
  impact: z.enum(['high', 'medium', 'low']).nullable(),
  owner: z.string().nullable(),
  mitigation: z.string().nullable(),
  status: z.enum(['open', 'mitigated', 'accepted', 'closed']),
  created_at: z.string(),
  updated_at: z.string(),
})

const vendorReviewRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  vendor_name: z.string(),
  vendor_type: z.enum(['lawyer', 'accountant', 'insurance', 'it_security', 'other']).nullable(),
  privacy_agreement: z.boolean().nullable(),
  security_review_date: z.string().nullable(),
  next_review_date: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

function toAsset(row: z.infer<typeof assetRowSchema>): SecurityAsset {
  return { ...row }
}

function toAccessReview(row: z.infer<typeof accessReviewRowSchema>): SecurityAccessReview {
  return { ...row }
}

function toIncident(row: z.infer<typeof incidentRowSchema>): SecurityIncident {
  return { ...row }
}

function toRisk(row: z.infer<typeof riskRowSchema>): SecurityRisk {
  return { ...row }
}

function toVendorReview(row: z.infer<typeof vendorReviewRowSchema>): SecurityVendorReview {
  return { ...row }
}

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function listSecurityAssets(organizationId: string): Promise<SecurityAsset[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('security_assets')
      .select('*')
      .eq('organization_id', organizationId)
      .order('status')
      .order('name')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(assetRowSchema).parse(data)
  return parsed.map(toAsset)
}

export async function listSecurityAccessReviews(
  organizationId: string,
): Promise<SecurityAccessReview[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('security_access_reviews')
      .select('*')
      .eq('organization_id', organizationId)
      .order('review_due_date')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(accessReviewRowSchema).parse(data)
  return parsed.map(toAccessReview)
}

export async function listSecurityIncidents(organizationId: string): Promise<SecurityIncident[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('security_incidents')
      .select('*')
      .eq('organization_id', organizationId)
      .order('reported_at', { ascending: false })
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(incidentRowSchema).parse(data)
  return parsed.map(toIncident)
}

export async function listSecurityRisks(organizationId: string): Promise<SecurityRisk[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('security_risks')
      .select('*')
      .eq('organization_id', organizationId)
      .order('status')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(riskRowSchema).parse(data)
  return parsed.map(toRisk)
}

export async function listSecurityVendorReviews(
  organizationId: string,
): Promise<SecurityVendorReview[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('security_vendor_reviews')
      .select('*')
      .eq('organization_id', organizationId)
      .order('next_review_date')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(vendorReviewRowSchema).parse(data)
  return parsed.map(toVendorReview)
}
