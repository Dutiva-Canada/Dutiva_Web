# Self-hosting Dutiva

What "self-host" can mean here, in order of how much you operate yourself:

1. **Web bundle only** — you serve the static site; the backend stays a
   Supabase cloud project. This is what `deploy/self-host/` automates and
   what most teams actually want.
2. **Web + Supabase stack** — you also run Postgres, GoTrue, PostgREST,
   Storage and the edge-runtime yourself using Supabase's official compose
   project. Works, but it is an ops commitment: backups, upgrades, SMTP for
   auth email, object storage. Nothing in this repo replaces that work.
3. **Fully offline / air-gapped** — not supported. The bundle still calls
   huggingface.co (first install of on-device models) and cdn.jsdelivr.net,
   and optional features call Stripe / Resend / a captcha provider.

Either way the deployable unit is the same: `dist/` — static files, no
Node server, no SSR at request time. Every dynamic call goes to Supabase
(PostgREST, Auth, Storage, Edge Functions), which is why the two halves can
be split like this.

## Path 1 — web bundle with `deploy/self-host/`

```bash
cp deploy/self-host/.env.selfhost.example deploy/self-host/.env.selfhost
# edit .env.selfhost: your Supabase URL, publishable key, origin
docker compose -f deploy/self-host/docker-compose.yml \
  --env-file deploy/self-host/.env.selfhost up -d --build
```

- `Dockerfile.web` builds `dist/` (vite → SSR build → prerender → service
  worker) and serves it with nginx. VITE_* vars are **compile-time** —
  change them by rebuilding the image.
- `nginx.conf.template` sets the security headers vercel.json sets for
  production, with `connect-src` built from `SELFHOST_SUPABASE_ORIGIN`.
  **If the app loads but every request fails, that value is wrong** — the
  browser console will show CSP blocks.
- The compose file includes an optional `ollama` profile
  (`--profile local-ai`) for a local OpenAI-compatible endpoint — see
  "Local models" below.

Any static host works instead of the container — nginx, Caddy, a bucket +
CDN. Reproduce three things from `vercel.json`: the `/app*`/`/demo*` rewrites
to `app.html`, the security headers (adjust CSP connect-src to your Supabase
origin), and immutable caching for `/assets/`.

## Path 2 — the backend: Supabase cloud or self-hosted

**Supabase cloud** (recommended): create a project, then apply this repo's
migrations and deploy its functions:

```bash
supabase link --project-ref <ref>
supabase db push                       # applies supabase/migrations/*
supabase functions deploy              # deploys every function in supabase/functions/
supabase secrets set --env-file .env   # server-side secrets; see .env.example
```

**Self-hosted Supabase**: use the official compose stack from
`supabase/supabase` (docker/docker-compose.yml there). Then apply the same
migrations against its Postgres and mount `supabase/functions/` into its
edge-runtime service. Plan for:

- **Auth email** — GoTrue needs a working SMTP or users can't sign in
  (magic links). The `smtp_email` workspace integration stores credentials
  but GoTrue's SMTP is configured in its own env, separately.
- **Cron** — several features are pg_cron jobs created by migrations
  (law monitoring, support notifications). Confirm pg_cron/pg_net run in
  your Postgres image.
- **Vault** — integration credentials use `supabase_vault`
  (migration 0161); enable the extension.
- **Backups** — yours now. `supabase db dump` or plain pg_dump.

`npm run check:migrations` can verify a repo↔project migration match when
`SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF` are set — run it after
applying, and record what you verified.

## What still points outside

| Dependency                       | Needed for                                | Off if unset?                                       |
| -------------------------------- | ----------------------------------------- | --------------------------------------------------- |
| huggingface.co, cdn.jsdelivr.net | first install of on-device browser models | yes — models simply can't install                   |
| Stripe                           | billing, Advisor reply packs              | yes — checkout functions answer 503, app still runs |
| Resend                           | support notification email                | yes — notifications queue, nothing sends            |
| Turnstile/hCaptcha               | public contact/intake spam check          | yes — verification is skipped with no secret        |
| GA4/GTM                          | marketing analytics                       | yes — inert                                         |

All of these are server-side secrets configured per `.env.example`; none
are required for the workspace to boot.

## Local models on a self-hosted deployment

Three separate things, don't conflate them (docs/LOCAL_INFERENCE.md):

- **On-device browser models** — run in the user's browser via
  transformers.js, download once from huggingface.co. No server needed.
- **LAN/self-hosted endpoint** — an OpenAI-compatible server (the compose
  `ollama` profile, or your own vLLM/LM Studio) registered in Settings →
  AI. The Advisor's edge function calls it, so **the function must reach
  it**: on Supabase cloud that means a public URL or tunnel — a LAN IP is
  not reachable. On a self-hosted Supabase in the same network, it is.
- **External-drive model loading** — the File System Access prototype
  (Settings → AI → "on this device") reads model files from a folder the
  user picks each session, Chromium only. No silent USB mounting exists.

## Honest limits

- This is a deployment scaffold, not a turnkey appliance. There's no
  installer, no upgrade automation, no HA story.
- The bundle carries Dutiva branding and marketing pages; `VITE_SITE_ORIGIN`
  rewrites canonical metadata but the site content is the same site.
- Edge-function scheduling (pg_cron jobs that POST to function URLs) has
  the function URL hardcoded at migration time — check
  `supabase/migrations/*schedule*.sql` if you move hosts.
- Licensed proprietary — see LICENSE.md; self-hosting doesn't change that.
