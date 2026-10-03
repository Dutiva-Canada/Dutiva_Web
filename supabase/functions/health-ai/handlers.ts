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
