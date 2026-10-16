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
  /* Local end-of-day — 'T23:59:59Z' would mark the item overdue at local
     evening (UTC-5..-8) while the calendar still says today. */
  const due = new Date(`${dueDate}T23:59:59`)
  const soonCutoff = new Date(now.getTime() + soonDays * 24 * 60 * 60 * 1000)
  if (due < now) return 'overdue'
  if (due <= soonCutoff) return 'due_soon'
  return 'ok'
}
