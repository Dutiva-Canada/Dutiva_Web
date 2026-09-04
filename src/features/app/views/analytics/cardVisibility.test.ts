import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  CARD_MIN_ROLE,
  CARD_PLAN_FEATURE,
  analyticsCardPlanFeature,
  analyticsCardVisible,
  visibleAtFloor,
} from './cardVisibility'
import type { AnalyticsCardKey } from './cardVisibility'

const ALL_CARDS = Object.keys(CARD_MIN_ROLE) as AnalyticsCardKey[]

const { PLAN_FEATURE_GATES_ENABLED } = vi.hoisted(() => ({
  PLAN_FEATURE_GATES_ENABLED: { value: true },
}))

vi.mock('@/config/plans', async () => {
  const actual = await vi.importActual<typeof import('@/config/plans')>('@/config/plans')
  return {
    ...actual,
    get PLAN_FEATURE_GATES_ENABLED() {
      return PLAN_FEATURE_GATES_ENABLED.value
    },
  }
})

describe('analyticsCardVisible', () => {
  beforeEach(() => {
    PLAN_FEATURE_GATES_ENABLED.value = true
  })
  afterEach(() => {
    PLAN_FEATURE_GATES_ENABLED.value = true
  })

  it('names the service-milestone card without legacy probation identifiers', () => {
    expect(CARD_MIN_ROLE).toHaveProperty('serviceMilestones')
    expect(CARD_MIN_ROLE).not.toHaveProperty('probation')
  })

  it('maps pricing insight rows onto concrete cards', () => {
    expect(analyticsCardPlanFeature('score')).toBe('compliance_trends')
    expect(analyticsCardPlanFeature('cases')).toBe('case_aging_insights')
    expect(analyticsCardPlanFeature('headcount')).toBe('workforce_insights')
    expect(analyticsCardPlanFeature('acks')).toBeNull()
    expect(CARD_PLAN_FEATURE.documents).toBeUndefined()
  })

  it('shows every card to every member when plan gates are off', () => {
    PLAN_FEATURE_GATES_ENABLED.value = false
    for (const card of ALL_CARDS) {
      expect(analyticsCardVisible(card, 'viewer', false, 'starter')).toBe(true)
    }
  })

  it('hides Growth insight cards on Starter when gates are on', () => {
    expect(analyticsCardVisible('score', 'member', false, 'starter')).toBe(false)
    expect(analyticsCardVisible('cases', 'member', false, 'starter')).toBe(false)
    expect(analyticsCardVisible('headcount', 'member', false, 'starter')).toBe(false)
    expect(analyticsCardVisible('acks', 'member', false, 'starter')).toBe(true)
    expect(analyticsCardVisible('score', 'member', false, 'growth')).toBe(true)
  })

  it('treats a missing role as the table default (member), not as nothing', () => {
    PLAN_FEATURE_GATES_ENABLED.value = false
    for (const card of ALL_CARDS) {
      expect(analyticsCardVisible(card, null, false)).toBe(true)
    }
  })

  it('org admins always pass the role floor; plan still applies unless bypassed', () => {
    expect(analyticsCardVisible('score', null, true, 'starter')).toBe(false)
    expect(
      analyticsCardVisible('score', null, true, 'starter', { bypassPlanGates: true }),
    ).toBe(true)
  })

  it('a raised floor hides the card below it and keeps it above', () => {
    /* The one-word policy change (a card's floor → 'admin') behaves: */
    expect(visibleAtFloor('admin', 'member', false)).toBe(false)
    expect(visibleAtFloor('admin', 'manager', false)).toBe(false)
    expect(visibleAtFloor('admin', 'owner', false)).toBe(true)
    expect(visibleAtFloor('admin', 'member', true)).toBe(true)
    expect(visibleAtFloor('manager', 'member', false)).toBe(false)
    expect(visibleAtFloor('manager', 'manager', false)).toBe(true)
  })
})
