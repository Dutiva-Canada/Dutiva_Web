import { describe, expect, it } from 'vitest'
import {
  PLANS,
  annualTotal,
  getPlanById,
  hasPaidPlanAccess,
  hasPlanAccess,
  normalizePlanId,
} from './plans'

describe('plans config', () => {
  it('defines exactly the four landing-page tiers, in ascending price order', () => {
    expect(PLANS.map((p) => p.id)).toEqual(['free', 'starter', 'growth', 'pro'])
    expect(PLANS.map((p) => p.monthlyPrice)).toEqual([0, 24, 49, 99])
  })

  it('marks growth as the popular plan, matching the landing page', () => {
    expect(PLANS.find((p) => p.popular)?.id).toBe('growth')
  })

  it('looks up a plan by id', () => {
    expect(getPlanById('growth')?.monthlyPrice).toBe(49)
    expect(getPlanById('nonexistent')).toBeUndefined()
  })

  it('normalizes unknown or missing plan ids to free', () => {
    expect(normalizePlanId('growth')).toBe('growth')
    expect(normalizePlanId('enterprise')).toBe('free')
    expect(normalizePlanId(undefined)).toBe('free')
  })

  it('ranks plan access hierarchically', () => {
    expect(hasPlanAccess('pro', 'starter')).toBe(true)
    expect(hasPlanAccess('free', 'starter')).toBe(false)
    expect(hasPlanAccess('growth', 'growth')).toBe(true)
  })

  it('requires both sufficient tier and an active subscription for paid plan access', () => {
    expect(hasPaidPlanAccess('pro', 'growth', 'active')).toBe(true)
    expect(hasPaidPlanAccess('starter', 'growth', 'active')).toBe(false)
    expect(hasPaidPlanAccess('pro', 'growth', 'past_due')).toBe(false)
    expect(hasPaidPlanAccess('pro', 'growth', 'canceled')).toBe(false)
  })

  it('charges exactly ten monthly payments on annual billing', () => {
    expect(annualTotal(24)).toBe(240)
    expect(annualTotal(49)).toBe(490)
    expect(annualTotal(99)).toBe(990)
  })
})
