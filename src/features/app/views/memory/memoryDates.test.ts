import { describe, expect, it } from 'vitest'
import { demoTodayISO } from '@/data'
import { isCanonicalMemoryDate } from '@/data/memoryDates'
import { formatMemoryDate, formatMemoryResumedSub } from './memoryDates'

describe('isCanonicalMemoryDate re-export', () => {
  it('rejects timestamp suffixes on otherwise valid date prefixes', () => {
    expect(isCanonicalMemoryDate('2026-07-05T12:00:00Z')).toBe(false)
    expect(isCanonicalMemoryDate('2026-07-05banana')).toBe(false)
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
