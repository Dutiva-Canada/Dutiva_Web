/* How old is too old for a market quote. Session-aware: the quarter-hour
   sync writes every ~15 min during North American hours, so 90 min
   misses several runs; outside the session only the 07:20 UTC daily
   sync writes, so ~26h is the honest window — the same gap the
   overdue-run flag exists to show. */

const SESSION_STALE_MS = 90 * 60_000
const DAILY_STALE_MS = 26 * 3_600_000

function inSession(nowMs: number): boolean {
  const d = new Date(nowMs)
  const dow = d.getUTCDay()
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes()
  return dow >= 1 && dow <= 5 && mins >= 13 * 60 && mins < 22 * 60
}

export function quoteStaleMs(nowMs = Date.now()): number {
  return inSession(nowMs) ? SESSION_STALE_MS : DAILY_STALE_MS
}

export function isQuoteStale(asOfIso: string | null | undefined, nowMs = Date.now()): boolean {
  if (!asOfIso) return false
  return nowMs - Date.parse(asOfIso) > quoteStaleMs(nowMs)
}

/* The agent's daily cadence — a run older than this means the last
   sweep missed its window. Matches the market-sync watchdog's write
   threshold so the tile's amber note and the alert row agree. */
export const AGENT_RUN_STALE_MS = DAILY_STALE_MS
