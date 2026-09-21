/**
 * Landing-page conversion events. Pushes onto `dataLayer` so the same call
 * works whether the consented tag loader is GTM or the direct gtag snippet —
 * and stays a no-op until the visitor accepts analytics (Law 25 s. 8.1) or
 * when no measurement ID is configured (no dataLayer exists then either).
 */

import { hasAnalyticsConsent } from '@/lib/analyticsConsent'

export type LandingEvent =
  | 'cta_click' // { cta: 'see_plans' | 'open_demo' | 'join_waitlist', location: string }
  | 'showcase_tab' // { tab: string }
  | 'demo_tour_stop' // { stop: string }
  | 'waitlist_submit'

export function trackMarketingEvent(
  event: LandingEvent,
  params: Record<string, string> = {},
): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return
  const w = window as { dataLayer?: unknown[] }
  if (!Array.isArray(w.dataLayer)) return
  w.dataLayer.push({ event, ...params })
}
