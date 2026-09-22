import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type { ApplicationStatus } from '@/features/careers/data/applicationsApi'

/* ── Portal applications — submissions from the public candidate portal ──
 *
 * Candidates apply on /careers into candidate_applications (migration 0153).
 * RLS (0165) lets org members read applications to their own postings and
 * the attached candidate profile, and update the pipeline status — all other
 * columns are immutable by trigger (guard_candidate_application_update). */

export interface PortalApplication {
  id: string
  status: ApplicationStatus
  appliedAt: string
  coverLetter: string | null
  submittedResume: string
  aiMatchScore: number | null
  aiSuggestions: unknown | null
  jobPostingId: string | null
  jobPostingTitle: string | null
  candidateName: string | null
  candidateEmail: string | null
  candidateHeadline: string | null
  candidateLocation: string | null
}

const rowSchema = z.object({
  id: z.string(),
  status: z.string(),
  cover_letter: z.string().nullable(),
  submitted_resume: z.string(),
  ai_match_score: z.number().nullable(),
  ai_suggestions: z.unknown().nullable(),
  applied_at: z.string(),
  job_posting: z.object({ id: z.string(), title: z.string() }).nullable(),
  candidate: z
    .object({
      name: z.string(),
      email: z.string().nullable(),
      headline: z.string(),
      location: z.string(),
    })
    .nullable(),
})

const COLUMNS =
  'id, status, cover_letter, submitted_resume, ai_match_score, ai_suggestions, applied_at, job_posting:job_posting_id(id, title), candidate:candidate_id(name, email, headline, location)'

function toApplication(row: z.infer<typeof rowSchema>): PortalApplication {
  return {
    id: row.id,
    status: row.status as ApplicationStatus,
    appliedAt: row.applied_at,
    coverLetter: row.cover_letter,
    submittedResume: row.submitted_resume,
    aiMatchScore: row.ai_match_score,
    aiSuggestions: row.ai_suggestions,
    jobPostingId: row.job_posting?.id ?? null,
    jobPostingTitle: row.job_posting?.title ?? null,
    candidateName: row.candidate?.name ?? null,
    candidateEmail: row.candidate?.email ?? null,
    candidateHeadline: row.candidate?.headline ?? null,
    candidateLocation: row.candidate?.location ?? null,
  }
}

/**
 * List portal applications to this organization's postings, newest first.
 * Scoped twice — by the explicit posting-id list and by RLS — so an org
 * never sees another org's applicants.
 */
export async function listPortalApplications(organizationId: string): Promise<PortalApplication[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')

  const { data: postings, error: postingsError } = await client
    .from('hr_job_postings')
    .select('id')
    .eq('organization_id', organizationId)
  if (postingsError) throw postingsError
  const postingIds = (postings ?? []).map((p) => p.id as string)
  if (postingIds.length === 0) return []

  const data = await fetchAllPages((from, to) =>
    client
      .from('candidate_applications')
      .select(COLUMNS)
      .in('job_posting_id', postingIds)
      .order('applied_at', { ascending: false })
      .order('id')
      .range(from, to),
  )
  return z.array(rowSchema).parse(data).map(toApplication)
}

/**
 * Move a portal application to a new pipeline status. Only `status` can be
 * written — the guard trigger rejects edits to every other column.
 */
export async function updatePortalApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client.from('candidate_applications').update({ status }).eq('id', id)
  if (error) throw error
}
