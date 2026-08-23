# End-to-end tests

Two suites share `e2e/` and `e2e/serve-dist.mjs` (static server mirroring
Vercel routing over `dist/`).

## Hermetic smoke (`npm run test:e2e`)

Credential-free. Asserts prerender/hydration, consent, and the `/app` SPA
rewrite. Driven by [`playwright.config.ts`](../playwright.config.ts). Does
**not** talk to Supabase (build without `VITE_SUPABASE_*`).

```bash
npm run build
npm run test:e2e
```

## Authenticated critical path (`npm run test:e2e:auth`)

Signed-in admin → Settings **Production** → Employees empty → add one
employee → assert → remove. Driven by
[`playwright.auth.config.ts`](../playwright.auth.config.ts).

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
