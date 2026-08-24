# End-to-end tests

Two suites share `e2e/` and `e2e/serve-dist.mjs` (static server mirroring
Vercel routing over `dist/`).

## Hermetic smoke (`npm run test:e2e`)

Credential-free. Asserts prerender/hydration, consent, the `/app` SPA rewrite,
and CSP regressions (`e2e/csp.spec.ts` — script + style violations on load).
Driven by [`playwright.config.ts`](../playwright.config.ts). Does
**not** talk to Supabase (build without `VITE_SUPABASE_*`).

```bash
npm run build
npm run test:e2e
```

| Spec | What it asserts |
| --- | --- |
| [`marketing.spec.ts`](marketing.spec.ts) | Prerender + hydration on `/` and `/fr`; consent gate |
| [`app.spec.ts`](app.spec.ts) | `/app` SPA rewrite |
| [`csp.spec.ts`](csp.spec.ts) | No CSP script/style console violations on load |
| [`auth-forwarder.spec.ts`](auth-forwarder.spec.ts) | Magic-link tokens on `/` forward to `/app/auth/confirm` |

Woodpecker: [`.woodpecker/e2e.yml`](../.woodpecker/e2e.yml).

## Authenticated critical path (`npm run test:e2e:auth`)

Signed-in admin → Settings **Production** → production-mode CRUD across core
HR modules. Spec:
[`e2e/auth/critical-path.spec.ts`](auth/critical-path.spec.ts). Config:
[`playwright.auth.config.ts`](../playwright.auth.config.ts).

Session comes from `globalSetup` (`e2e/auth/global-setup.ts`) — OTP is minted
server-side; no inbox / magic-link click.

### CRUD matrix (`critical-path.spec.ts`)

Eight tests, one worker (`fullyParallel: false`). Each test enables Production
mode, exercises one module, and tears down created rows where applicable.

| Module | Route | Operations exercised | Setup / teardown |
| --- | --- | --- | --- |
| Employees | `/app/employees` | empty → create → list count → remove | — |
| Cases | `/app/cases` | empty → create → list count → remove | — |
| Tasks | `/app/planning/tasks` | empty → create → toggle done → remove | — |
| Communications | `/app/communications` | empty → log → edit title → mark sent → confirm remove | — |
| Memory manager | `/app/settings/memory` | add person-scoped fact → correct → forget | create employee first; remove employee after |
| Case memory | `/app/settings/memory/cases/:id` | edit resume summary (English) | create case first; remove case after |
| Documents | `/app/documents` | honest empty state only (no CRUD yet) | — |
| Search | `/app/home` | `Ctrl+K` opens overlay | — |

Shared helpers in the spec: `enableProductionMode`, `createEmployee`,
`removeEmployee`, `createCase`, `removeCase`. Selectors use English i18n
strings and ARIA labels from production views (`Add task`, `Log a message`,
`Add memory fact`, `Edit — {title}`, etc.).

Requires a **Supabase-aware** production build and a service-role key for
seed + session mint (no inbox):

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` | Publishable anon key (must be present at **build** time) |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed `admin_users` + `admin_beta_access`, mint OTP session |
| `E2E_ADMIN_EMAIL` | Optional; default `e2e-playwright@dutiva.ca` |

```bash
# Build with Vite Supabase env so the SPA client is not null
set VITE_SUPABASE_URL=https://….supabase.co
set VITE_SUPABASE_ANON_KEY=…
set SUPABASE_SERVICE_ROLE_KEY=…
npm run build
npm run test:e2e:auth
```

If the service-role (or URL/anon) env is unset, `test:e2e:auth` **exits 0**
and skips — so CI without the secret stays green.

Session file `e2e/.auth/admin.json` is gitignored (written by globalSetup).

Woodpecker: [`.woodpecker/e2e-auth.yml`](../.woodpecker/e2e-auth.yml) (secret
`SUPABASE_SERVICE_ROLE_KEY`).
