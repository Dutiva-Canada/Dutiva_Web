/**
 * Shared utilities for the communications workspace.
 *
 * The localStorage persistence stub that previously lived here has been
 * replaced by Supabase-backed API files (`*Api.ts`) and the
 * `CommsDataProvider` now loads and persists through those directly.
 * This module retains only the domain-agnostic helpers that screens import
 * directly (e.g. `getSubmissionDueStatus`).
 */

export type SubmissionDueStatus = 'overdue' | 'due-soon' | 'ok'

export function getSubmissionDueStatus(deadline?: string): SubmissionDueStatus {
  if (!deadline) return 'ok'
  const [year = 0, month = 1, day = 1] = deadline.split('-').map((n) => Number(n))
  const due = Date.UTC(year, month - 1, day)
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  if (Number.isNaN(due)) return 'ok'
  if (due < today) return 'overdue'
  const days = (due - today) / (1000 * 60 * 60 * 24)
  if (days <= 7) return 'due-soon'
  return 'ok'
}
