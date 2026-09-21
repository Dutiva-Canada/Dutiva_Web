import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'

/* Candidate records — hr_candidates. */

export type ProductionCandidateStatus =
  | 'application'
  | 'basic_qualified'
  | 'evidence_qualified'
  | 'work_sample'
  | 'interview'
  | 'hired'
  | 'rejected'

export type ProductionWorkAuthorization = 'authorized' | 'needs_sponsorship' | 'unknown'

export interface ProductionCandidate {
  id: string
  organizationId: string
  name: string
  email: string
  phone?: string
  location: string
  resume: string
  linkedIn?: string
  position: string
  currentRole: string
  yearsExperience: number
  workAuthorization: ProductionWorkAuthorization
  compensationExpectations?: string
  status: ProductionCandidateStatus
  appliedDate: string
  assignedTo?: string
  /** JSON-encoded knockout criteria */
  knockoutCriteria: {
    meets_requirements: boolean
    required_qualifications: string[]
    missing_requirements: string[]
  }
}

export interface NewCandidate {
  name: string
  email: string
  phone?: string
  location: string
  resume: string
  linkedIn?: string
  position: string
  currentRole: string
  yearsExperience: number
  workAuthorization: ProductionWorkAuthorization
  compensationExpectations?: string
}

const candidateRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  location: z.string(),
  resume: z.string(),
  linkedin: z.string().nullable(),
  position: z.string(),
  current_role: z.string(),
  years_experience: z.number(),
  work_authorization: z.enum(['authorized', 'needs_sponsorship', 'unknown']),
  compensation_expectations: z.string().nullable(),
  status: z.enum([
    'application',
    'basic_qualified',
    'evidence_qualified',
    'work_sample',
    'interview',
    'hired',
    'rejected',
  ]),
  applied_date: z.string(),
  assigned_to: z.string().nullable(),
  knockout_criteria: z.object({
    meets_requirements: z.boolean(),
    required_qualifications: z.array(z.string()),
    missing_requirements: z.array(z.string()),
  }),
})

const CANDIDATE_SELECT_COLUMNS =
  'id, organization_id, name, email, phone, location, resume, linkedin, position, current_role, years_experience, work_authorization, compensation_expectations, status, applied_date, assigned_to, knockout_criteria'

function toCandidate(row: z.infer<typeof candidateRowSchema>): ProductionCandidate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    location: row.location,
    resume: row.resume,
    linkedIn: row.linkedin ?? undefined,
    position: row.position,
    currentRole: row.current_role,
    yearsExperience: row.years_experience,
    workAuthorization: row.work_authorization,
    compensationExpectations: row.compensation_expectations ?? undefined,
    status: row.status,
    appliedDate: row.applied_date,
    assignedTo: row.assigned_to ?? undefined,
    knockoutCriteria: row.knockout_criteria as ProductionCandidate['knockoutCriteria'],
  }
}

export async function listCandidates(organizationId: string): Promise<ProductionCandidate[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const data = await fetchAllPages((from, to) =>
    client
      .from('hr_candidates')
      .select(CANDIDATE_SELECT_COLUMNS)
      .eq('organization_id', organizationId)
      .order('applied_date', { ascending: false })
      .range(from, to),
  )
  return z.array(candidateRowSchema).parse(data).map(toCandidate)
}

export async function getCandidate(id: string): Promise<ProductionCandidate | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_candidates')
    .select(CANDIDATE_SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toCandidate(candidateRowSchema.parse(data))
}

export async function addCandidate(
  organizationId: string,
  fields: NewCandidate,
): Promise<ProductionCandidate> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_candidates')
    .insert({
      organization_id: organizationId,
      name: fields.name,
      email: fields.email,
      phone: fields.phone ?? null,
      location: fields.location,
      resume: fields.resume,
      linkedin: fields.linkedIn ?? null,
      position: fields.position,
      current_role: fields.currentRole,
      years_experience: fields.yearsExperience,
      work_authorization: fields.workAuthorization,
      compensation_expectations: fields.compensationExpectations ?? null,
      status: 'application',
      applied_date: new Date().toISOString(),
      knockout_criteria: {
        meets_requirements: false,
        required_qualifications: [],
        missing_requirements: [],
      },
    })
    .select(CANDIDATE_SELECT_COLUMNS)
    .single()
  if (error) throw error
  if (!data) throw new Error('Failed to create candidate')
  return toCandidate(candidateRowSchema.parse(data))
}

export async function updateCandidateStatus(
  id: string,
  status: ProductionCandidateStatus,
): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client
    .from('hr_candidates')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function assignCandidate(id: string, assignedTo: string): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client
    .from('hr_candidates')
    .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
