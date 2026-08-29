/**
 * Google Tag Manager loader — gated on BOTH a configured container ID
 * (`VITE_GTM_CONTAINER_ID`) AND explicit user consent (`hasAnalyticsConsent`).
 *
 * The Google-provided snippets use an inline <head> script and a <noscript>
 * iframe. We cannot paste those into prerendered HTML: Law 25 s. 8.1 keeps
 * analytics off until the visitor accepts, and CSP forbids inline scripts.
 * This module is the equivalent — same `gtm.js` URL and `ns.html` iframe —
 * injected only after both gates pass.
 *
 * When Tag Manager is configured it is the tag loader; `loadGa4()` is skipped
 * so GA4 does not fire twice if the container already includes it.
 */

import { hasAnalyticsConsent } from '@/lib/analyticsConsent'
import { loadGa4 } from './ga4'

const SCRIPT_ID = 'dutiva-gtm'
const IFRAME_ID = 'dutiva-gtm-ns'

function containerId(): string | null {
  const id = import.meta.env.VITE_GTM_CONTAINER_ID
  if (typeof id !== 'string') return null
  const trimmed = id.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function isGtmConfigured(): boolean {
  return containerId() !== null
}

/**
 * Load GTM if and only if both gates pass. Injects the container script into
 * <head> and the noscript iframe at the top of <body>. Returns true when GTM
 * is present after the call (including if it was already loaded).
 */
export function loadGtm(): boolean {
  if (!isGtmConfigured()) return false
  if (!hasAnalyticsConsent()) return false
  if (typeof window === 'undefined' || typeof document === 'undefined') return false

  const id = containerId()
  if (!id) return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  w.dataLayer = w.dataLayer || []
  if (!document.getElementById(SCRIPT_ID)) {
    w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`
    document.head.appendChild(script)
  }

  if (!document.getElementById(IFRAME_ID) && document.body) {
    const iframe = document.createElement('iframe')
    iframe.id = IFRAME_ID
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${id}`
    iframe.title = 'Google Tag Manager'
    iframe.setAttribute('aria-hidden', 'true')
    iframe.width = '0'
    iframe.height = '0'
    iframe.className = 'gtm-ns'
    document.body.insertBefore(iframe, document.body.firstChild)
  }

  return true
}

/** Prefer GTM when configured; otherwise the direct GA4 gtag loader. */
export function loadConsentedTags(): boolean {
  if (loadGtm()) return true
  return loadGa4()
}
