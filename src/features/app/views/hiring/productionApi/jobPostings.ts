import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type { TablesUpdate } from '@/lib/supabase/types'

/* ── Job Postings ─────────────────────────────────────────────────────── */

export interface ProductionJobPosting {
  id: string
  organizationId: string
  /** Public slug (generated server-side, migration 0186). */
  slug: string
  title: string
  department: string
  location: string
  type: string
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  salaryMin: number | null
  salaryMax: number | null
  salaryPeriod: 'year' | 'hour'
  employerBlurb: string | null
  knockoutCriteria: string[]
  workSampleScenario: string
  status: string
  postedDate: string | null
  closingDate: string | null
}

const jobPostingRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  slug: z.string().nullable().default(''),
  title: z.string(),
  department: z.string(),
  location: z.string(),
  type: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  responsibilities: z.array(z.string()).nullable(),
  benefits: z.array(z.string()).nullable(),
  salary_min: z.number().nullable().default(null),
  salary_max: z.number().nullable().default(null),
  salary_period: z.string().nullable().default('year'),
  employer_blurb: z.string().nullable().default(null),
  knockout_criteria: z.array(z.string()),
  work_sample_scenario: z.string(),
  status: z.string(),
  posted_date: z.string().nullable(),
  closing_date: z.string().nullable(),
})

function toJobPosting(row: z.infer<typeof jobPostingRowSchema>): ProductionJobPosting {
  return {
    id: row.id,
    organizationId: row.organization_id,
    slug: row.slug || row.id,
    title: row.title,
    department: row.department,
    location: row.location,
    type: row.type,
    description: row.description,
    requirements: row.requirements,
    responsibilities: row.responsibilities ?? [],
    benefits: row.benefits ?? [],
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    salaryPeriod: row.salary_period === 'hour' ? 'hour' : 'year',
    employerBlurb: row.employer_blurb || null,
    knockoutCriteria: row.knockout_criteria,
    workSampleScenario: row.work_sample_scenario,
    status: row.status,
    postedDate: row.posted_date,
    closingDate: row.closing_date,
  }
}

export async function listJobPostings(organizationId: string): Promise<ProductionJobPosting[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const data = await fetchAllPages((from, to) =>
    client
      .from('hr_job_postings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(from, to),
  )
  return z.array(jobPostingRowSchema).parse(data).map(toJobPosting)
}

export async function getJobPosting(id: string): Promise<ProductionJobPosting | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_job_postings')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toJobPosting(jobPostingRowSchema.parse(data))
}

export interface NewJobPosting {
  title: string
  department: string
  location: string
  type: string
  description: string
  status: string
  requirements?: string[]
  responsibilities?: string[]
  benefits?: string[]
  salaryMin?: number | null
  salaryMax?: number | null
  salaryPeriod?: 'year' | 'hour'
  employerBlurb?: string | null
  knockoutCriteria?: string[]
  workSampleScenario?: string
  closingDate?: string | null
}

export async function createJobPosting(
  organizationId: string,
  posting: NewJobPosting,
): Promise<ProductionJobPosting> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_job_postings')
    .insert({
      organization_id: organizationId,
      title: posting.title,
      department: posting.department,
      location: posting.location,
      type: posting.type,
      description: posting.description,
      status: posting.status,
      requirements: posting.requirements ?? [],
      responsibilities: posting.responsibilities ?? [],
      benefits: posting.benefits ?? [],
      salary_min: posting.salaryMin ?? null,
      salary_max: posting.salaryMax ?? null,
      salary_period: posting.salaryPeriod ?? 'year',
      employer_blurb: posting.employerBlurb ?? null,
      knockout_criteria: posting.knockoutCriteria ?? [],
      work_sample_scenario: posting.workSampleScenario ?? '',
      closing_date: posting.closingDate ?? null,
      posted_date: posting.status === 'active' ? new Date().toISOString() : null,
    })
    .select('*')
    .single()
  if (error) throw error
  if (!data) throw new Error('Failed to create job posting')
  return toJobPosting(jobPostingRowSchema.parse(data))
}

export async function updateJobPosting(
  organizationId: string,
  id: string,
  patch: Partial<NewJobPosting>,
): Promise<ProductionJobPosting | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const row: TablesUpdate<'hr_job_postings'> = { updated_at: new Date().toISOString() }
  if (patch.title !== undefined) row.title = patch.title
  if (patch.department !== undefined) row.department = patch.department
  if (patch.location !== undefined) row.location = patch.location
  if (patch.type !== undefined) row.type = patch.type
  if (patch.description !== undefined) row.description = patch.description
  if (patch.status !== undefined) row.status = patch.status
  if (patch.requirements !== undefined) row.requirements = patch.requirements
  if (patch.responsibilities !== undefined) row.responsibilities = patch.responsibilities
  if (patch.benefits !== undefined) row.benefits = patch.benefits
  if (patch.salaryMin !== undefined) row.salary_min = patch.salaryMin
  if (patch.salaryMax !== undefined) row.salary_max = patch.salaryMax
  if (patch.salaryPeriod !== undefined) row.salary_period = patch.salaryPeriod
  if (patch.employerBlurb !== undefined) row.employer_blurb = patch.employerBlurb
  if (patch.knockoutCriteria !== undefined) row.knockout_criteria = patch.knockoutCriteria
  if (patch.workSampleScenario !== undefined) row.work_sample_scenario = patch.workSampleScenario
  if (patch.closingDate !== undefined) row.closing_date = patch.closingDate
  const { data, error } = await client
    .from('hr_job_postings')
    .update(row)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select('*')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toJobPosting(jobPostingRowSchema.parse(data))
}

export async function deleteJobPosting(organizationId: string, id: string): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client
    .from('hr_job_postings')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId)
  if (error) throw error
}
