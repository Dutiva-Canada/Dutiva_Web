import { describe, expect, it } from 'vitest'
import {
  buildCompanionSignals,
  buildHabitStatuses,
  buildHealthFacts,
  CHAT_ACTION_TYPES,
  chatPrompt,
  createReplyDeltaExtractor,
  entryReactPrompt,
  habitPrompt,
  parseChatReply,
  parseHabit,
  reactPrompt,
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
    for (const p of [reflectPrompt(facts, [], 'en'), recapPrompt(facts, [], 'en')]) {
      expect(p).toContain('non-clinical')
      expect(p).toContain('Never diagnose')
    }
  })
  it('reads the person\'s own words now — every kind carries the signals block', () => {
    const signals = buildCompanionSignals(
      [{ mood: 2, energy: null, note: 'tense morning', created_at: dayAgo(1) }],
      [],
    )
    for (const p of [
      reflectPrompt(facts, signals, 'en'),
      recapPrompt(facts, signals, 'en'),
      habitPrompt(facts, [], signals, 'en'),
    ]) {
      expect(p).toContain('"tense morning"')
      expect(p).toContain('Their recent words')
    }
  })
  it('switches language', () => {
    expect(reflectPrompt(facts, [], 'fr')).toContain('Canadian French')
    expect(recapPrompt(facts, [], 'fr')).toContain('Canadian French')
  })
  it('recap instructs describe-not-advise', () => {
    expect(recapPrompt(facts, [], 'en').toLowerCase()).toContain('describe')
  })
  it('habit prompt stays non-clinical and names existing habits', () => {
    const p = habitPrompt(facts, ['Morning walk'], [], 'en')
    expect(p).toContain('non-clinical')
    expect(p).toContain('Morning walk')
    expect(p).toContain('Habit name | one short reason')
  })
  it('habit prompt switches language and handles an empty habit list', () => {
    const p = habitPrompt(facts, [], [], 'fr')
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
  it('names the companion, keeps the guardrails, the action grammar and the crisis line', () => {
    const p = chatPrompt(facts, [], [], TODAY, 'en')
    expect(p.role).toBe('system')
    expect(p.content).toContain('Mira')
    expect(p.content).toContain('non-clinical')
    expect(p.content).toContain('software, not a person')
    expect(p.content).toContain('mark_habit_done')
    expect(p.content).toContain('9-8-8')
    expect(p.content).toContain('action')
    expect(p.content).toContain(TODAY)
  })
  it('lists habit status for the model and switches language', () => {
    const statuses = buildHabitStatuses(HABITS, [{ habit_id: 'h1', day: TODAY }], TODAY)
    const p = chatPrompt(facts, statuses, [], TODAY, 'fr')
    expect(p.content).toContain('"Walk" — done today, streak 1 day')
    expect(p.content).toContain('"Evening stretch" — not done today, streak 0 days')
    expect(p.content).toContain('Canadian French')
  })
  it('embeds the person\'s own words when present, and says so when not', () => {
    const signals = buildCompanionSignals(
      [{ mood: 2, energy: null, note: 'rough day at work', created_at: dayAgo(1) }],
      [],
    )
    const withWords = chatPrompt(facts, [], signals, TODAY, 'en')
    expect(withWords.content).toContain('"rough day at work"')
    expect(withWords.content).toContain('mood 2/5')
    const empty = chatPrompt(facts, [], [], TODAY, 'en')
    expect(empty.content).toContain('(nothing shared yet)')
  })
})

describe('buildCompanionSignals', () => {
  it('quotes notes and journal excerpts, newest first, skipping empty text', () => {
    const lines = buildCompanionSignals(
      [
        { mood: 4, energy: 3, note: '', created_at: dayAgo(1) },
        { mood: 2, energy: null, note: 'tense morning', created_at: dayAgo(3) },
        { mood: 3, energy: 3, note: 'better after a walk', created_at: dayAgo(1) },
      ],
      [
        {
          title: 'Sunday',
          body: 'felt calmer after the walk',
          created_at: dayAgo(2),
          shared_at: dayAgo(0),
        },
        { title: '', body: '   ', created_at: dayAgo(1), shared_at: dayAgo(0) },
      ],
    )
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('mood 3/5')
    expect(lines[0]).toContain('"better after a walk"')
    expect(lines[1]).toContain('mood 2/5')
    expect(lines[2]).toContain('journal')
    expect(lines[2]).toContain('"Sunday"')
    expect(lines[2]).toContain('"felt calmer after the walk"')
  })

  it('excerpts only entries the person explicitly shared', () => {
    const lines = buildCompanionSignals(
      [],
      [
        {
          title: 'private',
          body: 'never shown',
          created_at: dayAgo(1),
          shared_at: null,
        },
        {
          title: 'shared',
          body: 'shown',
          created_at: dayAgo(2),
          shared_at: dayAgo(0),
        },
      ],
    )
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('"shared"')
    expect(lines[0]).not.toContain('never shown')
  })

  it('flattens newlines and truncates long text', () => {
    const lines = buildCompanionSignals(
      [{ mood: 3, energy: null, note: `line one\nline two ${'x'.repeat(400)}`, created_at: dayAgo(1) }],
      [{ title: '', body: 'y'.repeat(500), created_at: dayAgo(1), shared_at: dayAgo(0) }],
    )
    expect(lines[0]).toContain('line one line two')
    expect(lines[0]).not.toContain('\n')
    expect(lines[0].length).toBeLessThan(220)
    expect(lines[1].length).toBeLessThan(260)
  })

  it('caps how much of a person\'s writing reaches the prompt', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      mood: 3,
      energy: null,
      note: `note ${i}`,
      created_at: dayAgo(i),
    }))
    const entries = Array.from({ length: 6 }, (_, i) => ({
      title: `e${i}`,
      body: `body ${i}`,
      created_at: dayAgo(i),
      shared_at: dayAgo(0),
    }))
    const lines = buildCompanionSignals(many, entries)
    expect(lines.filter((l) => l.startsWith('- check-in'))).toHaveLength(8)
    expect(lines.filter((l) => l.startsWith('- journal'))).toHaveLength(3)
  })
})

describe('reaction prompts', () => {
  it('reactPrompt carries the companion rules, the event, and the crisis line', () => {
    const p = reactPrompt(
      { type: 'checkin_saved', mood: 2, energy: 1, note: 'rough day' },
      null,
      [],
      TODAY,
      'en',
    )
    expect(p).toContain('Mira')
    expect(p).toContain('software, not a person')
    expect(p).toContain('mood 2/5')
    expect(p).toContain('energy 1/5')
    expect(p).toContain('"rough day"')
    expect(p).toContain('9-8-8')
    expect(p).toContain('one or two short sentences')
    expect(p).toContain(TODAY)
  })

  it('habit_marked names the habit and the server-resolved streak', () => {
    const p = reactPrompt({ type: 'habit_marked', habit: 'Walk' }, 3, [], TODAY, 'en')
    expect(p).toContain('"Walk"')
    expect(p).toContain('streak now 3 days')
  })

  it('habit_marked flags a round-mark streak as a milestone — and stays quiet otherwise', () => {
    const mark = reactPrompt({ type: 'habit_marked', habit: 'Walk' }, 7, [], TODAY, 'en')
    expect(mark).toContain('a round mark')
    const ordinary = reactPrompt({ type: 'habit_marked', habit: 'Walk' }, 6, [], TODAY, 'en')
    expect(ordinary).not.toContain('round mark')
  })

  it('a check-in without a note says so instead of inventing one', () => {
    const p = reactPrompt({ type: 'checkin_saved', mood: 4 }, null, [], TODAY, 'en')
    expect(p).toContain('no note')
    expect(p).not.toContain('note:')
  })

  it('entryReactPrompt quotes the shared entry and says it was chosen', () => {
    const p = entryReactPrompt('Sunday', 'a long entry body', [], TODAY, 'fr')
    expect(p).toContain('chose to share')
    expect(p).toContain('"Sunday"')
    expect(p).toContain('a long entry body')
    expect(p).toContain('Canadian French')
    expect(p).toContain('9-8-8')
    expect(p).toContain('software, not a person')
  })

  /* The crisis path for reactions: a saved check-in whose note reads as
     crisis must route to the 9-8-8 reply, not a "noted!" reaction. The
     prompt is the seam vitest can reach — index.ts carries Deno imports. */
  it('a crisis-flavored check-in note still routes to the crisis reply', () => {
    const p = reactPrompt(
      { type: 'checkin_saved', mood: 1, energy: null, note: 'thinking about ending it' },
      null,
      [],
      TODAY,
      'en',
    )
    expect(p).toContain('thinking about ending it')
    expect(p).toContain('9-8-8')
    expect(p).toContain('reply ONLY with supportive words')
  })

  it('flattens newlines and caps the shared entry body', () => {
    const p = entryReactPrompt(
      '',
      `first line\nsecond line ${'x'.repeat(4000)}`,
      [],
      TODAY,
      'en',
    )
    expect(p).toContain('first line second line')
    expect(p).not.toContain('\nsecond')
    expect(p.length).toBeLessThan(4000)
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

/* Streaming — the model's reply arrives as a JSON object fed piece by
   piece; the extractor emits only the reply field's string content so the
   action block never reaches the bubble mid-stream. */
describe('createReplyDeltaExtractor', () => {
  it('emits only the reply text from streamed JSON', () => {
    const ex = createReplyDeltaExtractor()
    let out = ''
    for (const chunk of [
      '{"reply":"Hel',
      'lo there,',
      ' that sounded heavy.',
      '","action":{"type":"mark_habit_done","habit":"Walk"}}',
    ]) {
      out += ex.push(chunk)
    }
    expect(out).toBe('Hello there, that sounded heavy.')
  })

  it('resolves escapes and never leaks the action block', () => {
    const ex = createReplyDeltaExtractor()
    const out = ex.push('{"reply":"line one\\nline \\"two\\"","action":null}')
    expect(out).toBe('line one\nline "two"')
  })

  it('holds a split escape across chunk boundaries', () => {
    const ex = createReplyDeltaExtractor()
    let out = ex.push('{"reply":"one\\')
    out += ex.push('ntwo\\u00')
    out += ex.push('e9 three","action":null}')
    expect(out).toBe('one\ntwoé three')
  })

  it('emits nothing when the reply key never arrives', () => {
    const ex = createReplyDeltaExtractor()
    expect(ex.push('plain text, no json')).toBe('')
    expect(ex.push('{"other":123}')).toBe('')
  })
})

/* Persona contract — the invariants that make Mira Mira: the non-clinical
   boundary, the crisis line, and a grammar that matches the whitelist. If a
   prompt edit loses one, this breaks before the model does. */
describe('Mira persona contract', () => {
  it('chat prompt carries the non-clinical boundary and the crisis line', () => {
    const p = chatPrompt(buildHealthFacts([], [], [], 14, NOW), [], [], TODAY, 'en')
    expect(p.content).toContain('Mira')
    expect(p.content).toContain('non-clinical')
    expect(p.content).toContain('software, not a person')
    expect(p.content).toContain('9-8-8')
  })

  it('every whitelisted action type appears in the grammar', () => {
    const p = chatPrompt(buildHealthFacts([], [], [], 14, NOW), [], [], TODAY, 'en')
    for (const t of CHAT_ACTION_TYPES) {
      expect(p.content).toContain(`"type":"${t}"`)
    }
  })

  it('react and entry prompts keep the crisis line', () => {
    expect(reactPrompt({ type: 'habit_marked', habit: 'x' }, 1, [], TODAY, 'en')).toContain('9-8-8')
    expect(entryReactPrompt('t', 'b', [], TODAY, 'en')).toContain('9-8-8')
  })
})

/* Internal-staff tier — a verified @dutiva.ca sign-in loosens the
   observations-only register to direct everyday advice. The clinical line
   and the crisis line are identical either way. */
describe('internal advice tier (@dutiva.ca)', () => {
  const facts = buildHealthFacts([], [], [], 14, NOW)

  it('chat prompt carries the advice grant for staff, and keeps the boundaries', () => {
    const p = chatPrompt(facts, [], [], TODAY, 'en', true)
    expect(p.content).toContain('Internal staff account (@dutiva.ca)')
    expect(p.content).toContain('concrete everyday advice')
    expect(p.content).toContain('advise directly')
    expect(p.content).toContain('Never diagnose')
    expect(p.content).toContain('software, not a person')
    expect(p.content).toContain('9-8-8')
    for (const t of CHAT_ACTION_TYPES) {
      expect(p.content).toContain(`"type":"${t}"`)
    }
  })

  it('chat prompt defaults to the observations-only register', () => {
    const p = chatPrompt(facts, [], [], TODAY, 'en')
    expect(p.content).toContain('Meet the person where they are')
    expect(p.content).not.toContain('@dutiva.ca')
    expect(p.content).toContain('at most ONE')
  })

  it('one-shot prompts switch the advice rule, keeping the clinical line', () => {
    for (const p of [
      reflectPrompt(facts, [], 'en', true),
      recapPrompt(facts, [], 'en', true),
      habitPrompt(facts, [], [], 'en', true),
    ]) {
      expect(p).toContain('advice is in scope')
      expect(p).toContain('@dutiva.ca')
      expect(p).toContain('Never diagnose')
    }
    expect(recapPrompt(facts, [], 'en')).toContain("Describe, don't advise")
    expect(recapPrompt(facts, [], 'en', true)).toContain('what you would change')
  })

  it('react and entry prompts permit a suggestion for staff, crisis line intact', () => {
    const r = reactPrompt({ type: 'habit_marked', habit: 'x' }, 1, [], TODAY, 'en', true)
    expect(r).toContain('concrete suggestion')
    expect(r).toContain('9-8-8')
    const e = entryReactPrompt('t', 'b', [], TODAY, 'en', true)
    expect(e).toContain('concrete suggestion')
    expect(e).toContain('9-8-8')
    expect(entryReactPrompt('t', 'b', [], TODAY, 'en')).toContain('not advice')
  })
})
