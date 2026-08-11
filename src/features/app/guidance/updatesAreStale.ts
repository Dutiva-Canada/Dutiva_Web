import type { LawUpdate } from './api'

/**
 * Days without a monitor report before the panel says so. The monitor sweeps
 * daily (0035_schedule_law_monitor.sql), so a week of silence means it is not
 * running — the exact state that went unnoticed between June and July 2026.
 */
const STALE_AFTER_DAYS = 7

/** True when the newest update is old enough that it should not read as current. */
export function updatesAreStale(updates: readonly LawUpdate[]): boolean {
  const newest = updates.reduce<number | null>((max, u) => {
    if (!u.detectedAt) return max
    const t = new Date(u.detectedAt).getTime()
    if (Number.isNaN(t)) return max
    return max === null || t > max ? t : max
  }, null)
  if (newest === null) return false
  return Date.now() - newest > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000
}
