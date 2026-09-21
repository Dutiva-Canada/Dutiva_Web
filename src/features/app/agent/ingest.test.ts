import { describe, expect, it } from 'vitest'
import { proposalsFromAdvisorResponse } from './ingest'
import type { AdvisorResponse, ProposedAction } from '@/features/app/advisor/contract'

/**
 * Wire → workspace ingest — the gates that decide whether an engine-emitted
 * `proposedActions` block becomes confirm cards or is dropped entirely.
 * Nothing here executes; these tests pin the suppression rules the
 * interactive path relies on.
 */

function makeResponse(overrides: Partial<AdvisorResponse> = {}): AdvisorResponse {
  return {
    route: {
      responseMode: 'hr',
      workspaceAllowed: true,
      retrievalAllowed: true,
      legalBasisAllowed: true,
      documentsAllowed: true,
      webSearchAllowed: false,
      actionsAllowed: true,
    },
    jurisdiction: { status: 'known', value: 'Ontario' },
    risk: { compliance: 'low', safety: 'none' },
    professionalReview: null,
    supportNotice: false,
    legalBasis: { items: [] },
    retrieval: { items: [] },
    webSearch: null,
    confidence: null,
    proposedActions: [],
    warnings: [],
    isCrisis: false,
    ...overrides,
  }
}

const LOG_CALL: ProposedAction = {
  toolId: 'crm.log_activity',
  summary: { en: 'Log a call with Amara.', fr: 'Consigner un appel avec Amara.' },
  params: { type: 'call', summary: 'call — Amara', contact: 'Amara' },
}

describe('proposalsFromAdvisorResponse', () => {
  it('maps a gated-on action into a proposal with a client-minted id', () => {
    const proposals = proposalsFromAdvisorResponse(makeResponse({ proposedActions: [LOG_CALL] }))
    expect(proposals).toHaveLength(1)
    expect(proposals[0]?.toolId).toBe('crm.log_activity')
    expect(proposals[0]?.id).toMatch(/^agent-/)
    expect(proposals[0]?.params).toEqual(LOG_CALL.params)
    expect(proposals[0]?.summary).toEqual(LOG_CALL.summary)
  })

  it('wraps a plain-string summary bilingually', () => {
    const proposals = proposalsFromAdvisorResponse(
      makeResponse({ proposedActions: [{ ...LOG_CALL, summary: 'Log a call.' }] }),
    )
    expect(proposals[0]?.summary).toEqual({ en: 'Log a call.', fr: 'Log a call.' })
  })

  it('returns nothing for a null or absent payload', () => {
    expect(proposalsFromAdvisorResponse(null)).toEqual([])
    expect(proposalsFromAdvisorResponse(undefined)).toEqual([])
    expect(proposalsFromAdvisorResponse(makeResponse())).toEqual([])
  })

  it('suppresses everything on a crisis turn, whatever the wire says', () => {
    const proposals = proposalsFromAdvisorResponse(
      makeResponse({ isCrisis: true, proposedActions: [LOG_CALL] }),
    )
    expect(proposals).toEqual([])
  })

  it('suppresses everything in supportive mode, even with the gate on', () => {
    const proposals = proposalsFromAdvisorResponse(
      makeResponse({
        route: { ...makeResponse().route, responseMode: 'supportive' },
        proposedActions: [LOG_CALL],
      }),
    )
    expect(proposals).toEqual([])
  })

  it('suppresses everything when the route gate is off or absent', () => {
    const base = makeResponse({ proposedActions: [LOG_CALL] })
    const gateOff = {
      ...base,
      route: { ...base.route, actionsAllowed: false },
    }
    expect(proposalsFromAdvisorResponse(gateOff)).toEqual([])
    const gateAbsent = {
      ...base,
      route: { ...base.route, actionsAllowed: undefined },
    }
    expect(proposalsFromAdvisorResponse(gateAbsent)).toEqual([])
  })

  it('drops actions naming tools the client registry does not know', () => {
    const proposals = proposalsFromAdvisorResponse(
      makeResponse({
        proposedActions: [LOG_CALL, { toolId: 'payroll.run', summary: 'Run payroll', params: {} }],
      }),
    )
    expect(proposals).toHaveLength(1)
    expect(proposals[0]?.toolId).toBe('crm.log_activity')
  })

  it('keeps action params declarative — no execution happens at ingest', () => {
    const proposals = proposalsFromAdvisorResponse(
      makeResponse({
        proposedActions: [
          { toolId: 'tasks.create', summary: 'Create a task', params: { title: 'Renew WSIB' } },
        ],
      }),
    )
    expect(proposals[0]?.params).toEqual({ title: 'Renew WSIB' })
  })
})
