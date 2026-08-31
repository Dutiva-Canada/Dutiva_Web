import { describe, expect, it } from 'vitest'
import { CARD_MIN_ROLE, analyticsCardVisible, visibleAtFloor } from './cardVisibility'
import type { AnalyticsCardKey } from './cardVisibility'

const ALL_CARDS = Object.keys(CARD_MIN_ROLE) as AnalyticsCardKey[]

describe('analyticsCardVisible', () => {
  it('names the service-milestone card without legacy probation identifiers', () => {
    expect(CARD_MIN_ROLE).toHaveProperty('serviceMilestones')
    expect(CARD_MIN_ROLE).not.toHaveProperty('probation')
  })

  it('shows every card to every member under the current policy', () => {
    for (const card of ALL_CARDS) {
      expect(analyticsCardVisible(card, 'viewer', false)).toBe(true)
      expect(analyticsCardVisible(card, 'member', false)).toBe(true)
    }
  })

  it('treats a missing role as the table default (member), not as nothing', () => {
    for (const card of ALL_CARDS) {
      expect(analyticsCardVisible(card, null, false)).toBe(true)
    }
  })

  it('org admins always see everything, whatever the policy says', () => {
    for (const card of ALL_CARDS) {
      expect(analyticsCardVisible(card, null, true)).toBe(true)
    }
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
