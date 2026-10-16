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

export interface NotifyPrefRow {
  user_id: string
  email_enabled: boolean
  reminder_enabled: boolean
}

/**
 * Opted-in reminder recipients: reminder_enabled on, email_enabled not
 * false (that master switch still wins — "no emails" means no emails),
 * and no check-in row stamped today. Absent rows can't appear — the
 * query that feeds this filters on reminder_enabled = true.
 */
export function reminderRecipients(
  prefs: NotifyPrefRow[],
  checkedInToday: Set<string>,
): Set<string> {
  const out = new Set<string>()
  for (const p of prefs) {
    if (!p.reminder_enabled || p.email_enabled === false) continue
    if (checkedInToday.has(p.user_id)) continue
    out.add(p.user_id)
  }
  return out
}
