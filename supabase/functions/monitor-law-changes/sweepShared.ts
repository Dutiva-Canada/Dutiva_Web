/**
 * Shared context and thresholds for the law-monitor sweep — the deps the
 * per-page case handlers need threaded through, plus the failure/staleness
 * bounds that decide when "quiet" becomes "suspect".
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { LawAnalysis } from './lawChangeAnalysis.ts'

/** Facts → a plain-English read for an HR audience, or null when the model
    route/key is unavailable (the factual row files regardless). */
export type AnalyzeChangeFn = (
  lawName: string,
  jurisdiction: string,
  facts: string,
) => Promise<LawAnalysis | null>

/** One law_page_hashes row as loaded for comparison. */
export interface HashRecord {
  hash: string
  failures: number
  redirectUrl: string | null
  meta: unknown
}

export interface SweepCtx {
  db: SupabaseClient
  hfToken: string
  analyzeChange: AnalyzeChangeFn
}

/** Consecutive failures before we alert and attempt URL recovery. */
export const BROKEN_ALERT_THRESHOLD = 3
export const DAY_MS = 86_400_000
/* Source-liveness heartbeats — a source that keeps answering 200s while its
   data stops advancing looks identical to "no changes" at the fingerprint
   level. e-Laws' currency-date normally moves within days (a 90-day-old
   claim means the corpus froze); Données Québec republishes roughly
   fortnightly but a 71-day gap is on record, so Québec gets 120 days
   before we suspect the feed rather than the law. */
export const ONTARIO_SOURCE_STALE_MS = 90 * DAY_MS
export const QUEBEC_DATASET_STALE_MS = 120 * DAY_MS
