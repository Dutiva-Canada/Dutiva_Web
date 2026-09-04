import { describe, expect, it } from 'vitest'
import { onboardingSupportPath, onboardingSupportPrefill } from './onboardingRequest'

describe('onboardingSupportPrefill', () => {
  it('hides Free and Starter', () => {
    expect(onboardingSupportPrefill('none')).toBeNull()
    expect(onboardingSupportPath('none')).toBeNull()
  })

  it('Growth requests a walkthrough by email', () => {
    const prefill = onboardingSupportPrefill('walkthrough_on_request')
    expect(prefill?.category).toBe('sales')
    expect(prefill?.responseMethod).toBe('email')
    expect(onboardingSupportPath('walkthrough_on_request')).toBe('/app/support?intent=walkthrough')
  })

  it('Pro prefers a scheduled call', () => {
    const prefill = onboardingSupportPrefill('walkthrough_and_call')
    expect(prefill?.responseMethod).toBe('scheduled_call')
    expect(onboardingSupportPath('walkthrough_and_call')).toBe(
      '/app/support?intent=onboarding-call',
    )
  })
})
