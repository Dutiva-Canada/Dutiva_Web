/**
 * Google Analytics 4 loader — gated on BOTH a configured measurement ID
 * (`VITE_GA_MEASUREMENT_ID`) AND explicit user consent (`hasAnalyticsConsent`).
 *
 * The Privacy Policy already names GA4 as the optional analytics provider
 * ("Google Analytics, if enabled: product or website analytics. The current
 * application only loads this service when a measurement ID is configured."),
 * and the Cookie Policy commits to consent controls before loading optional
 * analytics. This module honours both: without a measurement ID, nothing
 * loads; with one but without consent, nothing loads. The consent banner
 * ships in `src/features/marketing/analytics/ConsentBanner.tsx`; GA4 loads
 * only when a visitor accepts analytics.
 *
 * When both gates pass, the GA4 script is injected into <head> and
 * `dataLayer` is initialized. Page views are tracked automatically by GA4's
 * enhanced measurement for SPA navigations when the script is loaded.
 */

import { hasAnalyticsConsent } from '@/lib/analyticsConsent'

/** Whether GA4 should load at all. */
export function isGa4Configured(): boolean {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID
  return typeof id === 'string' && id.length > 0
}

/**
 * Load GA4 if and only if both gates pass: a configured measurement ID AND
 * explicit user consent. Called once from the marketing shell at mount.
 * Returns true if GA4 was loaded, false otherwise.
 */
export function loadGa4(): boolean {
  if (!isGa4Configured()) return false
  if (!hasAnalyticsConsent()) return false
  if (typeof window === 'undefined' || typeof document === 'undefined') return false

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string

  // Standard GA4 snippet — only runs when both gates have passed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  w.dataLayer = w.dataLayer || []
  w.gtag = function gtag() {
    w.dataLayer.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', measurementId, { anonymize_ip: true })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  return true
}
