import type { HealthCheckIn } from './types'

/**
 * Pure derivations over check-ins — the Insights and Overview pages compute
 * these client-side; nothing is stored as a "score" server-side, and nothing
 * here is a clinical metric: counts, day-level averages, and a day streak.
 */

const DAY_MS = 24 * 60 * 60 * 1000

function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

function todayKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

/** Check-ins grouped by calendar day, most recent day first. */
function byDay(checkIns: HealthCheckIn[]): Map<string, HealthCheckIn[]> {
  const map = new Map<string, HealthCheckIn[]>()
  for (const c of checkIns) {
    const key = dayKey(c.createdAt)
    const list = map.get(key)
    if (list) list.push(c)
    else map.set(key, [c])
  }
  return map
}

/** Consecutive days with at least one check-in, counting back from today. */
export function checkInStreak(checkIns: HealthCheckIn[], now: Date = new Date()): number {
  const days = byDay(checkIns)
  if (days.size === 0) return 0
  let streak = 0
  const cursor = new Date(now)
  // A day "counts" if any check-in exists for it; today may be empty only
  // if yesterday started a streak (streak counts from today or yesterday).
  if (!days.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(todayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Whether the user has at least one check-in dated today (local time). */
export function hasCheckInToday(checkIns: HealthCheckIn[], now: Date = new Date()): boolean {
  return checkIns.some((c) => dayKey(c.createdAt) === todayKey(now))
}

/** Average mood over check-ins in the last `days` calendar days (null when
    the window is empty). */
export function avgMood(
  checkIns: HealthCheckIn[],
  days: number,
  now: Date = new Date(),
): number | null {
  return avgField(checkIns, days, (c) => c.mood, now)
}

export function avgEnergy(
  checkIns: HealthCheckIn[],
  days: number,
  now: Date = new Date(),
): number | null {
  return avgField(checkIns, days, (c) => c.energy, now)
}

function avgField(
  checkIns: HealthCheckIn[],
  days: number,
  field: (c: HealthCheckIn) => number | null,
  now: Date,
): number | null {
  const cutoff = now.getTime() - days * DAY_MS
  let sum = 0
  let n = 0
  for (const c of checkIns) {
    const v = field(c)
    if (v == null) continue
    if (new Date(c.createdAt).getTime() < cutoff) continue
    sum += v
    n += 1
  }
  return n === 0 ? null : sum / n
}

export interface DayMood {
  /** YYYY-MM-DD, local time. */
  day: string
  /** Average mood for that day, or null when no check-in exists. */
  mood: number | null
}

/** One entry per calendar day for the last `days` days, oldest first — the
    shape the Insights bar chart renders. */
export function dailyMoods(
  checkIns: HealthCheckIn[],
  days: number,
  now: Date = new Date(),
): DayMood[] {
  const daysMap = byDay(checkIns)
  const out: DayMood[] = []
  const cursor = new Date(now)
  cursor.setDate(cursor.getDate() - (days - 1))
  for (let i = 0; i < days; i += 1) {
    const key = todayKey(cursor)
    const list = daysMap.get(key)
    const moods = (list ?? []).map((c) => c.mood)
    out.push({
      day: key,
      mood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

/** Best/toughest recorded day inside the window — by daily average mood. */
export function moodRange(
  checkIns: HealthCheckIn[],
  days: number,
  now: Date = new Date(),
): { best: DayMood | null; toughest: DayMood | null } {
  const windowDays = dailyMoods(checkIns, days, now).filter((d) => d.mood != null)
  let best: DayMood | null = null
  let toughest: DayMood | null = null
  for (const d of windowDays) {
    if (!best || (d.mood ?? 0) > (best.mood ?? 0)) best = d
    if (!toughest || (d.mood ?? 0) < (toughest.mood ?? 0)) toughest = d
  }
  return { best, toughest }
}
