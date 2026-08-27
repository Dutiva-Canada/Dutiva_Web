/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { registerServiceWorker } from './lib/registerServiceWorker'
import { installErrorReporting, reportRecoverableError } from '@/lib/errorReporting'
import { installAnalyticsFlush } from '@/features/support/analytics/supportAnalytics'
import { installWebVitalsReporting } from '@/lib/webVitals'

/* Install global error/rejection reporting before the app renders so early
   crashes are captured too. Inert in dev, tests, and non-production/preview
   deploys (see src/lib/errorReporting). */
installErrorReporting()

/* Install the analytics page-unload flush so queued events are sent before
   the user navigates away. Same inert-unless-configured discipline. */
installAnalyticsFlush()
installWebVitalsReporting()

const rootEl = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

/* React already recovers from these on its own (most commonly a hydration
   mismatch on the public, prerendered pages: it discards the mismatched
   subtree and re-renders from scratch, so nothing breaks for the visitor) —
   but recovery is otherwise silent about *where*. Reporting it with the
   component stack, instead of leaving it to the generic window.onerror path,
   is what lets a hydration mismatch actually be diagnosed from production
   telemetry rather than guessed at. */
const rootOptions = { onRecoverableError: reportRecoverableError }

/* Public pages ship prerendered HTML (scripts/prerender.mjs) and hydrate;
   the app shell (app.html) has an empty root and client-renders. */
if (rootEl.childElementCount > 0) {
  hydrateRoot(rootEl, app, rootOptions)
} else {
  createRoot(rootEl, rootOptions).render(app)
}

/* Enable offline use in production builds (no-op in dev / tests). */
registerServiceWorker()
