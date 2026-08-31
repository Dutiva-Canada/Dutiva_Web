import { describe, expect, it } from 'vitest'
import { complianceItems } from './compliance'
import { chats, followupReplies, lightFlows } from './chats'

describe('Advisor chat fixtures — jurisdiction and provenance copy', () => {
  it('does not retain stale BC-specific wording in the remote-work Advisor flow', () => {
    const policy = lightFlows.policy!
    const serialized = JSON.stringify(policy)

    expect(serialized).not.toMatch(/BC Employment Standards Act/)
    expect(serialized).not.toMatch(/British Columbia → BC/)
    expect(policy.reasoning?.[0]?.en).toMatch(/Ontario, Quebec, federally regulated/i)
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

  it('frames attendance discipline around disability-related needs rather than diagnostic exclusion', () => {
    const performance = lightFlows.performance!
    const serialized = JSON.stringify(performance)

    expect(performance.reasoning?.[0]?.en).toMatch(/duty to inquire/i)
    expect(performance.reasoning?.[1]?.en).toMatch(/disability-related needs/i)
    expect(serialized).not.toMatch(/ruling out a medical cause/i)
  })

  it('keeps accommodation medical-information requests proportionate and non-diagnostic by default', () => {
    const accommodation = lightFlows.accommodation!

    expect(accommodation.text.en).toMatch(/reasonably necessary/i)
    expect(accommodation.text.en).toMatch(/diagnosis is generally unnecessary/i)
    expect(accommodation.text.en).toMatch(/circumstances justify additional information/i)
  })

  it('describes common-law notice as a factor-based assessment, not a rule of thumb', () => {
    const notice = followupReplies['Estimate notice exposure']!

    expect(notice.reasoning?.[0]?.en).toMatch(/reasonable-notice assessment/i)
    expect(notice.reasoning?.[0]?.en).toMatch(/age.*role.*length of service.*similar employment/i)
    expect(notice.reasoning?.[0]?.en).not.toMatch(/rule of thumb/i)
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
