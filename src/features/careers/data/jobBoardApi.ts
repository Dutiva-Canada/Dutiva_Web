import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'

/**
 * Public job board API — reads active job postings through the
 * `public_job_postings` view (migration 0165, extended by 0186). The view
 * exposes only candidate-facing columns plus the employer's organization
 * name; the base table is no longer readable by anonymous callers, so
 * internal screening fields (knockout criteria, work-sample scenario) never
 * leave the server.
 */

export interface PublicJobPosting {
  id: string
  organizationId: string
  organizationName: string
  /** Stable SEO slug (`<slugified-title>-<id6>`) — the canonical URL key. */
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
  /** 'year' | 'hour' — how salaryMin/Max are expressed. */
  salaryPeriod: 'year' | 'hour'
  /** Optional per-posting employer text. */
  employerBlurb: string | null
  status: string
  postedDate: string | null
  closingDate: string | null
}

const jobPostingRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  organization_name: z.string(),
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
  status: z.string(),
  posted_date: z.string().nullable(),
  closing_date: z.string().nullable(),
})

function toPosting(row: z.infer<typeof jobPostingRowSchema>): PublicJobPosting {
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
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
    status: row.status,
    postedDate: row.posted_date,
    closingDate: row.closing_date,
  }
}

const COLUMNS =
  'id, organization_id, organization_name, slug, title, department, location, type, description, requirements, responsibilities, benefits, salary_min, salary_max, salary_period, employer_blurb, status, posted_date, closing_date'

/** List all active job postings, newest first. Public — no org scope. */
export async function listActiveJobPostings(): Promise<PublicJobPosting[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const data = await fetchAllPages((from, to) =>
    client
      .from('public_job_postings')
      .select(COLUMNS)
      .order('posted_date', { ascending: false, nullsFirst: false })
      .range(from, to),
  )
  return z.array(jobPostingRowSchema).parse(data).map(toPosting)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Get a single active posting by slug or id. Slugs are the canonical
 * public key (0186); bare uuids still resolve so links created before
 * slugs existed keep working.
 */
export async function getPublicJobPosting(slugOrId: string): Promise<PublicJobPosting | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const column = UUID_RE.test(slugOrId) ? 'id' : 'slug'
  const { data, error } = await client
    .from('public_job_postings')
    .select(COLUMNS)
    .eq(column, slugOrId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toPosting(jobPostingRowSchema.parse(data))
}
