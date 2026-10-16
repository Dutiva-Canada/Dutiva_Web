import type { HealthCheckIn, HealthHabit, HealthHabitLog } from './types'

/**
 * Pure derivations over check-ins — the Insights and Overview pages compute
 * these client-side; nothing is stored as a "score" server-side, and nothing
 * here is a clinical metric: counts, day-level averages, and a day streak.
 */

export function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** YYYY-MM-DD → absolute day number — consecutive-day math that can't be
    thrown by DST (a "day" is 23h or 25h twice a year). */
function dayNum(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y!, m! - 1, d!) / 86400000
}

function todayKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

/** Check-ins grouped by local calendar day. Iteration order follows the
    input's first-seen order — callers sort or look days up by key, so the
    map itself promises grouping, not ordering. */
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

/** Average mood over the last `days` calendar days — per DAY, not per
    check-in, so a day logged three times doesn't outweigh a day logged
    once (matches how the Insights chart aggregates). Null when the window
    is empty. */
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
  /* Calendar days, not a rolling N×24h window — the label says "(7 days)"
     and the number shouldn't drift as the clock moves inside a day. */
  const windowDays = new Set(recentDayKeys(days, now))
  const perDay = new Map<string, { sum: number; n: number }>()
  for (const c of checkIns) {
    const v = field(c)
    if (v == null) continue
    const key = dayKey(c.createdAt)
    if (!windowDays.has(key)) continue
    const slot = perDay.get(key) ?? { sum: 0, n: 0 }
    slot.sum += v
    slot.n += 1
    perDay.set(key, slot)
  }
  if (perDay.size === 0) return null
  let sum = 0
  for (const { sum: s, n } of perDay.values()) sum += s / n
  return sum / perDay.size
}

export interface DayMetric {
  /** YYYY-MM-DD, local time. */
  day: string
  /** The day's averaged metric (mood, energy), or null when nothing
      recorded it — null is "no data", never a low score. */
  value: number | null
}

/** One slot per calendar day for the last `days` days, oldest first — the
    shape the Insights bar charts render. `pick` chooses the metric; days
    where no check-in answered it stay null rather than reading as zero. */
function dailyAverage(
  checkIns: HealthCheckIn[],
  days: number,
  pick: (c: HealthCheckIn) => number | null,
  now: Date = new Date(),
): DayMetric[] {
  const daysMap = byDay(checkIns)
  const out: DayMetric[] = []
  const cursor = new Date(now)
  cursor.setDate(cursor.getDate() - (days - 1))
  for (let i = 0; i < days; i += 1) {
    const key = todayKey(cursor)
    const list = (daysMap.get(key) ?? [])
      .map(pick)
      .filter((v): v is number => v != null)
    out.push({
      day: key,
      value: list.length ? list.reduce((a, b) => a + b, 0) / list.length : null,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

export function dailyMoods(
  checkIns: HealthCheckIn[],
  days: number,
  now: Date = new Date(),
): DayMetric[] {
  return dailyAverage(checkIns, days, (c) => c.mood, now)
}

/* Energy is optional on a check-in — a day with a mood but no energy
   answer stays null here too, so skipped energy never masquerades as a
   drained day. */
export function dailyEnergies(
  checkIns: HealthCheckIn[],
  days: number,
  now: Date = new Date(),
): DayMetric[] {
  return dailyAverage(checkIns, days, (c) => c.energy, now)
}

/** Best/toughest recorded day inside the window — by daily average mood. */
export function moodRange(
  checkIns: HealthCheckIn[],
  days: number,
  now: Date = new Date(),
): { best: DayMetric | null; toughest: DayMetric | null } {
  const windowDays = dailyMoods(checkIns, days, now).filter((d) => d.value != null)
  let best: DayMetric | null = null
  let toughest: DayMetric | null = null
  for (const d of windowDays) {
    if (!best || (d.value ?? 0) > (best.value ?? 0)) best = d
    if (!toughest || (d.value ?? 0) < (toughest.value ?? 0)) toughest = d
  }
  return { best, toughest }
}

/* ---------- habits (non-clinical: routine tracking, nothing diagnostic) -- */

export function todayDayKey(now: Date = new Date()): string {
  return todayKey(now)
}

/** Days on which a given habit was marked done, as a Set of YYYY-MM-DD. */
export function habitDoneDays(logs: HealthHabitLog[], habitId: string): Set<string> {
  return new Set(logs.filter((l) => l.habitId === habitId).map((l) => l.day))
}

/** Consecutive days a habit was marked done, counting back from today
    (today empty doesn't break the streak, same leniency as check-ins). */
export function habitStreak(
  logs: HealthHabitLog[],
  habitId: string,
  now: Date = new Date(),
): number {
  const days = habitDoneDays(logs, habitId)
  if (days.size === 0) return 0
  let streak = 0
  const cursor = new Date(now)
  if (!days.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(todayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Longest consecutive run of done days — the record a live streak stands
    against. A broken streak disappears from the pill; this one stays. */
export function habitBestRun(logs: HealthHabitLog[], habitId: string): number {
  const days = [...habitDoneDays(logs, habitId)].sort()
  let best = 0
  let run = 0
  let prev = Number.NaN
  for (const key of days) {
    const n = dayNum(key)
    run = n === prev + 1 ? run + 1 : 1
    if (run > best) best = run
    prev = n
  }
  return best
}

/** The length of a run that broke yesterday — the habit was done two days
    ago (and the days before it), but not yesterday and not today. Returns
    that run's length, or 0 when there's no fresh break. It fires once, the
    morning after the first fully missed day; an older break is stale news
    and a live-or-pending streak (done yesterday) isn't a break at all. */
export function brokeStreak(
  logs: HealthHabitLog[],
  habitId: string,
  now: Date = new Date(),
): number {
  const days = habitDoneDays(logs, habitId)
  if (days.size === 0) return 0
  /* Yesterday or today done → the streak is still live (or restarted
     today), so nothing broke. A miss yesterday with a run ending two
     days ago is the one fresh break. */
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (days.has(todayKey(now)) || days.has(todayKey(yesterday))) return 0
  const cursor = new Date(now)
  cursor.setDate(cursor.getDate() - 2)
  if (!days.has(todayKey(cursor))) return 0
  let run = 0
  while (days.has(todayKey(cursor))) {
    run += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return run
}

/** How many habits are done today — the Overview stat. */
export function habitsDoneToday(
  logs: HealthHabitLog[],
  habits: HealthHabit[],
  now: Date = new Date(),
): { done: number; total: number } {
  const today = todayKey(now)
  const doneIds = new Set(logs.filter((l) => l.day === today).map((l) => l.habitId))
  return { done: habits.filter((h) => doneIds.has(h.id)).length, total: habits.length }
}

/** The last `days` day-keys, oldest first — the 7-day dots on each habit row. */
export function recentDayKeys(days: number, now: Date = new Date()): string[] {
  const out: string[] = []
  const cursor = new Date(now)
  cursor.setDate(cursor.getDate() - (days - 1))
  for (let i = 0; i < days; i += 1) {
    out.push(todayKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}
