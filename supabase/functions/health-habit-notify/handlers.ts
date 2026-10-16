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
  /** Local day the habit was created (migration 0229) — the floor for its
      streak math; a backfilled mark can't reach behind its birth. NULL →
      created_at's UTC date, the pre-0229 shape. */
  day?: string | null
  created_at?: string | null
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

/** The user's local calendar day (YYYY-MM-DD) in their stamped timezone —
    the sweep's "today" is per-person, not per-UTC. An invalid or absent
    zone falls back to the UTC date the sweep always used. */
export function localDay(nowUtc: Date, tz: string | null | undefined): string {
  if (!tz) return toIsoDay(nowUtc)
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(nowUtc)
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
    return `${p.year}-${p.month}-${p.day}`
  } catch {
    return toIsoDay(nowUtc)
  }
}

/** The day a habit started existing — stored local day when present, else
    created_at's UTC date, else no floor (bare fixtures stay unrestricted). */
function habitStartDay(h: HabitRow): string | null {
  return h.day ?? h.created_at?.slice(0, 10) ?? null
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
 * `todayFor` answers each user's local day — pass a constant to keep the
 * sweep's old single-clock behaviour, or a lookup keyed by stamped tz.
 */
export function atRiskHabits(
  habits: HabitRow[],
  logs: HabitLogRow[],
  todayFor: string | ((userId: string) => string),
): Map<string, string[]> {
  const forUser = typeof todayFor === 'function' ? todayFor : () => todayFor
  const daysByHabit = new Map<string, Set<string>>()
  for (const log of logs) {
    const set = daysByHabit.get(log.habit_id) ?? new Set<string>()
    set.add(log.day)
    daysByHabit.set(log.habit_id, set)
  }

  const out = new Map<string, string[]>()
  for (const habit of habits) {
    const floor = habitStartDay(habit)
    const rawDays = daysByHabit.get(habit.id)
    const days =
      floor == null ? rawDays : rawDays && new Set([...rawDays].filter((d) => d >= floor))
    if (!days || days.size === 0) continue
    const todayISO = forUser(habit.user_id)
    if (days.has(todayISO)) continue
    if (streakEndingOn(days, addDays(todayISO, -1)) < 1) continue
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
  /** IANA timezone stamped by the portal (migration 0229) — the sweep
      computes this user's "today" from it. Absent → UTC, the old default. */
  tz?: string | null
}

/**
 * Opted-in reminder recipients: reminder_enabled on, email_enabled not
 * false (that master switch still wins — "no emails" means no emails),
 * and no check-in on their local today. The caller builds `checkedInToday`
 * per user — a check-in's stored day is compared to the recipient's own
 * date, so "today" means the same thing to the sweep as it did to them.
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
