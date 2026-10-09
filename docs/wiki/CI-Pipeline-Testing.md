# CI Pipeline & Testing

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [.woodpecker/check.yml](.woodpecker/check.yml)
- [.woodpecker/live-checks.yml](.woodpecker/live-checks.yml)
- [.woodpecker/e2e.yml](.woodpecker/e2e.yml)
- [.woodpecker/e2e-auth.yml](.woodpecker/e2e-auth.yml)
- [.woodpecker/statute-drift.yml](.woodpecker/statute-drift.yml)
- [.gitignore](.gitignore)
- [docs/SUPPORT_ANALYTICS.md](docs/SUPPORT_ANALYTICS.md)
- [e2e/app.spec.ts](e2e/app.spec.ts)
- [e2e/marketing.spec.ts](e2e/marketing.spec.ts)
- [e2e/serve-dist.mjs](e2e/serve-dist.mjs)
- [index.html](index.html)
- [playwright.config.ts](playwright.config.ts)
- [src/features/app/toasts/toasts.test.tsx](src/features/app/toasts/toasts.test.tsx)
- [src/features/app/views/home/HomeBriefHero.tsx](src/features/app/views/home/HomeBriefHero.tsx)
- [src/features/marketing/analytics/ga4.test.ts](src/features/marketing/analytics/ga4.test.ts)
- [src/features/marketing/analytics/ga4.ts](src/features/marketing/analytics/ga4.ts)
- [src/features/support/analytics/supportAnalytics.test.ts](src/features/support/analytics/supportAnalytics.test.ts)
- [src/features/support/analytics/supportAnalytics.ts](src/features/support/analytics/supportAnalytics.ts)
- [src/i18n/i18n.test.tsx](src/i18n/i18n.test.tsx)
- [src/lib/theme.test.tsx](src/lib/theme.test.tsx)
- [src/lib/theme.tsx](src/lib/theme.tsx)
- [src/test/setup.ts](src/test/setup.ts)
- [supabase/migrations/0052_purge_support_analytics_rate_limit.sql](supabase/migrations/0052_purge_support_analytics_rate_limit.sql)

</details>

CI runs on Woodpecker as five isolated pipelines under `.woodpecker/` — `check.yml` (the deterministic merge gate), `live-checks.yml` (credentialed Supabase probes), `e2e.yml` (hermetic Playwright smoke), `e2e-auth.yml` (authenticated Playwright CRUD), and `statute-drift.yml` (cron/manual statute-source verification). Each is a separate `when:`/`steps:` file targeting a distinct failure class. The separation ensures that credential problems or browser flakes never block the merge gate. Test infrastructure uses Vitest (jsdom) for unit/integration tests and Playwright (Chromium) for end-to-end smoke tests, with a custom static server that mirrors the production Vercel routing contract.

## Pipeline Triggers & Environment

Every pipeline fires on pushes to `main`, pull requests, and manual runs [.woodpecker/check.yml:11-15](). `statute-drift.yml` instead fires only on `cron` and `manual` — deliberately never on push/PR, because it depends on live government sites that rate-limit and would flake as a gate [.woodpecker/statute-drift.yml:1-14](). Manual triggers are explicitly justified: live-project checks can go red without any code change (e.g. someone applying a migration directly to the database), so re-running should not require inventing a commit.

Public (non-secret) environment variables are declared per-pipeline via YAML anchors:

| Variable                 | Value                                      | Set in                              | Purpose                                    |
| ------------------------ | ------------------------------------------ | ----------------------------------- | ------------------------------------------ |
| `SUPABASE_URL`           | `https://khtwpxnvziiyplaflwru.supabase.co` | `live-checks.yml`, `e2e-auth.yml`   | Project endpoint for live checks           |
| `SUPABASE_ANON_KEY`      | `sb_publishable_…`                         | `live-checks.yml`, `e2e-auth.yml`   | Publishable anon key for RLS probing       |
| `VITE_GA_MEASUREMENT_ID` | `G-V85ZQ75EWL`                             | `check.yml`, `e2e.yml`, `e2e-auth.yml` | GA4 measurement ID (public in HTML)     |
| `VITE_GTM_CONTAINER_ID`  | `GTM-P3C7386R`                             | `check.yml`, `e2e.yml`, `e2e-auth.yml` | GTM container ID (public in HTML)       |

Secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_SERVICE_ROLE_KEY`) are pulled through Woodpecker `from_secret:` — only the pipelines that need them declare them.

Sources: [.woodpecker/check.yml:1-15](), [.woodpecker/live-checks.yml:10-21](), [.woodpecker/e2e-auth.yml:11-22](), [.woodpecker/statute-drift.yml:1-16]()

## Job Architecture

**Pipeline dependency diagram**

```mermaid
graph LR
    subgraph ".woodpecker/"
        A["check.yml"]
        B["live-checks.yml"]
        C["e2e.yml"]
        D2["e2e-auth.yml"]
    end
    A --- G["Required status\n(merge gate)"]
    B -. "independent" .- A
    C -. "independent" .- A
    D2 -. "independent" .- A
    B -.->|"credential\nfailure OK"| E["Never blocks gate"]
    C -.->|"browser flake\nOK"| E
    D2 -.->|"auth secrets\nmissing"| E
```

The pipelines are independent files — each is an isolated failure domain, so a credential gap in `live-checks` or a Chromium flake in `e2e` cannot abort the gate. Within a pipeline, steps run on `node:22` images chained by `depends_on`. A fifth pipeline, `statute-drift.yml`, fires only on cron/manual (see [Advisor Evaluation & Statute Drift](Advisor-Evaluation-Statute-Drift)).

Sources: [.woodpecker/check.yml:1-15](), [.woodpecker/live-checks.yml:1-19](), [.woodpecker/e2e.yml:1-16](), [.woodpecker/e2e-auth.yml:1-22](), [.woodpecker/statute-drift.yml:1-16]()

## Pipeline 1: `check.yml` (Merge Gate)

The `check` pipeline is the deterministic, credential-free gate. Steps run in sequence via `depends_on`; any failure blocks the PR.

**`check` pipeline step chain**

```mermaid
flowchart TD
    A["install\n(node:22, npm ci)"] --> D["npm run typecheck\n(tsc -b)"]
    D --> E["npm run lint\n(oxlint)"]
    E --> F["npm run test:coverage\n(vitest run --coverage)"]
    F --> G["npm run check:message-scopes\n(check-message-scopes.mjs)"]
    G --> H["npm run check:facts\n(check-canonical-facts.mjs)"]
    H --> H2["check:architecture → check:brand-assets"]
    H2 --> I["npm run build\n(build + SEO validation)"]
```

| Step               | npm script                     | Tool                                                                    | What it catches                                    |
| ------------------ | ------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------- |
| Typecheck          | `npm run typecheck`            | `tsc -b`                                                                | Type errors across the project                     |
| Lint               | `npm run lint`                 | `oxlint`                                                                | Linting violations                                 |
| Test with coverage | `npm run test:coverage`        | `vitest run --coverage`                                                 | Unit/integration failures, coverage regression     |
| Message scopes     | `npm run check:message-scopes` | `check-message-scopes.mjs`                                              | i18n key crossing surface boundary                 |
| Canonical facts    | `npm run check:facts`          | `check-canonical-facts.mjs`                                             | Brand palette drift vs CSS                         |
| Brand assets       | `npm run check:brand-assets`   | `check-brand-assets.mjs`                                                | Missing `public/brand/` asset                      |
| Architecture       | `npm run check:architecture`   | `check-architecture.mjs`                                                | Marketing→`@/data` fixture import, file-size budget, inline demo views |
| Build + SEO        | `npm run build`                | vite build → prerender → validate-seo → check-entry-graph → generate-sw | Build, metadata, sitemap, entry-graph budget drift |

The CI `check` pipeline runs the deterministic subset above. Four `npm run check` steps are **local-gate only** (not in `.woodpecker/check.yml`): `check:migrations` + `check:rls` (in the credentialed `live-checks` job instead), `check:workspace-links`, `check:advisor-golden`, `check:db-types`, and `check:edge-types`. The network-bound `check:statute-drift` runs on its own `.woodpecker/statute-drift.yml` cron/manual pipeline.

The build script is a multi-step chain defined in `package.json` [package.json:8]():

```
tsc -b && vite build && relocate-sourcemaps.mjs && build:ssr && prerender.mjs
       && validate-seo.mjs && check-entry-graph.mjs && generate-sw.mjs
```

The header comment in `check.yml` states the rationale for `check` being its own pipeline: a failure in the credentialed `live-checks` must never abort build/SEO/test verification — the failure mode that caused two days of unverified builds to merge green when the `SUPABASE_ACCESS_TOKEN` secret expired (docs/TODO.md OA19) [.woodpecker/check.yml:1-4]().

Sources: [.woodpecker/check.yml:14-78](), [package.json:6-18]()

## Pipeline 2: `live-checks.yml` (Live Supabase Guards)

The `live-checks` pipeline hits the real Supabase project with two steps — `migration-drift` then `rls-regression` — where the RLS step declares `when: status: [success, failure]` so it still runs even when migration drift fails [.woodpecker/live-checks.yml:52-64]().

**`live-checks` data flow diagram**

```mermaid
flowchart TD
    subgraph "live-checks job"
        M["check-migrations.mjs"]
        R["check-rls.mjs"]
    end

    M -->|"SUPABASE_ACCESS_TOKEN\n+ SUPABASE_PROJECT_REF"| API["Supabase Management API\n(/v1/projects/{ref}/database/query)"]
    API -->|"schema_migrations rows"| M
    M -->|"compare"| LOCAL["supabase/migrations/*.sql\n(local files)"]

    R -->|"SUPABASE_ANON_KEY"| REST["PostgREST /rest/v1/{table}"]
    REST -->|"row count"| R
    R -->|"positive control"| SC["service_status table\n(must return rows)"]
    R -->|"negative controls"| ST["beta_signups\nhr_documents\nsignatures\n(must return 0 rows)"]
```

### Migration Drift (`check-migrations.mjs`)

Two halves run in the same script [scripts/check-migrations.mjs:18-36]():

1. **LOCAL (always runs)** — Filename discipline. Validates every file under `supabase/migrations/` matches the pattern `NNNN_lower_snake_case.sql`, catches duplicated sequence numbers (except entries in `ACCEPTED_DUPLICATES`), and detects slug collisions [scripts/check-migrations.mjs:99-137]().

2. **DRIFT (credential-gated)** — Fetches `supabase_migrations.schema_migrations` from the live project via the Management API [scripts/check-migrations.mjs:198-228](). Compares in both directions:
   - **Forward**: repo files not applied to the project → silently inert features [scripts/check-migrations.mjs:234-239]()
   - **Reverse**: applied migrations with no repo file → schema that vanishes on rebuild [scripts/check-migrations.mjs:251-267]()

Credentials are cleaned via `cleanSecret()` from `scripts/lib/secrets.mjs` [scripts/check-migrations.mjs:181-182](), which strips trailing whitespace, wrapping quotes, and redundant `Bearer ` prefixes [scripts/lib/secrets.mjs:31-38]().

### RLS Regression Guard (`check-rls.mjs`)

Probes the live database as the anonymous PostgREST role [scripts/check-rls.mjs:120-157](). Two-part strategy:

1. **Positive control**: reads `service_status` (a table the anon role is meant to read). If it returns no rows or a non-200 status, the key is broken and every subsequent "no rows" would be a false all-clear, so the script exits with an error [scripts/check-rls.mjs:161-187]().

2. **Negative controls**: reads each table in `SENSITIVE_TABLES` (`beta_signups`, `hr_documents`, `signatures`) [scripts/check-rls.mjs:50-51](). Any row returned means a world-open RLS policy is live [scripts/check-rls.mjs:217-223]().

Sources: [.woodpecker/live-checks.yml:28-64](), [scripts/check-migrations.mjs:1-291](), [scripts/check-rls.mjs:1-238](), [scripts/lib/secrets.mjs:1-68]()

## Loud Skipping Pattern

Both live-check scripts implement a "loud skipping" pattern when credentials are missing. They exit 0 (do not fail the build), but announce the skip loudly [scripts/check-migrations.mjs:35-36]():

1. Emit a `::warning` annotation — the format GitHub Actions surfaces on the run and on the PR (on Woodpecker it lands as a loud log line) [scripts/check-migrations.mjs:159](), [scripts/check-rls.mjs:71]()
2. Append a `### … UNCHECKED` entry to `GITHUB_STEP_SUMMARY` when that env var is set (GitHub Actions runs; a no-op elsewhere) [scripts/check-migrations.mjs:164-176](), [scripts/check-rls.mjs:75-86]()

This ensures that a green check is never mistaken for a verified one — the philosophy is stated directly: "a skipped drift check must not read as a passed one" [scripts/check-migrations.mjs:142-154]().

The `describeSecret()` helper provides safe diagnostics when a credential is rejected, reporting length and character-class properties without exposing the value [scripts/lib/secrets.mjs:47-58]().

Sources: [scripts/check-migrations.mjs:140-176](), [scripts/check-rls.mjs:62-106](), [scripts/lib/secrets.mjs:47-58]()

## Pipeline 3: `e2e.yml` (Playwright Browser Smoke Tests)

The e2e pipeline builds the production bundle, installs Chromium, then runs the hermetic Playwright suite against the built `dist/` [.woodpecker/e2e.yml:20-43]().

```mermaid
flowchart TD
    A["npm ci"] --> B["npx playwright install\n--with-deps chromium"]
    B --> C["npm run build\n(produces dist/)"]
    C --> D["npm run test:e2e\n(playwright test)"]
    D --> E["serve-dist.mjs\n(started by webServer config)"]
    E --> F["dist/\n(static files)"]
    D --> G["marketing.spec.ts"]
    D --> H["app.spec.ts"]
    D --> I["auth-forwarder.spec.ts\ncsp.spec.ts"]
    G -->|"HTTP"| E
    H -->|"HTTP"| E
    I -->|"HTTP"| E
```

A fourth pipeline, `e2e-auth.yml`, runs the authenticated Playwright suite (`npm run test:e2e:auth` → `e2e/auth/run-or-skip.mjs`): signed-in admin → Production mode → production CRUD matrix over employees, cases, tasks, communications, and memory. It needs `SUPABASE_SERVICE_ROLE_KEY` (Woodpecker secret) plus the `VITE_SUPABASE_*`/`SUPABASE_*` vars so the built SPA talks to Supabase — isolated from `e2e.yml` so missing auth secrets never charge against the credential-free gate [.woodpecker/e2e-auth.yml:1-44](). Additional hermetic specs (`auth-forwarder.spec.ts`, `csp.spec.ts`) cover the auth-forwarding edge and CSP headers against the same `dist/` contract.

Sources: [.woodpecker/e2e.yml:1-43](), [.woodpecker/e2e-auth.yml:1-44]()

### Playwright Configuration (`playwright.config.ts`)

The configuration defines a single Chromium project on port `4173` [playwright.config.ts:19-20](). Key settings:

| Setting               | CI Value                   | Local Value    |
| --------------------- | -------------------------- | -------------- |
| `retries`             | 1                          | 0              |
| `workers`             | 1                          | unlimited      |
| `reporter`            | `list` + `html` (unopened) | `list` only    |
| `reuseExistingServer` | false                      | true           |
| `forbidOnly`          | true                       | false          |
| `trace`               | on-first-retry             | on-first-retry |

The `webServer` block starts `e2e/serve-dist.mjs` before tests run, waiting up to 30 seconds for the server to be ready [playwright.config.ts:39-44]().

Chromium resolution adapts to the host: if `/opt/pw-browsers/chromium` exists (as in the Claude execution environment), it is used as `executablePath`; otherwise Playwright uses its own installed browser (installed by `npx playwright install --with-deps chromium` in CI) [playwright.config.ts:16-17]().

Sources: [playwright.config.ts:1-45]()

### Static Server (`e2e/serve-dist.mjs`)

A zero-dependency Node HTTP server that mirrors the Vercel routing contract from `vercel.json` [e2e/serve-dist.mjs:1-15]():

**Routing contract comparison**

| Route Pattern            | `vercel.json`           | `serve-dist.mjs`                                                             |
| ------------------------ | ----------------------- | ---------------------------------------------------------------------------- |
| `/app` and `/app/*`      | Rewrites to `/app.html` | Returns `dist/app.html` with 200 [e2e/serve-dist.mjs:56-57]()                |
| Clean URLs (`/about`)    | `trailingSlash: false`  | Tries `dist/about/index.html` then `about.html` [e2e/serve-dist.mjs:74-79]() |
| Real files (`/assets/*`) | Served directly         | Served if `isFile()` returns true [e2e/serve-dist.mjs:79]()                  |
| Unknown paths            | 404                     | Returns `dist/404.html` with 404 status [e2e/serve-dist.mjs:81]()            |

The server includes path traversal protection — decoded paths are normalized and confirmed to be inside `DIST` before serving [e2e/serve-dist.mjs:62-72]().

MIME types are mapped from file extension for 17 content types [e2e/serve-dist.mjs:25-43]().

Sources: [e2e/serve-dist.mjs:1-99](), [vercel.json:1-14]()

### Marketing Surface Tests (`e2e/marketing.spec.ts`)

Four test cases exercise the prerendered marketing pages:

| Test                          | What it proves                                                                                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home page load + consent gate | Prerendered content visible, consent banner proves hydration, `Accept` records `dutiva.analytics.consent` in localStorage, persists across reload [e2e/marketing.spec.ts:11-45]() |
| French homepage               | `/fr` serves `fr-CA` title, consent banner reads `Accepter` from URL-scoped language provider [e2e/marketing.spec.ts:47-53]()                                                     |
| Prerendered subpage           | `/about` routes to the prerendered About page [e2e/marketing.spec.ts:55-59]()                                                                                                     |
| 404 status                    | Unknown URL returns HTTP 404 with the "Page not found" page [e2e/marketing.spec.ts:61-65]()                                                                                       |

A separate test group disables JavaScript and confirms the homepage is fully prerendered (content without hydration) — the H1 and footer are present with no client runtime [e2e/marketing.spec.ts:68-78]().

Page errors are collected via `page.on('pageerror')` and asserted to be empty at the end of the home-page test [e2e/marketing.spec.ts:14-15](), [e2e/marketing.spec.ts:44]().

Sources: [e2e/marketing.spec.ts:1-78]()

### App Surface Tests (`e2e/app.spec.ts`)

Two test cases exercise the SPA shell rewrite:

| Test                             | What it proves                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/app/welcome` → SPA shell       | 200 status (not 404), `#root` is not empty, and marketing content is absent [e2e/app.spec.ts:12-24]() |
| Deep `/app/this/does/not/matter` | Arbitrary deep paths rewrite to the shell with 200 and `#root` attached [e2e/app.spec.ts:26-31]()     |

Tests deliberately stop at the sign-in gate — the authenticated workspace needs a backend and is out of scope for a hermetic build [e2e/app.spec.ts:6-9]().

Sources: [e2e/app.spec.ts:1-32]()

## Vitest Unit/Integration Test Infrastructure

### Configuration

Vitest is configured in `vite.config.ts` under the `test` key [vite.config.ts:255-284]():

| Setting       | Value                                                 | Rationale                                                                                         |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `environment` | `jsdom`                                               | Browser-like DOM for React component tests                                                        |
| `setupFiles`  | `./src/test/setup.ts`                                 | Global test setup                                                                                 |
| `exclude`     | default + `e2e/**`                                    | Prevents Vitest from claiming Playwright spec files [vite.config.ts:259-260]()                    |
| `css`         | `false`                                               | CSS modules stubbed (canonical facts palette check uses a separate script) [vite.config.ts:261]() |
| `testTimeout` | 20000ms                                               | First test per worker pays fixture-module transform cost [vite.config.ts:263-264]()               |
| `env`         | `VITE_SUPABASE_URL: ''`, `VITE_SUPABASE_ANON_KEY: ''` | Forces doclib onto bundled fixtures, independent of local `.env` [vite.config.ts:270]()           |

### Coverage Thresholds

Coverage uses the `v8` provider with thresholds set a few points below the measured baseline to prevent flakes while catching real regressions [vite.config.ts:274-283]():

| Metric     | Threshold | Measured Baseline |
| ---------- | --------- | ----------------- |
| Statements | 80%       | 83.7%             |
| Branches   | 65%       | 69.9%             |
| Functions  | 75%       | 80.5%             |
| Lines      | 80%       | 85.1%             |

Sources: [vite.config.ts:255-284]()

### Test Setup (`src/test/setup.ts`)

The global setup file does three things:

1. Imports `@testing-library/jest-dom/vitest` for DOM matchers [src/test/setup.ts:1]()
2. Installs a `MemoryStorage` class as `globalThis.localStorage` to replace Node ≥25's broken built-in localStorage that shadows jsdom's implementation [src/test/setup.ts:9-35]()
3. Registers an `afterEach` hook that calls `cleanup()` (React Testing Library) and `localStorage.clear()` [src/test/setup.ts:37-40]()

Sources: [src/test/setup.ts:1-41]()

### Test File Inventory

The project contains 360+ test files across the codebase (~3,900 tests, colocated as `*.test.ts(x)` next to the unit under test). A representative sample by area:

| Area             | Example Files                                                                                       | Count |
| ---------------- | --------------------------------------------------------------------------------------------------- | ----- |
| Advisor & Safety | `chatApi.test.ts`, `crisisSignals.test.ts`, `safetyBackstop.test.ts`, `statutoryCrossCheck.test.ts` | ~12   |
| Auth             | `AuthProvider.test.tsx`, `AuthConfirm.test.tsx`, `RequireAdminSession.test.tsx`                     | 5     |
| Documents        | `engine.test.ts`, `DoclibProvider.test.tsx`, `GenerateScreen.test.tsx`                              | ~8    |
| Workspace Views  | `EmployeesView.test.tsx`, `CasesView.test.tsx`, `AnalyticsView.test.tsx`                            | ~20   |
| Marketing Pages  | `PricingPage.test.tsx`, `LegalHubPage.test.tsx`, `ArticlePage.test.tsx`                             | ~15   |
| Support          | `SupportRequestForm.test.tsx`, `helpSearch.test.ts`, `triage.test.ts`                               | ~15   |
| Infrastructure   | `reporter.test.ts`, `scrubRoute.test.ts`, `fingerprint.test.ts`                                     | ~12   |
| i18n             | `i18n.test.tsx`, `scopes.test.ts`                                                                   | 2     |
| Edge Functions   | `aiUsage.test.ts`, `billing-event.test.ts`, `contentSanity.test.ts`                                 | ~12   |
| Canonical/Data   | `canonicalFacts.test.ts`, `data.test.ts`                                                            | 2     |

Sources: search results for `.test.ts` files across the repository

## CI Guard Scripts in the `check` Job

### Message Scopes (`check-message-scopes.mjs`)

Guards the surface boundary established by `src/i18n/messages/{workspace,marketing,shared}.ts`. It derives which message keys each surface may use (from the modules each entry file imports) and scans for any literal `t('key')` call reaching outside its file's surface [scripts/check-message-scopes.mjs:1-23]().

Two surfaces are scanned [scripts/check-message-scopes.mjs:76-87]():

- **workspace**: `src/features/app`, `src/components/advisor`, `src/lib/exportProtection`
- **marketing**: `src/features/marketing`

### Canonical Facts (`check-canonical-facts.mjs`)

Checks the brand palette rows of `docs/CANONICAL_FACTS.md` against actual CSS token values in `src/styles/`. This exists as a separate script because Vitest runs with `css: false` and cannot read stylesheet values [scripts/check-canonical-facts.mjs:1-26]().

The companion test `src/canonicalFacts.test.ts` handles the TypeScript-backed rows (template count, plan prices, jurisdictions, beta flag, etc.) [src/canonicalFacts.test.ts:1-33](). Together they provide bidirectional enforcement of the canonical facts document.

Sources: [.woodpecker/check.yml:40-57](), [scripts/check-message-scopes.mjs:1-87](), [scripts/check-canonical-facts.mjs:1-65](), [src/canonicalFacts.test.ts:1-33]()

## End-to-End Architecture Overview

**Full CI pipeline: jobs, tools, and artifacts**

```mermaid
flowchart TB
    subgraph "check (merge gate)"
        TC["tsc -b"]
        LN["oxlint"]
        VT["vitest run --coverage"]
        MS["check-message-scopes.mjs"]
        CF["check-canonical-facts.mjs"]
        BD["npm run build\n(vite build → prerender.mjs\n→ validate-seo.mjs\n→ check-entry-graph.mjs\n→ generate-sw.mjs)"]
    end

    subgraph "live-checks (credential-gated)"
        MD["check-migrations.mjs\n(SUPABASE_ACCESS_TOKEN\n+ SUPABASE_PROJECT_REF)"]
        RL["check-rls.mjs\n(SUPABASE_URL\n+ SUPABASE_ANON_KEY)"]
    end

    subgraph "e2e (browser smoke)"
        PW["playwright test"]
        SD["serve-dist.mjs\n(port 4173)"]
        DIST["dist/"]
        MK["marketing.spec.ts"]
        AP["app.spec.ts"]
    end

    TC --> LN --> VT --> MS --> CF --> BD
    MD -.->|"when: status\n[success, failure]"| RL
    BD -.->|"same dist/"| DIST
    PW --> SD
    SD --> DIST
    PW --> MK
    PW --> AP

    MD -->|"fetch"| SAPI["Supabase\nManagement API"]
    RL -->|"fetch"| PREST["PostgREST\n(anon role)"]
```

Sources: [.woodpecker/check.yml:1-78](), [.woodpecker/live-checks.yml:1-64](), [.woodpecker/e2e.yml:1-43](), [package.json:6-26](), [playwright.config.ts:1-45](), [e2e/serve-dist.mjs:1-99]()

## `serve-dist.mjs` Routing Logic

The resolve function implements a resolution strategy that mirrors Vercel's routing:

```mermaid
flowchart TD
    REQ["Incoming request\npathname"] --> APP{"/app or /app/*?"}
    APP -->|Yes| APPHTML["Return dist/app.html\nstatus 200"]
    APP -->|No| DECODE["decodeURIComponent\n+ normalize + traversal guard"]
    DECODE --> ROOT{"pathname === '/'?"}
    ROOT -->|Yes| IDX["Try dist/index.html"]
    ROOT -->|No| CAND["Try candidates:\n1. dist/{path}\n2. dist/{path}/index.html\n3. dist/{path}.html"]
    IDX --> FOUND{"isFile()?"}
    CAND --> FOUND
    FOUND -->|Yes| SERVE["Return file\nstatus 200"]
    FOUND -->|No| NOTFOUND["Return dist/404.html\nstatus 404"]
```

Sources: [e2e/serve-dist.mjs:54-82]()

## Key Design Decisions

| Decision                                   | Rationale                                                                                                              | Reference                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `check.yml` isolated from `live-checks.yml` | Credential failure (expired token) must never abort build/test verification — the OA19 incident                       | [.woodpecker/check.yml:1-4]()                                     |
| `e2e.yml` isolated from `check.yml`        | Browser download/flake should never charge against the merge gate                                                      | [.woodpecker/e2e.yml:1-13]()                                      |
| `e2e-auth.yml` isolated from `e2e.yml`     | Missing auth secrets never charge against the credential-free gate                                                     | [.woodpecker/e2e-auth.yml:1-6]()                                  |
| `rls-regression` uses `when: status`       | Each live check reports independently; migration drift failure doesn't skip RLS                                        | [.woodpecker/live-checks.yml:54-56]()                             |
| `manual` event on every pipeline           | Live-project checks can go red without a code change (out-of-band DB changes)                                          | [.woodpecker/check.yml:11-15]()                                   |
| `statute-drift.yml` is cron/manual only    | Live government sources rate-limit — would flake as a merge gate                                                       | [.woodpecker/statute-drift.yml:1-14]()                            |
| Vitest `env` blanks Supabase vars          | Forces doclib onto bundled fixtures, prevents test ordering from varying by `.env`                                     | [vite.config.ts:269-270]()                                        |
| Coverage thresholds are below baseline     | Normal fluctuation doesn't flake CI; real regression still fails                                                       | [vite.config.ts:273-283]()                                        |
| Steps pin `image: node:22`                 | Same runtime on every pipeline; no mutable runner tag                                                                  | [.woodpecker/check.yml:18-22]()                                   |
| Dependency-free scripts                    | `check-migrations.mjs` and `check-rls.mjs` use Node's global `fetch` only, so they cannot rot behind a package upgrade | [scripts/check-migrations.mjs:37](), [scripts/check-rls.mjs:36]() |

Sources: [.woodpecker/check.yml:1-78](), [.woodpecker/e2e-auth.yml:1-44](), [.woodpecker/statute-drift.yml:1-30](), [vite.config.ts:255-284](), [scripts/check-migrations.mjs:36-37](), [scripts/check-rls.mjs:34-36]()

## Artifacts & Outputs

| Artifact             | Location               | Committed?        | Purpose                                           |
| -------------------- | ---------------------- | ----------------- | ------------------------------------------------- |
| `dist/`              | Build output           | No (`.gitignore`) | Production bundle, served by e2e tests            |
| `coverage/`          | Vitest coverage        | No (`.gitignore`) | V8 coverage reports                               |
| `test-results/`      | Playwright results     | No (`.gitignore`) | Test run artifacts                                |
| `playwright-report/` | Playwright HTML report | No (`.gitignore`) | HTML report (CI: `open: 'never'`)                 |
| `sourcemaps/`        | Relocated source maps  | No (`.gitignore`) | Moved out of `dist/` by `relocate-sourcemaps.mjs` |

Sources: [.gitignore:12-43](), [playwright.config.ts:28]()

---
