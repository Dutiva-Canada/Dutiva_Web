# HTTP security headers

Set in `vercel.json` on every route (`/(.*)`), added 2026-08-08 after the
security audit found none present. The matcher is `/(.*)` rather than
`/:path*` because Vercel's path-to-regexp does **not** apply `/:path*` to
`/` — TrustedSite (and any other homepage scanner) was reading the apex
with no CSP, no `X-Frame-Options`, and no `nosniff`. The full
**Content-Security-Policy** is now enforcing; it was promoted from
Report-Only on 2026-08-10 after a signed-in Playwright click-through of
the marketing and app surfaces showed zero console violations.

## Enforcing now

| Header                        | Value                                                          | Closes                                                                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `X-Frame-Options`             | `DENY`                                                         | Clickjacking — nothing legitimately frames `dutiva.ca` or the `/app` workspace.                                                                                                      |
| `Content-Security-Policy`     | `default-src 'self'; ...` (full resource policy, see below)    | Modern-browser clickjacking + `<object>`/`<embed>` + `<base>` hijack, plus all resource directives. Promoted to enforcing 2026-08-10.                                                |
| `X-Content-Type-Options`      | `nosniff`                                                      | MIME sniffing on user-influenced blobs.                                                                                                                                              |
| `Referrer-Policy`             | `strict-origin-when-cross-origin`                              | Path/query leakage to third parties.                                                                                                                                                 |
| `Strict-Transport-Security`   | `max-age=63072000; includeSubDomains`                          | SSL-strip / downgrade. (No `preload` yet — that commits every subdomain to HTTPS permanently; add it and submit to hstspreload.org when ready.)                                      |
| `Permissions-Policy`          | Broad deny list (camera/mic/geo/payment/usb/… + Topics)        | Powerful browser features the app never uses; opts out of Topics / FLoC. Expanded 2026-09-02 after ImmuniWeb flagged the shorter list as misconfigured.                              |
| `Cross-Origin-Opener-Policy`  | `same-origin-allow-popups`                                     | Process-isolates the browsing context from cross-origin openers while still allowing intentional popups (auth/payment).                                                              |
| `Cross-Origin-Resource-Policy`| `same-origin`                                                  | Stops other origins from embedding our documents/assets as no-cors resources.                                                                                                        |
| `Origin-Agent-Cluster`        | `?1`                                                           | Asks the browser to give this origin its own agent cluster (Spectre isolation hint).                                                                                                 |
| `X-Permitted-Cross-Domain-Policies` | `none`                                                   | Blocks legacy Adobe cross-domain policy files (Flash/PDF).                                                                                                                           |
| `X-DNS-Prefetch-Control`      | `off`                                                          | Disables speculative DNS prefetch of outbound links.                                                                                                                                 |
| `Access-Control-Allow-Origin` | `https://dutiva.ca`                                            | Overrides Vercel's static-file default of `*`. The marketing site is first-party; hashed `/assets/*` files are still fetched same-origin (including the `crossorigin` font preload). |

## Deliberately not set

| Header | Why |
| --- | --- |
| `Cross-Origin-Embedder-Policy: require-corp` | Would break Turnstile, hCaptcha, TrustedSite, and GTM embeds that do not send matching CORP headers. |
| `Clear-Site-Data` | Must not ship on normal page responses — it wipes cookies and storage. |
| `X-XSS-Protection` | Deprecated; modern browsers ignore it, and ImmuniWeb **penalizes** its presence. CSP replaces it. |
| `Document-Policy` / `Integrity-Policy` | Experimental scanner checklists; no product need yet. |
| Removing `Server: Vercel` | Injected by the platform; not overridable from `vercel.json`. |

## Crawler-invented `/support@dutiva.ca`

JSON-LD `Organization.email` is `mailto:support@dutiva.ca`. Some scanners
still request `https://dutiva.ca/support@dutiva.ca` as if it were a page.
A 308 to `/contact` is not enough for those tools: they score the original
URL as a failed page load unless it returns 200 with HTML. `vercel.json`
rewrites the invented path (and `/fr/support@dutiva.ca`) to the contact
page, with `X-Robots-Tag: noindex, nofollow`. Canonical tags on that HTML
still point at `/contact`.

## Directory indexes

Vercel Directory Listing was on for this project, so `GET /assets` (and
`/brand`, `/.well-known`) returned an HTML inventory of every hashed
bundle. `middleware.js` answers those exact paths with 404; files under
them (`/assets/….js`, `/brand/icon-app.svg`, `/.well-known/security.txt`)
are unchanged. Turn the project-wide setting off too: Vercel dashboard →
Project → Settings → Advanced → Directory Listing.

## Not overridable / scanner noise

`Server: Vercel` is injected by the platform. `vercel.json` cannot remove or
rename it. Scanners that flag it as an info leak will keep flagging it on
this host — that is expected on Vercel.

## Enforcing CSP — promoted 2026-08-10

The full resource policy is now served as `Content-Security-Policy` on every
route. It was verified with a Playwright signed-in click-through (marketing
pages, `/fr`, `/app`, Advisor, Documents, Knowledge, Support, People, Cases)
on 2026-08-10 and logged **zero CSP console violations**.

The allowed origins:

- **self** — the app's own bundle and API calls.
- **Supabase** `khtwpxnvziiyplaflwru.supabase.co` (+ `wss:` for realtime) — REST, auth, edge functions.
- **Self-hosted fonts** — Inter Variable + Montserrat Variable from same-origin `/assets/*.woff2` (`font-src 'self'` only).
- **GA4 / Tag Manager** — `googletagmanager.com`, `google-analytics.com`, `region1.google-analytics.com` (consent-gated). GTM also needs `frame-src` and `connect-src` for `www.googletagmanager.com`.
- **CAPTCHA** — Turnstile (`challenges.cloudflare.com` and `*.challenges.cloudflare.com`) and hCaptcha (`js.hcaptcha.com`, `newassets.hcaptcha.com`, `api.hcaptcha.com`).
- **TrustedSite** — `cdn.ywxi.net` (script, style, images), `www.trustedsite.com` (frame + connect), `s3-us-west-2.amazonaws.com` (connect). Loaded from the public marketing route shell only; never on `/app/*`. `style-src` does **not** add `'unsafe-inline'` for this vendor.

`script-src` no longer includes `'unsafe-inline'` (2026-08-23): bootstrap
scripts moved to `/bootstrap-auth.js` and `/bootstrap-theme.js`. `style-src`
no longer includes `'unsafe-inline'` (2026-08-23): React inline `style={{…}}`
attributes were replaced with Tailwind utilities, SVG geometry (`ProgressFill`),
and colocated CSS classes. Prerendered marketing pages allow one hashed inline
script for React Router static hydration data (`__staticRouterHydrationData`).

`upgrade-insecure-requests` was added 2026-09-02 (ImmuniWeb CSP scoring). The
CSP still includes `https://*.challenges.cloudflare.com` for Turnstile regional
challenge hosts — ImmuniWeb deducts for host wildcards; removing them would
break CAPTCHA.

### Ongoing CSP hygiene

- Hermetic regression: `e2e/csp.spec.ts` (via `npm run test:e2e`) fails on
  `script-src` or `style-src` console violations on marketing load and `/app`
  welcome — run after any inline-script or inline-style change.
- Re-test after any new third-party integration, new font origin, or inline
  script change.
- If a new origin is needed, add it to the matching directive in
  `vercel.json` **and** update the list above so the source and the docs do
  not drift.
