import { describe, expect, it } from 'vitest'
import {
  NOTICE_SCHEDULES,
  lookupStatutoryNoticeWeeks,
} from '@/features/app/advisor/safety/statutoryNotice'
import {
  ONTARIO_NOTICE_BANDS,
  isNoticeQuestion,
  noticeScheduleBlock,
  ontarioNoticeWeeks,
} from './noticeSchedule'

/**
 * Drift test: the edge function's schedule copy must equal the client's
 * statutoryNotice.ts — same discipline as the crisis phrases and the score
 * formula. A band edited on one side only fails here before the prompt and
 * the cross-check can disagree about the law.
 */

describe('notice schedule drift — edge copy vs client copy', () => {
  it('pins the Ontario bands to statutoryNotice.ts', () => {
    const client = NOTICE_SCHEDULES.find((s) => s.jurisdiction === 'ON')
    expect(client?.bands).toEqual(ONTARIO_NOTICE_BANDS)
  })

  it('computes identical lookups across the band edges', () => {
    for (const months of [0, 2, 3, 11, 12, 35, 36, 47, 48, 59, 60, 95, 96, 200]) {
      expect(ontarioNoticeWeeks(months)).toBe(lookupStatutoryNoticeWeeks('ON', months))
    }
    expect(ontarioNoticeWeeks(-1)).toBeNull()
    expect(ontarioNoticeWeeks(Number.NaN)).toBeNull()
  })
})

describe('noticeScheduleBlock', () => {
  it('injects the ladder for an Ontario notice question', () => {
    const block = noticeScheduleBlock('How much notice do I owe a 4-year employee in Ontario?', [
      'ON',
    ])
    expect(block).toContain('Ontario ESA, 2000 s.57')
    expect(block).toContain('- 4 years to under 5 years: 4 weeks')
    expect(block).toContain('- 8 years or more: 8 weeks')
    expect(block).toContain('statutory floor only')
  })

  it('stays silent off-topic, off-jurisdiction, or with no jurisdiction', () => {
    expect(noticeScheduleBlock('What is the Ontario minimum wage?', ['ON'])).toBe('')
    expect(noticeScheduleBlock('How much notice for termination?', ['QC'])).toBe('')
    expect(noticeScheduleBlock('How much notice for termination?', [])).toBe('')
  })

  it('recognizes French notice phrasing', () => {
    expect(isNoticeQuestion('Quel préavis pour un licenciement en Ontario?')).toBe(true)
  })
})
