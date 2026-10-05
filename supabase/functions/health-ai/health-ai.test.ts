import { describe, expect, it } from 'vitest'
import {
  buildHabitStatuses,
  buildHealthFacts,
  chatPrompt,
  habitPrompt,
  parseChatReply,
  parseHabit,
  recapPrompt,
  reflectPrompt,
  resolveHabitRef,
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

const HABITS = [
  { id: 'h1', name: 'Walk' },
  { id: 'h2', name: 'Evening stretch' },
]
const TODAY = '2026-10-02'

describe('buildHabitStatuses', () => {
  it('marks done-today and counts streaks back from today', () => {
    const statuses = buildHabitStatuses(
      HABITS,
      [
        { habit_id: 'h1', day: '2026-10-02' },
        { habit_id: 'h1', day: '2026-10-01' },
        { habit_id: 'h1', day: '2026-09-30' },
        { habit_id: 'h2', day: '2026-10-01' },
        { habit_id: 'h2', day: '2026-09-30' },
      ],
      TODAY,
    )
    expect(statuses).toEqual([
      { id: 'h1', name: 'Walk', doneToday: true, streak: 3 },
      /* Today is unmarked but the streak started yesterday — the same
         leniency the client-side habitStreak gives. */
      { id: 'h2', name: 'Evening stretch', doneToday: false, streak: 2 },
    ])
  })

  it('an empty log set streaks to zero without error', () => {
    expect(buildHabitStatuses(HABITS, [], TODAY).map((s) => s.streak)).toEqual([0, 0])
    expect(buildHabitStatuses([], [], TODAY)).toEqual([])
  })
})

describe('chatPrompt', () => {
  const facts = buildHealthFacts([], HABITS, [], 14, NOW)
  it('carries the non-clinical rules, the action grammar and the crisis line', () => {
    const p = chatPrompt(facts, [], TODAY, 'en')
    expect(p.role).toBe('system')
    expect(p.content).toContain('non-clinical')
    expect(p.content).toContain('mark_habit_done')
    expect(p.content).toContain('9-8-8')
    expect(p.content).toContain('action')
    expect(p.content).toContain(TODAY)
  })
  it('lists habit status for the model and switches language', () => {
    const statuses = buildHabitStatuses(HABITS, [{ habit_id: 'h1', day: TODAY }], TODAY)
    const p = chatPrompt(facts, statuses, TODAY, 'fr')
    expect(p.content).toContain('"Walk" — done today, streak 1 day')
    expect(p.content).toContain('"Evening stretch" — not done today, streak 0 days')
    expect(p.content).toContain('Canadian French')
  })
})

describe('parseChatReply', () => {
  it('parses a reply with no action', () => {
    expect(parseChatReply('{"reply":"Looks like a steady week.","action":null}')).toEqual({
      reply: 'Looks like a steady week.',
      action: null,
    })
  })
  it('parses a reply with a habit action', () => {
    expect(
      parseChatReply('{"reply":"Done!","action":{"type":"mark_habit_done","habit":"Walk"}}'),
    ).toEqual({ reply: 'Done!', action: { type: 'mark_habit_done', habit: 'Walk' } })
  })
  it('validates check-in bounds', () => {
    expect(
      parseChatReply('{"reply":"r","action":{"type":"add_checkin","mood":3,"energy":2}}'),
    ).toEqual({ reply: 'r', action: { type: 'add_checkin', mood: 3, energy: 2, note: undefined } })
    expect(
      parseChatReply('{"reply":"r","action":{"type":"add_checkin","mood":9}}'),
    ).toBeNull()
  })
  it('rejects unknown actions, bad JSON and empty replies', () => {
    expect(parseChatReply('{"reply":"r","action":{"type":"delete_everything"}}')).toBeNull()
    expect(parseChatReply('{"reply":"r","action":{"type":"mark_habit_done"}}')).toBeNull()
    expect(parseChatReply('plain text')).toBeNull()
    expect(parseChatReply('{"action":null}')).toBeNull()
    expect(parseChatReply(null)).toBeNull()
  })
})

describe('resolveHabitRef', () => {
  const statuses = buildHabitStatuses(HABITS, [], TODAY)
  it('matches exact names case-insensitively and unique substrings', () => {
    expect(resolveHabitRef('walk', statuses)?.id).toBe('h1')
    expect(resolveHabitRef('stretch', statuses)?.id).toBe('h2')
  })
  it('returns null for unknown names', () => {
    expect(resolveHabitRef('meditate', statuses)).toBeNull()
    expect(resolveHabitRef('', statuses)).toBeNull()
  })
})
