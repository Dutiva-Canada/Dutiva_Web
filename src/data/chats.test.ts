import { describe, expect, it } from 'vitest'
import { complianceItems } from './compliance'
import { chats, followupReplies, lightFlows } from './chats'

describe('Advisor chat fixtures — jurisdiction and provenance copy', () => {
  it('does not present BC employment standards as shipped Advisor guidance', () => {
    const serialized = JSON.stringify({ chats, lightFlows, followupReplies })
    expect(serialized).not.toMatch(/BC Employment Standards Act/)
    expect(serialized).not.toMatch(/British Columbia → BC/)
  })

  it('frames Quebec onboarding under the Charter rather than Bill 96', () => {
    const onboarding = lightFlows.onboarding!
    expect(onboarding.reasoning?.[0]?.en).toContain('Charter of the French Language')
    expect(onboarding.reasoning?.[0]?.en).not.toMatch(/^Bill 96/)
    expect(onboarding.cards?.[0]?.citations?.[0]?.label.en).toBe(
      'Charter of the French Language (Québec)',
    )
  })

  it('uses Ontario mandatory new-hire information in the hiring light flow', () => {
    const hiring = lightFlows.hiring!
    expect(hiring.reasoning?.[0]?.en).toContain('Ontario')
    expect(hiring.reasoning?.[1]?.en).toContain('25 or more employees')
  })

  it('names shipped jurisdictions for remote-work OHS considerations', () => {
    const policy = lightFlows.policy!
    expect(policy.reasoning?.[0]?.en).toMatch(/Ontario, Quebec, federally regulated/i)
    expect(policy.reasoning?.[0]?.en).not.toMatch(/obligations extend to home offices/i)
  })

  it('uses Ontario official ESA terminology and notice follow-up for Jordan termination', () => {
    const jordanReply = chats.find((c) => c.id === 'c1')?.messages.find((m) => m.id === 'm4')
    const riskCard = jordanReply?.cards?.[0]
    expect(riskCard?.citations?.[0]?.label.fr).toBe('LNE art. 57 — Délai de préavis de l’employeur')
    expect(riskCard?.citations?.[1]?.label.fr).toBe('LNE art. 64 — Indemnité de cessation d’emploi')
    expect(jordanReply?.followups).toContain('Estimate notice exposure')
    expect(followupReplies['Estimate notice exposure']?.text.en).toMatch(
      /preliminary range pending counsel review/i,
    )
  })

  it('uses multi-jurisdiction remote-work wording in the policy light flow', () => {
    const policy = lightFlows.policy!
    expect(policy.text.en).toMatch(/multi-jurisdiction team/i)
    expect(policy.cards?.[0]?.body.en).toMatch(/3 new employment jurisdictions/i)
    expect(JSON.stringify(policy)).not.toMatch(/multi-province team/i)
  })
})

describe('compliance fixtures — Quebec language citations', () => {
  it('references the Charter of the French Language without Bill 96 framing', () => {
    const ci5 = complianceItems.find((item) => item.id === 'ci5')!
    expect(ci5.detail.en).toContain('Charter of the French Language')
    expect(ci5.detail.en).not.toMatch(/Bill 96/)
    expect(ci5.citations?.[0]?.label.en).toBe('Charter of the French Language (Québec)')
  })
})
