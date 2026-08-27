/**
 * Client-side support analytics — fire-and-forget event recording for the
 * full support funnel (TODO.md D2, decided 2026-08-06). See
 * docs/SUPPORT_ANALYTICS.md for the privacy model.
 *
 * Same inert-unless-configured discipline as errorReporting (src/lib/
 * errorReporting): nothing is sent in dev, tests, or when VITE_SUPABASE_URL
 * is unset. The edge function (`support-analytics-event`) is pinned to
 * ca-central-1 via `forceFunctionRegion` so payload processing stays in
 * Canada even though Supabase functions otherwise run at the edge nearest
 * the caller.
 *
 * Consent-gated on top of that. Every event carries a daily-rotated visitor
 * identifier (visitorId.ts) that stitches a single visit's search → article →
 * vote sequence — profiling a visit within the meaning of Quebec Law 25
 * s. 8.1, which requires such technology to be OFF by default. So trackEvent()
 * also checks hasAnalyticsConsent() and records nothing until the visitor opts
 * in through the consent banner; with no recorded choice, no event is queued
 * and no visitor id is ever created.
 *
 * Events are queued and flushed in a single `sendBeacon`/fetch on page
 * unload or when the queue reaches 10 events, whichever comes first — so a
 * helpfulness vote or a search doesn't round-trip to the server individually.
 * A send failure is silently swallowed (analytics is best-effort, never
 * blocking).
 */

import { VERCEL_ENV } from '@/lib/deployEnv'
import { hasAnalyticsConsent } from '@/lib/analyticsConsent'
import { getVisitorId } from './visitorId'

export type AnalyticsEventType =
  | 'helpfulness_vote'
  | 'help_search'
  | 'help_article_view'
  | 'ticket_submitted'
  | 'ticket_status_changed'
  | 'web_vital'

export interface AnalyticsEventInput {
  event_type: AnalyticsEventType
  workspace_id?: string | null
  article_slug?: string | null
  search_query?: string | null
  search_result_count?: number | null
  vote_value?: 'yes' | 'no' | null
  ticket_reference?: string | null
  ticket_category?: string | null
  ticket_source?: string | null
  locale?: 'en' | 'fr' | null
  web_vital_name?: 'LCP' | 'INP' | 'CLS' | 'TTFB' | 'FCP' | null
  web_vital_value?: number | null
  web_vital_rating?: 'good' | 'needs-improvement' | 'poor' | null
  page_path?: string | null
}

/** Region the analytics function is pinned to — must match the DB region (ca-central-1). */
const ANALYTICS_REGION = 'ca-central-1'

/** Max events to buffer before flushing. */
const FLUSH_THRESHOLD = 10

let queue: (AnalyticsEventInput & { anonymous_visitor_id: string | null })[] = []
let flushScheduled = false

/** Whether analytics is active at all — same gates as errorReporting. */
function isActive(): boolean {
  if (typeof window === 'undefined') return false
  if (VERCEL_ENV !== 'production' && VERCEL_ENV !== 'preview') return false
  const url = import.meta.env.VITE_SUPABASE_URL
  return typeof url === 'string' && url.length > 0
}

/** The analytics endpoint, pinned to ca-central-1. Null when inactive. */
function endpoint(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url || typeof url !== 'string') return null
  return `${url.replace(/\/+$/, '')}/functions/v1/support-analytics-event?forceFunctionRegion=${ANALYTICS_REGION}`
}

/** Record an event. Fire-and-forget — never throws, never blocks. */
export function trackEvent(event: AnalyticsEventInput): void {
  if (!isActive()) return
  // Off by default (Law 25 s. 8.1): no consent, no event, no visitor id.
  if (!hasAnalyticsConsent()) return
  const enriched = { ...event, anonymous_visitor_id: getVisitorId() }
  queue.push(enriched)
  if (queue.length >= FLUSH_THRESHOLD) {
    void flush()
  } else if (!flushScheduled) {
    flushScheduled = true
    // Flush on next tick — coalesces rapid events (e.g. search + article view)
    // into a single round-trip without waiting for the threshold.
    setTimeout(() => {
      flushScheduled = false
      void flush()
    }, 2000)
  }
}

/** Flush the queue to the edge function. Best-effort — swallows all errors. */
export async function flush(): Promise<void> {
  if (queue.length === 0) return
  const url = endpoint()
  if (!url) {
    queue = []
    return
  }
  const batch = queue
  queue = []
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true, // survive page unload
    })
  } catch {
    // Intentionally swallowed — analytics is best-effort.
    // Don't re-queue: a transient failure shouldn't cause unbounded growth.
  }
}

/** Install a page-unload flush. Called once from main.tsx, same as installErrorReporting. */
export function installAnalyticsFlush(): void {
  if (typeof window === 'undefined') return
  if (!isActive()) return
  window.addEventListener('pagehide', () => {
    void flush()
  })
}

/** Test-only: reset the module state. */
export function __resetAnalyticsForTest(): void {
  queue = []
  flushScheduled = false
}

/** Test-only: inspect the current queue. */
export function __testQueue(): readonly AnalyticsEventInput[] {
  return queue
}
