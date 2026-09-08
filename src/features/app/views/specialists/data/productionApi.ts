import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type { Specialist, SpecialistEngagement } from './types'

const specialistRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  specialty: z.enum(['lawyer', 'accountant', 'tax', 'insurance', 'it_security', 'hr_consultant', 'bookkeeper', 'other']),
  company: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  crm_contact_id: z.string().nullable(),
  finance_party_id: z.string().nullable(),
  workspace_access: z.boolean(),
  workspace_role: z.enum(['consultant', 'viewer']),
  granted_modules: z.array(z.string()),
  access_expires_at: z.string().nullable(),
  organization_member_id: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const engagementRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  specialist_id: z.string(),
  engagement_date: z.string().nullable(),
  engagement_type: z.enum(['call', 'email', 'meeting', 'contract', 'task']).nullable(),
  summary: z.string().nullable(),
  follow_up_date: z.string().nullable(),
  created_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

function toSpecialist(row: z.infer<typeof specialistRowSchema>): Specialist {
  return { ...row }
}

function toEngagement(row: z.infer<typeof engagementRowSchema>): SpecialistEngagement {
  return { ...row }
}

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function listSpecialists(organizationId: string): Promise<Specialist[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('specialists')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(specialistRowSchema).parse(data)
  return parsed.map(toSpecialist)
}

const specialistInsertSchema = z.object({
  organization_id: z.string(),
  name: z.string().min(1),
  specialty: z.enum(['lawyer', 'accountant', 'tax', 'insurance', 'it_security', 'hr_consultant', 'bookkeeper', 'other']),
  company: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  crm_contact_id: z.string().nullable(),
  finance_party_id: z.string().nullable(),
  workspace_access: z.boolean(),
  workspace_role: z.enum(['consultant', 'viewer']),
  granted_modules: z.array(z.string()),
  access_expires_at: z.string().nullable(),
  notes: z.string().nullable(),
})

const engagementInsertSchema = z.object({
  organization_id: z.string(),
  specialist_id: z.string(),
  engagement_date: z.string().nullable(),
  engagement_type: z.enum(['call', 'email', 'meeting', 'contract', 'task']).nullable(),
  summary: z.string().nullable(),
  follow_up_date: z.string().nullable(),
  created_by: z.string().nullable(),
})

export type SpecialistInsert = z.input<typeof specialistInsertSchema>
export type SpecialistEngagementInsert = z.input<typeof engagementInsertSchema>

export async function createSpecialist(
  organizationId: string,
  values: Omit<SpecialistInsert, 'organization_id'>,
): Promise<Specialist> {
  const client = getClient()
  const insert = specialistInsertSchema.parse({ ...values, organization_id: organizationId })
  const { data, error } = await client.from('specialists').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const parsed = specialistRowSchema.parse(data)
  return toSpecialist(parsed)
}

export async function createSpecialistEngagement(
  organizationId: string,
  values: Omit<SpecialistEngagementInsert, 'organization_id'>,
): Promise<SpecialistEngagement> {
  const client = getClient()
  const insert = engagementInsertSchema.parse({ ...values, organization_id: organizationId })
  const { data, error } = await client.from('specialist_engagements').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const parsed = engagementRowSchema.parse(data)
  return toEngagement(parsed)
}

export async function updateSpecialist(
  id: string,
  values: Omit<SpecialistInsert, 'organization_id'>,
): Promise<Specialist> {
  const client = getClient()
  const update = specialistInsertSchema.parse(values)
  const { data, error } = await client.from('specialists').update(update).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  const parsed = specialistRowSchema.parse(data)
  return toSpecialist(parsed)
}

export async function updateSpecialistEngagement(
  id: string,
  values: Omit<SpecialistEngagementInsert, 'organization_id'>,
): Promise<SpecialistEngagement> {
  const client = getClient()
  const update = engagementInsertSchema.parse(values)
  const { data, error } = await client.from('specialist_engagements').update(update).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  const parsed = engagementRowSchema.parse(data)
  return toEngagement(parsed)
}

export async function deleteSpecialist(id: string): Promise<void> {
  const client = getClient()
  const { error: engagementsError } = await client
    .from('specialist_engagements')
    .delete()
    .eq('specialist_id', id)
  if (engagementsError) throw new Error(engagementsError.message)
  const { error } = await client.from('specialists').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteSpecialistEngagement(id: string): Promise<void> {
  const client = getClient()
  const { error } = await client.from('specialist_engagements').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listSpecialistEngagements(organizationId: string): Promise<SpecialistEngagement[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('specialist_engagements')
      .select('*')
      .eq('organization_id', organizationId)
      .order('engagement_date')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(engagementRowSchema).parse(data)
  return parsed.map(toEngagement)
}
