import type { Database } from '@/lib/supabase/types'

type CheckInRow = Database['public']['Tables']['health_checkins']['Row']
type JournalRow = Database['public']['Tables']['health_journal_entries']['Row']
type HabitRow = Database['public']['Tables']['health_habits']['Row']
type HabitLogRow = Database['public']['Tables']['health_habit_logs']['Row']

export interface HealthCheckIn {
  id: string
  /** Self-reported mood, 1 (rough) → 5 (great). Not a clinical score. */
  mood: number
  /** Self-reported energy, 1 (drained) → 5 (energized). Optional. */
  energy: number | null
  note: string
  createdAt: string
}

export interface HealthJournalEntry {
  id: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

/** A daily wellness habit the user chose — "take a walk", "stretch",
    "screens off by 10". Non-clinical: tracking a routine, not treating
    anything. */
export interface HealthHabit {
  id: string
  name: string
  createdAt: string
}

/** One habit marked done on one calendar day (YYYY-MM-DD, local time). */
export interface HealthHabitLog {
  id: string
  habitId: string
  day: string
  createdAt: string
}

export interface HealthState {
  checkIns: HealthCheckIn[]
  entries: HealthJournalEntry[]
  habits: HealthHabit[]
  habitLogs: HealthHabitLog[]
  lastLoadedAt: string
}

export function checkInFromRow(row: CheckInRow): HealthCheckIn {
  return {
    id: row.id,
    mood: row.mood,
    energy: row.energy,
    note: row.note,
    createdAt: row.created_at,
  }
}

export function journalFromRow(row: JournalRow): HealthJournalEntry {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function habitFromRow(row: HabitRow): HealthHabit {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }
}

export function habitLogFromRow(row: HabitLogRow): HealthHabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    day: row.day,
    createdAt: row.created_at,
  }
}
