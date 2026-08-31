import { describe, expect, it } from 'vitest'
import type { AdvisorResponse } from '../contract'
import { JURISDICTION_VALUE } from '../../../../../supabase/functions/advisor-chat/responsePayload'
import { applySafetyBackstop } from './safetyBackstop'

/** A clean, low-risk HR response with jurisdiction confirmed — the pass case. */
function baseResponse(overrides: Partial<AdvisorResponse> = {}): AdvisorResponse {
  return {
    route: {
      responseMode: 'hr',
      workspaceAllowed: true,
      retrievalAllowed: true,
      legalBasisAllowed: true,
      documentsAllowed: true,
      webSearchAllowed: false,
    },
    jurisdiction: { status: 'known', value: 'Ontario' },
    risk: { compliance: 'low', safety: 'none' },
    professionalReview: null,
    supportNotice: false,
    legalBasis: { items: [] },
    retrieval: { items: [] },
    webSearch: null,
    confidence: null,
    warnings: [],
    isCrisis: false,
    ...overrides,
  }
}

describe('applySafetyBackstop — crisis intercept (§5.1)', () => {
  it('raises isCrisis from a user-message signal the engine missed', () => {
    const { response, actions } = applySafetyBackstop({
      userMessage: 'I honestly want to kill myself',
      reply: 'Here is some guidance.',
      response: baseResponse({ isCrisis: false }),
    })
    expect(response.isCrisis).toBe(true)
    expect(actions).toContain('crisis-intercept')
  })

  it('is monotonic: never clears a crisis the engine already flagged', () => {
    const { response, actions } = applySafetyBackstop({
      userMessage: 'thanks, that helps',
      reply: 'Take care.',
      response: baseResponse({ isCrisis: true }),
    })
    expect(response.isCrisis).toBe(true)
    expect(actions).not.toContain('crisis-intercept')
  })

  it('takes precedence over the figure gate', () => {
    const { response, actions } = applySafetyBackstop({
      userMessage: 'I want to end my life',
      reply: 'The statutory minimum is 2 weeks of notice.',
      response: baseResponse({ jurisdiction: { status: 'unknown', value: '' } }),
    })
    expect(response.isCrisis).toBe(true)
    expect(actions).toEqual(['crisis-intercept'])
  })
})

describe('applySafetyBackstop — jurisdiction/figure gate (§5.2)', () => {
  it('withholds legal basis when a figure appears before jurisdiction is confirmed', () => {
    const { response, actions } = applySafetyBackstop({
      userMessage: 'How much notice do I owe?',
      reply: "That's roughly 8 weeks' notice.",
      response: baseResponse({ jurisdiction: { status: 'unknown', value: '' } }),
    })
    expect(response.route.legalBasisAllowed).toBe(false)
    expect(response.legalBasis.withheldReason).toBeDefined()
    expect(response.warnings.length).toBe(1)
    expect(actions).toContain('legal-basis-withheld')
  })

  it('does not fire when jurisdiction is confirmed', () => {
    const input = {
      userMessage: 'How much notice do I owe?',
      reply: "That's roughly 8 weeks' notice.",
      response: baseResponse({ jurisdiction: { status: 'known', value: 'Ontario' } }),
    }
    const { response, actions } = applySafetyBackstop(input)
    expect(response.route.legalBasisAllowed).toBe(true)
    expect(actions).toEqual([])
  })

  it('does not fire when the reply carries no statutory figure', () => {
    const { actions } = applySafetyBackstop({
      userMessage: 'What should I keep in mind?',
      reply: 'Follow a fair, documented process and confirm the jurisdiction first.',
      response: baseResponse({ jurisdiction: { status: 'unknown', value: '' } }),
    })
    expect(actions).toEqual([])
  })
})

describe('applySafetyBackstop — notice-figure cross-check (§5.2b)', () => {
  /* Label-drift guard: scheduleJurisdiction() maps the engine's display
     strings back to schedule codes by prefix. If someone edits
     JURISDICTION_VALUE in responsePayload.ts, this fails loudly instead of
     silently disarming the cross-check. */
  it('recognizes the engine-authored jurisdiction labels', () => {
    const { actions } = applySafetyBackstop({
      userMessage: 'Terminating an employee with 4 years of service.',
      reply: 'The ESA requires 6 weeks of notice.',
      response: baseResponse({
        jurisdiction: { status: 'known', value: JURISDICTION_VALUE.ON },
      }),
    })
    expect(actions).toContain('figure-mismatch')
    for (const code of ['QC', 'FED'] as const) {
      /* Known label, unencoded schedule → recognized but unverifiable. */
      expect(
        applySafetyBackstop({
          userMessage: 'An employee with 4 years of service.',
          reply: 'The minimum is 2 weeks of notice.',
          response: baseResponse({
            jurisdiction: { status: 'known', value: JURISDICTION_VALUE[code] },
          }),
        }).actions,
      ).toEqual([])
    }
  })

  it('flags an Ontario notice figure that disagrees with the schedule', () => {
    const { response, actions } = applySafetyBackstop({
      userMessage: 'Terminating an employee with 4 years of service in Ontario.',
      reply: 'The ESA requires 6 weeks of notice.',
      response: baseResponse({
        jurisdiction: { status: 'known', value: 'Ontario · Provincially regulated' },
      }),
    })
    expect(actions).toContain('figure-mismatch')
    expect(response.route.legalBasisAllowed).toBe(false)
    expect(response.legalBasis.withheldReason).toBeDefined()
    /* The warning carries both numbers so the operator can act on it. */
    const warning = response.warnings.at(-1)
    const text = typeof warning === 'string' ? warning : (warning?.en ?? '')
    expect(text).toContain('6 weeks')
    expect(text).toContain('4 weeks')
  })

  it('passes a correct Ontario figure untouched', () => {
    const response = baseResponse({
      jurisdiction: { status: 'known', value: 'Ontario · Provincially regulated' },
    })
    const result = applySafetyBackstop({
      userMessage: 'Terminating an employee with 4 years of service in Ontario.',
      reply: 'The ESA statutory minimum is 4 weeks of notice.',
      response,
    })
    expect(result.actions).toEqual([])
    expect(result.response).toBe(response)
  })

  it('stays silent when tenure is unknown or the schedule is unencoded', () => {
    expect(
      applySafetyBackstop({
        userMessage: 'How much notice do I owe in Ontario?',
        reply: 'Roughly 8 weeks of notice.',
        response: baseResponse({
          jurisdiction: { status: 'known', value: 'Ontario · Provincially regulated' },
        }),
      }).actions,
    ).toEqual([])
    expect(
      applySafetyBackstop({
        userMessage: 'An employee with 4 years of service in Quebec.',
        reply: 'The LNT requires 2 weeks of notice.',
        response: baseResponse({
          jurisdiction: { status: 'known', value: 'Quebec · Provincially regulated' },
        }),
      }).actions,
    ).toEqual([])
  })
})

describe('applySafetyBackstop — pass-through', () => {
  it('returns the input response untouched on a clean turn', () => {
    const response = baseResponse()
    const result = applySafetyBackstop({
      userMessage: 'What is the process for a layoff?',
      reply: 'Here is the general process.',
      response,
    })
    expect(result.response).toBe(response)
    expect(result.actions).toEqual([])
  })
})
