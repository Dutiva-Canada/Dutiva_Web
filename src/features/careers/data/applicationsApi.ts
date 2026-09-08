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

/** List the signed-in candidate's applications, newest first. */
export async function listMyApplications(): Promise<CandidateApplication[]> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('candidate_applications')
    .select(
      'id, candidate_id, job_posting_id, status, cover_letter, submitted_resume, ai_match_score, ai_suggestions, applied_at, updated_at, job_posting_id(id, title, department, location, type)',
    )
    .order('applied_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toApplication)
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
  if (error) throw error
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
    jobPosting: row.job_posting_id
      ? {
          id: row.job_posting_id.id,
          title: row.job_posting_id.title,
          department: row.job_posting_id.department,
          location: row.job_posting_id.location,
          type: row.job_posting_id.type,
        }
      : undefined,
  }
}
