# Offline support (PWA)

Dutiva Web ships a service worker so the site keeps working in the browser
after you lose connectivity, and can be **installed** like a desktop/phone
app. This exists mainly to make the app easy to demo and test with no wifi —
open it once online, then it runs fully offline.

## How to test it offline

The service worker only runs in **production builds** (never under `npm run
dev`, where caching would fight HMR). So:

```bash
npm run build      # generates dist/, including dist/sw.js
npm run preview     # serve the production build at http://localhost:4173
```

Then, in the browser:

1. Open the preview URL once **while online** — this installs the worker and
   fills the offline cache (watch `Application → Service Workers` in DevTools).
2. Go offline — DevTools **Network → Offline**, or literally turn off wifi.
3. Reload and click around. Marketing pages, `/pricing`, `/templates`, and the
   whole `/app` workspace all render from cache, populated with the built-in
   demo data.

To **install** it: use the browser's install icon in the address bar (Chrome/
Edge) or _Share → Add to Home Screen_ (iOS Safari). It launches standalone,
using the existing `public/site.webmanifest`.

> First visit must be online. A service worker can only install once the page
> has loaded over the network — that's the browser's contract, not a Dutiva
> limitation. After that first load, offline works.

## What works offline vs. what doesn't

- **Works:** every public page and the full `/app` workspace in **demo mode**
  (the bundled fixtures in `src/data/`). This is the same graceful fallback the
  app uses whenever `VITE_SUPABASE_*` is unset — no backend required.
- **Doesn't (by design):** anything that needs the live backend — signing in,
  and any **production-mode** data (real cases/employees from Supabase). Those
  calls go to `*.supabase.co`; the worker deliberately never caches backend
  data, so it fails cleanly offline rather than serving stale records.
- **Fonts:** Inter Variable + Montserrat Variable are self-hosted same-origin
  woff2 files under `/assets/` (latin + latin-ext). They ride the hashed-asset
  precache, so they render offline after the first online visit.

## How it works

- **`scripts/generate-sw.mjs`** runs at the end of `npm run build` (after the
  client build, SSR build, and prerender) and writes **`dist/sw.js`**. It
  enumerates the hashed `dist/assets/*`, brand images, and the prerendered
  shells (`/`, `/app.html`, `/404.html`) into a precache list, and derives the
  cache version from a hash of that list — deterministic, no build timestamps,
  and any asset change rotates the cache automatically.
- **`src/lib/registerServiceWorker.ts`** registers `/sw.js` from `main.tsx`,
  guarded to production browser builds only.
- **Caching strategy** (in `sw.js`):
  - HTML navigations → **network-first**. Online users and search crawlers
    always get fresh, per-route prerendered HTML; offline falls back to the
    cached page, then to the SPA shell (which re-renders the route
    client-side). This is what keeps the service worker from ever hurting SEO.
  - Hashed assets / brand images → **cache-first** (they're immutable; includes
    self-hosted Inter/Montserrat woff2).
  - Cross-origin backend traffic (Supabase) → **not intercepted**.

### Updates / avoiding stale content

New deploys change asset hashes, which rotate the cache version, so the old
cache is deleted on the next activation. `sw.js` itself is served with
`Cache-Control: public, max-age=0, must-revalidate` (see `vercel.json`) and
registered with `updateViaCache: 'none'`, so the browser always revalidates it
against the network and picks up new builds promptly. Because navigations are
network-first, online visitors never see stale HTML.

If you ever need to fully reset during testing: DevTools → _Application →
Storage → Clear site data_, or unregister the worker under _Service Workers_.
