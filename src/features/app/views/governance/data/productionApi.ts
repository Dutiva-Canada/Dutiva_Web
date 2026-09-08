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

const recordInsertSchema = z.object({
  organization_id: z.string(),
  title: z.string().min(1),
  record_type: z.enum(['articles', 'bylaw', 'resolution', 'minutes', 'register']),
  jurisdiction: z.string().nullable(),
  effective_date: z.string().nullable(),
  review_due_date: z.string().nullable(),
  status: z.enum(['active', 'superseded', 'pending_review']),
  viewer_visible: z.boolean(),
  document_id: z.string().nullable(),
  created_by: z.string().nullable(),
})

const decisionInsertSchema = z.object({
  organization_id: z.string(),
  title: z.string().min(1),
  decision_date: z.string().nullable(),
  decided_by: z.string().nullable(),
  rationale: z.string().nullable(),
  status: z.enum(['proposed', 'adopted', 'rescinded']),
  viewer_visible: z.boolean(),
  related_record_id: z.string().nullable(),
  created_by: z.string().nullable(),
})

const officerInsertSchema = z.object({
  organization_id: z.string(),
  name: z.string().min(1),
  role: z.enum(['director', 'officer_president', 'officer_secretary', 'officer_treasurer']),
  appointed_date: z.string().nullable(),
  resigned_date: z.string().nullable(),
  contact_email: z.string().nullable(),
  is_active: z.boolean(),
  viewer_visible: z.boolean(),
})

const shareholderInsertSchema = z.object({
  organization_id: z.string(),
  name: z.string().min(1),
  share_class: z.string().nullable(),
  shares_issued: z.number().nullable(),
  issue_date: z.string().nullable(),
  contact_email: z.string().nullable(),
  viewer_visible: z.boolean(),
})

export type GovernanceRecordInsert = z.input<typeof recordInsertSchema>
export type GovernanceDecisionInsert = z.input<typeof decisionInsertSchema>
export type GovernanceOfficerInsert = z.input<typeof officerInsertSchema>
export type GovernanceShareholderInsert = z.input<typeof shareholderInsertSchema>

export async function createGovernanceRecord(
  organizationId: string,
  values: Omit<GovernanceRecordInsert, 'organization_id'>,
): Promise<GovernanceRecord> {
  const client = getClient()
  const insert = recordInsertSchema.parse({ ...values, organization_id: organizationId })
  const { data, error } = await client.from('governance_records').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const parsed = recordRowSchema.parse(data)
  return toRecord(parsed)
}

export async function createGovernanceDecision(
  organizationId: string,
  values: Omit<GovernanceDecisionInsert, 'organization_id'>,
): Promise<GovernanceDecision> {
  const client = getClient()
  const insert = decisionInsertSchema.parse({ ...values, organization_id: organizationId })
  const { data, error } = await client.from('governance_decisions').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const parsed = decisionRowSchema.parse(data)
  return toDecision(parsed)
}

export async function createGovernanceOfficer(
  organizationId: string,
  values: Omit<GovernanceOfficerInsert, 'organization_id'>,
): Promise<GovernanceOfficer> {
  const client = getClient()
  const insert = officerInsertSchema.parse({ ...values, organization_id: organizationId })
  const { data, error } = await client.from('governance_officers').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const parsed = officerRowSchema.parse(data)
  return toOfficer(parsed)
}

export async function createGovernanceShareholder(
  organizationId: string,
  values: Omit<GovernanceShareholderInsert, 'organization_id'>,
): Promise<GovernanceShareholder> {
  const client = getClient()
  const insert = shareholderInsertSchema.parse({ ...values, organization_id: organizationId })
  const { data, error } = await client.from('governance_shareholders').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const parsed = shareholderRowSchema.parse(data)
  return toShareholder(parsed)
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
