import { describe, expect, it } from 'vitest'
import { demoTodayISO } from '@/data'
import { formatMemoryDate, formatMemoryResumedSub, isCanonicalMemoryDate } from './memoryDates'

describe('isCanonicalMemoryDate', () => {
  it('accepts a valid YYYY-MM-DD value', () => {
    expect(isCanonicalMemoryDate('2026-07-05')).toBe(true)
  })

  it('rejects relative labels and malformed values', () => {
    for (const value of ['Today', 'Aujourd’hui', 'Yesterday', 'Jul 5', 'banana', '2026-99-99']) {
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
