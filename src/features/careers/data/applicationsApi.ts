import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

/**
 * Candidate applications API — reads and writes the candidate_applications
 * table. RLS (migration 0153) restricts every operation to the signed-in
 * user's own applications (via candidate_profiles.user_id = auth.uid()).
 */

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

/**
 * Thrown when the database rejects an application because the candidate has
 * already applied to the posting (unique(candidate_id, job_posting_id)).
 * UI catches this to show the localized "already applied" message instead of
 * a generic failure.
 */
export class DuplicateApplicationError extends Error {
  constructor() {
    super('already_applied')
    this.name = 'DuplicateApplicationError'
  }
}

export interface CandidateApplication {
  id: string
  candidateId: string
  jobPostingId: string
  status: ApplicationStatus
  coverLetter: string | null
  submittedResume: string
  aiMatchScore: number | null
  aiSuggestions: unknown | null
  appliedAt: string
  updatedAt: string
  /** Joined job posting data (selected via the FK). */
  jobPosting?: {
    id: string
    title: string
    department: string
    location: string
    type: string
  }
}

export interface NewApplication {
  jobPostingId: string
  coverLetter?: string | null
  submittedResume: string
  aiMatchScore?: number | null
  aiSuggestions?: unknown | null
}

// View rows lose NOT NULL at the type level; the base columns are required.
const postingRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  department: z.string(),
  location: z.string(),
  type: z.string(),
})

/**
 * List the signed-in candidate's applications, newest first.
 *
 * Posting details come from `public_job_postings` in a second query rather
 * than an FK embed — since migration 0165 the base table is org-member-only,
 * so a candidate embed resolves to null. Postings that have since closed are
 * absent from the view and surface as `jobPosting: undefined`.
 */
export async function listMyApplications(): Promise<CandidateApplication[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('candidate_applications')
    .select(
      'id, candidate_id, job_posting_id, status, cover_letter, submitted_resume, ai_match_score, ai_suggestions, applied_at, updated_at',
    )
    .order('applied_at', { ascending: false })
  if (error) throw error
  const rows = data ?? []
  const postingIds = [...new Set(rows.map((row) => row.job_posting_id))]
  const postings = new Map<string, NonNullable<CandidateApplication['jobPosting']>>()
  if (postingIds.length > 0) {
    const { data: postingRows, error: postingError } = await client
      .from('public_job_postings')
      .select('id, title, department, location, type')
      .in('id', postingIds)
    if (postingError) throw postingError
    for (const posting of z.array(postingRowSchema).parse(postingRows ?? [])) {
      postings.set(posting.id, posting)
    }
  }
  return rows.map((row) =>
    toApplication({ ...row, job_posting: postings.get(row.job_posting_id) ?? null }),
  )
}

/** Check if the candidate has already applied to a specific job posting. */
export async function hasApplied(jobPostingId: string): Promise<boolean> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('candidate_applications')
    .select('id')
    .eq('job_posting_id', jobPostingId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

/** Submit a new application. Throws if already applied (unique constraint). */
export async function submitApplication(input: NewApplication): Promise<CandidateApplication> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  // Get the candidate's profile id
  const { data: profile, error: profileError } = await client
    .from('candidate_profiles')
    .select('id')
    .maybeSingle()
  if (profileError) throw profileError
  if (!profile) throw new Error('No candidate profile found')
  const { data, error } = await client
    .from('candidate_applications')
    .insert({
      candidate_id: profile.id,
      job_posting_id: input.jobPostingId,
      cover_letter: input.coverLetter ?? null,
      submitted_resume: input.submittedResume,
      ai_match_score: input.aiMatchScore ?? null,
      ai_suggestions: (input.aiSuggestions ?? null) as never,
    })
    .select(
      'id, candidate_id, job_posting_id, status, cover_letter, submitted_resume, ai_match_score, ai_suggestions, applied_at, updated_at',
    )
    .single()
  if (error) {
    // Postgres unique-violation on UNIQUE(candidate_id, job_posting_id)
    if (error.code === '23505') throw new DuplicateApplicationError()
    throw error
  }
  return toApplication(data)
}

/** Withdraw an application (set status to 'withdrawn'). */
export async function withdrawApplication(id: string): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client
    .from('candidate_applications')
    .update({ status: 'withdrawn' })
    .eq('id', id)
  if (error) throw error
}

/**
 * Permanently delete an application row. Candidate-only via RLS; distinct
 * from withdraw — this removes the record entirely.
 */
export async function deleteApplication(id: string): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { error } = await client.from('candidate_applications').delete().eq('id', id)
  if (error) throw error
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toApplication(row: any): CandidateApplication {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    jobPostingId: row.job_posting_id,
    status: row.status,
    coverLetter: row.cover_letter,
    submittedResume: row.submitted_resume,
    aiMatchScore: row.ai_match_score,
    aiSuggestions: row.ai_suggestions,
    appliedAt: row.applied_at,
    updatedAt: row.updated_at,
    jobPosting: row.job_posting
      ? {
          id: row.job_posting.id,
          title: row.job_posting.title,
          department: row.job_posting.department,
          location: row.job_posting.location,
          type: row.job_posting.type,
        }
      : undefined,
  }
}
