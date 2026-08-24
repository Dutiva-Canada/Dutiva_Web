# Open items — the running to-do list

**Swept 2026-08-02, across every session in this repository: PRs #1–#132.**

Sessions here end at a merge, and each one closes by writing down what it did
_not_ do — in a "Still staged", "Not done", "Follow-up" or "Decisions needed"
section of its PR body, and usually in a doc under `docs/`. That is good
practice and it had one failure mode: those notes were spread across 132 PR
descriptions and a dozen documents, so nothing said what was open _in total_.
This file is that total.

**Precedence.** This file is an index of open work, not a source of fact.
[CANONICAL_FACTS.md](CANONICAL_FACTS.md) outranks it, and the code outranks
both. Where an item names a file, the file is the authority on its current
state — an entry here can go stale, a test cannot.

**Verification note.** Items are verified against the repository at the sweep
date. Items whose truth lives on the live Supabase project or in a dashboard are
marked _unverified here_ — this session had no database or dashboard access, so
"the code is inert until a secret is set" is checkable and "the secret is not
set" is not.

**Eng polish (2026-08-23) — closed.** Cross-cutting shell polish is done:
production-mode empty-state / Workflows / Search i18n, advisor Copy/Export
messages, toast/signature/auth token cleanup, and production-mode tests for
Workflows and Search. Owner gates (OA*, L5 corpus review, residency) are
unchanged.

## Status vocabulary

| Status       | Meaning                                                                         |
| ------------ | ------------------------------------------------------------------------------- |
| **Owner**    | Built and merged; needs a secret, an account, or a dashboard action to come on  |
| **Decision** | Blocked on a product or policy call, not on engineering time                    |
| **Blocked**  | Blocked by something outside this repo (network policy, legal review, a vendor) |
| **Build**    | Ready to implement; no decision or credential in the way                        |
| **Verify**   | Something believed true that no one has confirmed                               |

---

## 1. Owner actions — merged, and inert until configured

Everything in this section is code that exists, passes tests, and does nothing
until someone with credentials acts. A merged migration is not an applied
migration and a merged function is not a deployed one; see
[AGENTS.md § Migrations ship in two halves](../AGENTS.md).

**OA1 — Done.** The `law_monitor_service_key` Vault secret was created on
2026-08-06. The nightly sweep at 07:00 UTC now fires `trigger_law_monitor()`,
which reads the key and POSTs to the edge function. Verified via
`law_monitor_status()`: `secret_configured: true`, `hours_since_check: 0.0`.

**OA2 — Done.** The first successful federal sweep ran on 2026-08-06, fetching
both Justice Canada XML pages (Canada Labour Code, Canadian Human Rights Act)
and recording `first_seen` events. `monitoringCoverage.ts` flipped Federal from
`unverified` to `active`, `COVERAGE_AUDITED_ON` updated to 2026-08-06, and
`CANONICAL_FACTS.md §5` updated to reflect that Federal detection is confirmed
working while ON/QC remain unavailable. (PR #162)

**OA3 — Done.** Verified 2026-08-07 via Supabase MCP: `RESEND_API_KEY`,
`SUPPORT_EMAIL_FROM`, and `SUPPORT_NOTIFY_SECRET` are all set (notifications
go `sent` on first attempt). The Resend webhook is registered and
`RESEND_WEBHOOK_SECRET` is set — `delivery_status` is now populated:
`DUT-2026-000005` shows `delivered` (operator alert) and `bounced` (customer
ticket), proving the full round-trip works. A bounce is now visible instead
of silent. (PRs #43, #50, #51)

**OA4 — Done.** Verified 2026-08-07: the prerendered `https://dutiva.ca/contact`
HTML includes the `data-testid="captcha-widget"` container, and
`create-public-support-ticket` (v18) is deployed with `CAPTCHA_SECRET_KEY`
set — the edge function now rejects submissions with a missing or invalid
CAPTCHA token. `VITE_CAPTCHA_SITE_KEY` is compiled into the bundle. (PR #115)

**OA17 — Done.** Both functions deployed and verified 2026-08-06.
`support-analytics-event` recorded its **first event in production**:
`help_article_view / signing-in / en`, `workspace_id` null, opaque visitor id
present — the privacy model in
[SUPPORT_ANALYTICS.md](SUPPORT_ANALYTICS.md) §2 behaving as written.
`export-audit-trail` deployed with `verify_jwt = true`, which is right: it
takes a user JWT and gates on `is_admin` server-side, and a publishable key
alone correctly gets `401 Invalid user token`.

**The deploy took two attempts, and the reason is worth keeping.** The first
went out with `verify_jwt` at the CLI default of `true`. Every flush then
died at the gateway with `UNAUTHORIZED_NO_AUTH_HEADER`, because
`supportAnalytics.ts`'s `flush()` posts a bare body — no `apikey`, no
`Authorization` — and swallows all errors by design. Deployed, reachable,
returning 401 to a client that cannot report it. `report-error` settled it:
its client sends no key either
([reporter.ts](../src/lib/errorReporting/reporter.ts)) and it runs
`verify_jwt = false`. Both are now pinned in
[`supabase/config.toml`](../supabase/config.toml) so neither drifts back.

**The rate-limiting follow-up this entry raised is closed.** It was real:
`verify_jwt = false` made this an unauthenticated write path taking 50 events a
request with nothing stopping anyone filling `support_analytics_events` with
fabricated rows, and 90-day retention bounds the storage but not the accuracy of
any metric built on it. Migration `0051` closed it with the `0019` pattern —
peppered IP hash, advisory lock, all-sources sweep, `security definer` to
`service_role` — counting **events rather than requests**, at 120/minute per
source. Verified against the deployed function: 251 events across five batches
stored 101 and rejected the rest once the window filled.

`0051` did leave one half of `0019` behind, and `0052` adds it: `0019` ships a
scheduled purge because the in-RPC sweep only runs when a request arrives, so a
quiet endpoint keeps the last caller's IP hashes indefinitely. `0052` adds
`purge_support_analytics_rate_limit()` on an hourly job and widens
`support_analytics_status()` so `rate_limit_purge_scheduled` is checkable —
the same "merged is not running" trap this entry is about.

**`0052` is applied and verified 2026-08-06 — no owner action left.** The gap
was real in production: `purge_support_analytics_rate_limit` did not exist and
`cron.job` held no purge entry, so nothing but incoming traffic had ever swept
that table. After applying, `purge-support-analytics-rate-limit` is active on
`17 * * * *` and `support_analytics_status()` returns
`rate_limit_purge_scheduled: true`. Proven rather than assumed: a seeded row
aged two hours was deleted by one `purge_support_analytics_rate_limit()` call
while a fresh row beside it survived, and the probe rows were removed after.
Grants confirmed `service_role`-only — `anon` and `authenticated` both false on
the purge and on the widened status function.

_Historical detail below._

**What was wrong.** The "merged is not deployed" gap in
[AGENTS.md](../AGENTS.md), caught in production:

- **`support-analytics-event`** — absent from the project. Edge logs show
  `OPTIONS | 404 | …/support-analytics-event` at 21:39 UTC on 2026-08-06, the
  moment a ticket was created through the public form. **Every support funnel
  analytics event has been 404ing**, so D2 (PR #153) — the whole funnel, the
  90-day raw retention, the daily rollups — has been recording nothing in
  production while `0047` sat applied and the client dutifully posted events.
- **`export-audit-trail`** — also absent, so `ExportAuditView` has no backend.

Both exist in `supabase/functions/`. Deploy from the repo root, where
`supabase/config.toml` now pins them:

```bash
npx supabase functions deploy support-analytics-event --project-ref khtwpxnvziiyplaflwru
npx supabase functions deploy export-audit-trail --project-ref khtwpxnvziiyplaflwru
```

Note neither is listed in `config.toml`'s `[functions.*]` blocks, which only
name the ten that need `verify_jwt = false`. Check what each one expects
before deploying — `support-analytics-event` is called from the browser and
will need `verify_jwt` set to match how it authenticates.

**OA5 — Done.** Attachment scanning is on and proven end to end. Verified
2026-08-06 with a real EICAR upload to ticket `DUT-2026-000004`: the row went
`pending → flagged` in one attempt, `scan_detail` recorded
`Eicar-Test-Signature`, `scanned_at` was stamped, and an `attachment_flagged`
event landed in the ticket's audit trail beside the `attachment_added` one.
`attachment_scan_status()` reads `flagged_count: 1, pending_count: 0`. The
whole path ran: browser upload → Supabase storage → pg_cron →
`support-attachment-scan` → 5-minute signed URL → ClamAV in Toronto → verdict
written back.

The flagged object was deliberately **not** deleted — downloads are refused
but the bytes stay for an incident responder, per
[SUPPORT_ARCHITECTURE.md](SUPPORT_ARCHITECTURE.md). The EICAR test file is
still attached to that ticket; it is an inert industry test string, safe to
leave or remove.

_Historical detail below._

**Scanner deployment.** The endpoint is live:
`dutiva-attachment-scanner` on DigitalOcean App Platform, region `tor`,
`apps-s-1vcpu-2gb`, built from
[`services/attachment-scanner`](../services/attachment-scanner/README.md) on
`main` with `deploy_on_push` off. Verified 2026-08-06 against the deployed URL:
`/health` → `{"ok":true,"clamd":"PONG"}`, `/scan` with a wrong or absent token
→ `401`, unknown route → `404`, plain http → `301`. The first deployment
deliberately failed — `SCAN_TOKEN is not set — refusing to start an
unauthenticated scan endpoint` — which also proved clamd loads its full
signature database inside the 2 GB slug before the token check runs.

**What is left:** set `SUPPORT_ATTACHMENT_SCAN_URL` (the app's ingress URL +
`/scan`) and `SUPPORT_ATTACHMENT_SCAN_KEY` (the same value as the app's
`SCAN_TOKEN`) as Supabase edge-function secrets. Until then every row stays
`scan_status: pending` — the honest state, since `pending` has never meant
clean. (PR #115, #165)

**Not yet exercised end to end.** No file has been scanned through the
deployed service: it only fetches from `ALLOWED_FETCH_HOST`
(`khtwpxnvziiyplaflwru.supabase.co`), so a real scan needs a Supabase signed
URL, which needs the secrets above. The first genuine test is uploading an
EICAR `.txt` to a ticket and watching the row go `pending → flagged`. Local
verification against real ClamAV did pass (EICAR → `infected`
`Eicar-Test-Signature`, ordinary file → `clean`).

The scanner is self-hosted deliberately: it fetches the actual bytes of
customer HR attachments, which makes "whose servers do these touch" a
compliance question (OA9, PIPEDA) rather than a vendor-selection one. A hosted
API would have needed a translation service anyway — none of them return the
`{status: clean|infected|unsupported}` shape
[attachmentScan.ts](../src/features/support/attachmentScan.ts) requires, and
every unrecognised body maps to `unknown`, so nothing would ever go `clean`.
Two things to know before deploying: it needs a **2 GB** instance (clamd holds
the signature DB in RAM; below that it is OOM-killed and every file comes back
`scanner_unreachable`, which looks like a network fault and isn't), and
**setting the URL arms the download gate as well as the worker** — verify the
endpoint with curl first. `support_attachments` is currently empty, so there is
no backlog to lock out; this is the cheapest moment to switch it on.

The Vault half is done. Verified 2026-08-06: the cron job was firing every 10
minutes and getting **403** on every run, because `support-attachment-scan` is
the one function that compares the bearer to its own
`SUPABASE_SERVICE_ROLE_KEY`, and the legacy service_role JWT that 0038 told the
operator to store is a valid credential but not that same string. Migration
`0048` switches the job to the `x-scan-secret` / `support_notify_secret` path
that `support-notify-drain` already proves works; the trigger now returns
`200 {"processed":0,"pending":0,"note":"no_scanner"}`, i.e. correctly inert
pending the two secrets above. `attachment_scan_status()` was reporting
`secret_configured: true` throughout and never saw this — it now checks the
credential the job actually presents, and
[SUPPORT_RUNBOOK.md](SUPPORT_RUNBOOK.md) gained the `net._http_response` check
that would have caught it.

**OA6 — Done.** Verified 2026-08-06 via Supabase MCP: the `report-error`
function is not failing closed (48 rows in `client_error_reports`, latest
2026-08-06 12:12 UTC), confirming `ERROR_REPORT_SALT` or its
`SUPPORT_NOTIFY_SECRET` fallback is set. The `purge-client-error-data` cron
job is scheduled hourly at :23 and running successfully (5/5 recent runs
succeeded). Retention is bounded.

**OA7 — Done.** Supabase Auth dashboard settings for magic links. Verified
2026-08-06 in the dashboard, all three settings in
[AUTH_MAGIC_LINK.md](AUTH_MAGIC_LINK.md) §1–§3:

- §2 **Site URL** was already `https://dutiva.ca`.
- §3 **Magic link template** was already on
  `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink`, so the
  scanner-burn failure mode is gone.
- §1 **Redirect URLs** was the gap and was fixed the same day. The list held
  three stale entries from the old `/auth` callback path
  (`http://localhost:5173/auth`, `https://dutiva.ca/auth`,
  `https://dutiva.vercel.app/auth`) that matched nothing the app requests;
  local dev and the `dutiva.vercel.app` alias were therefore falling back to
  the Site URL. Added `http://localhost:5173/**` and
  `https://dutiva.vercel.app/**`, removed the three stale entries. 19 entries
  now; production was already covered by `https://dutiva.ca/**`. (PR #52)

**OA8 — Done.** Both engines were already verified and crawling; this entry was
stale, not outstanding. It had inferred "unverified" from "no session could
reach `dutiva.ca` from its sandbox" — but the work had been done in the
dashboards back in April, where no sandbox could see it. Checked directly in
both consoles 2026-08-06:

- **Google Search Console** — property `https://dutiva.ca/` verified and
  reporting (69 indexed pages, 37 not indexed). Sitemap `/sitemap.xml`
  submitted 2026-04-12, last read 2026-07-29, **Success**, 102 pages
  discovered.
- **Bing Webmaster Tools** — site `www.dutiva.ca` live (17 clicks, 68
  impressions). Two sitemaps known, 0 errors, 0 warnings, 252 URLs
  discovered: `https://dutiva.ca/sitemap.xml` (submitted 2026-04-23, crawled
  2026-08-05) and `https://www.dutiva.ca/sitemap.xml` (submitted 2026-04-22,
  crawled 2026-08-04), both **Success**.

**`GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` are not needed** and
were never set. Both properties are verified by another method, so the
build-time meta tags in [`scripts/prerender.mjs`](../scripts/prerender.mjs)
have nothing to prove. The code stays — it costs nothing and is the right
mechanism if a property ever needs re-verifying — but no Vercel variable and
no redeploy is required. (PRs #112, #113)

Two real findings surfaced by Bing's own recommendations, both feeding
[SEO_AUTHORITY_PLAYBOOK.md](SEO_AUTHORITY_PLAYBOOK.md) rather than this
section:

- _"Meta descriptions on many pages are too short."_ That is a code fix in
  the route metadata, not a dashboard action.
- _"Your site does not have enough inbound links from high quality domains."_
  The off-site half of the playbook, unchanged by anything here.

Optional tidy: Bing holds sitemaps for both `dutiva.ca` and `www.dutiva.ca`
while `vercel.json` 301s www → apex. Harmless — both report Success — but the
www entry is redundant.

**OA9 — Send the DigitalOcean residency ticket.** _Owner._ The ticket is
drafted and unsent in
[do-residency-confirmation-request.md](do-residency-confirmation-request.md).
Five public legal documents state the Advisor's processing location as Toronto;
that claim rests on a July 2026 confirmation covering the _previous_ model, and
the production route moved to `deepseek-3.2` on 2026-07-26. Resolving it unblocks
the PIPEDA wording in CANONICAL_FACTS §2. (PR #103)

**OA10 — Done.** `supabase/schema.sql` committed 2026-08-07 via
`npx supabase db dump`. 6,469 lines covering 124 tables, 218 RLS policies,
136 functions, 209 indexes, and 26 triggers — the full application schema
that `supabase/migrations/` alone can't reproduce. A reviewer can now see
the real RLS policies and function bodies in a diff.
[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md). (PR #74)

**OA11 — Stripe secrets and webhook endpoint.** _Eng prep done 2026-08-23;
Stripe Dashboard deferred._ Checkout / portal / webhook match repo (annual
wiring + apex `SITE_URL`); paid CTAs stay off
(`PAID_PLANS_DISABLED_DURING_BETA` remains `true`). Founder still needs to
run [STRIPE_GO_LIVE.md](STRIPE_GO_LIVE.md) when ready (products/prices,
secrets, webhook, test-mode smoke) — **not blocking other eng work**. Flag
flip is a separate eng PR after that smoke test (§5). Prior notes:
[BILLING_BETA_AUDIT.md § Remaining work](BILLING_BETA_AUDIT.md).

**OA12 — Partially done.** D3 was decided 2026-08-06 (Google Calendar, full
loop) and built the same day. Verified 2026-08-06 via Supabase MCP:

- (2) **Done.** All three edge functions deployed: `support-agent-action`
  (v11, extended with `propose_call`), `support-confirm-call` (v1),
  `support-call-scheduler` (v1). Manual trigger of
  `trigger_support_call_scheduler()` returned 200.
- (3) **Done.** `support_scheduler_service_key` Vault secret created.
  `support_call_scheduler_status()` shows `secret_configured: true`,
  `job_scheduled: true`.
- (1) **Closed as "not doing", 2026-08-07.** The three Calendar secrets
  (`GOOGLE_CALENDAR_CLIENT_EMAIL` / `GOOGLE_CALENDAR_PRIVATE_KEY` /
  `GOOGLE_CALENDAR_ID`) are **not set and are not planned.** Calendar sync
  stays off; `support-confirm-call` skips it via `if (key && calendarId)` and
  records a `calendar_sync_skipped` ticket event, so proposing and confirming
  a call still works end to end — the customer just gets no automatic invite.
  See [SUPPORT_CALL_SCHEDULING.md](SUPPORT_CALL_SCHEDULING.md).

  **Why it was abandoned rather than finished.** Google enforces
  `iam.disableServiceAccountKeyCreation` on the `dutiva.ca` organization by
  default (Secure by Default), so the service account was created but no JSON
  key could be generated. Getting one required granting
  `roles/orgpolicy.policyAdmin` to an account that currently lacks even
  `orgpolicy.policy.get`, then switching off a Google security default — a
  privilege escalation plus a weakened org-wide control, to enable a
  convenience feature whose absence costs one calendar invite.

  That trade was not worth making. Service-account keys are long-lived
  credentials in a file, which is exactly what the policy exists to prevent,
  and this repo would have been holding one for a calendar.

  **If this is revisited**, the options in preference order are: (a) create
  the project outside the `dutiva.ca` org, where the policy does not apply and
  nothing is weakened; (b) rewrite
  [`googleCalendar.ts`](../supabase/functions/_shared/googleCalendar.ts) onto
  Workload Identity Federation, which needs no key at all — the option Google
  itself points to; (c) grant `policyAdmin` and add an exception scoped to the
  single project, never org-wide.

  **Leftovers to clean up:** the unused Google Cloud project
  `dutiva-support-calendar` (`sunny-mender-504801-m9`) and its
  `dutiva-calendar@…iam.gserviceaccount.com` service account, both created
  2026-08-07 and now doing nothing. Neither has a key and neither holds any
  role, so they are inert — but an idle service account is still an identity,
  and deleting the project removes both.

**OA13 — Done.** D1 was decided 2026-08-06 (internal-only, weekly,
human-reviewed) and built the same day. All three deployment steps verified
2026-08-07 via Supabase MCP:

- (1) **Done.** OA1/OA2 completed — the monitor is running and Federal
  detection is confirmed working.
- (2) **Done.** `send-law-updates` deployed and returning
  `200 {"ok":true,"sent":false,"reason":"nothing_to_digest"}`. With OA3 now
  complete, `RESEND_API_KEY` and `SUPPORT_OPERATOR_EMAIL` are set — the
  function will send the digest email as soon as a human reviews a row.
- (3) **Done.** `law_update_digest_service_key` Vault secret created.
  `law_update_digest_status()` shows `secret_configured: true`,
  `job_scheduled: true`, `unreviewed_count: 22`.
- Reviewing a row is direct SQL for now (`update law_updates set
review_status = 'reviewed' where id = '<uuid>'`) — there is no admin UI, on
  purpose, for a low-volume internal pilot. See
  [LAW_CHANGE_NOTIFICATIONS.md § 7](LAW_CHANGE_NOTIFICATIONS.md).

**OA16 — Done.** Redeployed 2026-08-06 as v24 via the Supabase CLI. The auth
bypass is closed: a forged token (`x.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.x` — a
literal `{"role":"service_role"}` with no signature) returns **403
Forbidden**, confirmed via `net.http_post` → `net._http_response`. The
deployed `isAuthorizedTrigger()` does exact-match only against the
service-role key or `SUPABASE_SECRET_KEY` — no JWT payload decoding.

PR #146 (Ontario/Québec API rework: `ontarioApi.ts`, `quebecCkan.ts`) shipped in
the same deploy, as the TODO entry anticipated — whatever is in the working
tree is what goes.

**OA20 — Done.** Migrations `0071_corpus_source_change_flags.sql` and
`0072_flag_trigger_idempotent_guard.sql` were already applied in the
2026-08-10 backlog. Verified: `advisor_guidance_chunks` has
`source_changed_at`/`source_change_note`, `match_advisor_guidance`
returns 9 columns including the new flag, and trigger
`law_updates_flag_guidance` is enabled. `advisor-chat` and
`advisor-safety-event` were redeployed 2026-08-10.

End-to-end verification with a temporary beta test user:

- `advisor-safety-event` accepted the new `figure-mismatch` action and
  returned `202 {"data":{"recorded":1}}`.
- `advisor-chat` answered an Ontario notice question ("What notice period
  do I owe an Ontario employee with 3 years of service?") with a grounded
  ESA s.57 ladder and an `advisor_response` workspace payload; status
  `200`.
- A synthetic Ontario `law_updates` `change` event was inserted and then
  removed; the `law_updates_flag_guidance` trigger flagged 14 active
  Ontario `advisor_guidance_chunks`, and the test flags were cleared
  afterwards.

**SEC1 — Anon RLS holes closed (migration 0073, applied to prod
2026-08-08).** _Done — with two owner follow-ups._ A four-dimension security
audit found three legacy tables world-open to anonymous callers:
`beta_signups` (prospect PII + CASL consent + the workspace-membership
allowlist — 0 rows at the time), `signatures` (anon could read every
signature and forge an executed one — 1 row), and `hr_documents` (template
IP — 26 rows). Confirmed live via `pg_policies`, fixed by dropping the anon
policies (verified: as `anon`, all three now return 0 rows / permission
denied; the public status page, admin reads, public signup INSERT and
authenticated signature owners still work), and brought into version
control as `0073_close_anon_rls_holes.sql`. The bad policies had **no
creating migration** — out-of-band drift — which is the deeper lesson.
Owner follow-ups: (1) **regenerate `supabase/schema.sql`** — done
2026-08-10; the snapshot now reflects `0039–0074` and the `flag_guidance_chunks_on_law_change`,
`score_snapshot_status`, `trigger_score_snapshots`, `compliance_score_snapshots`,
`hr_obligations`, and related RLS policies. (2) **re-run `get_advisors('security')`**
— done 2026-08-10. The run found 28 WARNs after the migration backlog; the new
`public.flag_guidance_chunks_on_law_change()` function from `0071` was flagged as
an `anon`-callable `SECURITY DEFINER` RPC. This was fixed by migration
`0074_revoke_flag_guidance_public_execute.sql` (revoke client `EXECUTE`, applied
2026-08-10). Re-run after the fix shows 26 WARNs and no `anon` flag: the
remaining non-blocking items are `pg_net` in the public schema, leaked-password
protection off (low relevance — magic-link auth), and 24 `authenticated`
`SECURITY DEFINER` functions (verified benign — the org-scoped ones
self-authorize; `claim_ai_usage` is service-role only).

**SEC2 — Done.** _Verified and promoted 2026-08-10._ The site shipped with
no CSP / X-Frame-Options / HSTS / nosniff / Referrer-Policy. Every route now
carries the enforcing safe set **plus a full, enforcing CSP** in
`Content-Security-Policy`. A Playwright signed-in click-through (marketing
pages, `/fr`, `/app`, Advisor, Documents, Knowledge, Support, People, Cases)
logged **zero CSP console violations**; the report-only header was promoted by
renaming it to `Content-Security-Policy` in `vercel.json`. `*.challenges.cloudflare.com`
was added defensively to `img-src`, `connect-src`, and `frame-src` for
Turnstile. **2026-08-23 follow-up:** `'unsafe-inline'` removed from both
`script-src` (bootstraps externalized) and `style-src` (React inline styles
refactored); regressions guarded by `e2e/csp.spec.ts`. See [SECURITY_HEADERS.md](SECURITY_HEADERS.md).

**SEC3 — Done.** _Verified 2026-08-10; one mailbox owner follow-up remains._
(1) **`SECURITY.md`** and `public/.well-known/security.txt` are in place
(Expires 2027-08-08). _Owner:_ keep `security@dutiva.ca` routed to a
monitored inbox and refresh `Expires` before 2027-08-08.
(2) **CAPTCHA on `create-beta-signup`** is live: the function is deployed
(`create-beta-signup` v16, ACTIVE), `CAPTCHA_SECRET_KEY` / `CAPTCHA_PROVIDER`
are set in Supabase secrets, and the client side matches the
`create-public-support-ticket` gate. A test signup without a token now returns
`403` when the secret is set.
(3) **Supabase tokens in `localStorage`** (audit H2): the decision not to move
them reactively stands. The impact mitigations are the CSP (SEC2) and the
already-strong XSS prevention. **Refresh-token rotation** is confirmed enabled
via the Supabase Management API (`refresh_token_rotation_enabled: true`,
`security_refresh_token_reuse_interval: 10s`, `jwt_exp: 3600s`). See
[AUTH_MAGIC_LINK.md](AUTH_MAGIC_LINK.md#session-token-storage--the-xss-blast-radius).

**OA19 — Done.** Updated the GitHub repository secret `SUPABASE_ACCESS_TOKEN`
to a valid `sbp_…` Supabase personal access token. The `Migration drift` CI
step now reaches the Supabase Management API; the first run after the fix
(run `31421301817`) completed successfully. A `401` on bad credentials is the
check working by design — it no longer hides drift behind a credentials
failure.

**OA18 — Done.** The score-formula v2+v3 migrations (`0068_score_formula_v2.sql`,
`0069_score_formula_v3_obligations.sql`, and `0070_score_snapshot_close_retries.sql`)
were applied, the `record-score-snapshots` edge function was deployed with
`verify_jwt = false` pinned in `supabase/config.toml`, and the
`score_snapshot_service_key` Vault secret was created. Verification:
`select * from public.score_snapshot_status();` shows
`secret_configured: true`, both cron jobs scheduled, and
`orgs_with_current_month` ≥ 1 after `public.trigger_score_snapshots()` was
fired. See [SCORING_LOGIC.md](SCORING_LOGIC.md) §2.3/§8.

---

## 2. Decisions needed before anyone writes code

These are not backlog items. Each one was deliberately left to the owner because
building it speculatively would have meant deciding it speculatively.

**D2 — Support analytics: the privacy model comes first.** Decided
2026-08-06 (full support funnel, workspace-scoped, 90-day raw / forever
aggregate, first-party Supabase sink + GA4 plumbing) and built the same day —
migration `0047`, `support-analytics-event` edge function, client module
wired into all six event points, privacy/cookie/retention docs concretized.
See [SUPPORT_ANALYTICS.md](SUPPORT_ANALYTICS.md). **Done 2026-08-10.** The
`support-analytics-event` edge function was redeployed (v9, ACTIVE) and the
consent banner UI (`ConsentBanner.tsx`) is wired and shipped. Both the
first-party Supabase sink and GA4 are gated behind the banner. The
`VITE_GA_MEASUREMENT_ID` is set to `G-V85ZQ75EWL` for CI builds and local
`.env`; GA4 still stays inert for visitors who decline consent. Set the same
ID in the deployment platform (e.g., Vercel) for production. (PR #153)

**D4 — Training-crawler policy.** Decided 2026-08-06: opted in.
`GPTBot` (OpenAI), `ClaudeBot` (Anthropic), `CCBot` (Common Crawl),
`Amazonbot` (Amazon), and `Google-Extended` (Google Gemini/Vertex) are now
allowed with the same private-path exclusions as search crawlers.
`scripts/prerender.mjs` updated; `docs/SEO_GEO_IMPLEMENTATION.md` § Crawler
& AI policy updated. Reversible — move a bot back to `Disallow: /` to opt
out of a specific provider's training. (PR #154)

**D5 — Done.** Decided 2026-08-06: the Beta Launch Brief (2026-07-20) is the
plan of record. CANONICAL_FACTS § Positioning and § Open items 3 updated; the
replacement privacy wording was pasted into the Beta Launch Brief and the other
business plans in Drive were marked as superseded 2026-08-10. (PR #166)

**D6 — Is a non-figure linkable asset worth building.** Decided 2026-08-06:
yes — a jurisdiction-scoping questionnaire. Three questions determine
whether Ontario (ESA), Quebec (LNT), or federal (Canada Labour Code)
employment standards likely apply. No statutory figures (notice periods,
thresholds, deadlines) — names the statute and links to the official text.
Live at `/tools/jurisdiction-check` (EN) and `/fr/outils/verification-juridiction`
(FR), prerendered and in the sitemap. A **public** termination-notice
calculator remains ruled out (publishing notice periods violates the
editorial rule in `articleModel.ts`). Workspace calculators are deferred
separately as EF11. (PR #156)

**D8 — Score formula v3: task provenance and the obligations component.**
Decided 2026-08-08 (owner: "go ahead with v3") and built the same day.
(a) Tasks now score only when provenanced — category beyond the `'general'`
default or an app-written `metadata.kind` (`isProvenancedTask`, mirrored in
the job's scoring copy); hand-added to-dos still count everywhere except the
score. (b) `hr_obligations` (migration 0069) is the production obligation
register — evidence-centric statuses, overdue derived from the due date —
and its `ok`-over-all ratio is the fourth component. Deploy steps live in
OA18. See [SCORING_LOGIC.md](SCORING_LOGIC.md) §2.2/§2.5/§8.

**D7 — `/guides` vs `/blog` positioning.** Decided 2026-08-06: no publishing
cadence is planned; the current positioning holds. `/guides` = documents an
employer produces (contracts, probation, accommodation, termination).
`/blog` = obligations that apply before drafting (employment regime, required
policies, records, leaves). Neither is dated, neither is "news" — a stale
timestamp on a compliance page is worse than none. If a cadence is ever
planned, the blog should become dated and the strings should change; the
`articleModel.ts` comment already says to change the rule deliberately rather
than letting one article quietly become the exception. (PR #157)

---

## 3. Legal and content verification

The corpus rule is that every statutory figure comes from a direct fetch of an
official government page, fetched twice — once to author, once to verify
independently. Everything in this section is gated on that rule.

**L5 — Corpus review gate: the Ontario pack is built, awaiting the pass.**
_Blocked (human review) — but the preparation is done._ Every row in
`advisor_guidance_chunks` is `review_status: machine_curated`; only a human
flips a row to `reviewed`, and that gate has never been exercised.
[advisor-corpus-review-pack-ontario.md](advisor-corpus-review-pack-ontario.md)
(2026-08-08) now carries the full checklist for the 14 Ontario chunks —
per-chunk figures to verify, source URLs, priority order (minimum wage
first: it expires Oct 1, 2026), and the per-chunk sign-off SQL, which also
clears the 0071 source-change flag. Working through it is deliberately an
owner/reviewer act, not an agent one.

**L6 — Québec and Federal notice bands: deferred — hard hedges remain.**
_Decision (2026-08-23)._ Qualified legal sign-off has not been obtained.
`NOTICE_SCHEDULES` keeps `bands: null` for QC and FED; Document Studio and
Advisor continue to hedge. The research pack is complete
([notice-bands-review-pack.md](notice-bands-review-pack.md)); the interim
product decision is recorded in
[notice-bands-decision.md](notice-bands-decision.md). Population waits on
§4 sign-off with an explicit **Yes** — not engineering time.

Two findings in it decide the question and were not visible from the code:

- **Québec's band is only a floor.** CCQ art. 2091 reasonable notice sits on top
  of s. 82 (preserved expressly by s. 82 ¶4) and is non-renounceable under
  art. 2092, so presenting the band as "the notice a Québec employee gets" is
  materially misleading. A technically correct table can still be the wrong
  thing to ship. s. 82 is also literally ambiguous at exactly 5 and 10 years, in
  **both** language editions — so the Charter's French-prevails tiebreaker
  cannot resolve it, and only CNESST's non-binding administrative reading does.
- **The federal picture is due to change silently.** 2018, c. 27, ss. 479–484
  are enacted but **not yet in force**; they would make group termination
  _displace_ the s. 230(1.1) band table (with an 8-week floor) rather than add
  to it. A federal table shipped today becomes wrong for group terminations the
  day those are proclaimed, with no change to the in-force consolidated text.
  If FED is approved, attach a monitoring commitment to the sign-off.

(PRs #78, #110)

**L7 — ESA s. 64 severance: three options written up, awaiting a choice.**
_Decision._ Severance does not fit `NOTICE_SCHEDULES` at all — it is continuous
and proportional rather than banded, its gate is a property of the employer
(the $2.5M payroll test) and of the event (50 employments severed in six months
on a permanent closure) rather than of tenure, and it carries a 26-week ceiling
the shape has no field for. Adding it means changing the type, not adding a row.
Options A (collect payroll and compute), B (collect payroll, gate eligibility
only — recommended) and C (severance stays a flag, which is defensible) are
written up concretely in
[notice-bands-review-pack.md § 3](notice-bands-review-pack.md).

Sourcing caveat carried forward: ss. 63–65 could **not** be quoted from the
consolidated statute — Ontario e-Laws serves statute text through a client-side
app, and `/print`, a version-pinned URL and an XML `Accept` header all return
the same shell. The substance came from ontario.ca's official ESA guide and
needs checking against the statute. (This independently confirms EF2.) (PR #110)

**L9 — Drive template hygiene.** T01, T02 and T04 went to `Legal Review` as
`_polished` drafts in June 2026 and never returned to the `ON/EN` folder, which
is now missing them; and every template in the HR tree exists twice from two
uploads on 2026-06-16. Deliberately deferred by the owner rather than fixed
unilaterally, since it means deleting files. CANONICAL_FACTS § Open items 4–5.

---

## 4. Engineering follow-ups

**EF1 — Done.** _Verified 2026-08-10 with a temporary signed-in beta test user._
`advisor-chat` returned `200`, the reply streamed, and `ai_telemetry_events`
finalized to `completed` with a token count: `deepseek-3.2`, 3,059 prompt /
457 completion / 3,516 total tokens, 3,239 ms latency, `retrieval_failed: false`,
`retrieved_chunks: 4`. The guardrail claim/finalize lifecycle is working end to
end. (PRs #87, #90)

**EF2 — Done.** _Verified 2026-08-10._ The scheduled `monitor-law-changes-daily`
sweep at 07:00 UTC ran the live `monitor-law-changes` edge function and
fetched all 19 pages. `law_page_hashes` for Ontario (`Employment Standards Act,
2000`, `Ontario Human Rights Code`, `Workplace Safety and Insurance Act, 1997`)
and Québec (`Act respecting labour standards (LNT)`, `Charter of Human Rights
and Freedoms (Quebec)`) are all `is_broken = false` with `ontario-api:` and
`quebec-ckan:` fingerprints, and `law_monitor_status()` reports the job
scheduled, secret configured, and last update at 2026-08-10 07:00. This proves
the e-Laws act-versions API and Données Québec CKAN dataset are working sources.
`src/features/app/guidance/monitoringCoverage.ts` and its test were updated:
`COVERAGE_AUDITED_ON` is now `2026-08-10`, and ON/QC are `active` alongside
Federal. The unbuilt follow-ups noted in `LAW_MONITORING.md` remain: per-statute
drill-down into the Québec zip and independent liveness alarms for the two
Ontario health checks beyond the per-fetch verdict. (PRs #105, #106)

**EF3 — Done.** Three follow-ups from the export protection system, all
closed 2026-08-06:

1. **Admin viewer.** Live at `/app/support/admin/exports` — reads
   `export_events` through the `export-audit-trail` edge function
   (service-role, `is_admin`-gated server-side). The table stays
   service-role-only with zero client policies — the edge function is the
   only read path. Supports filtering by surface/kind, pagination, and
   forensic lookup of a single export id (the "resolve a leaked artifact"
   use case). Linked from the support admin dashboard.
2. **Copy button watermarking.** The Advisor chat Copy button now runs
   through `authorizeExport` (`surface='advisor'`, `kind='text'`), so every
   copied message carries an invisible zero-width tag that resolves to an
   `export_events` row. A velocity denial shows the same retry toast as a
   refused document export. On-screen text remains unwatermarked (the analog
   hole); the Copy button is the boundary where content leaves the product.
3. **Signed URLs.** Not applicable — exports are generated client-side as
   Blob downloads, not stored in Supabase Storage. The conditional ("if
   Supabase Storage ever holds real files") is not met.

The audit table's security posture was decided: admin-gated edge function,
not an admin RLS policy. The table never becomes client-readable, even if
`is_admin()` is compromised — the edge function is the only read path.
[EXPORT_PROTECTION.md](EXPORT_PROTECTION.md). (PR #158)

**EF4a — Annual billing needs its Stripe objects and migration 0043.** _Owner._
The code half is done: `create-checkout-session` resolves
`STRIPE_PRICE_*_ANNUAL`, the webhook's price lookup maps the annual ids, and
`getCheckoutProfilePatch` records the real interval instead of hardcoding
`monthly`. Three things outside this repo remain, and annual checkout does not
work until all three land: create the annual Price objects in Stripe (yearly
recurring, charging `ANNUAL_MONTHS_BILLED` = 10 months' worth), set the three
env vars, and **apply migration `0043`** — without it
`profiles.billing_period` may still reject `'annual'`, which would take the
money and lose the entitlement. The function fails closed with a 503 meanwhile,
and `PricingPage`'s annual guard turns that into an intelligible notice; remove
that guard only once this is done. Folded into OA11.

**EF4b — Done.** _Verified 2026-08-10._ The live `profiles_billing_period_check`
allows `monthly` and `annual`:

```sql
profiles_billing_period_check  CHECK ((billing_period = ANY (ARRAY['monthly'::text, 'annual'::text])))
```

No differently-named predecessor check survived. `0043_billing_period_annual.sql`
is applied and the column will accept `'annual'` writes.

**EF6 — Done.** The entry graph was broad because three things rode it: the
`vendor` group carried react-markdown's 157kB parser tree; `messages/index.ts`
split into 25+ tiny chunks that were each modulepreloaded; and `routes.tsx` →
`appViews.tsx` → `ModeGate` → `navConfig` → `@/data` put 113kB of demo HR
fixtures in front of every landing page. 34 preloads → 5, and 1121kB → 850kB
raw. `scripts/check-entry-graph.mjs` now fails the build on a regression,
reading membership from the build's own source maps.

**EF6b — Done.** The router imported `@/seo/routes`, which read every article
and help article to build `allPublicPages()` — it needs slugs, and it was
getting `blogArticles.ts` (89kB), `guideArticles.ts` (111kB) and
`helpCenterData.ts` (32kB) in full. Prose is now split from the records it
hangs off, keyed by English slug, in `blogContent.ts` / `guideContent.ts` /
`helpContent.ts`. Every consumer — `ArticlePage`, `HelpArticlePage`, Help
Centre search, the support first-line helper — is behind a lazy route, so the
imports stay static and prerendering is unchanged.

Entry chunk 248kB → 62kB; eager graph 850kB → 665kB. The move was done with a
codemod copying verbatim source ranges, and verified by comparing every
authored string literal against `git HEAD`: 786 article strings and 76 help
strings, identical. `check-entry-graph.mjs` now bars the three content modules
by name, and parity tests assert the metadata and content key sets match in
both directions per collection.

**EF7 — Done.** The five unmatched legacy templates have been authored into
the doclib catalogue as T47–T50 (the legacy "Onboarding Package (Français)"
was a separate entry only because the prototype shipped the French body for
both languages; the doclib's bilingual `Bi` model handles both in one
template, so T49 covers it). The five are:

- **T47** — Candidate rejection letter (hiring, low risk)
- **T48** — Expense reimbursement policy (policies, low risk)
- **T49** — Onboarding package (hiring, low risk, QC Charter note)
- **T50** — Policy template (policies, low risk, Advisor-tailored shell)

The legacy fixture (`src/data/documents.ts`) still holds the 10 templates that
have doclib matches by tid — they remain as string-key fallbacks for callers
that pass title strings (e.g. `PoliciesView` passes `p.title.en`). The search
corpus now uses the doclib catalogue directly (`allTemplates`), passing tids.
The canonical template count is now **50** (T01…T50). Per
[FOUR_RING_FRAMEWORK.md](FOUR_RING_FRAMEWORK.md), these are legal-adjacent
documents in a compliance product and need review budget — the `review` field
on each is set to `hr_review_required` or `not_reviewed` as appropriate, and
none are marked `approved_for_use`. (PR #159)

**EF8 — Done (engineering half).** Plan gating is now wired into `/app`:
`PlanProvider` is in `AppProviders` (reads the signed-in account's plan from
`profiles`), `PlanGate` enforces plan requirements in production mode, and two
premium features are gated:

1. **Save & export documents** (growth+) — the PDF/Word/Copy-link buttons in
   Document Studio are wrapped in `<PlanGate required="growth">`.
2. **Workspace preview & guidance** (growth+) — `HomeProductionView` is
   wrapped in `<PlanGate required="growth">`.

`PlanGate` respects workspace mode: demo mode bypasses the gate entirely
(the demo experience is the marketing surface — every visitor sees the full
product). Production mode enforces the plan check, with an upgrade nudge
linking to `/pricing?upgrade={required}` when access is denied. Internal
`@dutiva.ca` accounts always bypass via `isAdmin`.

`PAID_PLANS_DISABLED_DURING_BETA` remains `true` — the gates exist and are
wired, but every signed-in beta user resolves to `free` (the webhook never
grants a paid plan), so gates show the upgrade nudge in production mode
without blocking anything in demo mode. The owner action to start selling
is: flip the flag to `false`, apply migration 0043, and create the annual
Stripe price objects (EF8a below). (PR #161)

**EF9 — Ring 2 Pillar B's two design-blocked tools are built; the pattern is
not.** The duty-to-accommodate workflow and the functional-limitations guide
needed a decision-tree runner and a reference-content surface, and both surfaces
now exist (`flows/data/`, `reference/data/`). Nothing is outstanding — this
entry exists so the next tool goes into one of the three established shapes
rather than inventing a fourth.
[FOUR_RING_FRAMEWORK.md](FOUR_RING_FRAMEWORK.md). (PRs #121, #123, #125)

**EF10 — Done.** The raised "Ask" tab on the mobile nav now uses a `Sparkle`
icon, aligning it with the 18+ other Advisor/AI surfaces that use Sparkle
(brief card, advisor home, advisor rail, chat avatar, memory views, doc
studio, topbar, entry stage, etc.). The in-repo advisor chat handoff uses
`sparkFill` for all Advisor touchpoints and `star` only for pinned threads;
the external mobile nav handoff that supposedly specified a star is no
longer accessible, so the inconsistency could not be verified as
intentional. `Star` remains in use for pinned threads (matching the handoff)
and workflow impact indicators. (PR #160)

**EF11 — Workspace entitlement calculators.** _Engineering complete 2026-08-24._
Interactive entitlement tools live as guided flows under `/app/workflows/`
(not as public marketing pages). A **public** termination-notice calculator
that publishes statutory figures remains barred (D6 /
[SEO_AUTHORITY_PLAYBOOK.md](SEO_AUTHORITY_PLAYBOOK.md)).

**Engineering status:** **Done for eng-only work.** Every calculator / tracker
EF11 scoped that can ship without qualified legal sign-off or new org data
model is built and on `main`. Do not treat the items below as a backlog for
unattended eng sprints — they are explicitly blocked.

**Shipped**

| Flow | Route | What it does |
| --- | --- | --- |
| Ontario statutory notice (ESA floor) | `/app/workflows/statutory-notice-ontario` | Tenure band **or** typed completed months → ESA s. 57 floor weeks; T03 |
| Québec termination notice (hedge) | `/app/workflows/statutory-notice-quebec` | Process shape + LNT / CCQ pointers; **no week figures** while L6 keeps `bands: null`; T03 |
| Federal termination notice (hedge) | `/app/workflows/statutory-notice-federal` | Process shape + CLC Part III pointers; **no week figures**; T03 |
| Ontario ESA severance eligibility | `/app/workflows/severance-eligibility-ontario` | Option B gate; points at amount workflow when gates met; T03 |
| Ontario ESA severance amount | `/app/workflows/severance-amount-ontario` | Option A formula from user-entered tenure + weekly wages (26-week cap); T03 |
| ROE filing checklist | `/app/workflows/roe-filing-checklist` | Interruption → gather → file; employer records deadline; T29 |
| Temporary layoff awareness | `/app/workflows/temporary-layoff-awareness` | Contract + statute-cap shape; T32 |
| Leave return tracker | `/app/workflows/leave-return-tracker` | Return prep / restore / contested path; no invented leave lengths; T27 |

Building blocks: `statutoryNotice.ts` lookup, `ontarioEsaSeverance.ts` formula,
FlowRunner `input` + `formula` step kinds, Document Studio handoffs, Disclaimer.

**Blocked — not eng-completable alone**

| Item | Blocker | Unblock |
| --- | --- | --- |
| **QC / FED numeric notice ladders** (`NOTICE_SCHEDULES` bands) | L6 — interim decision keeps `bands: null` ([notice-bands-decision.md](notice-bands-decision.md)); research pack is ready but unsigned | Qualified legal reviewer marks **Yes** on pack §4; eng populates tables + tests in the same PR |
| **Org-stored global payroll + mass-termination count** | Product / data — Option A amount flow uses self-reported eligibility confirmation and wages today; auto-filling the $2.5M / 50-employee gates needs org settings + a termination ledger the product does not yet own (review pack §3) | Product decision to add org payroll field and how to count closures; then eng wires eligibility to those sources |

Hedge QC/FED notice flows stay the correct fail-safe until ladders are signed.
Do not “finish” L6 by inventing week figures in workflows or on `/tools/*`.

Non-negotiables unchanged: bilingual `{en,fr}`; standing `Disclaimer` on the
runner; grounded tables only; floors are floors not common-law advice; do not
put figure-emitting tools on `/tools/*`.

---

## 5. Verification and hygiene

**V1 — Done.** `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` are now set
as repository secrets, so `check:migrations` compares the repo against the
live project instead of skipping. The first full run after the secrets were
fixed (run `31421301817`) was green. Applying the missing migrations and the
`0073` name repair turned up more backlog than just `0068/0069/0070`; the full
set applied was `0032`, `0039–0041`, `0043`, `0068–0072`, plus a metadata
repair for the already-applied `0073`. `check-migrations: OK` is now the
normal state.

---

## Recently closed — do not re-open

Sweeping 132 PR bodies turns up items that read as open in one PR and were
closed two PRs later. These are settled; the note is here so the next sweep
does not resurrect them.

| Item                                                                              | Closed by                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EF6a — split the message catalogue by surface, and guard `t()`'s surface boundary | Catalogue source split into `workspace.ts`/`marketing.ts`/`shared.ts`; `vite.config.ts`'s `messages-workspace` group needed `includeDependenciesRecursively: false` to actually stop riding into the eager graph (671.3kB → 539.9kB, -131.4kB) — see that file's comment for the rolldown mechanism. `t()` itself is still typed `MessageKey`, not per-surface — `scripts/check-message-scopes.mjs` (`npm run check`) guards the same boundary a different way, by scanning every literal `t('key')` call against its file's surface, instead of retyping ~140 call sites for an equivalent guarantee. A _computed_ key (`t(someVariable)`) is invisible to this script by construction, same as it always was — those are guarded at the data structure that carries the key (`plans.ts`, `legalHubData.ts`, etc.), which was already typed. |
| D3 — scheduled-call booking calendar decision                                     | Decided 2026-08-06 (Google Calendar, full loop) and built the same day. **Revised 2026-08-07: calendar sync is off and staying off** — the org's `iam.disableServiceAccountKeyCreation` policy blocks the key, and weakening it was not worth one calendar invite. Propose/confirm works without it; see OA12. [SUPPORT_CALL_SCHEDULING.md](SUPPORT_CALL_SCHEDULING.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| D1 — law-change notifications' five open questions                                | Decided 2026-08-06 (internal-only, weekly, org jurisdiction wins, human review required) and built the same day — see OA13 for what's left to deploy it. [LAW_CHANGE_NOTIFICATIONS.md](LAW_CHANGE_NOTIFICATIONS.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| EF5 — `inferCheckoutPrice`'s dead branch                                          | Deleted; server-set metadata is the checkout path's documented single source                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| L1 — primary sources "unreachable"                                                | Not a network block — a bot filter on the fetching tool; run from a workstation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| L2 — WI1 federal leaves omission                                                  | Pregnancy loss leave confirmed and added; "placement of a child" **does not exist**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| L3 — WI3 Ontario minimum wage                                                     | All four Oct-2026 special-category rates verified twice and added                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| L4 — WI2 CNESST URL normalization                                                 | SHORT form is canonical (301 trace); fixed per-URL, never by prefix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| V2 — `0021`'s "not yet applied" banner                                            | Both conditions had lapsed; banner rewritten with the real state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| V3 — was PR #101's crisis framing lost?                                           | Not lost. Every change is on `main` as `214f0eb`; verified line by line                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Annual toggle advertised an unbuyable price                                       | #96 — hidden while paid plans are disabled                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| CASL consent not recorded at signup                                               | #109 — `0037_beta_signups_consent_record`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `scan_status` documented an intention                                             | #115 — `support-attachment-scan` and the release rules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Support entry-point sweep, CAPTCHA                                                | #115                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `/blog` and `/guides` cards linked nowhere                                        | #113 — twelve bilingual article pages                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| French corpus body missing on 40 rows                                             | #99 / `0032` — `content_fr` non-null on 42/42                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| "Regenerate with `generate-doclib.mjs`"                                           | #128 — the generator does not run; headers now say hand-maintained                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Rings 2, 3 and 4 listed as roadmap                                                | #121–#131 — all four rings complete                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| AI usage unmetered during an open beta                                            | #90 / #91 — guardrails live 2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Client error reporting inert                                                      | #92 — `0019` applied, `report-error` deployed (but see OA6)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| L1a — corpus tranche migration unapplied                                          | Applied `0042` 2026-08-05 via direct DB access; retrieval smoke test passing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| L1b — four federal leaves unauthored                                              | Added in `0044` 2026-08-05: court/jury duty, reserve force, work-related illness/injury, maternity-related reassignment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Advisor Memory persistence (facts, audit, chat injection, case narratives)        | #196–#199 — `hr_advisor_memory_facts` / audit (`0086`), case narratives + timeline (`0087`), production Memory surfaces, `advisor-chat` injects confirmed facts and auto-extracts inferred candidates (fence + heuristic fallback); workspace shows “Memory used”; gold in-answer highlights; PIPEDA export + retention rail. Remaining: L5 corpus review, OA9 residency.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| L8a / L8b — business phone + CIPO objection                                       | Founder 2026-08-23 — phone confirmed; CIPO pre-assessment objection addressed. Application 2465617 is still not a registration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

---

## Keeping this current

The convention that produced this list is worth keeping: **every PR says what it
did not do.** This file is where those notes accumulate.

- Closing an item means deleting its entry, not striking it through — and moving
  it to "Recently closed" only if a future session would plausibly re-raise it.
- Opening one means adding it with the same shape: what, why it is open, where
  the authority lives, and which PR left it.
- An item that names a secret, a dashboard or a filing is an **Owner** item.
  Piling those into an engineering backlog is how they stay open for months.
