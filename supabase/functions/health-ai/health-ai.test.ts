import { describe, expect, it } from 'vitest'
import {
  buildHealthFacts,
  habitPrompt,
  parseHabit,
  recapPrompt,
  reflectPrompt,
} from './handlers'

const NOW = '2026-10-02T18:00:00.000Z'
const dayAgo = (n: number, hour = 12) => {
  const d = new Date(Date.parse(NOW) - n * 86_400_000)
  d.setUTCHours(hour)
  return d.toISOString()
}
const isoDay = (n: number) => dayAgo(n).slice(0, 10)

describe('buildHealthFacts', () => {
  it('aggregates mood, energy, counts within the window', () => {
    const facts = buildHealthFacts(
      [
        { mood: 4, energy: 3, created_at: dayAgo(1) },
        { mood: 2, energy: null, created_at: dayAgo(3) },
        { mood: 5, energy: 4, created_at: dayAgo(40) }, // outside window
      ],
      [{ id: 'h1', name: 'Walk' }],
      [{ habit_id: 'h1', day: isoDay(1) }],
      14,
      NOW,
    )
    expect(facts.checkInCount).toBe(2)
    expect(facts.avgMood).toBe(3)
    expect(facts.avgEnergy).toBe(3)
    expect(facts.habitsKept).toBe(1)
    expect(facts.habitsTotal).toBe(1)
    expect(facts.bestHabitDays).toBe(1)
  })

  it('computes mood trend across the halves', () => {
    const up = buildHealthFacts(
      [
        { mood: 2, energy: null, created_at: dayAgo(10) },
        { mood: 2, energy: null, created_at: dayAgo(9) },
        { mood: 4, energy: null, created_at: dayAgo(2) },
        { mood: 5, energy: null, created_at: dayAgo(1) },
      ],
      [],
      [],
      14,
      NOW,
    )
    expect(up.moodTrend).toBe('up')
    const flat = buildHealthFacts(
      [{ mood: 3, energy: null, created_at: dayAgo(1) }],
      [],
      [],
      14,
      NOW,
    )
    expect(flat.moodTrend).toBeNull() // one half empty → no trend claim
  })

  it('handles an empty window without fabricating stats', () => {
    const f = buildHealthFacts([], [], [], 14, NOW)
    expect(f.checkInCount).toBe(0)
    expect(f.avgMood).toBeNull()
    expect(f.moodTrend).toBeNull()
    expect(f.habitsKept).toBe(0)
  })
})

describe('prompt guardrails', () => {
  const facts = buildHealthFacts([], [{ id: 'h1', name: 'Walk' }], [], 14, NOW)
  it('carries the non-clinical rules in both prompts', () => {
    for (const p of [reflectPrompt(facts, 'en'), recapPrompt(facts, 'en')]) {
      expect(p).toContain('non-clinical')
      expect(p).toContain('Never diagnose')
      expect(p).not.toContain('journal entries')
    }
  })
  it('switches language', () => {
    expect(reflectPrompt(facts, 'fr')).toContain('Canadian French')
    expect(recapPrompt(facts, 'fr')).toContain('Canadian French')
  })
  it('recap instructs describe-not-advise', () => {
    expect(recapPrompt(facts, 'en')).toContain('describe')
  })
  it('habit prompt stays non-clinical and names existing habits', () => {
    const p = habitPrompt(facts, ['Morning walk'], 'en')
    expect(p).toContain('non-clinical')
    expect(p).toContain('Morning walk')
    expect(p).toContain('Habit name | one short reason')
  })
  it('habit prompt switches language and handles an empty habit list', () => {
    const p = habitPrompt(facts, [], 'fr')
    expect(p).toContain('Canadian French')
    expect(p).toContain('(none yet)')
  })
})

describe('parseHabit', () => {
  it('parses the name | reason format', () => {
    expect(parseHabit('Evening stretch | five minutes before bed')).toEqual({
      name: 'Evening stretch',
      why: 'five minutes before bed',
    })
  })
  it('accepts a name-only line', () => {
    expect(parseHabit('Ten-minute tidy')).toEqual({ name: 'Ten-minute tidy', why: '' })
  })
  it('strips bullets, numbering, and quotes', () => {
    expect(parseHabit('1. "Glass of water by the bed" | easy win')).toEqual({
      name: 'Glass of water by the bed',
      why: 'easy win',
    })
  })
  it('skips a leading blank line', () => {
    expect(parseHabit('\n\nShort walk | fresh air')).toEqual({ name: 'Short walk', why: 'fresh air' })
  })
  it('returns null for empty or unusable replies', () => {
    expect(parseHabit('')).toBeNull()
    expect(parseHabit('ok')).toBeNull()
  })
})
