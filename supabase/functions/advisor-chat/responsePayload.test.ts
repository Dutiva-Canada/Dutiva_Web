import { describe, expect, it } from 'vitest'
import { advisorResponseSchema, allowedSurfaces } from '@/features/app/advisor/contract'
import type { AdvisorResponse } from '@/features/app/advisor/contract'
import { buildAdvisorResponse, detectJurisdictions, detectsCrisis } from './responsePayload'
import type { GuidanceChunk } from './responsePayload'

/**
 * The payload builder is the server half of the engine contract. These tests
 * pin the deterministic rules AND validate every shape against the real client
 * zod schema — the drift guard, since the edge function cannot import from
 * src/ at runtime.
 */

const onNoticeChunk: GuidanceChunk = {
  title: 'Ontario — Individual termination notice under the Employment Standards Act, 2000',
  content: 'The notice ladder by period of employment is: …',
  source_url:
    'https://www.ontario.ca/document/your-guide-employment-standards-act-0/termination-employment',
  source_name: 'Ontario.ca — Your guide to the ESA',
  jurisdiction: 'ON',
  effective_note: null,
  review_status: 'machine_curated',
  topic: 'termination_notice',
}

const reviewedChunk: GuidanceChunk = { ...onNoticeChunk, review_status: 'reviewed' }

/** Parse through the client contract — throws if the server shape drifts. */
function parsed(payload: unknown): AdvisorResponse {
  const result = advisorResponseSchema.safeParse(payload)
  if (!result.success) {
    throw new Error(`payload failed the client contract: ${result.error.message}`)
  }
  return result.data
}

describe('detectsCrisis', () => {
  it('catches first-person distress in both languages, accents and apostrophes included', () => {
    expect(detectsCrisis('honestly I feel suicidal')).toBe(true)
    expect(detectsCrisis('je n’ai plus envie de vivre')).toBe(true)
    expect(detectsCrisis("I can't go on")).toBe(true)
  })

  it('does not fire on ordinary HR questions', () => {
    expect(detectsCrisis('I need to terminate an employee in Ontario')).toBe(false)
    expect(detectsCrisis('how much vacation pay is owed?')).toBe(false)
  })
})

describe('detectJurisdictions', () => {
  it('reads a single named jurisdiction', () => {
    expect(detectJurisdictions('what notice is required in Ontario?')).toEqual(['ON'])
    expect(detectJurisdictions('les normes du travail au Québec')).toEqual(['QC'])
    expect(detectJurisdictions('we are federally regulated')).toEqual(['FED'])
  })

  it('reports every jurisdiction mentioned so the caller can flag a conflict', () => {
    expect(detectJurisdictions('compare Ontario and Quebec rules')).toEqual(['ON', 'QC'])
  })

  it('never infers a jurisdiction from an unqualified question', () => {
    expect(detectJurisdictions('how many weeks of notice do I owe?')).toEqual([])
    /* "on" as an ordinary word must not read as Ontario. */
    expect(detectJurisdictions('what do I owe on termination?')).toEqual([])
  })
})

describe('buildAdvisorResponse — crisis', () => {
  it('intercepts everything and gates every structured surface off', () => {
    const response = parsed(
      buildAdvisorResponse({
        message: 'they want to fire me and I feel suicidal',
        reply: 'irrelevant model prose',
        chunks: [reviewedChunk],
      }),
    )

    expect(response.isCrisis).toBe(true)
    expect(response.supportNotice).toBe(true)
    expect(response.route.responseMode).toBe('supportive')
    expect(response.risk.safety).toBe('critical')
    /* Crisis outranks the termination keyword that would otherwise route HR. */
    expect(Object.values(allowedSurfaces(response)).every((v) => !v)).toBe(true)
    /* Even with a grounded chunk available, nothing is surfaced. */
    expect(response.legalBasis.items).toHaveLength(0)
    expect(response.retrieval.items).toHaveLength(0)
    expect(response.confidence).toBeNull()
  })
})

describe('buildAdvisorResponse — jurisdiction gate', () => {
  it('opens legal basis when jurisdiction is confirmed and the corpus grounded the turn', () => {
    const response = parsed(
      buildAdvisorResponse({
        message: 'How many weeks of termination notice for 6 years in Ontario?',
        reply: 'Six weeks under the ESA.',
        chunks: [reviewedChunk],
      }),
    )

    expect(response.jurisdiction.status).toBe('known')
    expect(response.route.legalBasisAllowed).toBe(true)
    expect(response.legalBasis.items).toHaveLength(1)
    expect(response.legalBasis.items[0]?.valid).toBe(true)
    expect(response.retrieval.items).toHaveLength(1)
  })

  it('withholds legal basis when jurisdiction is unknown, and says why', () => {
    const response = parsed(
      buildAdvisorResponse({
        message: 'How many weeks of termination notice do I owe for 6 years?',
        reply: 'That depends on your jurisdiction.',
        chunks: [reviewedChunk],
      }),
    )

    expect(response.jurisdiction.status).toBe('unknown')
    expect(response.route.legalBasisAllowed).toBe(false)
    expect(response.legalBasis.items).toHaveLength(0)
    expect(response.legalBasis.withheldReason).toBeDefined()
    expect(response.warnings.length).toBeGreaterThan(0)
    /* Retrieval still renders — only the statutory claim is gated. */
    expect(response.route.retrievalAllowed).toBe(true)
  })

  it('treats two named jurisdictions as a conflict rather than picking one', () => {
    const response = parsed(
      buildAdvisorResponse({
        message: 'Do Ontario and Quebec require the same notice?',
        reply: 'They differ.',
        chunks: [reviewedChunk],
      }),
    )

    expect(response.jurisdiction.status).toBe('conflict')
    expect(response.route.legalBasisAllowed).toBe(false)
  })
})

describe('buildAdvisorResponse — honesty about the corpus', () => {
  it('marks machine-curated citations as needs-review and warns', () => {
    const response = parsed(
      buildAdvisorResponse({
        message: 'Ontario termination notice for 6 years of service?',
        reply: 'Six weeks.',
        chunks: [onNoticeChunk],
      }),
    )

    expect(response.legalBasis.items[0]?.valid).toBe(false)
    expect(response.warnings.some((w) => JSON.stringify(w).includes('pending human review'))).toBe(
      true,
    )
  })

  it('flags an ungrounded turn instead of implying corpus backing', () => {
    const response = parsed(
      buildAdvisorResponse({
        message: 'What should I say in a stay interview in Ontario?',
        reply: 'Some general coaching.',
        chunks: [],
      }),
    )

    expect(response.route.retrievalAllowed).toBe(false)
    expect(response.route.legalBasisAllowed).toBe(false)
    expect(response.retrieval.withheldReason).toBeDefined()
    expect(response.warnings.some((w) => JSON.stringify(w).includes('not grounded'))).toBe(true)
  })

  it('says "retrieval was unavailable", never "nothing matched", on a retrieval failure', () => {
    const response = parsed(
      buildAdvisorResponse({
        message: 'Ontario termination notice for 6 years of service?',
        reply: 'Six weeks.',
        chunks: [],
        retrievalFailed: true,
      }),
    )

    const json = JSON.stringify(response)
    expect(json).toContain('unavailable')
    expect(json).not.toContain('matched this question')
    expect(response.warnings.some((w) => JSON.stringify(w).includes('unavailable'))).toBe(true)
  })

  it('demotes a reviewed citation whose source changed after curation (0071)', () => {
    const response = parsed(
      buildAdvisorResponse({
        message: 'Ontario termination notice for 6 years of service?',
        reply: 'Six weeks.',
        chunks: [{ ...reviewedChunk, source_changed_at: '2026-08-08T00:00:00Z' }],
      }),
    )

    expect(response.legalBasis.items[0]?.valid).toBe(false)
    expect(
      response.warnings.some((w) => JSON.stringify(w).includes('changed after it was curated')),
    ).toBe(true)
  })

  it('keeps a reviewed, unchanged citation valid', () => {
    const response = parsed(
      buildAdvisorResponse({
        message: 'Ontario termination notice for 6 years of service?',
        reply: 'Six weeks.',
        chunks: [reviewedChunk],
      }),
    )

    expect(response.legalBasis.items[0]?.valid).toBe(true)
  })
})

describe('buildAdvisorResponse — routing and risk', () => {
  it('routes a harassment report to escalation with a safety watch, not supportive mode', () => {
    const response = parsed(
      buildAdvisorResponse({
        message: 'An employee filed a harassment complaint against their manager',
        reply: 'Investigate promptly.',
        chunks: [],
      }),
    )

    expect(response.route.responseMode).toBe('escalation')
    expect(response.risk.safety).toBe('watch')
    expect(response.risk.compliance).toBe('high')
    expect(response.professionalReview?.type).toBe('legal')
    /* Escalation is not a wellbeing moment — support notice stays off. */
    expect(response.supportNotice).toBe(false)
    expect(response.isCrisis).toBe(false)
    /* Documents are an HR-mode affordance. */
    expect(response.route.documentsAllowed).toBe(false)
  })

  it('scores an everyday entitlement question as medium risk with no counsel referral', () => {
    const response = parsed(
      buildAdvisorResponse({
        message: 'How much vacation pay accrues in Ontario?',
        reply: 'Four per cent.',
        chunks: [reviewedChunk],
      }),
    )

    expect(response.route.responseMode).toBe('hr')
    expect(response.risk.compliance).toBe('medium')
    expect(response.risk.safety).toBe('none')
    expect(response.professionalReview).toBeNull()
    expect(response.route.documentsAllowed).toBe(true)
  })
})

describe('buildAdvisorResponse — confidence', () => {
  it('rises with jurisdiction certainty and corpus coverage', () => {
    const grounded = parsed(
      buildAdvisorResponse({
        message: 'Ontario vacation entitlement?',
        reply: 'Two weeks.',
        chunks: [reviewedChunk, { ...reviewedChunk, topic: 'vacation' }],
      }),
    )
    const ungrounded = parsed(
      buildAdvisorResponse({
        message: 'What is the vacation entitlement?',
        reply: 'It depends.',
        chunks: [],
      }),
    )

    expect(grounded.confidence?.pct).toBeGreaterThan(ungrounded.confidence?.pct ?? 0)
    expect(ungrounded.confidence?.pct).toBeLessThan(45)
    expect(grounded.confidence?.pct).toBeLessThanOrEqual(88)
  })
})

describe('buildAdvisorResponse — memory used', () => {
  it('surfaces injected org memory facts on the payload', () => {
    const res = parsed(
      buildAdvisorResponse({
        message: 'Ontario notice for Jordan?',
        reply: 'Confirm tenure and the contract clause first.',
        chunks: [reviewedChunk],
        memoryFacts: [
          {
            id: 'fact-1',
            statementEn: 'Started March 2018',
            statementFr: 'Début en mars 2018',
          },
        ],
      }),
    )
    expect(res.memory?.items).toHaveLength(1)
    expect(res.memory?.items[0]?.factId).toBe('fact-1')
    expect(res.memory?.items[0]?.label.en).toContain('March 2018')
  })

  it('omits memory when none were injected', () => {
    const res = parsed(
      buildAdvisorResponse({
        message: 'Ontario vacation?',
        reply: 'Two weeks.',
        chunks: [reviewedChunk],
      }),
    )
    expect(res.memory).toBeNull()
  })
})
