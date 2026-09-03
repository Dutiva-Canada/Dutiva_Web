import { describe, expect, it } from 'vitest'
import {
  ADVISOR_MONTHLY_BY_PLAN,
  hasOrgPlanAccess,
  normalizeOrgPlan,
  planAllowsAdvisorMemory,
  planFeatureGatesEnabled,
} from './planEntitlements.ts'

describe('advisor-chat planEntitlements', () => {
  it('normalizes plan ids', () => {
    expect(normalizeOrgPlan('growth')).toBe('growth')
    expect(normalizeOrgPlan('PRO')).toBe('pro')
    expect(normalizeOrgPlan('advanced')).toBe('free')
    expect(normalizeOrgPlan(null)).toBe('free')
  })

  it('ranks the plan hierarchy', () => {
    expect(hasOrgPlanAccess('pro', 'growth')).toBe(true)
    expect(hasOrgPlanAccess('starter', 'growth')).toBe(false)
    expect(hasOrgPlanAccess('free', 'free')).toBe(true)
  })

  it('allows Advisor memory only on Growth and Professional', () => {
    expect(planAllowsAdvisorMemory('free')).toBe(false)
    expect(planAllowsAdvisorMemory('starter')).toBe(false)
    expect(planAllowsAdvisorMemory('growth')).toBe(true)
    expect(planAllowsAdvisorMemory('pro')).toBe(true)
  })

  it('mirrors catalogue monthly allowances', () => {
    expect(ADVISOR_MONTHLY_BY_PLAN).toEqual({
      free: 20,
      starter: 80,
      growth: 200,
      pro: 400,
    })
  })

  it('defaults feature gates to off without env', () => {
    expect(planFeatureGatesEnabled()).toBe(false)
  })
})
