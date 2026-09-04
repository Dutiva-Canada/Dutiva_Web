import { describe, expect, it } from 'vitest'
import { clampPolicyReviewDays, POLICY_REVIEW_DAYS_DEFAULT } from './policyReviewSettingsApi'

describe('clampPolicyReviewDays', () => {
  it('defaults invalid values to 90', () => {
    expect(POLICY_REVIEW_DAYS_DEFAULT).toBe(90)
    expect(clampPolicyReviewDays(Number.NaN)).toBe(90)
  })

  it('clamps to 30–365', () => {
    expect(clampPolicyReviewDays(10)).toBe(30)
    expect(clampPolicyReviewDays(400)).toBe(365)
    expect(clampPolicyReviewDays(120.6)).toBe(121)
  })
})
