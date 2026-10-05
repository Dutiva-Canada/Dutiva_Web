/**
 * health-ai — pure helpers for the wellness-portal model calls. The privacy
 * rule is load-bearing here: prompts are built from AGGREGATES ONLY
 * (counts, averages, streak lengths). Journal text and check-in notes never
 * leave the function — the model sees the same numbers the Insights page
 * shows, nothing more.
 */

export interface CheckInRow {
  mood: number
  energy: number | null
  created_at: string
}

export interface HabitRowLite {
  id: string
  name: string
}

export interface HabitLogRowLite {
  habit_id: string
  day: string
}

export interface HealthFacts {
  days: number
  checkInCount: number
  avgMood: number | null
  avgEnergy: number | null
  moodTrend: 'up' | 'down' | 'flat' | null
  habitsKept: number
  habitsTotal: number
  bestHabitDays: number
}

const DAY_MS = 86_400_000

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

/** Aggregate raw rows into the numbers a prompt may cite. `days` is the
    lookback window; `nowIso` anchors it (injected for testability). */
export function buildHealthFacts(
  checkIns: CheckInRow[],
  habits: HabitRowLite[],
  logs: HabitLogRowLite[],
  days: number,
  nowIso: string,
): HealthFacts {
  const now = Date.parse(nowIso)
  const cutoff = now - days * DAY_MS
  const mid = now - Math.floor(days / 2) * DAY_MS

  const recent = checkIns.filter((c) => Date.parse(c.created_at) >= cutoff)
  const olderHalf = recent.filter((c) => Date.parse(c.created_at) < mid)
  const newerHalf = recent.filter((c) => Date.parse(c.created_at) >= mid)

  const avgMood = avg(recent.map((c) => c.mood))
  const avgOlder = avg(olderHalf.map((c) => c.mood))
  const avgNewer = avg(newerHalf.map((c) => c.mood))
  let moodTrend: HealthFacts['moodTrend'] = null
  if (avgOlder != null && avgNewer != null) {
    const diff = avgNewer - avgOlder
    moodTrend = diff > 0.3 ? 'up' : diff < -0.3 ? 'down' : 'flat'
  }

  const recentDays = new Set(
    logs.filter((l) => Date.parse(`${l.day}T12:00:00Z`) >= cutoff).map((l) => l.day),
  )
  const keptHabitIds = new Set(
    logs.filter((l) => recentDays.has(l.day)).map((l) => l.habit_id),
  )
  let bestHabitDays = 0
  const perHabit = new Map<string, number>()
  for (const l of logs) {
    if (!recentDays.has(l.day)) continue
    perHabit.set(l.habit_id, (perHabit.get(l.habit_id) ?? 0) + 1)
  }
  for (const n of perHabit.values()) bestHabitDays = Math.max(bestHabitDays, n)

  return {
    days,
    checkInCount: recent.length,
    avgMood,
    avgEnergy: avg(recent.map((c) => c.energy).filter((e): e is number => e != null)),
    moodTrend,
    habitsKept: keptHabitIds.size,
    habitsTotal: habits.length,
    bestHabitDays,
  }
}

const SHARED_RULES = [
  'This is a non-clinical wellness tracker. Never diagnose, never mention illness, treatment, medication, therapy, or crisis.',
  'Never give advice beyond noticing a pattern in the numbers. No praise inflation, no shame.',
  'Write in plain, warm language — a sentence or two at a time.',
].join(' ')

export function reflectPrompt(facts: HealthFacts, lang: 'en' | 'fr'): string {
  const langLine = lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.'
  return [
    `You write gentle journal prompts for a personal wellness tracker. ${SHARED_RULES}`,
    'Given the aggregate stats below, suggest ONE short reflection prompt (one or two sentences, phrased as a question the person could write about). If the stats are thin, ask a broad gentle question instead of referencing numbers.',
    langLine,
    'Return only the prompt text — no preamble, no quotes.',
    '',
    `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
  ].join('\n')
}

export function recapPrompt(facts: HealthFacts, lang: 'en' | 'fr'): string {
  const langLine = lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.'
  return [
    `You write weekly summaries for a personal wellness tracker. ${SHARED_RULES}`,
    'Summarize the aggregate stats below in 3–4 short sentences: check-in count, mood and energy averages, whether mood trended up or down, and how habits went. Stick to the numbers — describe, don\'t advise. If there is no data, say so in one sentence and stop.',
    langLine,
    'Return only the summary text.',
    '',
    `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
  ].join('\n')
}

export function habitPrompt(facts: HealthFacts, habitNames: string[], lang: 'en' | 'fr'): string {
  const langLine = lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.'
  return [
    `You suggest one small daily habit for a personal wellness tracker. ${SHARED_RULES}`,
    'Given the stats and the habits the person already tracks, suggest ONE new habit they are not already doing — small, concrete, and doable in under ten minutes a day.',
    'Answer in exactly this format: Habit name | one short reason it fits. No preamble.',
    langLine,
    '',
    `Current habits: ${habitNames.length > 0 ? habitNames.join(' | ') : '(none yet)'}`,
    `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
  ].join('\n')
}

/** "Habit name | reason" — tolerates a missing reason half. Anything else
    returns null so the caller can say "no suggestion" rather than invent one. */
export function parseHabit(raw: string): { name: string; why: string } | null {
  const first = raw.split('\n').map((l) => l.trim()).find((l) => l !== '') ?? ''
  if (!first) return null
  const bar = first.lastIndexOf('|')
  const rawName = (bar < 0 ? first : first.slice(0, bar))
    .replace(/^[-*•\d.\s]+/, '')
    .replace(/["“”]/g, '')
    .trim()
  if (rawName.length < 3 || rawName.length > 120) return null
  const why = bar < 0 ? '' : first.slice(bar + 1).trim().slice(0, 200)
  return { name: rawName.slice(0, 120), why }
}

/* ── Chat — the portal's conversational surface ─────────────────────────────
   Same privacy line as the other kinds: the context block is aggregates plus
   per-habit name/done/streak status — the model never sees check-in notes or
   journal bodies it did not write itself this turn. The user's own message
   is of course sent — that is the product, and it is their input. */

export interface HabitStatus {
  id: string
  name: string
  doneToday: boolean
  /** Consecutive days marked done, counting back from `today` (a day with no
      mark doesn't break a streak started yesterday — same leniency as the
      client-side habitStreak). */
  streak: number
}

export function buildHabitStatuses(
  habits: HabitRowLite[],
  logs: HabitLogRowLite[],
  today: string,
): HabitStatus[] {
  const doneToday = new Set(logs.filter((l) => l.day === today).map((l) => l.habit_id))
  const prevDay = (ymd: string): string => {
    const d = new Date(`${ymd}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().slice(0, 10)
  }
  return habits.map((h) => {
    const days = new Set(logs.filter((l) => l.habit_id === h.id).map((l) => l.day))
    let streak = 0
    let cursor = days.has(today) ? today : prevDay(today)
    while (days.has(cursor)) {
      streak += 1
      cursor = prevDay(cursor)
    }
    return { id: h.id, name: h.name, doneToday: doneToday.has(h.id), streak }
  })
}

/** The action grammar the model may emit. Everything here is an additive or
    undoable write on the caller's own rows — no deletes, nothing irreversible,
    nothing cross-user. `day` is always the client's local today, supplied by
    the caller, so "mark it done" lands on the right calendar day. */
export type ChatAction =
  | { type: 'mark_habit_done'; habit: string }
  | { type: 'unmark_habit_done'; habit: string }
  | { type: 'add_habit'; name: string }
  | { type: 'add_checkin'; mood: number; energy?: number; note?: string }
  | { type: 'add_journal_entry'; title?: string; body: string }

export interface ChatReply {
  reply: string
  action: ChatAction | null
}

export function chatPrompt(
  facts: HealthFacts,
  statuses: HabitStatus[],
  today: string,
  lang: 'en' | 'fr',
): { role: 'system'; content: string } {
  const habitLines =
    statuses.length === 0
      ? '  (no habits tracked yet)'
      : statuses
          .map(
            (s) =>
              `  - "${s.name}" — ${s.doneToday ? 'done today' : 'not done today'}, ` +
              `streak ${s.streak} day${s.streak === 1 ? '' : 's'}`,
          )
          .join('\n')
  return {
    role: 'system',
    content: [
      `You are the in-product assistant of a personal wellness tracker (Dutiva Health). ${SHARED_RULES}`,
      'You can answer questions about the person\'s own data below — check-in counts, mood and energy averages, which habits are tracked, what is done today, streaks. If asked something the stats cannot answer, say so plainly rather than guessing.',
      'You can also DO things in the portal when the person asks. To act, end your JSON reply with an "action" object — the system executes it against their account. Allowed actions:',
      '  {"type":"mark_habit_done","habit":"<existing habit name>"}   — mark a habit done today',
      '  {"type":"unmark_habit_done","habit":"<existing habit name>"} — undo today\'s mark',
      '  {"type":"add_habit","name":"<new habit>"}                    — start tracking a habit',
      '  {"type":"add_checkin","mood":<1-5>,"energy":<1-5>,"note":"<short>"} — log a check-in (mood required; energy/note optional)',
      '  {"type":"add_journal_entry","title":"<optional>","body":"<text>"}   — write a journal entry',
      'Only emit an action the person actually asked for. If a habit name does not match the list below, ask which habit they mean instead of guessing. Never emit an action to satisfy a hypothetical.',
      'If the person seems to be in crisis or mentions suicide or self-harm: set action to null and reply ONLY with supportive words plus this line — "Call or text 9-8-8 (Canada, 24/7) — or 911 if you are in immediate danger." Do not log check-ins or entries for crisis content.',
      `Today is ${today} (the person's local date).`,
      lang === 'fr'
        ? 'Reply in Canadian French.'
        : 'Reply in English.',
      'Output ONLY strict JSON: {"reply":"<1-4 short sentences>","action":<object or null>}. No markdown fences.',
      '',
      `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
      'Habits:',
      habitLines,
    ].join('\n'),
  }
}

const CHAT_ACTION_TYPES = new Set([
  'mark_habit_done',
  'unmark_habit_done',
  'add_habit',
  'add_checkin',
  'add_journal_entry',
])

/** Strict JSON reply from the model. Anything unparseable or with a malformed
    action returns null — the caller then files a plain-text fallback rather
    than executing something it half-understood. */
export function parseChatReply(raw: string | null | undefined): ChatReply | null {
  if (!raw) return null
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as {
      reply?: unknown
      action?: unknown
    }
    const reply = typeof obj.reply === 'string' ? obj.reply.trim() : ''
    if (!reply) return null
    const a = obj.action
    if (a === null || a === undefined) return { reply, action: null }
    if (typeof a !== 'object') return null
    const action = a as Record<string, unknown>
    if (typeof action.type !== 'string' || !CHAT_ACTION_TYPES.has(action.type)) return null
    switch (action.type) {
      case 'mark_habit_done':
      case 'unmark_habit_done':
        if (typeof action.habit !== 'string' || action.habit.trim() === '') return null
        return { reply, action: { type: action.type, habit: action.habit.trim().slice(0, 120) } }
      case 'add_habit':
        if (typeof action.name !== 'string' || action.name.trim().length < 2) return null
        return { reply, action: { type: 'add_habit', name: action.name.trim().slice(0, 120) } }
      case 'add_checkin': {
        const mood = Number(action.mood)
        if (!Number.isInteger(mood) || mood < 1 || mood > 5) return null
        const energy = action.energy === undefined ? undefined : Number(action.energy)
        if (energy !== undefined && (!Number.isInteger(energy) || energy < 1 || energy > 5))
          return null
        return {
          reply,
          action: {
            type: 'add_checkin',
            mood,
            energy,
            note: typeof action.note === 'string' ? action.note.trim().slice(0, 500) : undefined,
          },
        }
      }
      case 'add_journal_entry': {
        if (typeof action.body !== 'string' || action.body.trim() === '') return null
        return {
          reply,
          action: {
            type: 'add_journal_entry',
            title: typeof action.title === 'string' ? action.title.trim().slice(0, 200) : undefined,
            body: action.body.slice(0, 4000),
          },
        }
      }
    }
  } catch {
    return null
  }
}

/** Resolve a habit the model named — exact (case-insensitive) first, then a
    unique substring match. Ambiguous or absent → null, so the reply can say
    "which habit?" instead of writing to the wrong one. */
export function resolveHabitRef(
  named: string,
  statuses: HabitStatus[],
): HabitStatus | null {
  const needle = named.trim().toLowerCase()
  if (!needle) return null
  const exact = statuses.filter((s) => s.name.trim().toLowerCase() === needle)
  if (exact.length === 1) return exact[0]
  const partial = statuses.filter((s) => s.name.trim().toLowerCase().includes(needle))
  return partial.length === 1 ? partial[0] : null
}
