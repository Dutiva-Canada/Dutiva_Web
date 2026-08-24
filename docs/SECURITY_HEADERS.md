# HTTP security headers

Set in `vercel.json` on every route (`/:path*`), added 2026-08-08 after the
security audit found none present. The full **Content-Security-Policy** is
now enforcing; it was promoted from Report-Only on 2026-08-10 after a
signed-in Playwright click-through of the marketing and app surfaces showed
zero console violations.

## Enforcing now

| Header | Value | Closes |
| --- | --- | --- |
| `X-Frame-Options` | `DENY` | Clickjacking — nothing legitimately frames `dutiva.ca` or the `/app` workspace. |
| `Content-Security-Policy` | `default-src 'self'; ...` (full resource policy, see below) | Modern-browser clickjacking + `<object>`/`<embed>` + `<base>` hijack, plus all resource directives. Promoted to enforcing 2026-08-10. |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing on user-influenced blobs. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Path/query leakage to third parties. |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | SSL-strip / downgrade. (No `preload` yet — that commits every subdomain to HTTPS permanently; add it and submit to hstspreload.org when ready.) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | Powerful features the app never uses; opts out of Topics. |

## Enforcing CSP — promoted 2026-08-10

The full resource policy is now served as `Content-Security-Policy` on every
route. It was verified with a Playwright signed-in click-through (marketing
pages, `/fr`, `/app`, Advisor, Documents, Knowledge, Support, People, Cases)
on 2026-08-10 and logged **zero CSP console violations**.

The allowed origins:

- **self** — the app's own bundle and API calls.
- **Supabase** `khtwpxnvziiyplaflwru.supabase.co` (+ `wss:` for realtime) — REST, auth, edge functions.
- **Google Fonts** — `fonts.googleapis.com` (stylesheet), `fonts.gstatic.com` (fonts).
- **GA4** — `googletagmanager.com`, `google-analytics.com`, `region1.google-analytics.com` (consent-gated).
- **CAPTCHA** — Turnstile (`challenges.cloudflare.com` and `*.challenges.cloudflare.com`) and hCaptcha (`js.hcaptcha.com`, `newassets.hcaptcha.com`, `api.hcaptcha.com`).

`script-src` no longer includes `'unsafe-inline'` (2026-08-23): bootstrap
scripts moved to `/bootstrap-auth.js` and `/bootstrap-theme.js`. `style-src`
no longer includes `'unsafe-inline'` (2026-08-23): React inline `style={{…}}`
attributes were replaced with Tailwind utilities, SVG geometry (`ProgressFill`),
and colocated CSS classes. Prerendered marketing pages allow one hashed inline
script for React Router static hydration data (`__staticRouterHydrationData`).

### Ongoing CSP hygiene

- Hermetic regression: `e2e/csp.spec.ts` (via `npm run test:e2e`) fails on
  `script-src` or `style-src` console violations on marketing load and `/app`
  welcome — run after any inline-script or inline-style change.
- Re-test after any new third-party integration, new font origin, or inline
  script change.
- If a new origin is needed, add it to the matching directive in
  `vercel.json` **and** update the list above so the source and the docs do
  not drift.
