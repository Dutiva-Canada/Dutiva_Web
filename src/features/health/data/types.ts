import type { Database } from '@/lib/supabase/types'

type CheckInRow = Database['public']['Tables']['health_checkins']['Row']
type JournalRow = Database['public']['Tables']['health_journal_entries']['Row']

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

export interface HealthState {
  checkIns: HealthCheckIn[]
  entries: HealthJournalEntry[]
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
