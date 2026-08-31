# Client error reporting

The site builds to fully prerendered static HTML plus a client SPA, with **no
serverless functions** in front of it. Vercel therefore captures no runtime
logs, and any error caught in the browser — including anything that reaches the
branded `RouteErrorPage` boundary — is completely invisible in production. This
subsystem closes that gap **without weakening the product's privacy posture.**

Dutiva handles employee data and is positioned as PIPEDA-conscious and Quebec
Law 25-aware, so error telemetry is designed as privacy-first, not
privacy-as-afterthought.

## What is sent

Exactly these fields, and nothing else, per report:

| Field     | Example                          | Why it's safe                                              |
| --------- | -------------------------------- | ---------------------------------------------------------- |
| `message` | `Cannot read properties of null` | Error text. Free-form — see residual risk below.           |
| `stack`   | minified stack, ≤ 4 KB           | Resolved with source maps kept off the public server.      |
| `route`   | `/app/cases/:id`                 | Route **pattern** — never a resolved path (see scrubbing). |
| `release` | commit SHA                       | Ties a trace to the exact deploy + its source maps.        |
| `locale`  | `en-CA` / `fr-CA`                | From `<html lang>`; not identifying.                       |
| `kind`    | `route-boundary`                 | Which handler fired.                                       |
| `ua`      | `Chrome/120 macOS`               | **Coarse** UA — family + major + OS only.                  |
| `env`     | `production` / `preview`         | So preview noise can be filtered from prod triage.         |

### What is deliberately **not** sent

- **No DOM snapshots, no input-value capture, no session replay.**
- **No breadcrumbs** of any kind — nothing records user-entered text.
- **No Supabase auth token, session, or any `localStorage`/cookie data.** The
  transport is a keepalive `fetch` with `credentials: 'omit'`, so no cookies for
  the endpoint origin are ever attached (`sendBeacon` is avoided precisely
  because it can't omit credentials).
- **No persistent per-user / install id.** We considered a random install id for
  grouping and rejected it: dedupe is done in-memory client-side, and grouping is
  done server-side on `route` + `message` + stack. A persisted id in
  `localStorage` would be a _new identifier_ we'd have to justify under Law 25 for
  no benefit, so it isn't collected.
- **No full user-agent string is retained.** The raw UA is a high-entropy
  fingerprinting vector, so the value **stored in a report row** is reduced to
  `family/major OS` — and the server re-validates that shape, dropping anything
  that isn't already a coarse label. Caveat, stated plainly: the browser's HTTP
  `User-Agent` header still travels to the Supabase edge on every request (as it
  does for any web request) and may appear in the platform's transport logs; the
  coarsening controls the retained payload, not that transport metadata.

### URL scrubbing (the core PII control)

The `/app` surface carries employee, case, document, person, and conversation
identifiers directly in the path (`/app/employees/:employeeId`,
`/app/cases/:caseId`, …). `src/lib/errorReporting/scrubRoute.ts` reduces any
pathname to its **pattern** before it leaves the browser:

- The query string and hash are dropped entirely (they can carry search text or
  tokens).
- The full path is matched against a **known route registry** (deny-by-default),
  and the matched **pattern** is returned — `/legal/:slug`, `/app/cases/:id`. The
  match is position-aware, so `/app/employees/studio` binds `studio` to
  `:employeeId` → `/app/employees/:id` (it can't be mistaken for the
  documents-only `studio` route).
- Any path that matches **no** registered route degrades to a safe label —
  `/unknown`, or `/app/:unknown` on the private surface — **never** the resolved
  path. So a 404, or a new dynamic route not yet added to the registry, can never
  transmit a segment; the worst case is a lost grouping, not a leak. This also
  covers the human-readable slugs demo fixtures use (e.g. a person's name), which
  a "looks like an id" heuristic would miss.

**Residual risk, stated honestly:** `message` and `stack` are free-form, so they
can still carry PII an app throw embeds. Mitigations, in order: a **redaction
pass** (`reporter.ts`) strips emails, UUIDs, and long hex strings from both
fields before sending — deliberately conservative so it never mangles the
content-hashed asset names a stack needs for symbolication; known
identifier-bearing throws are also fixed at the source (e.g. doclib no longer
puts document/template ids in its message); both fields are length-capped
(client + DB); a **90-day retention** bounds how long anything lingers; nothing
else is attached; and the standing guideline is _don't embed PII in thrown error
messages._ Redaction is a safety net, not a guarantee — free text can't be fully
scrubbed without destroying its usefulness.

## Where the data lives (residency)

Reports go to a **Supabase edge function** and table — infrastructure Dutiva
**already discloses as a subprocessor.** This was a deliberate choice over a
hosted error-tracking vendor (Sentry/Datadog/Bugsnag/etc.): those would add a
**new third-party data processor** to the privacy policy, and **no major
error-tracking vendor offers Canadian data residency** — traces would land in the
US or EU. Keeping reports inside Supabase adds zero new processors.

> **Residency requirement:** this only holds if the Supabase project is pinned to
> a Canadian region (`ca-central-1`). If the project is hosted elsewhere, that is
> the residency fact to disclose — surface it, don't assume it.

**Edge Function region — a separate control.** The project region pins the
**database**, but Supabase Edge Functions run at the edge **nearest the caller**
by default, so the function's _execution_ (and its platform logs) can happen
outside Canada even with the DB in `ca-central-1`. The reporter therefore pins
the invocation with `?forceFunctionRegion=ca-central-1` (`REPORTING_REGION` in
`src/lib/errorReporting/index.ts`). Verify it in production via the response's
`x-sb-edge-region` header, and keep `REPORTING_REGION` aligned with the DB region
if the project ever moves. (The HTTP transport still traverses the caller's
network path like any web request; this control governs where the function
_processes and logs_ the payload.)

## How it runs (and when it doesn't)

Reporting is **inert** unless every gate passes (`src/lib/errorReporting/index.ts`):

1. running in a browser (never during SSR/prerender);
2. `VERCEL_ENV` is `production` or `preview` — it's baked into the bundle via
   `vite.config.ts` `define` and collapses to `''` locally and under Vitest, so
   **nothing is sent in dev or tests**;
3. `VITE_SUPABASE_URL` is configured (the endpoint derives from it).

**Preview reporting is on, by design.** Catching a crash in a preview build —
before it reaches a customer — is strictly more valuable than catching it after,
and the payload is equally privacy-minimized either way (the residual free-text
risk below applies the same to both). The only cost is noise, mitigated by the
`env` column so preview can be filtered out in triage.

### Sources of errors

- **`RouteErrorPage`** (the existing React error boundary) reports in an effect,
  so never during SSR and never before first paint. `kind: 'route-boundary'`.
- **`window.onerror` / `unhandledrejection`** handlers, installed from
  `src/main.tsx`, cover errors outside React's tree.
  `kind: 'window-error'` / `'unhandled-rejection'`.
- **`onRecoverableError`**, passed to `hydrateRoot`/`createRoot` in
  `src/main.tsx`. React calls this whenever it recovers from an error on its
  own — most commonly a hydration mismatch on the prerendered public pages,
  where React discards the mismatched subtree and re-renders client-side
  rather than crashing. The visitor never sees a broken page, but without this
  hook production had zero visibility into _where_ it happened (the minified
  message alone gives no clue, and the fallback path — an uncaught `error`
  event — reported it as an undifferentiated `window-error` with no component
  stack). `kind: 'recoverable-error'`; `stack` has `errorInfo.componentStack`
  appended when React provides one.

### Fail-safe behaviour

- Transport is a keepalive `fetch` with `credentials: 'omit'` and a plain-string
  body (`text/plain`, CORS-safelisted → no preflight). `keepalive` survives the
  page unload that often follows a crash; `sendBeacon` is deliberately not used
  because it always sends credentials.
- Everything is wrapped so **reporting never throws, never blocks paint, and
  never surfaces its own failure** to the user.
- **Dedupe + rate-limit** (`reporter.ts`): a per-fingerprint dedupe window, a
  rolling-window cap, and a hard per-session cap, so one broken render loop can't
  flood the endpoint. Server-side, `ingest_client_error_report()` enforces a
  per-IP window **atomically** — a transaction-scoped advisory lock keyed on the
  IP hash serializes concurrent calls so the check-then-insert can't be raced
  past the limit — and a storage failure returns **500** (visible in the function
  logs) rather than a silent 204.

### IP handling (rate-limit only)

The source IP is used **only** to rate-limit the open endpoint, and never lands
on a retained report row:

- It's keyed with **HMAC-SHA256 under a required secret pepper**
  (`ERROR_REPORT_SALT`, falling back to `SUPPORT_NOTIFY_SECRET`) — never a
  committed default, so IPv4's low entropy can't be brute-forced from table
  access without also holding the secret. The function **fails closed** (500) if
  the pepper is unset.
- The hash lives in a **separate table** (`client_error_rate_limit`), decoupled
  from reports, and holds no report content. The ingest RPC sweeps expired rows
  for **all sources** on every call — not just the calling IP — so under normal
  traffic a hash is removed within ~a window of the next report from anyone. Two
  honest caveats: on a **quiet** endpoint a hash persists until the scheduled
  `purge_client_error_data()` runs, and if that job is **not provisioned** it can
  persist indefinitely. So the hash is short-lived under traffic **and** a
  correctly scheduled purge — not unconditionally.
- **The HMAC governs only our table, not the platform logs.** The raw client IP
  is in the HTTP request, so Supabase's Edge/network invocation logs retain it as
  request metadata independently of what we store — the same transport-metadata
  caveat as the user-agent. "Used only to rate-limit" describes _our_ use; it does
  not erase the platform log. Verify Supabase's log **region**, **retention**, and
  any **log drains** for the project, and disclose them as part of the residency
  posture.

### Retention

`message` and `stack` are **privacy-minimized, not PII-free** — free text can
still carry a name, email, or URL (see the residual-risk note above). Report rows
therefore target a **90-day** bound, enforced by two mechanisms with different
guarantees:

- **Opportunistic (best-effort):** the ingest RPC deletes past-window rows on a
  small sample of calls. This needs no scheduler but only runs _under traffic_ —
  it cannot bound retention on a quiet endpoint.
- **Scheduled (the real guarantee — REQUIRED):** `purge_client_error_data()` must
  be scheduled at least hourly (pg_cron or an external scheduler) as a verified
  deploy step (see the migration's DEPLOY note and _Deploying the endpoint_
  below). **Until it is provisioned and verified, retention is best-effort only**
  and old rows can persist — do not treat 90 days as guaranteed before then.

## Source maps

Minified stacks are useless, so `build.sourcemap` is `'hidden'`:

- `'hidden'` emits `.map` files but **omits the `sourceMappingURL` comment**, so
  browsers and crawlers never auto-fetch them.
- `scripts/relocate-sourcemaps.mjs` then **moves every `dist/**/*.map` out of
  `dist/`** into a git-ignored `sourcemaps/<sha>/` — _before_ the service worker
  precaches assets and before `dist/` is deployed — so the maps are **never
  publicly served**.
- **Archival is a required deploy step, not automatic.** `sourcemaps/<sha>/` is a
  local build directory; the deploy build (Vercel) discards everything outside
  the deployed output, and the GitHub CI build produces _different_ bundles
  (no `__RELEASE_SHA__`, so different hashes), so neither preserves the deployed
  release's maps on its own. To symbolicate production traces, the **deploy
  pipeline must upload `sourcemaps/<sha>/` to private storage keyed by the
  release SHA** (e.g. a Vercel post-build hook) before the workspace is torn
  down. Don't rely on rebuilding to reproduce them: the bundle bakes in
  build-time env values and preview builds add extra transforms, so an exact
  rebuild needs the original build environment replicated.

## Service worker

The reporting endpoint is a **cross-origin POST** to the Supabase function. The
offline service worker (`scripts/generate-sw.mjs`) only handles same-origin GETs,
so the beacon is **never intercepted or cached**; `.map` files are also excluded
from the precache defensively.

## Deployment status

**Live as of 2026-07-28 — and inert before that.** The client reporter shipped,
but migration 0019 was never applied and `report-error` was never deployed, so
every crash report since launch went to an endpoint with no function, no table
and no RPC behind it. Nothing surfaced the gap: the code was merged and CI was
green, because a missing migration is invisible to a test suite. That class of
failure is now caught by `npm run check:migrations`
(`scripts/check-migrations.mjs`), which compares the repo's migrations against
the project's applied set.

Now in place, verified against the live project: the two tables and both
policies, `ingest_client_error_report()` (a synthetic report stored, and a
second call over the limit correctly returned `rate_limited`),
`purge_client_error_data()`, the hourly `purge-client-error-data` pg_cron job,
and the function itself at `verify_jwt: false`. Synthetic rows were deleted.

**One thing still to confirm:** the pepper. The function reads
`ERROR_REPORT_SALT`, falling back to `SUPPORT_NOTIFY_SECRET`, and **fails closed
(500, nothing stored) if neither is set** — function secrets are not readable
through the tooling used here, so this was not verified. If no report ever
appears, check the function logs for `report-error: missing configuration`.

## Deploying the endpoint

- Deploy `supabase/functions/report-error` with **`verify_jwt` off** (as with
  `resend-webhook`), so the credentials-omitting `fetch` can reach it without an
  auth header.
- **Required:** set `ERROR_REPORT_SALT` (or `SUPPORT_NOTIFY_SECRET`) — the pepper
  for the rate-limit IP HMAC. The function fails closed without it.
- **Required — schedule retention and verify it.** The migration does _not_
  schedule the purge itself (so it neither silently no-ops nor hard-fails a
  replay). Provision one of, then confirm it exists:
  - pg_cron: `create extension if not exists pg_cron;` then
    `select cron.schedule('purge-client-error-data','23 * * * *','select public.purge_client_error_data()');`
    — verify with `select jobname, schedule from cron.job where jobname = 'purge-client-error-data';`
  - or an external scheduler (Vercel Cron / GitHub Action) calling
    `purge_client_error_data()` at least hourly.

  Until this is done, retention is best-effort (RPC-only) and unbounded on a quiet
  endpoint.

- Reports land in `public.client_error_reports`; reads are admin-only (RLS).

## Files

| File                                                | Role                                  |
| --------------------------------------------------- | ------------------------------------- |
| `src/lib/errorReporting/scrubRoute.ts`              | Path → route pattern (PII control)    |
| `src/lib/errorReporting/coarseUserAgent.ts`         | Raw UA → coarse label                 |
| `src/lib/errorReporting/reporter.ts`                | Payload, dedupe/rate-limit, transport |
| `src/lib/errorReporting/index.ts`                   | Gate + install + boundary hook        |
| `src/lib/release.ts`                                | Commit SHA (baked at build)           |
| `supabase/functions/report-error/`                  | Beacon sink (service role)            |
| `supabase/migrations/0019_client_error_reports.sql` | Table + RLS                           |
| `scripts/relocate-sourcemaps.mjs`                   | Move maps out of `dist/`              |
