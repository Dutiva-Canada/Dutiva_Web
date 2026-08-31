import { describe, expect, it } from 'vitest'
import { demoTodayISO } from '@/data'
import { isCanonicalMemoryDate } from '@/data/memoryDates'
import { formatMemoryDate, formatMemoryResumedSub } from './memoryDates'

describe('isCanonicalMemoryDate', () => {
  it('accepts valid calendar dates including leap days', () => {
    expect(isCanonicalMemoryDate('2026-07-05')).toBe(true)
    expect(isCanonicalMemoryDate('2024-02-29')).toBe(true)
  })

  it('rejects relative labels and malformed values', () => {
    for (const value of [
      'Today',
      'Aujourd’hui',
      'Jul 5',
      '2026-7-5',
      '2026-13-01',
      '2026-00-10',
      '2026-02-30',
      '2026-04-31',
      'banana',
      '2025-02-29',
    ]) {
      expect(isCanonicalMemoryDate(value)).toBe(false)
    }
  })
})

describe('formatMemoryDate', () => {
  it('renders Today / Aujourd’hui when the ISO date matches the reference day', () => {
    expect(formatMemoryDate(demoTodayISO, 'en', demoTodayISO)).toBe('Today')
    expect(formatMemoryDate(demoTodayISO, 'fr', demoTodayISO)).toBe('Aujourd’hui')
  })

  it('renders a short localized date for other stored values', () => {
    expect(formatMemoryDate('2026-07-02', 'en', demoTodayISO)).toBe('Jul 2')
    expect(formatMemoryDate('2026-07-02', 'fr', demoTodayISO)).toMatch(/2 juill/)
  })
})

describe('formatMemoryResumedSub', () => {
  it('derives Resumed today / Repris aujourd’hui from resumedAt on the scenario date', () => {
    const sub = formatMemoryResumedSub(demoTodayISO, demoTodayISO)
    expect(sub.en).toBe('Resumed today')
    expect(sub.fr).toBe('Repris aujourd’hui')
  })

  it('derives a short date subtitle when resumed on another day', () => {
    const sub = formatMemoryResumedSub('2026-07-02', demoTodayISO)
    expect(sub.en).toBe('Resumed Jul 2')
    expect(sub.fr).toMatch(/Repris le 2 juill/)
  })
})
