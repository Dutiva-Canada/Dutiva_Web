/**
 * Pure logic for the support call-scheduling flow (TODO.md D3), shared
 * between support-agent-action (propose_call), support-confirm-call, and
 * support-call-scheduler (the reminder/follow-up cron sweep). Kept
 * side-effect-free and deterministic — callers pass `now` — the same
 * discipline src/features/support/triage.ts applies, so every branch is
 * testable without mocking the clock or a database.
 */

export const MIN_SLOTS = 1
export const MAX_SLOTS = 3
export const MIN_DURATION_MINUTES = 10
export const MAX_DURATION_MINUTES = 120

/** How long before a confirmed call's start to send the one reminder this flow sends. */
export const REMINDER_WINDOW_HOURS = 24
/** How long after a confirmed call's end before flagging it for a written follow-up. */
export const FOLLOWUP_GRACE_HOURS = 2

export interface ProposedSlot {
  start: string
  end: string
}

/** Validates an admin-supplied slot array: 1-3 entries, each a valid ISO range, each starting in the future. */
export function parseProposedSlots(input: unknown, now: Date): ProposedSlot[] | null {
  if (!Array.isArray(input) || input.length < MIN_SLOTS || input.length > MAX_SLOTS) return null
  const slots: ProposedSlot[] = []
  for (const entry of input) {
    if (typeof entry !== 'object' || entry === null) return null
    const { start, end } = entry as Record<string, unknown>
    if (typeof start !== 'string' || typeof end !== 'string') return null
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null
    if (endDate <= startDate) return null
    if (startDate <= now) return null
    slots.push({ start: startDate.toISOString(), end: endDate.toISOString() })
  }
  return slots
}

/** Validates the duration an admin proposed alongside the slots. */
export function isValidDurationMinutes(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_DURATION_MINUTES &&
    value <= MAX_DURATION_MINUTES
  )
}

/** Validates the index a customer picked out of the proposed slots. */
export function parseSlotIndex(value: unknown, slotCount: number): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null
  if (value < 0 || value >= slotCount) return null
  return value
}

export interface SchedulerRow {
  id: string
  confirmedStart: string | null
  confirmedEnd: string | null
  reminderSentAt: string | null
  followupFlaggedAt: string | null
}

/** Confirmed calls starting within REMINDER_WINDOW_HOURS that haven't been reminded yet. */
export function rowsNeedingReminder(rows: SchedulerRow[], now: Date): SchedulerRow[] {
  const cutoff = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000)
  return rows.filter(
    (r) =>
      r.confirmedStart !== null &&
      r.reminderSentAt === null &&
      new Date(r.confirmedStart) <= cutoff &&
      new Date(r.confirmedStart) > now,
  )
}

/** Confirmed calls whose end time is more than FOLLOWUP_GRACE_HOURS in the past, not yet flagged. */
export function rowsNeedingFollowup(rows: SchedulerRow[], now: Date): SchedulerRow[] {
  const cutoff = new Date(now.getTime() - FOLLOWUP_GRACE_HOURS * 60 * 60 * 1000)
  return rows.filter(
    (r) =>
      r.confirmedEnd !== null && r.followupFlaggedAt === null && new Date(r.confirmedEnd) <= cutoff,
  )
}
