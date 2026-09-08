import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'

/**
 * Public job board API — reads active job postings from hr_job_postings.
 * No auth required: the "Public can read active job postings" RLS policy
 * (migration 0153) allows anonymous SELECT on rows where status = 'active'.
 */

export interface PublicJobPosting {
  id: string
  organizationId: string
  title: string
  department: string
  location: string
  type: string
  description: string
  requirements: string[]
  status: string
  postedDate: string | null
  closingDate: string | null
}

const jobPostingRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  title: z.string(),
  department: z.string(),
  location: z.string(),
  type: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  status: z.string(),
  posted_date: z.string().nullable(),
  closing_date: z.string().nullable(),
})

function toPosting(row: z.infer<typeof jobPostingRowSchema>): PublicJobPosting {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    department: row.department,
    location: row.location,
    type: row.type,
    description: row.description,
    requirements: row.requirements,
    status: row.status,
    postedDate: row.posted_date,
    closingDate: row.closing_date,
  }
}

const COLUMNS =
  'id, organization_id, title, department, location, type, description, requirements, status, posted_date, closing_date'

/** List all active job postings, newest first. Public — no org scope. */
export async function listActiveJobPostings(): Promise<PublicJobPosting[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const data = await fetchAllPages((from, to) =>
    client
      .from('hr_job_postings')
      .select(COLUMNS)
      .eq('status', 'active')
      .order('posted_date', { ascending: false, nullsFirst: false })
      .range(from, to),
  )
  return z.array(jobPostingRowSchema).parse(data).map(toPosting)
}

/** Get a single active job posting by id. Returns null if not found or not active. */
export async function getPublicJobPosting(id: string): Promise<PublicJobPosting | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('hr_job_postings')
    .select(COLUMNS)
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toPosting(jobPostingRowSchema.parse(data))
}
