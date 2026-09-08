import { supabase } from '@/lib/supabaseClient'

/**
 * Candidate AI API — calls the `candidate-ai` edge function for optional
 * AI features (resume tailoring, cover letter generation, match scoring,
 * interview prep). All features are optional; the candidate can apply
 * without any AI assistance.
 */

export interface TailorResumeRequest {
  resumeText: string
  jobTitle: string
  jobDescription: string
  requirements: string[]
}

export interface TailorResumeResult {
  tailoredResume: string
}

export interface CoverLetterRequest {
  resumeText: string
  jobTitle: string
  jobDescription: string
  requirements: string[]
  candidateName: string
}

export interface CoverLetterResult {
  coverLetter: string
}

export interface MatchScoreRequest {
  resumeText: string
  jobTitle: string
  jobDescription: string
  requirements: string[]
}

export interface MatchScoreResult {
  score: number
  suggestions: string[]
}

export interface InterviewPrepRequest {
  jobTitle: string
  jobDescription: string
  requirements: string[]
  resumeText: string
}

export interface InterviewPrepResult {
  questions: string[]
  talkingPoints: string[]
}

type AiFeature = 'tailor-resume' | 'cover-letter' | 'match-score' | 'interview-prep'

async function callCandidateAi<T>(feature: AiFeature, payload: unknown): Promise<T> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data: sessionData } = await client.auth.getSession()
  const session = sessionData.session
  if (!session) throw new Error('Not signed in')
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/candidate-ai`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      },
      body: JSON.stringify({ feature, payload }),
    },
  )
  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`)
  }
  return (await response.json()) as T
}

export async function tailorResume(req: TailorResumeRequest): Promise<TailorResumeResult> {
  return callCandidateAi('tailor-resume', req)
}

export async function generateCoverLetter(req: CoverLetterRequest): Promise<CoverLetterResult> {
  return callCandidateAi('cover-letter', req)
}

export async function scoreMatch(req: MatchScoreRequest): Promise<MatchScoreResult> {
  return callCandidateAi('match-score', req)
}

export async function interviewPrep(req: InterviewPrepRequest): Promise<InterviewPrepResult> {
  return callCandidateAi('interview-prep', req)
}
