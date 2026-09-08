import { supabase } from '@/lib/supabaseClient'

/**
 * Candidate profile API — reads and writes the candidate_profiles table.
 * RLS (migration 0153) restricts every operation to the signed-in user's
 * own row (user_id = auth.uid()).
 */

export type CandidateWorkAuthorization = 'authorized' | 'needs_sponsorship' | 'unknown'

export interface CandidateProfile {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  location: string
  headline: string
  summary: string
  resumeText: string
  coverLetter: string | null
  linkedin: string | null
  website: string | null
  yearsExperience: number | null
  workAuthorization: CandidateWorkAuthorization
  currentRole: string | null
  createdAt: string
  updatedAt: string
}

export interface CandidateProfileInput {
  name: string
  email: string
  phone?: string | null
  location: string
  headline: string
  summary: string
  resumeText: string
  coverLetter?: string | null
  linkedin?: string | null
  website?: string | null
  yearsExperience?: number | null
  workAuthorization: CandidateWorkAuthorization
  currentRole?: string | null
}

/** Get the signed-in user's candidate profile, or null if not yet created. */
export async function getMyCandidateProfile(): Promise<CandidateProfile | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client
    .from('candidate_profiles')
    .select('*')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toProfile(data)
}

/** Create a new candidate profile for the signed-in user. */
export async function createCandidateProfile(
  input: CandidateProfileInput,
): Promise<CandidateProfile> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user) throw new Error('Not signed in')
  const { data, error } = await client
    .from('candidate_profiles')
    .insert({
      user_id: userData.user.id,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      location: input.location,
      headline: input.headline,
      summary: input.summary,
      resume_text: input.resumeText,
      cover_letter: input.coverLetter ?? null,
      linkedin: input.linkedin ?? null,
      website: input.website ?? null,
      years_experience: input.yearsExperience ?? null,
      work_authorization: input.workAuthorization,
      current_role: input.currentRole ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return toProfile(data)
}

/** Update the signed-in user's candidate profile. */
export async function updateCandidateProfile(
  patch: Partial<CandidateProfileInput>,
): Promise<CandidateProfile | null> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const row: Record<string, string | number | null> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.email !== undefined) row.email = patch.email
  if (patch.phone !== undefined) row.phone = patch.phone
  if (patch.location !== undefined) row.location = patch.location
  if (patch.headline !== undefined) row.headline = patch.headline
  if (patch.summary !== undefined) row.summary = patch.summary
  if (patch.resumeText !== undefined) row.resume_text = patch.resumeText
  if (patch.coverLetter !== undefined) row.cover_letter = patch.coverLetter
  if (patch.linkedin !== undefined) row.linkedin = patch.linkedin
  if (patch.website !== undefined) row.website = patch.website
  if (patch.yearsExperience !== undefined) row.years_experience = patch.yearsExperience
  if (patch.workAuthorization !== undefined) row.work_authorization = patch.workAuthorization
  if (patch.currentRole !== undefined) row.current_role = patch.currentRole
  const { data, error } = await client
    .from('candidate_profiles')
    .update(row as never)
    .select('*')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toProfile(data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProfile(row: any): CandidateProfile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    headline: row.headline,
    summary: row.summary,
    resumeText: row.resume_text,
    coverLetter: row.cover_letter,
    linkedin: row.linkedin,
    website: row.website,
    yearsExperience: row.years_experience,
    workAuthorization: row.work_authorization,
    currentRole: row.current_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
