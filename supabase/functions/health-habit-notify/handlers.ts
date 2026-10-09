/**
 * Streak-at-risk selection for health-habit-notify. Pure so vitest can cover
 * the date math — an "at risk" habit has a live streak (done yesterday or
 * more) and no log row for today yet. The nudge is intentionally once a day;
 * the notification_log unique key enforces it even if cron double-fires.
 */

export interface HabitRow {
  id: string
  user_id: string
  name: string
}

export interface HabitLogRow {
  habit_id: string
  user_id: string
  day: string
}

function toIsoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return toIsoDay(d)
}

/** Consecutive logged days ending at `day` (inclusive). 0 if `day` itself
    isn't logged. */
export function streakEndingOn(days: Set<string>, day: string): number {
  let streak = 0
  let cursor = day
  while (days.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

/**
 * Habits at risk per user: logged yesterday (live streak) but not today.
 * A habit done today is safe; one never started has nothing to protect.
 */
export function atRiskHabits(
  habits: HabitRow[],
  logs: HabitLogRow[],
  todayISO: string,
): Map<string, string[]> {
  const yesterday = addDays(todayISO, -1)
  const daysByHabit = new Map<string, Set<string>>()
  for (const log of logs) {
    const set = daysByHabit.get(log.habit_id) ?? new Set<string>()
    set.add(log.day)
    daysByHabit.set(log.habit_id, set)
  }

  const out = new Map<string, string[]>()
  for (const habit of habits) {
    const days = daysByHabit.get(habit.id)
    if (!days || days.has(todayISO)) continue
    if (streakEndingOn(days, yesterday) < 1) continue
    const list = out.get(habit.user_id) ?? []
    list.push(habit.name)
    out.set(habit.user_id, list)
  }
  return out
}
