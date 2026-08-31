import { describe, expect, it } from 'vitest'
import {
  isValidDurationMinutes,
  parseProposedSlots,
  parseSlotIndex,
  rowsNeedingFollowup,
  rowsNeedingReminder,
} from './scheduledCalls'
import type { SchedulerRow } from './scheduledCalls'

const NOW = new Date('2026-08-10T12:00:00.000Z')
const future = (hours: number) => new Date(NOW.getTime() + hours * 60 * 60 * 1000).toISOString()
const past = (hours: number) => new Date(NOW.getTime() - hours * 60 * 60 * 1000).toISOString()

describe('parseProposedSlots', () => {
  it('accepts 1-3 future ranges', () => {
    const slots = parseProposedSlots([{ start: future(24), end: future(24.5) }], NOW)
    expect(slots).toHaveLength(1)
  })

  it('rejects zero slots', () => {
    expect(parseProposedSlots([], NOW)).toBeNull()
  })

  it('rejects more than 3 slots', () => {
    const four = Array.from({ length: 4 }, (_, i) => ({
      start: future(24 + i),
      end: future(24.5 + i),
    }))
    expect(parseProposedSlots(four, NOW)).toBeNull()
  })

  it('rejects a slot ending before or at its own start', () => {
    expect(parseProposedSlots([{ start: future(24), end: future(24) }], NOW)).toBeNull()
    expect(parseProposedSlots([{ start: future(24), end: future(23) }], NOW)).toBeNull()
  })

  it('rejects a slot that starts in the past', () => {
    expect(parseProposedSlots([{ start: past(1), end: future(1) }], NOW)).toBeNull()
  })

  it('rejects malformed input', () => {
    expect(parseProposedSlots('not an array', NOW)).toBeNull()
    expect(parseProposedSlots([{ start: 'not a date', end: future(1) }], NOW)).toBeNull()
    expect(parseProposedSlots([{ start: future(1) }], NOW)).toBeNull()
    expect(parseProposedSlots([null], NOW)).toBeNull()
  })

  it('normalizes to ISO strings', () => {
    const slots = parseProposedSlots([{ start: future(24), end: future(24.5) }], NOW)
    expect(slots?.[0]?.start).toBe(new Date(future(24)).toISOString())
  })
})

describe('isValidDurationMinutes', () => {
  it('accepts the documented range', () => {
    expect(isValidDurationMinutes(10)).toBe(true)
    expect(isValidDurationMinutes(30)).toBe(true)
    expect(isValidDurationMinutes(120)).toBe(true)
  })

  it('rejects outside the range, and non-numbers', () => {
    expect(isValidDurationMinutes(9)).toBe(false)
    expect(isValidDurationMinutes(121)).toBe(false)
    expect(isValidDurationMinutes('30')).toBe(false)
    expect(isValidDurationMinutes(Number.NaN)).toBe(false)
  })
})

describe('parseSlotIndex', () => {
  it('accepts an in-range integer', () => {
    expect(parseSlotIndex(0, 3)).toBe(0)
    expect(parseSlotIndex(2, 3)).toBe(2)
  })

  it('rejects out-of-range, non-integer, or non-numeric input', () => {
    expect(parseSlotIndex(3, 3)).toBeNull()
    expect(parseSlotIndex(-1, 3)).toBeNull()
    expect(parseSlotIndex(1.5, 3)).toBeNull()
    expect(parseSlotIndex('1', 3)).toBeNull()
  })
})

function row(overrides: Partial<SchedulerRow>): SchedulerRow {
  return {
    id: 'row-1',
    confirmedStart: null,
    confirmedEnd: null,
    reminderSentAt: null,
    followupFlaggedAt: null,
    ...overrides,
  }
}

describe('rowsNeedingReminder', () => {
  it('includes a confirmed call starting within the next 24 hours, not yet reminded', () => {
    const rows = [row({ confirmedStart: future(12) })]
    expect(rowsNeedingReminder(rows, NOW)).toEqual(rows)
  })

  it('excludes a call more than 24 hours out', () => {
    expect(rowsNeedingReminder([row({ confirmedStart: future(25) })], NOW)).toEqual([])
  })

  it('excludes a call that has already started', () => {
    expect(rowsNeedingReminder([row({ confirmedStart: past(1) })], NOW)).toEqual([])
  })

  it('excludes a call already reminded', () => {
    expect(
      rowsNeedingReminder([row({ confirmedStart: future(12), reminderSentAt: past(1) })], NOW),
    ).toEqual([])
  })

  it('excludes a call with no confirmed start (still just proposed)', () => {
    expect(rowsNeedingReminder([row({ confirmedStart: null })], NOW)).toEqual([])
  })
})

describe('rowsNeedingFollowup', () => {
  it('includes a call whose end passed more than 2 hours ago, not yet flagged', () => {
    const rows = [row({ confirmedEnd: past(3) })]
    expect(rowsNeedingFollowup(rows, NOW)).toEqual(rows)
  })

  it('excludes a call that ended less than 2 hours ago', () => {
    expect(rowsNeedingFollowup([row({ confirmedEnd: past(1) })], NOW)).toEqual([])
  })

  it('excludes a call already flagged', () => {
    expect(
      rowsNeedingFollowup([row({ confirmedEnd: past(3), followupFlaggedAt: past(1) })], NOW),
    ).toEqual([])
  })

  it('excludes a call with no confirmed end', () => {
    expect(rowsNeedingFollowup([row({ confirmedEnd: null })], NOW)).toEqual([])
  })
})
