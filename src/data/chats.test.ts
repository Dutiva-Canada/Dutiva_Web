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

  it('uses Ontario hiring guidance in the hiring light flow', () => {
    const hiring = lightFlows.hiring!
    expect(hiring.reasoning?.[0]?.en).toContain('Ontario')
    expect(hiring.reasoning?.[1]?.en).not.toMatch(/universal written-offer requirement/i)
  })

  it('uses OHS considerations rather than universal home-office obligations', () => {
    const policy = lightFlows.policy!
    expect(policy.reasoning?.[0]?.en).toContain('considerations')
    expect(policy.reasoning?.[0]?.en).not.toMatch(/obligations extend to home offices/i)
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
