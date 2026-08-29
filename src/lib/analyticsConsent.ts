/**
 * Consent state for optional analytics — the single source of truth read by
 * every analytics path that must not run without permission.
 *
 * Two consumers gate on it:
 *   - Google Tag Manager / GA4 (src/features/marketing/analytics/gtm.ts,
 *     ga4.ts): optional third-party tags, loaded only when configured AND
 *     the visitor has consented.
 *   - First-party support analytics (src/features/support/analytics/
 *     supportAnalytics.ts): Help-Centre and support-funnel events that carry a
 *     daily-rotated visitor identifier. Because that identifier profiles a
 *     visit, Quebec Law 25 (s. 8.1) requires it to be off by default — so
 *     trackEvent() checks hasAnalyticsConsent() and records nothing until the
 *     visitor opts in.
 *
 * "Off by default" is the whole point: with no recorded response,
 * hasAnalyticsConsent() returns false and both consumers stay inert. The
 * consent banner (src/features/marketing/analytics/ConsentBanner.tsx) is what
 * records a choice — setAnalyticsConsent(true) from Accept, (false) from
 * Decline — and the choice is revocable from the footer's "Cookie preferences"
 * control, which reopens the banner.
 *
 * Lives in src/lib rather than a feature folder because the state is shared
 * across the marketing and support surfaces; a feature-local home would force
 * one surface to reach into another's internals.
 */

const CONSENT_KEY = 'dutiva.analytics.consent'

function defaultStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Whether the visitor has granted consent for optional analytics. Returns
 * `false` when storage is unavailable or no consent has been recorded — the
 * off-by-default posture the tracking gates depend on.
 */
export function hasAnalyticsConsent(storage: Storage | null = defaultStorage()): boolean {
  if (!storage) return false
  try {
    return storage.getItem(CONSENT_KEY) === 'true'
  } catch {
    return false
  }
}

/** Record the visitor's consent choice. Called by the consent banner. */
export function setAnalyticsConsent(
  granted: boolean,
  storage: Storage | null = defaultStorage(),
): void {
  if (!storage) return
  try {
    storage.setItem(CONSENT_KEY, granted ? 'true' : 'false')
  } catch {
    // Best-effort — a blocked store must not break the UI.
  }
}

/**
 * Whether the visitor has seen and answered the consent banner. Distinguishes
 * "declined" (a recorded `false`) from "not yet asked" (no value), so the
 * banner shows on the first visit and stays hidden once a choice exists.
 */
export function hasConsentResponse(storage: Storage | null = defaultStorage()): boolean {
  if (!storage) return false
  try {
    return storage.getItem(CONSENT_KEY) !== null
  } catch {
    return false
  }
}
