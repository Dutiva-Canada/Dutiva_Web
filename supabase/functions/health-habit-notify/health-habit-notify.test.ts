import { describe, expect, it } from 'vitest'
import { atRiskHabits, streakEndingOn } from './handlers'

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
