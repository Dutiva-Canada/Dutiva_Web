/**
 * Pure, Deno-free logic for the candidate-ai edge function. Kept separate
 * from index.ts so it can be unit-tested under Vitest, which cannot resolve
 * the `npm:`/`jsr:` specifiers the Deno handler uses — same split as
 * _shared/aiUsage.ts and advisor-chat/responsePayload.ts.
 */

export type AiFeature = 'tailor-resume' | 'cover-letter' | 'match-score' | 'interview-prep'

export const FEATURES: readonly AiFeature[] = [
  'tailor-resume',
  'cover-letter',
  'match-score',
  'interview-prep',
]

/* System prompts — the four the candidate portal expects. The two
   structured features (match-score, interview-prep) append a JSON shape
   instruction so the model returns parseable output. */
export const SYSTEM_PROMPTS: Record<AiFeature, string> = {
  'tailor-resume':
    'You are a resume tailoring assistant. Rewrite the candidate\'s resume to ' +
    'highlight experience most relevant to the job posting. Keep all facts ' +
    'accurate — never invent experience. Return only the tailored resume text.',
  'cover-letter':
    'You are a cover letter writing assistant. Draft a professional cover ' +
    'letter based on the candidate\'s resume and the job posting. Keep it ' +
    'concise (3-4 paragraphs). Use the candidate\'s name. Never invent ' +
    'experience not in the resume.',
  'match-score':
    'You are a job match analyzer. Compare the candidate\'s resume to the job ' +
    'requirements. Return a match score from 0-100 and specific, actionable ' +
    'suggestions for improvement. Be honest — don\'t inflate the score.\n\n' +
    'Respond as JSON with this exact shape: ' +
    '{"score": <number 0-100>, "suggestions": ["<string>", ...]}. ' +
    'Return only the JSON, no other text.',
  'interview-prep':
    'You are an interview prep assistant. Generate 5-7 practice questions and ' +
    '3-5 talking points based on the job posting and the candidate\'s ' +
    'background.\n\n' +
    'Respond as JSON with this exact shape: ' +
    '{"questions": ["<string>", ...], "talkingPoints": ["<string>", ...]}. ' +
    'Return only the JSON, no other text.',
}

/* Payload shapes — mirror the client contract in
   src/features/careers/data/candidateAi.ts. */
export interface BasePayload {
  resumeText: string
  jobTitle: string
  jobDescription: string
  requirements: string[]
}

export interface CoverLetterPayload extends BasePayload {
  candidateName: string
}

export type FeaturePayload = BasePayload | CoverLetterPayload

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string }

/* --- Auth header ---------------------------------------------------------- */

export function validateAuthHeader(
  authHeader: string | null,
): ValidationResult<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, error: 'Missing bearer token' }
  }
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) return { ok: false, error: 'Missing bearer token' }
  return { ok: true, value: token }
}

/* --- Feature validation --------------------------------------------------- */

export function validateFeature(feature: unknown): ValidationResult<AiFeature> {
  if (
    feature === 'tailor-resume' ||
    feature === 'cover-letter' ||
    feature === 'match-score' ||
    feature === 'interview-prep'
  ) {
    return { ok: true, value: feature }
  }
  return { ok: false, error: `Unknown feature: ${String(feature)}` }
}

/* --- Payload validation --------------------------------------------------- */

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === 'string')
}

function validateBaseFields(p: Record<string, unknown>): string | null {
  if (!isNonEmptyString(p['resumeText'])) return 'resumeText is required'
  if (!isNonEmptyString(p['jobTitle'])) return 'jobTitle is required'
  if (!isNonEmptyString(p['jobDescription'])) return 'jobDescription is required'
  if (!isStringArray(p['requirements'])) return 'requirements must be a string array'
  return null
}

export function validatePayload(
  feature: AiFeature,
  payload: unknown,
): ValidationResult<FeaturePayload> {
  if (payload === null || typeof payload !== 'object') {
    return { ok: false, error: 'payload must be an object' }
  }
  const p = payload as Record<string, unknown>

  const baseError = validateBaseFields(p)
  if (baseError) return { ok: false, error: baseError }

  if (feature === 'cover-letter') {
    if (!isNonEmptyString(p['candidateName'])) {
      return { ok: false, error: 'candidateName is required' }
    }
  }

  return { ok: true, value: p as FeaturePayload }
}

/* --- User message building ------------------------------------------------ */

function requirementsBlock(requirements: string[]): string {
  if (requirements.length === 0) return 'No specific requirements listed.'
  return requirements.map((r) => `- ${r}`).join('\n')
}

export function buildUserMessage(feature: AiFeature, payload: FeaturePayload): string {
  const base = payload as BasePayload
  const parts: string[] = []

  if (feature === 'cover-letter') {
    const clp = payload as CoverLetterPayload
    parts.push(`Candidate Name: ${clp.candidateName}`)
    parts.push('')
  }

  parts.push(`Job Title: ${base.jobTitle}`)
  parts.push('')
  parts.push('Job Description:')
  parts.push(base.jobDescription)
  parts.push('')
  parts.push('Requirements:')
  parts.push(requirementsBlock(base.requirements))
  parts.push('')
  parts.push('Resume:')
  parts.push(base.resumeText)

  return parts.join('\n')
}

/* --- Response parsing ----------------------------------------------------- */

/**
 * Extracts JSON from a model response that may be wrapped in a markdown
 * code fence or surrounded by prose. Tries a direct parse first, then
 * looks for ```json … ``` or ``` … ``` blocks.
 */
function extractJson(content: string): unknown | null {
  const direct = tryParse(content)
  if (direct !== null) return direct

  const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
  if (fenceMatch?.[1]) {
    return tryParse(fenceMatch[1].trim())
  }
  return null
}

function tryParse(text: string): unknown | null {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function parseModelResponse(
  feature: AiFeature,
  content: string,
): ValidationResult<unknown> {
  if (feature === 'tailor-resume') {
    const text = content.trim()
    if (!text) return { ok: false, error: 'Empty response from model' }
    return { ok: true, value: { tailoredResume: text } }
  }

  if (feature === 'cover-letter') {
    const text = content.trim()
    if (!text) return { ok: false, error: 'Empty response from model' }
    return { ok: true, value: { coverLetter: text } }
  }

  if (feature === 'match-score') {
    const parsed = extractJson(content)
    if (parsed === null || typeof parsed !== 'object') {
      return { ok: false, error: 'Model did not return valid JSON' }
    }
    const obj = parsed as Record<string, unknown>
    const score = Number(obj['score'])
    if (!Number.isFinite(score)) {
      return { ok: false, error: 'score must be a number' }
    }
    const suggestions = obj['suggestions']
    if (!Array.isArray(suggestions) || !suggestions.every((s) => typeof s === 'string')) {
      return { ok: false, error: 'suggestions must be a string array' }
    }
    return {
      ok: true,
      value: {
        score: Math.max(0, Math.min(100, Math.round(score))),
        suggestions,
      },
    }
  }

  /* interview-prep */
  const parsed = extractJson(content)
  if (parsed === null || typeof parsed !== 'object') {
    return { ok: false, error: 'Model did not return valid JSON' }
  }
  const obj = parsed as Record<string, unknown>
  const questions = obj['questions']
  const talkingPoints = obj['talkingPoints']
  if (!Array.isArray(questions) || !questions.every((q) => typeof q === 'string')) {
    return { ok: false, error: 'questions must be a string array' }
  }
  if (!Array.isArray(talkingPoints) || !talkingPoints.every((t) => typeof t === 'string')) {
    return { ok: false, error: 'talkingPoints must be a string array' }
  }
  return { ok: true, value: { questions, talkingPoints } }
}
