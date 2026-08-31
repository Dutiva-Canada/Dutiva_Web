# Founder support runbook

A practical guide for operating Dutiva support solo, in structured review
periods rather than continuous interruption. Config lives in
[`src/config/support.ts`](../src/config/support.ts); see
[`SUPPORT_ARCHITECTURE.md`](./SUPPORT_ARCHITECTURE.md) for the system design.

> Golden rule: **never collect unnecessary HR information.** If a ticket needs
> employee records, medical information, investigation evidence, or confidential
> workplace files, do **not** ask for them in the ticket thread — reply that
> Dutiva will provide secure instructions, and arrange a secure channel.

## Daily rhythm (suggested)

- **Immediate** (out-of-band alert): critical security reports, widespread
  access failures, confirmed outages.
- **Once or twice a day**: triage new tickets, answer standard/high items.
- **Weekly**: low-priority feedback and feature requests; review waiting-on-
  customer tickets for follow-up or closure.

## Triage a ticket

1. Read the request. Confirm the **category** is right (re-categorize if needed).
2. Set **priority** from real impact, not the customer's wording. The form
   suggests a priority (never `critical`); you confirm or adjust. Reserve
   `critical` for a confirmed/credible platform outage, active security
   incident, widespread auth failure, severe data-access issue, or time-
   sensitive privacy incident.
3. Move status `new → triaged`, then `in_progress`. Use `waiting_on_customer`
   when you need more from them and `waiting_on_dutiva` when the ball is yours.
4. Aim for the **initial-response target** (4 business hours / 1 / 2 / 5 business
   days). These are response targets, not resolution promises.

## Priority quick reference

| Priority | Use when                                                                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | Outage, active security incident, widespread auth failure, severe data-access issue, time-sensitive privacy incident                                           |
| High     | Customer can't access an essential account/workflow; billing interrupting service; significant accessibility barrier; major feature failure without workaround |
| Standard | Isolated defect, product question, billing clarification, general issue                                                                                        |
| Low      | Feature request, general feedback, non-urgent docs suggestion                                                                                                  |

## When to schedule a call

Only when the issue **cannot reasonably be resolved in writing** — complex
account recovery, accessibility accommodation, serious security concern,
escalated billing dispute, enterprise onboarding, or a sensitive complaint.
Requirements before a call: an existing ticket, initial written triage, identity
verification if account details will be discussed, and a scheduled appointment.
There is **no "call us now"** flow, and no general inbound number.

Propose up to 3 candidate times from the admin ticket view; the customer
confirms one from their own ticket, and — once
[SUPPORT_CALL_SCHEDULING.md](SUPPORT_CALL_SCHEDULING.md)'s owner setup is
done — a calendar event with a Meet link is created automatically. Until
then, propose/confirm still work; there's just no calendar invite, and
you'll see a note on the ticket saying so.

## Document a call

After every call, add a **written summary** to the ticket (a `customer`-visible
message plus an internal note if needed), set status back to the appropriate
written state, and record any commitments. The written ticket is the record.

## Handle a privacy request

Privacy requests (`privacy@dutiva.ca`) are **not** ordinary tickets. Do not treat
them as product support. Confirm the request type (access / correction /
deletion / consent withdrawal / complaint / question), note that identity
verification may be required, and follow the Privacy Request Procedure. Never
collect identity documents through the ordinary form.

## Handle a security report

Security reports (`security@dutiva.ca`) get **restricted visibility** and higher
triage priority. Keep details out of ordinary analytics. Ask for a factual
description, affected URL/feature, safe reproduction steps, and impact. Do not
ask for weaponized exploit details. Remind reporters not to access other
customers' data or disrupt service. There is no bug bounty unless one is
formally established.

## Handle an accessibility request

Accessibility feedback (`accessibility@dutiva.ca`) is available to everyone and
must not sit behind a paywall or authentication. If the customer asks for an
alternative communication method (including telephone or video) as an
accommodation, arrange it — the web form is never the only path.

## Handle a complaint

Acknowledge complaints **separately** from routine product tickets, in a calm,
non-adversarial tone. Capture the nature of the complaint, desired resolution,
relevant dates, language, and accessibility needs. Escalate to a scheduled call
only if written communication is unsuitable.

## Close a ticket

Confirm the resolution is written in the ticket, move to `resolved`, then
`closed` after any waiting period. Optionally invite feedback. Set
`retention_review_at` per the (review-pending) retention schedule.

## Email notifications (turning on the send worker)

The outbox and the `support-notify` worker are **built and deployed**, but email
is **off until configured** — until then, acknowledgements and alerts accumulate
as `pending` in `support_notifications` and nothing is sent. Enabling it flushes
the backlog, so no acknowledgement is lost.

To turn it on:

1. **Verify a sending domain** in Resend (SPF/DKIM) so mail from
   `@dutiva.ca` is deliverable.
2. **Set the function secrets** (Supabase → Edge Functions → `support-notify` →
   Secrets, or `supabase secrets set`):
   - `RESEND_API_KEY` — the Resend API key. (`SUPPORT_EMAIL_PROVIDER_API_KEY`
     also works — it's the provider-agnostic fallback name.)
   - `SUPPORT_EMAIL_FROM` — e.g. `Dutiva Support <support@dutiva.ca>` (must be on
     the verified domain).
   - `SUPPORT_NOTIFY_SECRET` — a long random string. **Required**: with a
     provider key set but no secret, the worker refuses to run (403) so the drain
     endpoint is never open.
   - Optional: `SITE_URL` (ticket links; defaults to `https://dutiva.ca`),
     `SUPPORT_OPERATOR_EMAIL` (operator-alert recipient).
3. **Schedule it** every minute or two via pg_cron + pg_net (store the secret in
   Vault, never inline):

   ```sql
   select cron.schedule('support-notify-drain', '* * * * *', $$
     select net.http_post(
       url     := 'https://<project-ref>.supabase.co/functions/v1/support-notify',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'apikey', '<publishable-key>',
         'x-notify-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'support_notify_secret')
       ),
       body := '{}'::jsonb
     );
   $$);
   ```

4. **Verify**: create a test ticket, then invoke once manually and confirm a
   `sent` count:

   ```bash
   curl -X POST 'https://<project-ref>.supabase.co/functions/v1/support-notify' \
     -H 'apikey: <publishable-key>' -H 'x-notify-secret: <secret>' -d '{}'
   ```

**Signup alerts** (`beta_signup`, `beta_confirmation`, `account_signup`,
`plan_signup`) share this outbox. Migration `0093_all_plan_signup_notifications`
widens the kind CHECK and extends `handle_new_user()` so a free/auth signup
enqueues `account_signup`. `create-beta-signup` already enqueues the beta pair;
`stripe-webhook` enqueues `plan_signup` after a successful
`checkout.session.completed` profile write. If an old worker marked a signup
kind `failed` because it lacked those templates, re-queue only those rows
(`status='pending'`, `attempts=0`) after deploying the current `support-notify`.

**Monitoring:** rows stuck `pending` with a rising `attempts`/`last_error` mean a
provider problem (bad key, unverified domain); a row hits `failed` after 5
attempts. Query `support_notifications` (admin-read) to inspect. Re-queue a
`failed` row by resetting `status='pending'`, `attempts=0`.

**`sent` does not mean delivered.** It means Resend accepted the message; a
bounce lands minutes later. Check the provider's verdict instead:

```sql
select kind, recipient, status, delivery_status, delivery_detail
from support_notifications
where delivery_status in ('bounced', 'complained');
```

To populate that, add the delivery webhook (one-time):

1. Resend → **Webhooks → Add Endpoint** →
   `https://<project-ref>.supabase.co/functions/v1/resend-webhook`
2. Subscribe to `email.delivered`, `email.bounced`, `email.complained`,
   `email.delivery_delayed`.
3. Copy the **signing secret** (`whsec_…`) and set it as the
   `RESEND_WEBHOOK_SECRET` edge-function secret.

Until that secret is set the webhook returns `503` and rejects everything —
deliberately. It never accepts an unsigned event.

**Role mailboxes must exist.** Every address in `src/config/support.ts`
(`support@`, `privacy@`, `security@`, `accessibility@`, `billing@`, `sales@`)
is published in the legal pages and Help Centre, and `support@` is both the
operator-alert recipient and the `From:` address customers reply to. If one
doesn't exist in Google Workspace, its mail bounces silently — create them as
aliases or groups.

## CAPTCHA on the public intake (turning it on)

The public Contact form is protected by a honeypot and per-IP/per-email rate
limits. Both are defeated by a script that rotates addresses and IPs, so the
CAPTCHA is the layer that actually costs an attacker something. It is **built
and inert**: with no secret set, `create-public-support-ticket` skips the check
entirely and the form behaves exactly as it does today.

**Set both keys together.** The secret is server-side; the site key is public
and is baked into the client bundle at build time. With the secret set but no
site key deployed, every real customer is turned away with a 403 — the form has
no token to send.

1. Create a **Cloudflare Turnstile** widget (or an hCaptcha site) for
   `dutiva.ca`. Both work; they share one verification API.
2. **Edge-function secret** (Supabase → Edge Functions → Secrets):
   - `CAPTCHA_SECRET_KEY` — the widget's secret key.
   - `CAPTCHA_PROVIDER` — `turnstile` (default) or `hcaptcha`.
3. **Build-time client vars** (Vercel → Environment Variables), then redeploy —
   these are compiled in, so a secret rotation without a redeploy breaks the form:
   - `VITE_CAPTCHA_SITE_KEY` — the public site key.
   - `VITE_CAPTCHA_PROVIDER` — must match `CAPTCHA_PROVIDER`.
4. **Verify** on `/contact`: the widget renders above the send button, and a
   request submitted normally still returns a `DUT-…` reference. Then confirm
   the gate is live by posting without a token — it must be refused:

   ```bash
   curl -i -X POST 'https://<project-ref>.supabase.co/functions/v1/create-public-support-ticket' \
     -H 'apikey: <publishable-key>' -H 'Content-Type: application/json' \
     -d '{"category":"product_question","email":"you@example.ca","subject":"t","description":"t","consent":true}'
   # expect: HTTP/2 403  {"error":"Human verification failed…","code":"missing_token"}
   ```

A 403 with `"code":"bad_secret"` means the secret is wrong or the provider
setting doesn't match the widget — not that a bot is calling.

**Turning it off** is removing `CAPTCHA_SECRET_KEY`: verification stops, the
honeypot and rate limits stay. Drop `VITE_CAPTCHA_SITE_KEY` and redeploy too, or
customers keep solving a challenge nothing checks.

## Attachment malware scanning (turning it on)

`support_attachments.scan_status` has read `pending` on every row since the
table shipped, because nothing flipped it. The `support-attachment-scan` worker
(migration `0038`) is what makes it mean something. Until a scanner is
configured it is a **safe no-op**: rows stay `pending`, downloads are unaffected,
and turning it on later scans the backlog rather than blessing it.

1. **Stand up a scan endpoint.** One is in this repo, ready to deploy:
   [`services/attachment-scanner`](../services/attachment-scanner/README.md) —
   ClamAV plus a dependency-free Node service, sized for a Canadian region so
   customer HR files are not shipped to a third-party scanner. Needs a **2 GB**
   instance; clamd holds the signature database in RAM and is OOM-killed below
   that. It receives:

   ```json
   {
     "url": "<5-minute signed URL>",
     "file_name": "…",
     "mime_type": "…",
     "size_bytes": 1234,
     "reference": "<attachment id>"
   }
   ```

   and must answer `{"status":"clean"|"infected"|"unsupported"}`. The boolean
   shapes (`{"infected":true}`, `{"clean":true}`) and a bare `OK`/`FOUND` body
   are accepted too. **Anything unrecognised counts as "not scanned", never as
   clean** — it is retried up to 5 times and then settles on `skipped`.

2. **Edge-function secrets**:
   - `SUPPORT_ATTACHMENT_SCAN_URL` — the endpoint. Setting this is what arms
     both the worker _and_ the download gate.
   - `SUPPORT_ATTACHMENT_SCAN_KEY` — sent as `Authorization: Bearer`.
3. **Apply `0038` and `0048`**, and **deploy `support-attachment-scan`**. No
   Vault step of its own: since `0048` the cron job authenticates with
   `x-scan-secret` drawn from the existing `support_notify_secret`, the same
   credential `support-notify-drain` uses. If that secret exists, the job is
   already armed.

   > `0038` originally had the job present the service-role key from a
   > `attachment_scan_service_key` Vault secret. That never worked: this
   > function is the one that compares the bearer to its own
   > `SUPABASE_SERVICE_ROLE_KEY`, and the _legacy_ service_role JWT is a valid
   > credential that is not the same string the edge runtime injects — so every
   > run 403'd while `attachment_scan_status()` cheerfully reported
   > `secret_configured: true`. Verified and fixed 2026-08-06. That Vault key is
   > now unused; it is left in place rather than dropped.

4. **Verify** — one query answers "is this actually running?":

   ```sql
   select * from public.attachment_scan_status();
   ```

   `secret_configured` and `job_scheduled` both true, `pending_count` falling,
   `last_scanned_at` recent. Upload a test attachment to a ticket and watch it
   go `pending → clean`.

   `attachment_scan_status()` cannot see an HTTP failure, so confirm the call
   itself is landing at least once — this is what would have caught the 403:

   ```sql
   select public.trigger_attachment_scan();
   -- wait ~5s, then:
   select status_code, content from net._http_response order by id desc limit 5;
   ```

   Expect `200` with `{"processed":…,"pending":…}` — or
   `{"note":"no_scanner"}` while `SUPPORT_ATTACHMENT_SCAN_URL` is unset.

**Once scanning is on, downloads are gated.** `support-attachment-action`
refuses to sign anything that has not come back `clean` (HTTP 423) — including
`skipped`, which means "never established as safe". A `flagged` file is refused
**unconditionally and for admins too**, and stays refused even if the scan URL is
later removed.

**A flagged object is not deleted.** The bytes stay in the bucket so they can be
handed to an incident responder; destroying the only copy of the evidence is not
the worker's call. To retrieve one deliberately, sign it with service-role
tooling outside the app. Find them with:

```sql
select a.id, a.file_name, a.scan_detail, a.scanned_at, t.public_reference
from support_attachments a join support_tickets t on t.id = a.ticket_id
where a.scan_status = 'flagged';
```

Rows stuck `pending` with `scan_attempts` climbing mean the endpoint is
unreachable or answering in a shape the worker doesn't recognise; `scan_detail`
records which (`timeout`, `scanner_unreachable`, `http_502`).

## After changing an RLS policy or a helper function

```sql
select * from public.rls_grant_gaps();
```

**Zero rows is healthy.** Any row names a table whose policy calls a function
`authenticated` cannot execute — which makes that table raise

```text
ERROR: 42501: permission denied for function <name>
```

for every signed-in read, instead of filtering rows. Not an empty result: a
hard error the client surfaces as "couldn't load".

Worth running because this is not hypothetical. On 2026-08-06 `is_admin`,
`is_org_member` and `is_org_admin` — used by policies on 71, 46 and 13 tables —
had no `EXECUTE` grant to `authenticated`, and most of the workspace was
failing this way. `npm run check` was fully green throughout: the suite is
offline by design, so nothing in 1,600 tests can perform a signed-in read of a
policy-protected table. Fixed in migration `0050`; this check exists so the
next one is found in a second rather than by a user hitting a red box.

Postgres evaluates a policy as the **querying** role, so any function named in
a `USING` clause needs `grant execute … to authenticated`. Adding a policy that
calls a new helper is the moment to re-run this.

## Never do

- Never publish or imply 24/7 staffed support.
- Never offer routine inbound phone support or expose a personal number/email.
- Never let AI close privacy, security, accessibility, billing-dispute,
  complaint, or account-recovery matters without your review.
- Never request unnecessary HR/employee personal information in a ticket.
