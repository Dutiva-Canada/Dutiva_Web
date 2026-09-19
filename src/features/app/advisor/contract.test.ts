import { describe, expect, it } from 'vitest'
import { advisorScenarioList } from '@/features/app/views/advisor/advisorScenarios'
import { advisorResponseSchema, allowedSurfaces } from './contract'
import type { AdvisorResponse } from './contract'

describe('advisorResponseSchema', () => {
  it('validates every demo scenario payload (fixtures conform to the contract)', () => {
    for (const scenario of advisorScenarioList) {
      const turns = [scenario.turn, scenario.resolved, scenario.webOff].filter(
        (turn): turn is NonNullable<typeof turn> => turn !== undefined,
      )
      for (const turn of turns) {
        const parsed = advisorResponseSchema.safeParse(turn.response)
        expect(parsed.success, `${scenario.id}: ${JSON.stringify(parsed)}`).toBe(true)
      }
    }
  })

  it('accepts plain-string LText at the HTTP boundary (live engine form)', () => {
    const base = advisorScenarioList[0]!.turn.response
    const engineForm = {
      ...base,
      jurisdiction: { status: 'known', value: 'Ontario · Provincially regulated' },
      retrieval: { items: ['Termination · ON'] },
      warnings: ['1 raw citation withheld.'],
    }
    expect(advisorResponseSchema.safeParse(engineForm).success).toBe(true)
  })

  it('rejects a payload with a missing gate', () => {
    const base = advisorScenarioList[0]!.turn.response
    const { webSearchAllowed: _dropped, ...routeWithoutGate } = base.route
    expect(advisorResponseSchema.safeParse({ ...base, route: routeWithoutGate }).success).toBe(
      false,
    )
  })
})

describe('allowedSurfaces', () => {
  it('mirrors the route gates on a normal turn', () => {
    const s4 = advisorScenarioList.find((s) => s.id === 's4')!.turn.response
    expect(allowedSurfaces(s4)).toEqual({
      workspace: true,
      retrieval: true,
      legalBasis: false,
      documents: false,
      webSearch: false,
      /* Agent actions stay withheld until the engine sends actionsAllowed. */
      actions: false,
    })
  })

  it('gates proposedActions behind actionsAllowed — absent means withheld', () => {
    const s4 = advisorScenarioList.find((s) => s.id === 's4')!.turn.response
    const withActions: AdvisorResponse = {
      ...s4,
      route: { ...s4.route, actionsAllowed: true },
      proposedActions: [
        { toolId: 'crm.log_activity', summary: 'Log a call', params: { type: 'call' } },
      ],
    }
    expect(advisorResponseSchema.safeParse(withActions).success).toBe(true)
    expect(allowedSurfaces(withActions).actions).toBe(true)
    expect(allowedSurfaces(s4).actions).toBe(false)
  })

  it('supportive triage gates every structured surface off', () => {
    const s5 = advisorScenarioList.find((s) => s.id === 's5')!.turn.response
    expect(Object.values(allowedSurfaces(s5)).every((v) => !v)).toBe(true)
  })

  it('isCrisis forces all surfaces off regardless of gates (cannot be overridden)', () => {
    const s1 = advisorScenarioList.find((s) => s.id === 's1')!.turn.response
    const crisis: AdvisorResponse = { ...s1, isCrisis: true }
    expect(Object.values(allowedSurfaces(crisis)).every((v) => !v)).toBe(true)
  })
})
