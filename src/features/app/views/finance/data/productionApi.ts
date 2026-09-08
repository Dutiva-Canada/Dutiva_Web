import type { FinanceJournalLine } from './types'

/**
 * Pure utility helpers for the finance workspace.
 *
 * The localStorage persistence stub has been removed — production mode now
 * uses the Supabase-backed APIs in `supabaseApi.ts`. Demo mode uses the
 * fixtures in `fixtures.ts`. Only stateless helpers remain here.
 */

/* ---------- Journal balance check ---------- */

export function isJournalBalanced(lines: FinanceJournalLine[]): boolean {
  const debit = lines.reduce((sum, l) => sum + parseDecimal(l.debit), 0)
  const credit = lines.reduce((sum, l) => sum + parseDecimal(l.credit), 0)
  return Math.abs(debit - credit) < 0.005
}

function parseDecimal(s: string): number {
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

/* ---------- Deadline helpers ---------- */

export type DeadlineState = 'none' | 'ok' | 'due_soon' | 'overdue'

export function deadlineState(dueDate: string | undefined, soonDays = 7): DeadlineState {
  if (!dueDate) return 'none'
  const now = new Date()
  const due = new Date(dueDate + 'T23:59:59Z')
  const soonCutoff = new Date(now.getTime() + soonDays * 24 * 60 * 60 * 1000)
  if (due < now) return 'overdue'
  if (due <= soonCutoff) return 'due_soon'
  return 'ok'
}
