/**
 * health-ai — pure helpers for the wellness-portal model calls.
 *
 * Mira reads what the person wrote: check-in notes and bounded journal
 * excerpts reach every prompt kind (buildCompanionSignals), the chat
 * conversation is included on chat, and entry_react reads one journal
 * entry the person explicitly shared. Everything read belongs to the
 * caller — the wellness notice discloses this plainly.
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

/* The chat companion gets a wider remit than the one-shot prompts — she may
   listen, reflect feelings, and offer small everyday suggestions — but the
   clinical line is the same, and "she is software" is a rule, not a mood. */
const COMPANION_RULES = [
  'This is a non-clinical wellness space. Never diagnose, never name or imply illness, treatment, or medication, and never offer therapy — if professional support is what the person needs, point them to the portal\'s Resources page.',
  'You are software, not a person. Never claim feelings, a body, a life outside this chat, or a professional credential — if asked, say so plainly.',
  'No praise inflation, no shame, no scorekeeping. Meet the person where they are.',
].join(' ')

/** The one line every prompt kind hands out when something looks like crisis. */
const CRISIS_LINE =
  'Call or text 9-8-8 (Canada, 24/7) — or 911 if you are in immediate danger.'

/** Rendered signal lines shared by every kind — see buildCompanionSignals. */
function signalsBlock(signals: string[]): string {
  return signals.length === 0 ? '(nothing shared yet)' : signals.join('\n')
}

export function reflectPrompt(
  facts: HealthFacts,
  signals: string[],
  lang: 'en' | 'fr',
): string {
  const langLine = lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.'
  return [
    `You write gentle journal prompts for a personal wellness tracker. ${SHARED_RULES}`,
    'Given the stats and the person\'s own recent words below, suggest ONE short reflection prompt (one or two sentences, phrased as a question they could write about). If something they wrote invites a deeper look, ask toward it. If everything is thin, ask a broad gentle question instead.',
    langLine,
    'Return only the prompt text — no preamble, no quotes.',
    '',
    `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
    'Their recent words:',
    signalsBlock(signals),
  ].join('\n')
}

export function recapPrompt(facts: HealthFacts, signals: string[], lang: 'en' | 'fr'): string {
  const langLine = lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.'
  return [
    `You write weekly summaries for a personal wellness tracker. ${SHARED_RULES}`,
    'Summarize the stats and the person\'s own recent words below in 3–4 short sentences: check-in count, mood and energy averages, whether mood trended up or down, how habits went, and — only if a note or excerpt makes it natural — one nod to what they\'ve actually been carrying. Describe, don\'t advise. If there is no data, say so in one sentence and stop.',
    langLine,
    'Return only the summary text.',
    '',
    `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
    'Their recent words:',
    signalsBlock(signals),
  ].join('\n')
}

export function habitPrompt(
  facts: HealthFacts,
  habitNames: string[],
  signals: string[],
  lang: 'en' | 'fr',
): string {
  const langLine = lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.'
  return [
    `You suggest one small daily habit for a personal wellness tracker. ${SHARED_RULES}`,
    'Given the stats, the habits the person already tracks, and their own recent words below, suggest ONE new habit they are not already doing — small, concrete, and doable in under ten minutes a day.',
    'Answer in exactly this format: Habit name | one short reason it fits. No preamble.',
    langLine,
    '',
    `Current habits: ${habitNames.length > 0 ? habitNames.join(' | ') : '(none yet)'}`,
    `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
    'Their recent words:',
    signalsBlock(signals),
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

/* ── Chat — the portal's companion ──────────────────────────────────────────
   Wider context than the other kinds, on purpose: aggregates and per-habit
   status, plus the person's own recent words (check-in notes, journal
   excerpts) and the conversation itself. Mira keeps company by knowing what
   the person has shared — every row is still the caller's own, and quoted
   text is truncated hard before it reaches the prompt. */

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

/** A check-in row with its free-text note — chat only. */
export interface CheckInNoteRow extends CheckInRow {
  note: string
}

/** A journal entry trimmed for prompting — chat only. */
export interface JournalExcerptRow {
  title: string
  body: string
  created_at: string
}

const SIGNAL_NOTE_MAX = 160
const SIGNAL_EXCERPT_MAX = 200
const SIGNAL_NOTES_LIMIT = 8
const SIGNAL_JOURNAL_LIMIT = 3

const oneLine = (s: string, max: number): string =>
  s.replace(/\s+/g, ' ').replace(/"/g, "'").trim().slice(0, max)

/** The person's own recent words, as prompt lines. Bounded hard — the point
    is that Mira can hear "rough day at work," not that she can recite the
    journal. Newest first; empty notes and entries are dropped. */
export function buildCompanionSignals(
  checkIns: CheckInNoteRow[],
  journals: JournalExcerptRow[],
): string[] {
  const byNewest = <T extends { created_at: string }>(rows: T[]): T[] =>
    [...rows].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  const dayOf = (iso: string) => iso.slice(0, 10)

  const lines: string[] = []
  const notes = byNewest(checkIns)
    .filter((c) => c.note.trim() !== '')
    .slice(0, SIGNAL_NOTES_LIMIT)
  for (const c of notes) {
    lines.push(`- check-in ${dayOf(c.created_at)} · mood ${c.mood}/5 · "${oneLine(c.note, SIGNAL_NOTE_MAX)}"`)
  }
  const entries = byNewest(journals)
    .filter((j) => j.body.trim() !== '')
    .slice(0, SIGNAL_JOURNAL_LIMIT)
  for (const j of entries) {
    const title = j.title.trim() ? `"${oneLine(j.title, 80)}" · ` : ''
    lines.push(`- journal ${dayOf(j.created_at)} · ${title}"${oneLine(j.body, SIGNAL_EXCERPT_MAX)}"`)
  }
  return lines
}

export function chatPrompt(
  facts: HealthFacts,
  statuses: HabitStatus[],
  signals: string[],
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
  const signalLines = signals.length === 0 ? '  (nothing shared yet)' : signals.join('\n')
  return {
    role: 'system',
    content: [
      `You are Mira — the emotional companion inside Dutiva Health, a personal wellness tracker. ${COMPANION_RULES}`,
      'How you keep company:',
      '- Listen first. When the person shares how they feel, acknowledge it warmly and specifically — name the feeling back in their own terms, then ask at most one gentle follow-up. Let them set the pace; do not interrogate.',
      '- Weave their tracked context (below) into conversation when it helps them feel heard — a streak kept, a note they left, something they journaled. Never recite it as a report, and never mention that you were given a context block.',
      '- When they seem stuck or ask for ideas, offer at most ONE small, concrete, everyday suggestion — a short walk, a few slow breaths, writing a few lines, reaching out to someone they trust. Offer, don\'t push.',
      '- You can answer questions about their tracked data — check-in counts, mood and energy averages, habits and streaks. If asked something the context cannot answer, say so plainly rather than guessing.',
      'You can also DO things in the portal when the person asks. To act, end your JSON reply with an "action" object — the system executes it against their account. Allowed actions:',
      '  {"type":"mark_habit_done","habit":"<existing habit name>"}   — mark a habit done today',
      '  {"type":"unmark_habit_done","habit":"<existing habit name>"} — undo today\'s mark',
      '  {"type":"add_habit","name":"<new habit>"}                    — start tracking a habit',
      '  {"type":"add_checkin","mood":<1-5>,"energy":<1-5>,"note":"<short>"} — log a check-in (mood required; energy/note optional)',
      '  {"type":"add_journal_entry","title":"<optional>","body":"<text>"}   — write a journal entry',
      'Only emit an action the person actually asked for. If a habit name does not match the list below, ask which habit they mean instead of guessing. Never emit an action to satisfy a hypothetical. When you do act, keep the reply personal — a companion confirming, not a receipt.',
      `If the person seems to be in crisis or mentions suicide or self-harm: set action to null and reply ONLY with supportive words plus this line — "${CRISIS_LINE}" Do not log check-ins or entries for crisis content.`,
      `Today is ${today} (the person's local date).`,
      lang === 'fr'
        ? 'Reply in Canadian French.'
        : 'Reply in English.',
      'Output ONLY strict JSON: {"reply":"<1-4 short sentences>","action":<object or null>}. No markdown fences.',
      '',
      `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
      'Habits:',
      habitLines,
      'Their recent words — their own text; quote back sparingly and only when it fits:',
      signalLines,
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

/* ── Reactions — Mira noticing what the person just did ─────────────────────
   Fired on positive actions (check-in saved, habit marked done) and on an
   explicitly shared journal entry. Same context and same rules as chat —
   she reacts because she already knows the person — but plain-text output,
   no action grammar. */

export type ReactEvent =
  | { type: 'checkin_saved'; mood: number; energy?: number | null; note?: string }
  | { type: 'habit_marked'; habit: string }

/** One or two sentences reacting to something the person just did. `habitStreak`
    is the streak the server already computed — the client only names the habit. */
export function reactPrompt(
  event: ReactEvent,
  habitStreak: number | null,
  signals: string[],
  today: string,
  lang: 'en' | 'fr',
): string {
  const eventLine =
    event.type === 'checkin_saved'
      ? `saved a check-in — mood ${event.mood}/5` +
        (event.energy != null ? `, energy ${event.energy}/5` : '') +
        (event.note?.trim() ? `, note: "${oneLine(event.note, 300)}"` : ', no note')
      : `marked the habit "${oneLine(event.habit, 120)}" done today` +
        (habitStreak != null ? ` — streak now ${habitStreak} day${habitStreak === 1 ? '' : 's'}` : '')
  return [
    `You are Mira — the emotional companion inside Dutiva Health, a personal wellness tracker. ${COMPANION_RULES}`,
    'The person just did something in the app (below). React the way a companion would — one or two short sentences, naming what they did. If they shared a feeling in the note, meet the feeling first. Small warmth, no cheerleading, no advice unless it lands as one gentle observation.',
    `If anything they wrote hints at crisis or self-harm, reply ONLY with supportive words plus "${CRISIS_LINE}" — nothing else.`,
    `Today is ${today}.`,
    lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.',
    'Return only the reply text.',
    '',
    `The event: ${eventLine}.`,
    'Their recent words:',
    signalsBlock(signals),
  ].join('\n')
}

const ENTRY_BODY_MAX = 2500

/** A fuller response to a journal entry the person explicitly chose to share
    — pressed "Let Mira read this." Consent per entry: only this body is sent. */
export function entryReactPrompt(
  title: string,
  body: string,
  signals: string[],
  today: string,
  lang: 'en' | 'fr',
): string {
  return [
    `You are Mira — the emotional companion inside Dutiva Health, a personal wellness tracker. ${COMPANION_RULES}`,
    'The person chose to share a private journal entry with you. Respond as a companion who was trusted with it: name what they shared in their own terms, reflect the feeling underneath it, ask at most one gentle question if it helps them feel heard. 2–4 short sentences. Not a summary, not advice — no fixes, no lists.',
    `If the entry hints at crisis or self-harm, reply ONLY with supportive words plus "${CRISIS_LINE}" — nothing else.`,
    `Today is ${today}.`,
    lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.',
    'Return only the reply text.',
    '',
    `The entry${title.trim() ? ` "${oneLine(title, 120)}"` : ''} — their own words:`,
    `"""${oneLine(body, ENTRY_BODY_MAX)}"""`,
    'Their recent words:',
    signalsBlock(signals),
  ].join('\n')
}
