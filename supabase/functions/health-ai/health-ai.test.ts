import { describe, expect, it } from 'vitest'
import {
  buildCompanionSignals,
  buildHabitStatuses,
  buildHealthFacts,
  CHAT_ACTION_TYPES,
  chatPrompt,
  createReplyDeltaExtractor,
  detectHealthFlags,
  entryReactPrompt,
  habitPrompt,
  habitToggleNoop,
  HEALTH_FALLBACK_EN,
  HEALTH_FALLBACK_FR,
  HEALTH_REACT_FALLBACK_EN,
  HEALTH_REACT_FALLBACK_FR,
  HEALTH_RECAP_FALLBACK_EN,
  HEALTH_RECAP_FALLBACK_FR,
  HEALTH_REFLECT_FALLBACK_EN,
  HEALTH_REFLECT_FALLBACK_FR,
  lowMoodPatchEligible,
  parseChatReply,
  parseHabit,
  parseReactEvent,
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
    expect(facts.loggedDays).toBe(2)
    expect(facts.avgMood).toBe(3)
    expect(facts.avgEnergy).toBe(3)
    expect(facts.habitsTotal).toBe(1)
    expect(facts.habitDays).toEqual([{ name: 'Walk', days: 1 }])
  })

  it('weights days equally — a day logged three times cannot outweigh a day logged once', () => {
    const sameDay = (hour: number) => {
      const d = new Date(Date.parse(NOW) - 86_400_000)
      d.setUTCHours(hour)
      return d.toISOString()
    }
    const facts = buildHealthFacts(
      [
        { mood: 1, energy: null, created_at: sameDay(8) },
        { mood: 1, energy: null, created_at: sameDay(13) },
        { mood: 1, energy: null, created_at: sameDay(21) },
        { mood: 5, energy: null, created_at: dayAgo(2) },
      ],
      [],
      [],
      14,
      NOW,
    )
    /* Per-check-in would be 2.0; per-day is (1 + 5) / 2 — matching the
       average the Insights card displays. */
    expect(facts.avgMood).toBe(3)
    expect(facts.checkInCount).toBe(4)
    expect(facts.loggedDays).toBe(2)
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

  it('refuses a trend built from one logged day per half', () => {
    const thin = buildHealthFacts(
      [
        { mood: 1, energy: null, created_at: dayAgo(10) },
        { mood: 5, energy: null, created_at: dayAgo(1) },
      ],
      [],
      [],
      14,
      NOW,
    )
    expect(thin.moodTrend).toBeNull()
  })

  it('splits the 14-day window into even 7|7 halves — the boundary day is older', () => {
    /* dayAgo(7) is the hinge: anchored to today it would land in the newer
       half (8|6 split); anchored to the cutoff it closes the older half.
       If it flipped back, the older side would hold one logged day and
       the trend would read null instead of 'up'. */
    const facts = buildHealthFacts(
      [
        { mood: 2, energy: null, created_at: dayAgo(8) },
        { mood: 2, energy: null, created_at: dayAgo(7) },
        { mood: 4, energy: null, created_at: dayAgo(2) },
        { mood: 5, energy: null, created_at: dayAgo(1) },
      ],
      [],
      [],
      14,
      NOW,
    )
    expect(facts.moodTrend).toBe('up')
  })

  it('compares raw half-means — a 0.35 shift must not round down to flat', () => {
    /* Older days mean 2.4 and 2.5 (half 2.45, rounds to 2.5); newer days
       mean 2.8 twice. Rounded halves would diff 0.3 → 'flat'; the real
       0.35 shift is 'up'. */
    const facts = buildHealthFacts(
      [
        { mood: 2, energy: null, created_at: dayAgo(8, 8) },
        { mood: 2, energy: null, created_at: dayAgo(8, 12) },
        { mood: 2, energy: null, created_at: dayAgo(8, 18) },
        { mood: 3, energy: null, created_at: dayAgo(8, 21) },
        { mood: 3, energy: null, created_at: dayAgo(8, 23) },
        { mood: 2, energy: null, created_at: dayAgo(9, 9) },
        { mood: 3, energy: null, created_at: dayAgo(9, 20) },
        { mood: 3, energy: null, created_at: dayAgo(2, 8) },
        { mood: 3, energy: null, created_at: dayAgo(2, 12) },
        { mood: 3, energy: null, created_at: dayAgo(2, 16) },
        { mood: 3, energy: null, created_at: dayAgo(2, 20) },
        { mood: 2, energy: null, created_at: dayAgo(2, 23) },
        { mood: 2, energy: null, created_at: dayAgo(1, 9) },
        { mood: 3, energy: null, created_at: dayAgo(1, 12) },
        { mood: 3, energy: null, created_at: dayAgo(1, 16) },
        { mood: 3, energy: null, created_at: dayAgo(1, 19) },
        { mood: 3, energy: null, created_at: dayAgo(1, 22) },
      ],
      [],
      [],
      14,
      NOW,
    )
    expect(facts.moodTrend).toBe('up')
  })

  it('reports per-habit days marked — including untouched habits and deduped days', () => {
    const facts = buildHealthFacts(
      [],
      [
        { id: 'h1', name: 'Walk' },
        { id: 'h2', name: 'Stretch' },
      ],
      [
        { habit_id: 'h1', day: isoDay(1) },
        { habit_id: 'h1', day: isoDay(1) }, // duplicate row can't inflate
        { habit_id: 'h1', day: isoDay(3) },
        { habit_id: 'h1', day: isoDay(40) }, // outside window
      ],
      14,
      NOW,
    )
    expect(facts.habitDays).toEqual([
      { name: 'Walk', days: 2 },
      { name: 'Stretch', days: 0 },
    ])
  })

  it('handles an empty window without fabricating stats', () => {
    const f = buildHealthFacts([], [], [], 14, NOW)
    expect(f.checkInCount).toBe(0)
    expect(f.loggedDays).toBe(0)
    expect(f.avgMood).toBeNull()
    expect(f.moodTrend).toBeNull()
    expect(f.habitDays).toEqual([])
  })

  it('buckets on the stored local day when the row carries one', () => {
    /* The stored day wins in both directions: a row created_at a date
       outside the window but stamped inside counts, and a row created_at
       inside but stamped outside doesn't. UTC-only bucketing fails both. */
    const facts = buildHealthFacts(
      [
        { mood: 4, energy: null, created_at: dayAgo(20), day: isoDay(2) },
        { mood: 1, energy: null, created_at: dayAgo(1), day: isoDay(20) },
      ],
      [],
      [],
      14,
      NOW,
    )
    expect(facts.checkInCount).toBe(1)
    expect(facts.avgMood).toBe(4)
  })

  it('lets a stored day one date ahead of the anchor in — UTC+ writers exist', () => {
    /* todayUtc is 2026-10-02; a UTC+14 writer's today is 2026-10-03. That
       day is real, not future — but 2026-10-04 is. */
    const facts = buildHealthFacts(
      [
        { mood: 4, energy: null, created_at: dayAgo(0), day: '2026-10-03' },
        { mood: 1, energy: null, created_at: dayAgo(0), day: '2026-10-04' },
      ],
      [],
      [],
      14,
      NOW,
    )
    expect(facts.checkInCount).toBe(1)
    expect(facts.avgMood).toBe(4)
  })

  it('ignores habit marks stamped before the habit existed', () => {
    const facts = buildHealthFacts(
      [],
      [
        { id: 'h1', name: 'Walk', day: isoDay(2) },
        /* Legacy row without `day` — created_at is the floor instead. */
        { id: 'h2', name: 'Stretch', created_at: dayAgo(1) },
      ],
      [
        { habit_id: 'h1', day: isoDay(3) }, // before h1 existed
        { habit_id: 'h1', day: isoDay(1) }, // counts
        { habit_id: 'h2', day: isoDay(4) }, // before h2 existed
      ],
      14,
      NOW,
    )
    expect(facts.habitDays).toEqual([
      { name: 'Walk', days: 1 },
      { name: 'Stretch', days: 0 },
    ])
  })
})

describe('lowMoodPatchEligible', () => {
  const factsFor = (checkIns: { mood: number; energy: number | null; created_at: string }[]) =>
    buildHealthFacts(checkIns, [], [], 14, NOW)

  it('needs five logged days — five check-ins across two days is a bad weekend, not a patch', () => {
    const twoDays = factsFor([
      { mood: 1, energy: null, created_at: dayAgo(1, 8) },
      { mood: 1, energy: null, created_at: dayAgo(1, 13) },
      { mood: 2, energy: null, created_at: dayAgo(1, 21) },
      { mood: 1, energy: null, created_at: dayAgo(2, 9) },
      { mood: 2, energy: null, created_at: dayAgo(2, 18) },
    ])
    expect(twoDays.checkInCount).toBe(5)
    expect(twoDays.loggedDays).toBe(2)
    expect(lowMoodPatchEligible(twoDays, [])).toBe(false)
  })

  it('files on five low days, and stays quiet for the wrong reasons', () => {
    const lowWeek = factsFor(
      [1, 2, 3, 4, 5].map((d) => ({ mood: 2, energy: null, created_at: dayAgo(d) })),
    )
    expect(lowMoodPatchEligible(lowWeek, [])).toBe(true)
    /* A tracked walk already covers the suggestion — in either language. */
    expect(
      lowMoodPatchEligible(lowWeek, [
        { id: 'h1', name: 'Evening walk', doneToday: false, streak: 2 },
      ]),
    ).toBe(false)
    expect(
      lowMoodPatchEligible(lowWeek, [
        { id: 'h1', name: 'Marche du soir', doneToday: false, streak: 2 },
      ]),
    ).toBe(false)
    /* A healthy week never triggers it, however many days are logged. */
    const goodWeek = factsFor(
      [1, 2, 3, 4, 5].map((d) => ({ mood: 4, energy: null, created_at: dayAgo(d) })),
    )
    expect(lowMoodPatchEligible(goodWeek, [])).toBe(false)
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
  it('recap never narrates habits that were never configured', () => {
    /* Zero configured habits is an absence, not a failure — asking "how
       habits went" when habitsTotal is 0 made the model report a lapse
       the person never signed up for. */
    const none = buildHealthFacts([], [], [], 14, NOW)
    expect(none.habitsTotal).toBe(0)
    expect(recapPrompt(none, [], 'en')).not.toContain('how each habit went')
    expect(recapPrompt(facts, [], 'en')).toContain('how each habit went by its days marked')
  })
  it('recap pins plain numbers over verdicts and guards thin data', () => {
    const p = recapPrompt(facts, [], 'en')
    expect(p).toContain('Report the numbers plainly')
    expect(p).toContain('If the data is thin')
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

  it('floors a streak at the habit\'s own day — a backfill can\'t invent history', () => {
    const statuses = buildHabitStatuses(
      [{ id: 'h1', name: 'Walk', day: '2026-10-01' }],
      [
        { habit_id: 'h1', day: '2026-10-02' },
        { habit_id: 'h1', day: '2026-10-01' },
        /* Stamped before the habit existed — the mark can't count. */
        { habit_id: 'h1', day: '2026-09-30' },
        { habit_id: 'h1', day: '2026-09-29' },
      ],
      TODAY,
    )
    expect(statuses[0].streak).toBe(2)
    /* A habit carrying no day falls back to created_at's UTC date. */
    const legacy = buildHabitStatuses(
      [{ id: 'h1', name: 'Walk', created_at: '2026-10-01T20:00:00Z' }],
      [{ habit_id: 'h1', day: '2026-09-30' }],
      TODAY,
    )
    expect(legacy[0].streak).toBe(0)
  })

  it('flags a streak that runs off the fetched window — the data ran out, not the streak', () => {
    const logs = [
      { habit_id: 'h1', day: '2026-10-01' },
      { habit_id: 'h1', day: '2026-09-30' },
      { habit_id: 'h1', day: '2026-09-29' },
    ]
    /* Floor on the streak's last day → the walk died at the window edge. */
    const capped = buildHabitStatuses(HABITS, logs, TODAY, '2026-09-29')
    expect(capped[0]).toMatchObject({ streak: 3, streakCapped: true })
    /* Floor one day earlier — a real gap day exists in the data → exact. */
    const exact = buildHabitStatuses(HABITS, logs, TODAY, '2026-09-28')
    expect(exact[0].streak).toBe(3)
    expect(exact[0].streakCapped).toBeUndefined()
    /* No floor passed → legacy callers stay exact by definition. */
    expect(buildHabitStatuses(HABITS, logs, TODAY)[0].streakCapped).toBeUndefined()
  })

  it('reads exact, not capped, when the habit\'s own start day is the fetch floor', () => {
    /* The walk dies at prevDay(floorDay) whether the fetch truncated or
       the creation floor clipped — but a habit created ON the floor can
       never extend past it, so the streak is genuinely exact. */
    const statuses = buildHabitStatuses(
      [{ id: 'h1', name: 'Walk', day: '2026-09-29' }],
      [
        { habit_id: 'h1', day: '2026-10-02' },
        { habit_id: 'h1', day: '2026-10-01' },
        { habit_id: 'h1', day: '2026-09-30' },
        { habit_id: 'h1', day: '2026-09-29' },
      ],
      TODAY,
      '2026-09-29',
    )
    expect(statuses[0].streak).toBe(4)
    expect(statuses[0].streakCapped).toBeUndefined()
  })

  it('renders a capped streak as "N+" in the prompt, never a bare count', () => {
    const capped = buildHabitStatuses(
      [{ id: 'h1', name: 'Walk' }],
      [
        { habit_id: 'h1', day: '2026-10-02' },
        { habit_id: 'h1', day: '2026-10-01' },
        { habit_id: 'h1', day: '2026-09-30' },
      ],
      TODAY,
      '2026-09-30',
    )
    expect(capped[0].streakCapped).toBe(true)
    const facts = buildHealthFacts([], HABITS, [], 14, NOW)
    const p = chatPrompt(facts, capped, [], TODAY, 'en').content
    expect(p).toContain('streak 3+ days')
    expect(p).not.toContain('streak 3 days')
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
  it('labels the writer\'s stored day, not the UTC date it landed on', () => {
    const lines = buildCompanionSignals(
      [{ mood: 3, energy: null, note: 'late entry', created_at: dayAgo(1), day: '2026-09-30' }],
      [],
    )
    expect(lines[0]).toContain('check-in 2026-09-30')
    expect(lines[0]).not.toContain(isoDay(1))
  })

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

  it('habit_added names the new habit without a streak clause', () => {
    const p = reactPrompt({ type: 'habit_added', habit: 'Stretch' }, null, [], TODAY, 'en')
    expect(p).toContain('started tracking a new habit')
    expect(p).toContain('"Stretch"')
    /* A fresh habit has no streak — she shouldn't reach for one. */
    expect(p).not.toContain('streak now')
    expect(p).not.toContain('done today')
  })

  it('habit_marked flags a round-mark streak as a milestone — and stays quiet otherwise', () => {
    const mark = reactPrompt({ type: 'habit_marked', habit: 'Walk' }, 7, [], TODAY, 'en')
    expect(mark).toContain('a round mark')
    const ordinary = reactPrompt({ type: 'habit_marked', habit: 'Walk' }, 6, [], TODAY, 'en')
    expect(ordinary).not.toContain('round mark')
  })

  it('a capped streak says "90+" and never claims a milestone it cannot verify', () => {
    const p = reactPrompt(
      { type: 'habit_marked', habit: 'Walk' },
      90,
      [],
      TODAY,
      'en',
      false,
      [],
      true,
    )
    expect(p).toContain('streak now 90+ days')
    /* 90 % 10 === 0 would normally print the milestone clause — but the
       true streak may be longer, so "this is day 90" could be wrong. */
    expect(p).not.toContain('round mark')
    expect(p).not.toContain('day 90 —')
  })

  it('a check-in without a note says so instead of inventing one', () => {
    const p = reactPrompt({ type: 'checkin_saved', mood: 4 }, null, [], TODAY, 'en')
    expect(p).toContain('no note')
    expect(p).not.toContain('note:')
  })

  it('checkin_edited reads as a revision, not a fresh save', () => {
    const p = reactPrompt(
      { type: 'checkin_edited', mood: 4, energy: null, note: 'felt better than I wrote' },
      null,
      [],
      TODAY,
      'en',
    )
    expect(p).toContain('revised a check-in')
    expect(p).toContain('mood 4/5')
    expect(p).not.toContain('saved a check-in')
  })

  it('accepted memories land as labeled durable context', () => {
    const facts = buildHealthFacts([], HABITS, [], 14, NOW)
    const p = chatPrompt(facts, [], [], TODAY, 'en', false, ['Walks help me think']).content
    expect(p).toContain('Things they asked you to remember')
    expect(p).toContain('- Walks help me think')
  })

  it('an empty memory list renders no block', () => {
    const facts = buildHealthFacts([], HABITS, [], 14, NOW)
    const p = chatPrompt(facts, [], [], TODAY, 'en').content
    expect(p).not.toContain('Things they asked you to remember')
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
      suggests: [],
    })
  })
  it('keeps string suggests, drops anything else', () => {
    const out = parseChatReply(
      '{"reply":"hi","action":null,"suggests":["Log a check-in?",7]}',
    )
    expect(out?.suggests).toEqual(['Log a check-in?'])
  })
  it('parses a reply with a habit action', () => {
    expect(
      parseChatReply('{"reply":"Done!","action":{"type":"mark_habit_done","habit":"Walk"}}'),
    ).toEqual({ reply: 'Done!', action: { type: 'mark_habit_done', habit: 'Walk' }, suggests: [] })
  })
  it('validates check-in bounds', () => {
    expect(
      parseChatReply('{"reply":"r","action":{"type":"add_checkin","mood":3,"energy":2}}'),
    ).toEqual({
      reply: 'r',
      action: { type: 'add_checkin', mood: 3, energy: 2, note: undefined },
      suggests: [],
    })
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
  it('parses propose_memory — trimmed, three chars minimum, capped at 500', () => {
    expect(
      parseChatReply('{"reply":"Noted — review it when you like.","action":{"type":"propose_memory","text":" Walks help me think "}}'),
    ).toEqual({
      reply: 'Noted — review it when you like.',
      action: { type: 'propose_memory', text: 'Walks help me think' },
      suggests: [],
    })
    /* Too short to be a durable fact — dropped. */
    expect(
      parseChatReply('{"reply":"r","action":{"type":"propose_memory","text":"ok"}}'),
    ).toBeNull()
    /* The cap: 500 chars survives intact. */
    const long = 'a'.repeat(600)
    const out = parseChatReply(
      `{"reply":"r","action":{"type":"propose_memory","text":"${long}"}}`,
    )
    expect(out?.action).toEqual({ type: 'propose_memory', text: 'a'.repeat(500) })
  })
  it('propose_memory is a registered chat action type', () => {
    expect(CHAT_ACTION_TYPES.has('propose_memory')).toBe(true)
  })
})

describe('parseReactEvent', () => {
  it('accepts checkin_edited with the same bounds as checkin_saved', () => {
    expect(
      parseReactEvent({ type: 'checkin_edited', mood: 4, energy: 2, note: 'revised' }),
    ).toEqual({ type: 'checkin_edited', mood: 4, energy: 2, note: 'revised' })
    expect(parseReactEvent({ type: 'checkin_edited', mood: 0 })).toBeNull()
    expect(parseReactEvent({ type: 'checkin_edited', mood: 3, energy: 6 })).toBeNull()
    expect(parseReactEvent({ type: 'checkin_edited', mood: 3, energy: null })).toEqual({
      type: 'checkin_edited',
      mood: 3,
      energy: null,
      note: undefined,
    })
  })
  it('rejects unknown event types and bad shapes', () => {
    expect(parseReactEvent({ type: 'checkin_deleted' })).toBeNull()
    expect(parseReactEvent({ type: 'habit_added', habit: '  ' })).toBeNull()
    expect(parseReactEvent('checkin_saved')).toBeNull()
    expect(parseReactEvent(null)).toBeNull()
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

  it('internal chat carries the practice playbook — guided exercises plus the clinician-led boundary', () => {
    const p = chatPrompt(facts, [], [], TODAY, 'en', true)
    /* The approaches she can run as skills practice. */
    for (const t of ['thought record', 'breathing space', 'defusion', 'DBT skills', 'DEAR MAN', 'miracle question', 'wind-down plan', 'loving-kindness']) {
      expect(p.content).toContain(t)
    }
    /* The ones she explains but never conducts — named as clinician-led. */
    expect(p.content).toContain('Clinician-led approaches')
    expect(p.content).toContain('EMDR')
    expect(p.content).toContain('hypnotherapy')
    expect(p.content).toContain('never conduct or simulate')
    /* One step per reply — an exercise is a conversation, not a dump. */
    expect(p.content).toContain('one step per reply')
  })

  it('external chat never sees the playbook — the listening posture stands alone', () => {
    const p = chatPrompt(facts, [], [], TODAY, 'en')
    expect(p.content).not.toContain('thought record')
    expect(p.content).not.toContain('DBT skills')
    expect(p.content).not.toContain('EMDR')
    expect(p.content).toContain('never offer therapy')
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

describe('detectHealthFlags (boundary backstop)', () => {
  it('flags clinical content applied to the person for EVERY tier — the clinical line is tier-independent', () => {
    for (const reply of [
      'You have insomnia — that much is clear.',
      'Try taking melatonin before bed.',
      'That sounds like depression to me.',
      'A therapist could help you sort through this.',
      'You should see a doctor about those symptoms.',
      'Take your medication at the same time each night.',
      /* The applied shapes beyond the bare words — a label read onto
         the person or a steer toward care flag however they're
         phrased. */
      'It could be a sign of depression.',
      'What you described sounds like anxiety.',
      'Your symptoms point toward burnout.',
      'You might be dealing with a mood disorder.',
      'You seem really depressed lately.',
      'You might want to talk to a therapist.',
      'Get checked out by a professional.',
      'Consider therapy for this.',
      "You've got a sleep disorder, I'd say.",
    ]) {
      expect(detectHealthFlags(reply, 'en', false), reply).not.toEqual([])
      /* Internal advice is in scope — applied clinical content and
         substances are not. */
      expect(detectHealthFlags(reply, 'en', true), reply).not.toEqual([])
    }
  })

  it('leaves general educational answers clean — the topic itself is in scope', () => {
    for (const reply of [
      'Depression is a common condition — low mood or a loss of interest that settles in for weeks, often with changes in sleep, energy, or focus.',
      'It usually shows up as a stretch of heavy days rather than one bad one.',
      'A doctor or licensed professional is the one who can diagnose it — the Resources page is the place to start.',
      'It is treatable. Professionals help people through it every day, and the Resources page lists where to start.',
      'Talking to a professional helps a lot of people with it.',
      'Common signs include trouble sleeping, low energy, and losing interest in things that used to feel good.',
      'People experience it differently — for some it is mostly exhaustion, for others a flatness.',
    ]) {
      for (const advice of [false, true]) {
        expect(detectHealthFlags(reply, 'en', advice), reply).toEqual([])
      }
    }
    for (const reply of [
      "La dépression est un trouble fréquent — un moral bas ou une perte d'intérêt qui s'installe, souvent avec des changements de sommeil ou d'énergie.",
      "Un professionnel peut l'évaluer — la page Ressources est le point de départ.",
      'Ça se soigne — du soutien existe, et la page Ressources liste par où commencer.',
      'Les signes fréquents incluent un sommeil difficile et une perte d’intérêt.',
    ]) {
      for (const advice of [false, true]) {
        expect(detectHealthFlags(reply, 'fr', advice), reply).toEqual([])
      }
    }
  })

  it('flags directed wellness calls only for the external tier', () => {
    for (const reply of [
      'You should sleep at least eight hours a night.',
      'Cut out caffeine after noon.',
      'Start a workout routine three times a week.',
      "I'd recommend cutting back on alcohol.",
    ]) {
      expect(detectHealthFlags(reply, 'en', false), reply).not.toEqual([])
    }
    /* Internal gets advice — the same directives stay in scope. */
    for (const reply of [
      'You should sleep more — your average is 5.8h.',
      'Cut the late-night screens if you want easier mornings.',
    ]) {
      expect(detectHealthFlags(reply, 'en', true), reply).toEqual([])
    }
  })

  it('flags French clinical terms and external directives', () => {
    for (const reply of [
      "Vous souffrez d'insomnie, c'est clair.",
      'Prenez de la mélatonine avant de dormir.',
      'Une thérapie pourrait aider.',
      'Coupez la caféine après midi.',
      'Vous devriez dormir plus.',
      /* Applied shapes — a label on the person or a steer toward care. */
      "Vous pourriez avoir de l'anxiété.",
      'Ça ressemble à de la dépression.',
      'Consultez un médecin.',
      'Votre insomnie empire ces temps-ci.',
      'Vous faites de la dépression, je pense.',
    ]) {
      expect(detectHealthFlags(reply, 'fr', false), reply).not.toEqual([])
    }
  })

  it('leaves observations, offered suggestions and the crisis line clean', () => {
    for (const reply of [
      'A short walk might help tonight.',
      'Your average mood dipped this week — 2.8 vs 3.4.',
      'The Resources page has options if you want more.',
      'You could try writing a few lines about it.',
      'Call or text 9-8-8 (Canada, 24/7) — or 911 if you are in immediate danger.',
      "That sounds heavy — I'm here.",
    ]) {
      expect(detectHealthFlags(reply, 'en', false), reply).toEqual([])
    }
    for (const reply of [
      'Une petite marche pourrait aider ce soir.',
      'Vos chiffres ont baissé cette semaine.',
      "La page Ressources offre des options si vous en voulez plus.",
    ]) {
      expect(detectHealthFlags(reply, 'fr', false), reply).toEqual([])
    }
  })

  it('fallbacks pass their own screen in both tables', () => {
    for (const advice of [false, true]) {
      expect(detectHealthFlags(HEALTH_FALLBACK_EN, 'en', advice)).toEqual([])
      expect(detectHealthFlags(HEALTH_FALLBACK_FR, 'fr', advice)).toEqual([])
      expect(detectHealthFlags(HEALTH_REACT_FALLBACK_EN, 'en', advice)).toEqual([])
      expect(detectHealthFlags(HEALTH_REACT_FALLBACK_FR, 'fr', advice)).toEqual([])
      expect(detectHealthFlags(HEALTH_REFLECT_FALLBACK_EN, 'en', advice)).toEqual([])
      expect(detectHealthFlags(HEALTH_REFLECT_FALLBACK_FR, 'fr', advice)).toEqual([])
      expect(detectHealthFlags(HEALTH_RECAP_FALLBACK_EN, 'en', advice)).toEqual([])
      expect(detectHealthFlags(HEALTH_RECAP_FALLBACK_FR, 'fr', advice)).toEqual([])
    }
  })
})

/* A mark/unmark already in effect must report NOT undoable — executeChatAction
   keys the undo chip on refId, and undo of a no-op writes data the action
   never touched (reversing a no-op mark deletes the pre-existing log;
   reversing a no-op unmark invents one). */
describe('habitToggleNoop', () => {
  const done = { id: 'h1', name: 'Walk', doneToday: true, streak: 3 }
  const pending = { id: 'h1', name: 'Walk', doneToday: false, streak: 3 }

  it('flags a mark on an already-done habit and an unmark on a not-done one', () => {
    expect(habitToggleNoop('mark_habit_done', done)).toBe(true)
    expect(habitToggleNoop('unmark_habit_done', pending)).toBe(true)
  })

  it('lets real state changes stay undoable', () => {
    expect(habitToggleNoop('mark_habit_done', pending)).toBe(false)
    expect(habitToggleNoop('unmark_habit_done', done)).toBe(false)
  })
})
