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

/**
 * Thrown when the per-user daily AI rail (claim_candidate_ai_call, migration
 * 0165) refuses the call. UI maps this to the localized "try again tomorrow"
 * message instead of a generic failure.
 */
export class CandidateAiDailyLimitError extends Error {
  constructor() {
    super('daily_limit')
    this.name = 'CandidateAiDailyLimitError'
  }
}

async function callCandidateAi<T>(feature: AiFeature, payload: unknown): Promise<T> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  const { data, error } = await client.functions.invoke('candidate-ai', {
    body: { feature, payload },
  })
  if (error) {
    // Non-2xx surfaces as FunctionsHttpError carrying the raw Response.
    const status = (error as { context?: { status?: number } }).context?.status
    if (status === 429) throw new CandidateAiDailyLimitError()
    throw error
  }
  return data as T
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
