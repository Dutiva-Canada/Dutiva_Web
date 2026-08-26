import { describe, expect, it } from 'vitest'
import {
  addBusinessDays,
  initialResponseDueDate,
  isBusinessDay,
  MAX_CUSTOMER_PRIORITY,
  ontarioStatutoryHolidays,
  responseTargetFor,
  applyPaidSupportFloor,
  suggestPriority,
  supportQueueRank,
} from './triage'
import type { TriageInput } from './triage'

const utc = (y: number, m1: number, d: number) => new Date(Date.UTC(y, m1 - 1, d))

describe('suggestPriority', () => {
  it('never returns critical from customer input', () => {
    const inputs: TriageInput[] = [
      { category: 'security', impact: 'blocking', urgency: 'urgent' },
      { category: 'account_access', impact: 'blocking', urgency: 'urgent' },
      { category: 'privacy', impact: 'blocking', urgency: 'urgent' },
    ]
    for (const input of inputs) {
      expect(suggestPriority(input)).toBe(MAX_CUSTOMER_PRIORITY)
      expect(suggestPriority(input)).not.toBe('critical')
    }
  })

  it('maps a blocking issue to high', () => {
    expect(suggestPriority({ category: 'technical', impact: 'blocking', urgency: 'soon' })).toBe(
      'high',
    )
  })

  it('maps an isolated defect to standard', () => {
    expect(suggestPriority({ category: 'technical', impact: 'minor', urgency: 'soon' })).toBe(
      'standard',
    )
  })

  it('maps a general question or feature request to low', () => {
    expect(
      suggestPriority({ category: 'product_question', impact: 'none', urgency: 'whenever' }),
    ).toBe('low')
  })

  it('does not let an "urgent" no-impact request inflate above low', () => {
    expect(
      suggestPriority({ category: 'product_question', impact: 'none', urgency: 'urgent' }),
    ).toBe('low')
  })

  it('floors security concerns at high even when described as minor', () => {
    expect(suggestPriority({ category: 'security', impact: 'minor', urgency: 'whenever' })).toBe(
      'high',
    )
  })

  it('treats an accessibility barrier as at least standard, high when blocking', () => {
    expect(
      suggestPriority({ category: 'accessibility', impact: 'none', urgency: 'whenever' }),
    ).toBe('standard')
    expect(
      suggestPriority({ category: 'accessibility', impact: 'blocking', urgency: 'soon' }),
    ).toBe('high')
  })
})

describe('Ontario statutory holidays', () => {
  it('computes the 2026 fixed and floating holidays', () => {
    const h = ontarioStatutoryHolidays(2026)
    expect(h.has('2026-01-01')).toBe(true) // New Year's Day
    expect(h.has('2026-02-16')).toBe(true) // Family Day (3rd Mon)
    expect(h.has('2026-04-03')).toBe(true) // Good Friday
    expect(h.has('2026-05-18')).toBe(true) // Victoria Day (Mon on/before May 24)
    expect(h.has('2026-07-01')).toBe(true) // Canada Day
    expect(h.has('2026-09-07')).toBe(true) // Labour Day (1st Mon)
    expect(h.has('2026-10-12')).toBe(true) // Thanksgiving (2nd Mon)
    expect(h.has('2026-12-25')).toBe(true) // Christmas
    expect(h.has('2026-12-26')).toBe(true) // Boxing Day
    expect(h.size).toBe(9)
  })
})

describe('isBusinessDay', () => {
  it('recognizes weekdays, weekends, and holidays', () => {
    expect(isBusinessDay(utc(2026, 7, 16))).toBe(true) // Thursday
    expect(isBusinessDay(utc(2026, 7, 17))).toBe(true) // Friday
    expect(isBusinessDay(utc(2026, 7, 18))).toBe(false) // Saturday
    expect(isBusinessDay(utc(2026, 7, 19))).toBe(false) // Sunday
    expect(isBusinessDay(utc(2026, 7, 1))).toBe(false) // Canada Day (Wed)
    expect(isBusinessDay(utc(2026, 12, 25))).toBe(false) // Christmas (Fri)
  })
})

describe('addBusinessDays', () => {
  it('skips a weekend', () => {
    // Friday 2026-07-17 + 1 business day = Monday 2026-07-20
    expect(addBusinessDays(utc(2026, 7, 17), 1)).toEqual(utc(2026, 7, 20))
  })
  it('skips a statutory holiday', () => {
    // Tuesday 2026-06-30 + 1 business day skips Canada Day (Wed Jul 1) -> Thu Jul 2
    expect(addBusinessDays(utc(2026, 6, 30), 1)).toEqual(utc(2026, 7, 2))
  })
})

describe('initialResponseDueDate', () => {
  it('resolves standard (2 business days) skipping the weekend', () => {
    // Thursday 2026-07-16 + 2 business days -> Monday 2026-07-20
    expect(initialResponseDueDate(utc(2026, 7, 16), 'standard')).toEqual(utc(2026, 7, 20))
  })
  it('keeps a critical target on the same business day when submitted on one', () => {
    expect(initialResponseDueDate(utc(2026, 7, 16), 'critical')).toEqual(utc(2026, 7, 16))
  })
  it('moves a critical target submitted on a weekend to the next business day', () => {
    // Saturday 2026-07-04 -> Monday 2026-07-06
    expect(initialResponseDueDate(utc(2026, 7, 4), 'critical')).toEqual(utc(2026, 7, 6))
  })
})

describe('applyPaidSupportFloor', () => {
  it('floors Growth and Pro product tickets at high', () => {
    expect(applyPaidSupportFloor('low', 'growth', 'product_question')).toBe('high')
    expect(applyPaidSupportFloor('standard', 'pro', 'technical')).toBe('high')
  })

  it('leaves Starter and free at the suggested priority', () => {
    expect(applyPaidSupportFloor('low', 'starter', 'product_question')).toBe('low')
    expect(applyPaidSupportFloor('standard', 'free', 'technical')).toBe('standard')
    expect(applyPaidSupportFloor('low', null, 'other')).toBe('low')
  })

  it('does not change restricted categories', () => {
    expect(applyPaidSupportFloor('standard', 'pro', 'privacy')).toBe('standard')
    expect(applyPaidSupportFloor('low', 'growth', 'complaint')).toBe('low')
    expect(applyPaidSupportFloor('high', 'pro', 'security')).toBe('high')
  })
})

describe('supportQueueRank', () => {
  it('puts paid plans ahead of free and unknown', () => {
    expect(supportQueueRank('pro')).toBeLessThan(supportQueueRank('growth'))
    expect(supportQueueRank('growth')).toBeLessThan(supportQueueRank('starter'))
    expect(supportQueueRank('starter')).toBeLessThan(supportQueueRank('free'))
    expect(supportQueueRank('free')).toBe(supportQueueRank(null))
  })
})

describe('responseTargetFor', () => {
  it('exposes the published unit and amount per priority', () => {
    expect(responseTargetFor('critical')).toMatchObject({ amount: 4, unit: 'business_hours' })
    expect(responseTargetFor('high')).toMatchObject({ amount: 1, unit: 'business_days' })
    expect(responseTargetFor('standard')).toMatchObject({ amount: 2, unit: 'business_days' })
    expect(responseTargetFor('low')).toMatchObject({ amount: 5, unit: 'business_days' })
  })
})
