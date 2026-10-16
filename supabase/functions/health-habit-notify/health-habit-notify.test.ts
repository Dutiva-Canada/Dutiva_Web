import { describe, expect, it } from 'vitest'
import { atRiskHabits, localDay, reminderRecipients, streakEndingOn } from './handlers'

const habit = (id: string, user_id = 'u1', name = `Habit ${id}`) => ({ id, user_id, name })
const log = (habit_id: string, day: string, user_id = 'u1') => ({ habit_id, user_id, day })

const TODAY = '2026-10-03'
const YESTERDAY = '2026-10-02'

describe('streakEndingOn', () => {
  it('counts consecutive days ending at the given day', () => {
    const days = new Set(['2026-09-30', '2026-10-01', '2026-10-02'])
    expect(streakEndingOn(days, '2026-10-02')).toBe(3)
    expect(streakEndingOn(days, '2026-10-03')).toBe(0)
  })

  it('stops at a gap', () => {
    const days = new Set(['2026-09-29', '2026-10-01', '2026-10-02'])
    expect(streakEndingOn(days, '2026-10-02')).toBe(2)
  })
})

describe('atRiskHabits', () => {
  it('flags a habit logged yesterday but not today', () => {
    const out = atRiskHabits(
      [habit('h1')],
      [log('h1', YESTERDAY)],
      TODAY,
    )
    expect(out.get('u1')).toEqual(['Habit h1'])
  })

  it('skips a habit already done today', () => {
    const out = atRiskHabits(
      [habit('h1')],
      [log('h1', YESTERDAY), log('h1', TODAY)],
      TODAY,
    )
    expect(out.size).toBe(0)
  })

  it('skips a habit whose streak already lapsed (not a risk today)', () => {
    const out = atRiskHabits(
      [habit('h1')],
      [log('h1', '2026-09-28')],
      TODAY,
    )
    expect(out.size).toBe(0)
  })

  it('skips a habit with no logs at all', () => {
    expect(atRiskHabits([habit('h1')], [], TODAY).size).toBe(0)
  })

  it('groups multiple at-risk habits by user and keeps users separate', () => {
    const out = atRiskHabits(
      [habit('h1'), habit('h2'), habit('h3', 'u2', 'Other')],
      [log('h1', YESTERDAY), log('h2', '2026-10-01'), log('h2', YESTERDAY), log('h3', YESTERDAY, 'u2')],
      TODAY,
    )
    expect(out.get('u1')).toEqual(['Habit h1', 'Habit h2'])
    expect(out.get('u2')).toEqual(['Other'])
  })
})

const pref = (user_id: string, email_enabled = true, reminder_enabled = true) => ({
  user_id,
  email_enabled,
  reminder_enabled,
})

describe('localDay', () => {
  const NOW = new Date('2026-10-03T02:00:00Z') // UTC Oct 3 — still Oct 2 in Toronto, already Oct 3 in Sydney

  it('answers the calendar day in the given timezone', () => {
    expect(localDay(NOW, 'Australia/Sydney')).toBe('2026-10-03')
    expect(localDay(NOW, 'America/Toronto')).toBe('2026-10-02')
  })

  it('falls back to the UTC date when the zone is absent or invalid', () => {
    expect(localDay(NOW, null)).toBe('2026-10-03')
    expect(localDay(NOW, 'Not/AZone')).toBe('2026-10-03')
  })
})

describe('atRiskHabits — per-user today and creation floor', () => {
  it('evaluates "today" per recipient — one user\'s yesterday is another\'s today', () => {
    const habits = [habit('h1', 'u1'), habit('h2', 'u2', 'Other')]
    const logs = [log('h1', '2026-10-03'), log('h2', '2026-10-03', 'u2')]
    /* u1 lives a date ahead: the mark is yesterday, streak at risk.
       u2 is on it: the mark is today, already safe. */
    const out = atRiskHabits(habits, logs, (u) => (u === 'u1' ? '2026-10-04' : '2026-10-03'))
    expect(out.get('u1')).toEqual(['Habit h1'])
    expect(out.get('u2')).toBeUndefined()
  })

  it('ignores marks stamped before the habit existed', () => {
    const created = { id: 'h1', user_id: 'u1', name: 'Walk', day: '2026-10-02' }
    const out = atRiskHabits(
      [created],
      [log('h1', '2026-09-30'), log('h1', '2026-09-29')],
      TODAY,
    )
    /* The only marks precede the habit — no live streak to protect. */
    expect(out.size).toBe(0)
  })

  it('floors legacy habits at created_at when day is absent', () => {
    const created = {
      id: 'h1',
      user_id: 'u1',
      name: 'Walk',
      created_at: '2026-10-02T20:00:00Z',
    }
    const out = atRiskHabits([created], [log('h1', '2026-10-01')], TODAY)
    expect(out.size).toBe(0)
  })
})

describe('reminderRecipients', () => {
  it('includes an opted-in user with no check-in today', () => {
    const out = reminderRecipients([pref('u1')], new Set())
    expect(out.has('u1')).toBe(true)
  })

  it('excludes a user who already checked in today', () => {
    const out = reminderRecipients([pref('u1')], new Set(['u1']))
    expect(out.size).toBe(0)
  })

  it('excludes a user whose master email switch is off — opt-out wins over opt-in', () => {
    const out = reminderRecipients([pref('u1', false, true)], new Set())
    expect(out.size).toBe(0)
  })

  it('excludes a user who never opted in', () => {
    const out = reminderRecipients([pref('u1', true, false)], new Set())
    expect(out.size).toBe(0)
  })
})
