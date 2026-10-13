/**
 * Pure, Deno-free logic for the candidate-ai edge function. Kept separate
 * from index.ts so it can be unit-tested under Vitest, which cannot resolve
 * the `npm:`/`jsr:` specifiers the Deno handler uses — same split as
 * _shared/aiUsage.ts and advisor-chat/responsePayload.ts.
 */
import { detectHonestClaims, detectPatterns } from '../_shared/adviceScreen.ts'

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
    /** Posting id — used to build the internal apply-page source link. */
    postingId: string | null
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
    url: string
    apply_url: string | null
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
      'How Claire works: replies sized to the ask — quick questions stay tight, a coaching question earns a fuller read. What the data shows first, then the next sensible step. She never inflates a match or a candidate\'s chances, never promises an interview or an offer, and never invents a posting, an employer, a salary, or a fact that is not below. She is software, not a person and not a recruiter — if the person seems to want a human career professional, say so plainly.',
      'You MAY teach — a coach explains the game. Explain how hiring reads (what recruiters scan for, how ATS screening works, what a cover letter is for), describe common approaches in the abstract (when to follow up, how to tailor a resume), and give generic examples clearly framed as examples — never invented "real" cases.',
      opts?.advice
        ? 'INTERNAL STAFF ACCOUNT (@dutiva.ca) — advise like a coach who owns the call: frank reads on their resume and application materials, what to fix first, whether a posting is worth the shot, what the search agent should be pointed at — say it plainly, with the reasoning. Still never promise outcomes or invent facts, and applying is always theirs — point at the apply page.'
        : 'Asked for a verdict on THEIR OWN chances or materials — keep it general: honest observations about the data, then point them at the AI tools for a scored read or a tailored draft. A clear-eyed read is welcome; a promised outcome is not.',
      'What Claire never does: she cannot edit the profile, apply to a job, or change agent settings — the Profile page, a job\'s apply page, and the agent card do that; point, don\'t do. And she never discourages someone from applying — name what the data shows, let them decide.',
      'Answer with ONE JSON object: {"reply":"<your reply>","suggests":["<prompt>"]} — the reply is plain text with light markdown allowed; a short paragraph or two for quick questions, and fuller structure when they ask for coaching — how to prep for a posting, weighing options, a plan: short paragraphs, a small list, bold labels where they help scan. "suggests" holds up to 3 short things the person might ask or tell you next — each under 8 words, same language as the reply; they are asks, not commands — the chip sends a message, it does not act. Omit the field or send an empty array when the exchange is clearly finished. Never include anything else in the JSON.',
      'One exception before you answer: if the question turns on what a company or the market has been doing lately — a target employer in the news, layoffs or funding at a place they are eyeing, an industry trend — you may answer {"reply":"","search":"<one web query>"} and the live search results come back to you. Use it at most once per turn; if the results are thin or off-topic, say so rather than inventing news.',
      `Today is ${new Date().toISOString().slice(0, 10)}.`,
      lang === 'fr' ? 'Write in Canadian French.' : 'Write in Canadian English.',
      '',
      buildChatContextBlock(ctx),
    ].join('\n'),
  }
}

/** Sources the reply grounded on — postings the agent found carry real
    external links; applications point at the portal's own apply page. A job
    counts when the reply names its title; the model never emits URLs, so a
    link can only point at a row that exists. */
export function candidateChatSources(
  ctx: CandidateChatContext,
  reply: string,
): { label: string; url?: string }[] {
  const sources: { label: string; url?: string }[] = []
  const seen = new Set<string>()
  const push = (label: string, url?: string) => {
    if (seen.has(label)) return
    seen.add(label)
    sources.push(url ? { label, url } : { label })
  }
  for (const j of ctx.discoveredJobs) {
    if (j.title.length > 8 && reply.includes(j.title)) {
      push(`"${j.title}" at ${j.company}`, j.url || j.apply_url || undefined)
    }
  }
  for (const a of ctx.applications) {
    if (a.title && a.title.length > 8 && reply.includes(a.title)) {
      push(
        `"${a.title}"${a.organization ? ` at ${a.organization}` : ''} — your application`,
        a.postingId ? `/careers/portal/jobs/${a.postingId}/apply` : undefined,
      )
    }
  }
  return sources.slice(0, 8)
}

/** Strict JSON reply. Anything unparseable or reply-less returns null —
    the caller surfaces it as a temporary failure, never a canned answer.
    `suggests` carries up to 3 short follow-up chips — they ride the reply
    payload, never the stored turn. */
export function parseCandidateChatReply(
  raw: string | null | undefined,
): { reply: string; suggests: string[]; search: string | null } | null {
  if (!raw) return null
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as {
      reply?: unknown
      suggests?: unknown
      search?: unknown
    }
    const reply = typeof obj.reply === 'string' ? obj.reply.trim() : ''
    /* `search` is the one-hop escape — a live-web query the server runs;
       an empty reply is only legal while one is outstanding. */
    const search =
      typeof obj.search === 'string' && obj.search.trim() !== ''
        ? obj.search.trim().replace(/\s+/g, ' ').slice(0, 160)
        : null
    if (!reply && !search) return null
    /* Follow-up chips — kept only as clean short strings; malformed or
       oversized entries drop out rather than fail the whole reply. */
    const suggests = Array.isArray(obj.suggests)
      ? obj.suggests
          .filter((s): s is string => typeof s === 'string')
          .map((s) => s.trim().slice(0, 120))
          .filter((s) => s !== '')
          .slice(0, 3)
      : []
    return { reply, suggests, search }
  } catch {
    return null
  }
}

/* ── Output screens — the deterministic backstop behind the prompt ─────────
   Two different boundaries are enforced here:

   1. The universal line binds EVERY tier — Claire never promises an
      outcome ("you'll get the interview") and never discourages an
      application ("don't bother", "skip this one"), not even for the
      internal coach who owns the call — the apply decision is always
      the candidate's.
   2. The verdict line binds only the external tier — external gets
      honest observations about the data and generic coaching, never a
      personal verdict on their chances or materials ("your chances are
      slim", "you're a strong fit"). Observations ("your resume shows
      five years in logistics") deliberately stay clean — flagging
      suppresses the reply, so a false positive costs a good answer.

   Internal @dutiva.ca replies run only the universal table — frank
   reads are in scope there; promised outcomes and discouragement are
   not. */
const UNIVERSAL_PATTERNS: Record<'en' | 'fr', RegExp[]> = {
  en: [
    /\byou(?:'ll|\s+will|\s+are\s+going\s+to)\s+(?:(?:get|land|secure|win|earn)\s+(?:the\s+|an?\s+|that\s+)?(?:interview|offer|job|role|callback|call|position|gig)|be\s+(?:offered|hired|called|picked|chosen|selected)|hear\s+back|receive\s+an?\s+(?:offer|interview|call)|ace|crush|nail)(?!\w)/i,
    /\b(?:this|that|it|your\s+(?:resume|application|profile|cover\s+letter|cv))\s+(?:will|would|is\s+going\s+to|'ll)\s+(?:get|land|earn|secure|win)\s+(?:you\s+)?(?:an?\s+|the\s+)?(?:interview|offer|job|role|callback|call)(?!\w)/i,
    /\b(?:don't|do\s+not|you\s+shouldn't|i\s+wouldn't|no\s+point(?:\s+in)?|not\s+worth|waste\s+of\s+(?:your\s+)?time)\s+(?:bother(?:ing)?\s+)?(?:to\s+)?apply(?:ing)?(?!\w)/i,
    /\b(?:skip|pass\s+on|give\s+up\s+on|forget)\s+(?:this|that|the)\s+(?:one|posting|role|job|application|opportunity)(?!\w)/i,
    /\bthey(?:'ll|\s+will|\s+would|\s+won't|\s+will\s+not|\s+are\s+going\s+to)\s+(?:hire|pick|choose|want|call|reject|pass\s+on|love|take)\s+you(?!\w)/i,
  ],
  fr: [
    /\bvous\s+(?:obtiendrez|décrocherez|réussirez|dénicherez|serez\s+(?:embauchée?|choisie?|retenue?))(?!\w)/i,
    /\bvous\s+aurez\s+(?:l'|une\s+|la\s+|des\s+)?(?:entrevue|entretien|offre|poste|emploi|rappel)(?!\w)/i,
    /(?:ça|cela|votre\s+(?:cv|candidature|profil|lettre))\s+(?:vous\s+)?(?:va|vas|pourrait|devrait|vous\s+va)\s+(?:vous\s+)?(?:décrocher|valoir|obtenir|donner|garantir)\s+(?:un|une|le|l'|des)?\s*(?:entrevue|entretien|offre|poste|emploi|rappel)(?!\w)/i,
    /(?:ne\s+postulez\s+pas|n'appliquez\s+pas|pas\s+la\s+peine\s+(?:de\s+|d')?postuler|ça\s+ne\s+vaut\s+pas\s+la\s+peine|oubliez\s+(?:ce|cet|cette)|laissez\s+tomber\s+(?:ce|cet|cette))(?!\w)/i,
    /\b(?:ils?|l'employeur|l'entreprise|on)\s+(?:vous\s+)?(?:embaucher\w*|choisir\w*|retiendr\w*|prendr\w*|rejetter\w*|refuser\w*|adorer\w*|voudr\w*)\s*(?:vous)?(?!\w)/i,
  ],
}

const VERDICT_PATTERNS: Record<'en' | 'fr', RegExp[]> = {
  en: [
    /\byour\s+chances?\s+(?:are|is|look|seem|of|here)\s+(?:good|great|strong|slim|thin|low|poor|small|high|decent|real|realistic|better|worse|solid)(?!\w)/i,
    /\byou(?:'re|\s+are)\s+(?:a\s+)?(?:strong|good|great|weak|poor|competitive|realistic|perfect|ideal|solid|bad|tough)\s+(?:candidate|fit|match|shot|contender|applicant)(?!\w)/i,
    /\b(?:this|the|that)\s+(?:role|job|posting|one|position|opportunity)\s+is\s+(?:a\s+)?(?:great|good|perfect|strong|poor|bad|realistic|long|tough|stretch|natural)\s+(?:fit|match|shot|reach)\s+for\s+you(?!\w)/i,
    /\byou(?:'d|\s+would)\s+(?:ace|crush|nail|be\s+great|be\s+perfect|be\s+ideal|fit\s+right|be\s+a\s+(?:great|perfect|natural)\s+fit)(?!\w)/i,
    /\byou\s+(?:stand|have)\s+(?:a\s+)?(?:good|real|decent|strong|poor|slim|fighting|realistic|fair)\s+chance(?!\w)/i,
    /\bi\s+(?:think|believe|feel|doubt|reckon)\s+you(?:'ll|\s+will|\s+won't|\s+have|\s+could|\s+stand|\s+should|\s+are|\s+would)(?!\w)/i,
    /\b(?:a\s+)?(?:real\s+)?long\s*shot(?!\w)/i,
  ],
  fr: [
    /\bvos\s+chances\s+(?:sont|semblent|paraissent|d'être)\s+(?:bonnes|grandes|fortes|minces|faibles|réelles|réalistes|meilleures|pires|solides)(?!\w)/i,
    /\bvous\s+êtes\s+(?:un\s+|une\s+)?(?:bon|bonne|fort|forte|faible|solide|excellent|excellente|mauvais|mauvaise|parfait|parfaite|idéal|idéale)\s+(?:candidat|candidature|profil|match|choix)(?!\w)/i,
    /\b(?:ce|le|cet|cette)\s+(?:poste|rôle|emploi|offre)\s+(?:est|semble|paraît)\s+(?:un\s+|une\s+)?(?:bon|bonne|excellent|parfait|mauvais|réaliste|long)\s+(?:match|fit|choix|coup)\s+pour\s+vous(?!\w)/i,
    /\bvous\s+(?:réussiriez|décrocheriez|auriez|feriez\s+un\s+excellent)(?!\w)/i,
    /\bvous\s+avez\s+(?:de\s+)?(?:bonnes|réelles|de\s+vraies|peu\s+de|de\s+faibles)\s+chances(?!\w)/i,
    /\bje\s+(?:pense|crois|doute)\s+que\s+vous\s+(?:allez|aurez|serez|pourriez|êtes|avez)(?!\w)/i,
    /\b(?:un\s+)?(?:vrai\s+)?long\s*shot(?!\w)/i,
  ],
}

/* Promise-words run through the negation-aware matcher — "can't promise
   you an interview" is the honest deflection, not a violation. */
const PROMISE_WORD_PATTERNS: Record<'en' | 'fr', RegExp[]> = {
  en: [
    /\b(?:guarantee\w*|promise\w*|sure\s+thing)\s+(?:you'll\s+|you\s+)?(?:of\s+|a\s+|an\s+|the\s+)?(?:interview|offer|job|callback|role|hired)(?!\w)/i,
  ],
  fr: [
    /\b(?:garantir|garantie|promets?|promesse|coup\s+sûr)\s+(?:de\s+|d'|une\s+|l')?\s*(?:entrevue|entretien|offre|embauche|poste)\b/i,
  ],
}

/** Fragments crossing a boundary, matched per tier. Empty = clean. */
export function detectCandidateFlags(text: string, lang: 'en' | 'fr', advice: boolean): string[] {
  const hits = [
    ...detectPatterns(text, UNIVERSAL_PATTERNS[lang]),
    ...detectHonestClaims(text, PROMISE_WORD_PATTERNS[lang]),
  ]
  if (advice) return hits
  return [...hits, ...detectPatterns(text, VERDICT_PATTERNS[lang])]
}

/** The repair note behind a flagged reply — names what crossed so the
    rewrite fixes the boundary instead of hedging. */
export function buildCandidateRepairNote(flags: string[], advice: boolean): string {
  return (
    'Your reply crossed a line the coach never crosses — flagged:\n' +
    flags.map((f) => `- "${f}"`).join('\n') +
    '\nRewrite it with no promised outcome and nothing that talks them out of applying — ' +
    (advice
      ? 'the frank read itself is fine for this internal account. '
      : 'observations about the data are fine; the verdict on their chances is not yours to give. ') +
    'Keep the same language and the same JSON contract.'
  )
}

/** The fixed text that replaces a flagged reply the repair pass could not
    clean — the coach's promise stated plainly. */
export const CANDIDATE_FALLBACK_EN =
  'Whether a role lands is the employer’s call — I can’t read that from here, and I won’t promise an outcome either way. What I can do is work the search with you: the posting, the materials, the next move. Where do you want to look?'
export const CANDIDATE_FALLBACK_FR =
  'C’est l’employeur qui décide — je ne peux pas le lire d’ici, et je ne promets pas de résultat non plus. Ce que je peux faire : travailler la recherche avec vous — l’offre, les documents, le prochain geste. Par où voulez-vous regarder ?'
