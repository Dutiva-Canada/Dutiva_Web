/**
 * Registers the offline service worker (dist/sw.js, generated at build time by
 * scripts/generate-sw.mjs).
 *
 * Production browser builds only: the dev server must never be caching (it
 * breaks HMR) and no sw.js exists there anyway, so this is a no-op under
 * `vite dev` and in tests (import.meta.env.PROD === false). Registration is
 * deferred to the load event so it never competes with first paint, and
 * updateViaCache:'none' makes the browser revalidate sw.js against the network
 * on each navigation rather than serving it from the HTTP cache — so a
 * redeployed worker is picked up promptly. A failed registration is swallowed:
 * offline support is an enhancement and must never break the live app.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  reloadOnWorkerTakeover(navigator.serviceWorker, window.location)

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {
      /* Never let a registration failure surface to the user. */
    })
  })
}

/**
 * When a replacement worker takes control of this already-open tab (a new
 * deploy activated and called clients.claim()), reload once so the page
 * re-renders against the new worker with fresh, per-route HTML — instead of
 * leaving the tab on whatever the superseded worker had served until the user
 * manually hard-refreshes (the "content looks stale / doubled until I force a
 * refresh" symptom this recovers from).
 *
 * Exported for tests; registerServiceWorker wires it to the real
 * navigator.serviceWorker + window.location in production browsers only.
 *
 * Guards, in order:
 *  - Nothing was controlling this load (`hadController` false): a first-visit
 *    install's initial claim, or a hard reload (worker bypassed) — either way
 *    already the freshest load, with nothing stale to escape. Also means the
 *    reload only ever fires for an *update* replacing a running worker.
 *  - The workspace + portal surfaces: drafts — the Advisor/Tally composer
 *    text, a half-filled order or mandate field, a half-signed document —
 *    live only in React state, so reloading would silently discard unsent
 *    work. The stale-content symptom this fixes was on the public marketing
 *    pages, which hold no such state, so recovery is limited to them.
 *    Segment-matched (`/pr` must not shadow `/pricing`). Read at takeover
 *    time so a client-side navigation into a workspace is respected.
 *  - `reloaded` latch: one reload per page load, so it can never loop.
 */
const NO_TAKEOVER_RELOAD = [
  '/workspace',
  /* Same both-spellings rule as /health: /app redirects client-side, but a
     client sitting on the old URL still holds drafts worth protecting. */
  '/app',
  '/invest',
  /* Both spellings — /health redirects client-side now, but a client
     sitting on the old URL still deserves draft protection. */
  '/wellness',
  '/health',
  '/pr',
  '/careers',
  '/fr/carrieres',
  '/employer',
  '/fr/employeur',
  '/sign',
  '/fr/sign',
]

export function reloadOnWorkerTakeover(
  container: ServiceWorkerContainer,
  location: Pick<Location, 'pathname' | 'reload'>,
): void {
  const hadController = container.controller !== null
  let reloaded = false
  container.addEventListener('controllerchange', () => {
    if (reloaded || !hadController) return
    const path = location.pathname
    if (NO_TAKEOVER_RELOAD.some((p) => path === p || path.startsWith(`${p}/`))) return
    reloaded = true
    location.reload()
  })
}
