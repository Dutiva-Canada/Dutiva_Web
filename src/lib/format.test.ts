import { describe, expect, it, vi } from 'vitest'
import {
  localDateISO,
  localDatePlusDaysISO,
  localDayOfISO,
  localTodayISO,
  relativeTime,
} from './format'

const now = new Date('2026-03-01T12:00:00Z')

describe('localDateISO / localTodayISO', () => {
  it('formats the local calendar day, not the UTC day', () => {
    /* 2026-03-01T02:00:00Z is still Feb 28 anywhere in Canada (UTC-3:30..-8).
       UTC slicing would say '2026-03-01' — a day ahead of the user's day. */
    const eveningUTC = new Date('2026-03-01T02:00:00Z')
    const expected = `${eveningUTC.getFullYear()}-${String(eveningUTC.getMonth() + 1).padStart(2, '0')}-${String(eveningUTC.getDate()).padStart(2, '0')}`
    expect(localDateISO(eveningUTC)).toBe(expected)
    expect(localDateISO(eveningUTC)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('localTodayISO matches the local calendar day', () => {
    vi.useFakeTimers()
    try {
      /* Freeze at 01:30 UTC — the local day is behind UTC wherever the suite
         runs outside UTC+X, and equal inside it; either way it must equal the
         machine's local date, never toISOString's. */
      vi.setSystemTime(new Date('2026-06-15T01:30:00Z'))
      const d = new Date()
      const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      expect(localTodayISO()).toBe(expected)
    } finally {
      vi.useRealTimers()
    }
  })

  it('localDatePlusDaysISO counts local calendar days (DST-safe)', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-03-07T12:00:00')) /* day before NA spring-forward */
      const d = new Date()
      d.setDate(d.getDate() + 7)
      const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      expect(localDatePlusDaysISO(7)).toBe(expected)
      expect(localDatePlusDaysISO(0)).toBe(localTodayISO())
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('localDayOfISO', () => {
  it('passes date-only strings through verbatim — never shifts a stored date', () => {
    expect(localDayOfISO('2026-03-01')).toBe('2026-03-01')
  })

  it('resolves a timestamp to the user\'s local calendar day', () => {
    const ts = '2026-03-02T02:30:00.000Z'
    expect(localDayOfISO(ts)).toBe(localDateISO(new Date(ts)))
    /* The UTC slice claims March 2; west of UTC the local day is still
       March 1. On a UTC-zoned host both coincide — skip rather than flake. */
    if (new Date(ts).getTimezoneOffset() !== 0) {
      expect(localDayOfISO(ts)).not.toBe(ts.slice(0, 10))
    }
  })

  it('falls back to the date prefix for unparseable timestamps', () => {
    expect(localDayOfISO('2026-13-40T99:99:99')).toBe('2026-13-40')
  })
})

describe('relativeTime', () => {
  it('buckets minutes, hours and days', () => {
    expect(relativeTime('2026-03-01T11:59:40Z', now)).toEqual({ unit: 'now', n: 0 })
    expect(relativeTime('2026-03-01T11:30:00Z', now)).toEqual({ unit: 'min', n: 30 })
    expect(relativeTime('2026-03-01T06:00:00Z', now)).toEqual({ unit: 'hr', n: 6 })
    expect(relativeTime('2026-02-26T12:00:00Z', now)).toEqual({ unit: 'day', n: 3 })
  })

  it('returns null for future or unparseable timestamps', () => {
    expect(relativeTime('2026-03-02T00:00:00Z', now)).toBeNull()
    expect(relativeTime('not-a-date', now)).toBeNull()
  })
})
