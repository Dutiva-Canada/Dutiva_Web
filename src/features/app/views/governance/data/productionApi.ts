import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type {
  GovernanceRecord,
  GovernanceDecision,
  GovernanceOfficer,
  GovernanceShareholder,
} from './types'

/**
 * Real persistence for the Governance module (production mode). Reads are
 * org-scoped by RLS; admin writes are enforced at the database. Errors throw.
 */

const recordRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  title: z.string(),
  record_type: z.enum(['articles', 'bylaw', 'resolution', 'minutes', 'register']),
  jurisdiction: z.string().nullable(),
  effective_date: z.string().nullable(),
  review_due_date: z.string().nullable(),
  status: z.enum(['active', 'superseded', 'pending_review']),
  viewer_visible: z.boolean(),
  document_id: z.string().nullable(),
  created_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const decisionRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  title: z.string(),
  decision_date: z.string().nullable(),
  decided_by: z.string().nullable(),
  rationale: z.string().nullable(),
  status: z.enum(['proposed', 'adopted', 'rescinded']),
  viewer_visible: z.boolean(),
  related_record_id: z.string().nullable(),
  created_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const officerRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  role: z.enum(['director', 'officer_president', 'officer_secretary', 'officer_treasurer']),
  appointed_date: z.string().nullable(),
  resigned_date: z.string().nullable(),
  contact_email: z.string().nullable(),
  is_active: z.boolean(),
  viewer_visible: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

const shareholderRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  share_class: z.string().nullable(),
  shares_issued: z.number().nullable(),
  issue_date: z.string().nullable(),
  contact_email: z.string().nullable(),
  viewer_visible: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

function toRecord(row: z.infer<typeof recordRowSchema>): GovernanceRecord {
  return { ...row }
}

function toDecision(row: z.infer<typeof decisionRowSchema>): GovernanceDecision {
  return { ...row }
}

function toOfficer(row: z.infer<typeof officerRowSchema>): GovernanceOfficer {
  return { ...row }
}

function toShareholder(row: z.infer<typeof shareholderRowSchema>): GovernanceShareholder {
  return { ...row }
}

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function listGovernanceRecords(organizationId: string): Promise<GovernanceRecord[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('governance_records')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(recordRowSchema).parse(data)
  return parsed.map(toRecord)
}

export async function listGovernanceDecisions(organizationId: string): Promise<GovernanceDecision[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('governance_decisions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('decision_date')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(decisionRowSchema).parse(data)
  return parsed.map(toDecision)
}

export async function listGovernanceOfficers(organizationId: string): Promise<GovernanceOfficer[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('governance_officers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_active', { ascending: false })
      .order('name')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(officerRowSchema).parse(data)
  return parsed.map(toOfficer)
}

export async function listGovernanceShareholders(
  organizationId: string,
): Promise<GovernanceShareholder[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('governance_shareholders')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(shareholderRowSchema).parse(data)
  return parsed.map(toShareholder)
}
