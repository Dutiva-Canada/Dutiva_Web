import { describe, expect, it } from 'vitest'
import {
  SYSTEM_PROMPTS,
  buildChatContextBlock,
  buildUserMessage,
  candidateChatPrompt,
  parseCandidateChatReply,
  parseModelResponse,
  validateAuthHeader,
  validateFeature,
  validatePayload,
  type AiFeature,
  type CandidateChatContext,
} from './handlers'

/* ---------------------------------------------------------------------------
   Auth header validation
   --------------------------------------------------------------------------- */

describe('validateAuthHeader', () => {
  it('rejects a missing header', () => {
    const result = validateAuthHeader(null)
    expect(result.ok).toBe(false)
  })

  it('rejects a non-Bearer header', () => {
    const result = validateAuthHeader('Basic abc123')
    expect(result.ok).toBe(false)
  })

  it('rejects an empty Bearer token', () => {
    const result = validateAuthHeader('Bearer ')
    expect(result.ok).toBe(false)
  })

  it('accepts a valid Bearer token', () => {
    const result = validateAuthHeader('Bearer some.jwt.token')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toBe('some.jwt.token')
  })
})

/* ---------------------------------------------------------------------------
   Feature validation
   --------------------------------------------------------------------------- */

describe('validateFeature', () => {
  it('accepts all four feature names', () => {
    const features: AiFeature[] = ['tailor-resume', 'cover-letter', 'match-score', 'interview-prep']
    for (const f of features) {
      const result = validateFeature(f)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toBe(f)
    }
  })

  it('rejects an invalid feature name', () => {
    const result = validateFeature('unknown-feature')
    expect(result.ok).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(validateFeature(null).ok).toBe(false)
    expect(validateFeature(42).ok).toBe(false)
    expect(validateFeature(undefined).ok).toBe(false)
  })
})

/* ---------------------------------------------------------------------------
   Payload validation
   --------------------------------------------------------------------------- */

const validBasePayload = {
  resumeText: 'Senior developer with 10 years experience.',
  jobTitle: 'Frontend Developer',
  jobDescription: 'We need a React developer.',
  requirements: ['React', 'TypeScript'],
}

describe('validatePayload', () => {
  it('rejects a non-object payload', () => {
    const result = validatePayload('tailor-resume', null)
    expect(result.ok).toBe(false)
  })

  it('rejects missing resumeText', () => {
    const result = validatePayload('tailor-resume', { ...validBasePayload, resumeText: '' })
    expect(result.ok).toBe(false)
  })

  it('rejects missing jobTitle', () => {
    const result = validatePayload('tailor-resume', { ...validBasePayload, jobTitle: '' })
    expect(result.ok).toBe(false)
  })

  it('rejects non-array requirements', () => {
    const result = validatePayload('tailor-resume', { ...validBasePayload, requirements: 'React' })
    expect(result.ok).toBe(false)
  })

  it('accepts a valid base payload for tailor-resume', () => {
    const result = validatePayload('tailor-resume', validBasePayload)
    expect(result.ok).toBe(true)
  })

  it('rejects cover-letter without candidateName', () => {
    const result = validatePayload('cover-letter', validBasePayload)
    expect(result.ok).toBe(false)
  })

  it('accepts cover-letter with candidateName', () => {
    const result = validatePayload('cover-letter', {
      ...validBasePayload,
      candidateName: 'Jane Doe',
    })
    expect(result.ok).toBe(true)
  })

  it('accepts match-score with a base payload', () => {
    const result = validatePayload('match-score', validBasePayload)
    expect(result.ok).toBe(true)
  })

  it('accepts interview-prep with a base payload', () => {
    const result = validatePayload('interview-prep', validBasePayload)
    expect(result.ok).toBe(true)
  })
})

/* ---------------------------------------------------------------------------
   User message building (request shape)
   --------------------------------------------------------------------------- */

describe('buildUserMessage', () => {
  it('includes job title, description, requirements, and resume for tailor-resume', () => {
    const msg = buildUserMessage('tailor-resume', validBasePayload)
    expect(msg).toContain('Job Title: Frontend Developer')
    expect(msg).toContain('Job Description:')
    expect(msg).toContain('We need a React developer.')
    expect(msg).toContain('- React')
    expect(msg).toContain('- TypeScript')
    expect(msg).toContain('Resume:')
    expect(msg).toContain('Senior developer with 10 years experience.')
  })

  it('includes candidate name for cover-letter', () => {
    const msg = buildUserMessage('cover-letter', { ...validBasePayload, candidateName: 'Jane Doe' })
    expect(msg).toContain('Candidate Name: Jane Doe')
  })

  it('handles empty requirements list', () => {
    const msg = buildUserMessage('match-score', { ...validBasePayload, requirements: [] })
    expect(msg).toContain('No specific requirements listed.')
  })
})

/* ---------------------------------------------------------------------------
   Response parsing (response shape, with mocked model output)
   --------------------------------------------------------------------------- */

describe('parseModelResponse', () => {
  it('returns tailoredResume for tailor-resume', () => {
    const result = parseModelResponse('tailor-resume', 'Here is your tailored resume...')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ tailoredResume: 'Here is your tailored resume...' })
    }
  })

  it('rejects an empty response for tailor-resume', () => {
    const result = parseModelResponse('tailor-resume', '   ')
    expect(result.ok).toBe(false)
  })

  it('returns coverLetter for cover-letter', () => {
    const result = parseModelResponse('cover-letter', 'Dear Hiring Manager...')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ coverLetter: 'Dear Hiring Manager...' })
    }
  })

  it('parses match-score JSON and clamps the score', () => {
    const mockModelOutput = JSON.stringify({
      score: 85,
      suggestions: ['Add more project details.'],
    })
    const result = parseModelResponse('match-score', mockModelOutput)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ score: 85, suggestions: ['Add more project details.'] })
    }
  })

  it('clamps match-score above 100', () => {
    const mockModelOutput = JSON.stringify({ score: 150, suggestions: [] })
    const result = parseModelResponse('match-score', mockModelOutput)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect((result.value as { score: number }).score).toBe(100)
    }
  })

  it('clamps match-score below 0', () => {
    const mockModelOutput = JSON.stringify({ score: -10, suggestions: [] })
    const result = parseModelResponse('match-score', mockModelOutput)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect((result.value as { score: number }).score).toBe(0)
    }
  })

  it('parses match-score JSON wrapped in a code fence', () => {
    const mockModelOutput = '```json\n{"score": 72, "suggestions": ["Learn Docker"]}\n```'
    const result = parseModelResponse('match-score', mockModelOutput)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ score: 72, suggestions: ['Learn Docker'] })
    }
  })

  it('rejects match-score with missing suggestions', () => {
    const mockModelOutput = JSON.stringify({ score: 50 })
    const result = parseModelResponse('match-score', mockModelOutput)
    expect(result.ok).toBe(false)
  })

  it('parses interview-prep JSON', () => {
    const mockModelOutput = JSON.stringify({
      questions: ['Tell me about your React experience.'],
      talkingPoints: ['Led migration to TypeScript.'],
    })
    const result = parseModelResponse('interview-prep', mockModelOutput)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({
        questions: ['Tell me about your React experience.'],
        talkingPoints: ['Led migration to TypeScript.'],
      })
    }
  })

  it('rejects interview-prep with missing talkingPoints', () => {
    const mockModelOutput = JSON.stringify({ questions: ['Q1'] })
    const result = parseModelResponse('interview-prep', mockModelOutput)
    expect(result.ok).toBe(false)
  })

  it('rejects interview-prep with non-string questions', () => {
    const mockModelOutput = JSON.stringify({ questions: [42], talkingPoints: [] })
    const result = parseModelResponse('interview-prep', mockModelOutput)
    expect(result.ok).toBe(false)
  })
})

/* ---------------------------------------------------------------------------
   System prompts
   --------------------------------------------------------------------------- */

describe('SYSTEM_PROMPTS', () => {
  it('has a prompt for every feature', () => {
    const features: AiFeature[] = ['tailor-resume', 'cover-letter', 'match-score', 'interview-prep']
    for (const f of features) {
      expect(SYSTEM_PROMPTS[f]).toBeTruthy()
      expect(SYSTEM_PROMPTS[f].length).toBeGreaterThan(20)
    }
  })

  it('includes JSON format instruction for match-score', () => {
    expect(SYSTEM_PROMPTS['match-score']).toContain('JSON')
    expect(SYSTEM_PROMPTS['match-score']).toContain('score')
    expect(SYSTEM_PROMPTS['match-score']).toContain('suggestions')
  })

  it('includes JSON format instruction for interview-prep', () => {
    expect(SYSTEM_PROMPTS['interview-prep']).toContain('JSON')
    expect(SYSTEM_PROMPTS['interview-prep']).toContain('questions')
    expect(SYSTEM_PROMPTS['interview-prep']).toContain('talkingPoints')
  })
})

/* ---------------------------------------------------------------------------
   Chat — Claire, the search coach (kind 'chat')
   --------------------------------------------------------------------------- */

const CTX: CandidateChatContext = {
  profile: {
    name: 'Jane Doe',
    headline: 'Senior frontend developer',
    current_role: 'Frontend Lead',
    summary: 'Ten years shipping React.',
    location: 'Toronto',
    years_experience: 10,
    work_authorization: 'Canadian citizen',
    resume_text: 'Senior developer with 10 years experience.',
  },
  applications: [
    {
      title: 'Frontend Developer',
      organization: 'Acme Inc',
      location: 'Toronto',
      status: 'submitted',
      match_score: 82,
      applied_at: '2026-10-01T12:00:00Z',
    },
  ],
  discoveredJobs: [
    {
      title: 'React Engineer',
      company: 'Globex',
      location: 'Remote',
      match_score: 77,
      status: 'needs_review',
    },
  ],
  agent: { enabled: true, autonomy: 'review', keywords: ['react'], locations: ['Toronto'] },
}

describe('candidateChatPrompt — Claire persona contract', () => {
  it('names herself and her surface, and is honest about being software', () => {
    const { content } = candidateChatPrompt(CTX, 'en')
    expect(content).toContain('Claire')
    expect(content).toContain('software, not a person')
    expect(content).toContain('not a recruiter')
  })

  it('never promises outcomes or invents facts, in either register', () => {
    for (const advice of [false, true]) {
      const { content } = candidateChatPrompt(CTX, 'en', { advice })
      expect(content).toContain('never promises')
      expect(content).toContain('never invents')
      /* She points, never does — no write surface exists for her. */
      expect(content).toContain('cannot edit the profile')
      expect(content).toContain('apply')
      expect(content).toContain('point')
    }
  })

  it('external accounts keep the general-read register, no personal verdicts', () => {
    const { content } = candidateChatPrompt(CTX, 'en')
    expect(content).toContain('keep it general')
    expect(content).not.toContain('@dutiva.ca')
    expect(content).not.toContain('INTERNAL STAFF')
  })

  it('internal @dutiva.ca accounts get the direct-advice register', () => {
    const { content } = candidateChatPrompt(CTX, 'en', { advice: true })
    expect(content).toContain('@dutiva.ca')
    expect(content).toContain('advise like a coach who owns the call')
    /* The shared boundaries still hold — outcomes are never promised and
       applying stays the candidate's own step. */
    expect(content).toContain('never promise outcomes')
    expect(content).toContain('applying is always theirs')
  })

  it('answers in the caller’s language and closes on the JSON contract', () => {
    expect(candidateChatPrompt(CTX, 'fr').content).toContain('Canadian French')
    expect(candidateChatPrompt(CTX, 'en').content).toContain('Canadian English')
    expect(candidateChatPrompt(CTX, 'en').content).toContain('{"reply"')
  })

  it('embeds the candidate’s own rows as context', () => {
    const { content } = candidateChatPrompt(CTX, 'en')
    expect(content).toContain('Jane Doe')
    expect(content).toContain('Frontend Developer')
    expect(content).toContain('Acme Inc')
    expect(content).toContain('Globex')
    expect(content).toContain('match 77')
    expect(content).toContain('react')
  })

  it('describes an empty portal honestly', () => {
    const empty: CandidateChatContext = {
      profile: null,
      applications: [],
      discoveredJobs: [],
      agent: null,
    }
    const block = buildChatContextBlock(empty)
    expect(block).toContain('no profile saved yet')
    expect(block).toContain('(none)')
    expect(block).toContain('never configured')
    expect(block).toContain('Resume: (none saved yet)')
  })
})

describe('parseCandidateChatReply', () => {
  it('reads the reply field out of the JSON envelope', () => {
    expect(parseCandidateChatReply('{"reply":"Apply to the Globex role."}')).toEqual({
      reply: 'Apply to the Globex role.',
      suggests: [],
    })
  })

  it('tolerates code fences and surrounding whitespace', () => {
    expect(parseCandidateChatReply('```json\n{"reply":"Hi."}\n```')).toEqual({
      reply: 'Hi.',
      suggests: [],
    })
  })

  it('keeps string suggests, drops anything else', () => {
    expect(
      parseCandidateChatReply('{"reply":"Hi.","suggests":["Apply to Globex?",true,7]}'),
    ).toEqual({ reply: 'Hi.', suggests: ['Apply to Globex?'] })
  })

  it('returns null on anything unparseable or reply-less', () => {
    expect(parseCandidateChatReply('not json')).toBeNull()
    expect(parseCandidateChatReply('{"reply":""}')).toBeNull()
    expect(parseCandidateChatReply('{"reply":"   "}')).toBeNull()
    expect(parseCandidateChatReply(null)).toBeNull()
  })
})
