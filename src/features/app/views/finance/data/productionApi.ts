/**
 * Pure utility helpers for the finance workspace.
 *
 * The localStorage persistence stub has been removed — production mode now
 * uses the Supabase-backed APIs in `supabaseApi.ts`. Demo mode uses the
 * fixtures in `fixtures.ts`. Only stateless helpers remain here.
 */

/* ---------- Deadline helpers ---------- */

type DeadlineState = 'none' | 'ok' | 'due_soon' | 'overdue'

export function deadlineState(dueDate: string | undefined, soonDays = 7): DeadlineState {
  if (!dueDate) return 'none'
  const now = new Date()
  const due = new Date(dueDate + 'T23:59:59Z')
  const soonCutoff = new Date(now.getTime() + soonDays * 24 * 60 * 60 * 1000)
  if (due < now) return 'overdue'
  if (due <= soonCutoff) return 'due_soon'
  return 'ok'
}
