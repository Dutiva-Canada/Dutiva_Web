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
    "You are a resume tailoring assistant. Rewrite the candidate's resume to " +
    'highlight experience most relevant to the job posting. Keep all facts ' +
    'accurate — never invent experience. Return only the tailored resume text.',
  'cover-letter':
    'You are a cover letter writing assistant. Draft a professional cover ' +
    "letter based on the candidate's resume and the job posting. Keep it " +
    "concise (3-4 paragraphs). Use the candidate's name. Never invent " +
    'experience not in the resume.',
  'match-score':
    "You are a job match analyzer. Compare the candidate's resume to the job " +
    'requirements. Return a match score from 0-100 and specific, actionable ' +
    "suggestions for improvement. Be honest — don't inflate the score.\n\n" +
    'Respond as JSON with this exact shape: ' +
    '{"score": <number 0-100>, "suggestions": ["<string>", ...]}. ' +
    'Return only the JSON, no other text.',
  'interview-prep':
    'You are an interview prep assistant. Generate 5-7 practice questions and ' +
    "3-5 talking points based on the job posting and the candidate's " +
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

export function validateAuthHeader(authHeader: string | null): ValidationResult<string> {
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

  return { ok: true, value: p as unknown as FeaturePayload }
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

export function parseModelResponse(feature: AiFeature, content: string): ValidationResult<unknown> {
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

/* --- Chat — Claire, the search coach -------------------------------------- */

/* What she sees — loaded server-side from the caller's own rows. The same
   slices the portal pages show: profile, submitted applications (with the
   posting's title/org joined through public_job_postings), the agent's
   discovered jobs, and the agent's current settings. */
export interface CandidateChatContext {
  profile: {
    name: string
    headline: string
    current_role: string | null
    summary: string
    location: string
    years_experience: number | null
    work_authorization: string
    resume_text: string
  } | null
  applications: {
    title: string | null
    organization: string | null
    location: string | null
    status: string
    match_score: number | null
    applied_at: string
  }[]
  discoveredJobs: {
    title: string
    company: string
    location: string
    match_score: number | null
    status: string
  }[]
  agent: {
    enabled: boolean
    autonomy: string
    keywords: string[]
    locations: string[]
  } | null
}

function lines(items: string[]): string {
  return items.length > 0 ? items.join('\n') : '(none)'
}

/** The "what I can see" block — plain text, compact, sized for the prompt. */
export function buildChatContextBlock(ctx: CandidateChatContext): string {
  const resumeExcerpt = ctx.profile?.resume_text.trim().slice(0, 1500) ?? ''
  return [
    `Profile: ${
      ctx.profile
        ? `${ctx.profile.name} — "${ctx.profile.headline}"` +
          (ctx.profile.current_role ? `, currently ${ctx.profile.current_role}` : '') +
          `, ${ctx.profile.location}` +
          (ctx.profile.years_experience !== null
            ? `, ${ctx.profile.years_experience} yrs experience`
            : '') +
          `, work authorization: ${ctx.profile.work_authorization}` +
          (ctx.profile.summary ? `. Summary: ${ctx.profile.summary.slice(0, 300)}` : '')
        : '(no profile saved yet)'
    }`,
    `Applications (${ctx.applications.length}):`,
    lines(
      ctx.applications.map(
        (a) =>
          `"${a.title ?? 'posting no longer listed'}"` +
          (a.organization ? ` at ${a.organization}` : '') +
          ` — ${a.status}` +
          (a.match_score !== null ? `, match ${a.match_score}` : '') +
          `, applied ${a.applied_at.slice(0, 10)}`,
      ),
    ),
    `Agent-discovered jobs (${ctx.discoveredJobs.length}):`,
    lines(
      ctx.discoveredJobs.map(
        (j) =>
          `"${j.title}" at ${j.company} (${j.location})` +
          (j.match_score !== null ? ` — match ${j.match_score}` : '') +
          ` — ${j.status}`,
      ),
    ),
    `Search agent: ${
      ctx.agent
        ? ctx.agent.enabled
          ? `on, ${ctx.agent.autonomy === 'auto_submit' ? 'auto-submits' : 'review first'} — keywords: ${ctx.agent.keywords.join(', ') || '(none)'}; locations: ${ctx.agent.locations.join(', ') || '(any)'}`
          : 'off'
        : '(never configured)'
    }`,
    resumeExcerpt ? `Resume excerpt:\n${resumeExcerpt}` : 'Resume: (none saved yet)',
  ].join('\n')
}

/* The coaching register is tiered on the caller's auth email — decided in
   index.ts via isInternalDutivaAccount. External accounts get honest reads
   and next steps but no personal verdicts; a verified @dutiva.ca sign-in
   gets a coach who owns the call. Everything else — software-not-a-person,
   no invented facts, no promised outcomes, apply stays theirs — is shared. */
export function candidateChatPrompt(
  ctx: CandidateChatContext,
  lang: 'en' | 'fr',
  opts?: { advice?: boolean },
): { role: 'system'; content: string } {
  return {
    role: 'system',
    content: [
      'You are Claire — the search coach inside Dutiva\'s candidate portal, a job-search companion for someone working on their next role. You answer from the candidate\'s own portal data below — profile, applications, and the jobs their search agent found. If the data cannot answer the question, say so plainly.',
      'How Claire works: short, useful replies — what the data shows, then the next sensible step. She never inflates a match or a candidate\'s chances, never promises an interview or an offer, and never invents a posting, an employer, a salary, or a fact that is not below. She is software, not a person and not a recruiter — if the person seems to want a human career professional, say so plainly.',
      'You MAY teach — a coach explains the game. Explain how hiring reads (what recruiters scan for, how ATS screening works, what a cover letter is for), describe common approaches in the abstract (when to follow up, how to tailor a resume), and give generic examples clearly framed as examples — never invented "real" cases.',
      opts?.advice
        ? 'INTERNAL STAFF ACCOUNT (@dutiva.ca) — advise like a coach who owns the call: frank reads on their resume and application materials, what to fix first, whether a posting is worth the shot, what the search agent should be pointed at — say it plainly, with the reasoning. Still never promise outcomes or invent facts, and applying is always theirs — point at the apply page.'
        : 'Asked for a verdict on THEIR OWN chances or materials — keep it general: honest observations about the data, then point them at the AI tools for a scored read or a tailored draft. A clear-eyed read is welcome; a promised outcome is not.',
      'What Claire never does: she cannot edit the profile, apply to a job, or change agent settings — the Profile page, a job\'s apply page, and the agent card do that; point, don\'t do. And she never discourages someone from applying — name what the data shows, let them decide.',
      'Answer with ONE JSON object: {"reply":"<your reply>"} — the reply is plain text; short paragraphs or a short list when it genuinely helps. Never include anything else in the JSON.',
      `Today is ${new Date().toISOString().slice(0, 10)}.`,
      lang === 'fr' ? 'Write in Canadian French.' : 'Write in Canadian English.',
      '',
      buildChatContextBlock(ctx),
    ].join('\n'),
  }
}

/** Strict JSON reply. Anything unparseable or reply-less returns null —
    the caller surfaces it as a temporary failure, never a canned answer. */
export function parseCandidateChatReply(raw: string | null | undefined): string | null {
  if (!raw) return null
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as { reply?: unknown }
    const reply = typeof obj.reply === 'string' ? obj.reply.trim() : ''
    return reply || null
  } catch {
    return null
  }
}
