import type { Database } from '@/lib/supabase/types'

type CheckInRow = Database['public']['Tables']['health_checkins']['Row']
type JournalRow = Database['public']['Tables']['health_journal_entries']['Row']
type HabitRow = Database['public']['Tables']['health_habits']['Row']
type HabitLogRow = Database['public']['Tables']['health_habit_logs']['Row']
type MemoryRow = Database['public']['Tables']['health_memories']['Row']

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
  /** When the person pressed "Let Mira read this" — null means the entry
      stays private and its excerpt never reaches her context. */
  sharedAt: string | null
  /** Storage path inside the private `health-journal-images` bucket —
      never the image bytes. Absent on rows fetched before migration
      0226's column existed. */
  imagePath?: string | null
  createdAt: string
  updatedAt: string
}

/** A daily wellness habit the user chose — "take a walk", "stretch",
    "screens off by 10". Non-clinical: tracking a routine, not treating
    anything. */
export interface HealthHabit {
  id: string
  name: string
  /** Opt-in times-per-week goal (1–6); null = the daily streak model.
      Absent on rows read before migration 0228's column existed. */
  weeklyTarget?: number | null
  createdAt: string
}

/** One habit marked done on one calendar day (YYYY-MM-DD, local time). */
export interface HealthHabitLog {
  id: string
  habitId: string
  day: string
  createdAt: string
}

/** A durable fact the person asked Mira to hold — a preference, a standing
    context, a boundary. Written two ways: by hand on the Home card
    ('manual'), or proposed by Mira in chat and accepted on the review
    queue ('mira'). Nothing lands here without a human hand. */
export interface HealthMemory {
  id: string
  text: string
  source: 'manual' | 'mira'
  createdAt: string
}

export interface HealthState {
  checkIns: HealthCheckIn[]
  entries: HealthJournalEntry[]
  habits: HealthHabit[]
  habitLogs: HealthHabitLog[]
  memories: HealthMemory[]
  /** True totals for the row-capped lists above — the stat strip shows
      these, not array lengths. Undefined in hand-built test fixtures. */
  checkInsTotal?: number
  entriesTotal?: number
  /** Pending agent_suggestions for this surface — the Review badge count. */
  pendingReview?: number
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
    sharedAt: row.shared_at,
    imagePath: row.image_path ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function habitFromRow(row: HabitRow): HealthHabit {
  return {
    id: row.id,
    name: row.name,
    weeklyTarget: row.weekly_target ?? null,
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

export function memoryFromRow(row: MemoryRow): HealthMemory {
  return {
    id: row.id,
    text: row.text,
    /* The check constraint guarantees 'manual' | 'mira' — the generated
       types don't reflect the enum, so narrow it here once. */
    source: row.source === 'mira' ? 'mira' : 'manual',
    createdAt: row.created_at,
  }
}
