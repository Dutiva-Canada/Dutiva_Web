import { describe, expect, it } from 'vitest'
import { formatMemoryDate } from './memoryDates'
import { demoTodayISO } from '@/data'

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
