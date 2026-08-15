# Customer support architecture

Dutiva runs a **digital-first** support model: self-service and asynchronous by
default, with scheduled telephone/video reserved for exceptional cases. There is
no routine inbound phone channel and no 24/7 staffed support.

Customer journey:

> Help Centre / contextual guidance → support request → automated
> acknowledgement → triage → written resolution → scheduled call only when
> required → written ticket summary → closure and optional feedback

This document describes the **foundation** that is implemented today and the
integration points staged for later phases. Legal/CX wording in the support
policy and messages is **flagged for human review**.

## What is implemented (Phase 1)

| Area | Location |
| --- | --- |
| Centralized config (channels, hours, targets, priority, status, categories, escalation) | [`src/config/support.ts`](../src/config/support.ts) |
| Triage logic (suggested priority, Ontario business calendar, response due dates) | [`src/features/support/triage.ts`](../src/features/support/triage.ts) + `triage.test.ts` |
| Bilingual support prose (approved policy + sensitive-info + diagnostics + ack) | [`src/i18n/messages/support.ts`](../src/i18n/messages/support.ts) |
| Public Customer Support Policy (EN/FR, approved wording) | `src/features/marketing/legal/content/support-policy.{en,fr}.ts` → `/legal/support-policy`, `/fr/juridique/politique-soutien` |
| Ticket data model + RLS + private attachments bucket | [`supabase/migrations/0014_support_system.sql`](../supabase/migrations/0014_support_system.sql) |

The config is the **single source of truth**. Support email addresses,
business hours, and response targets are defined only in `src/config/support.ts`
and must never be duplicated inline in components.

## Support channels

Sourced from `SUPPORT_CHANNELS` — never hard-code an address:

| Channel | Address | Public intake | Restricted handling |
| --- | --- | --- | --- |
| Support | <support@dutiva.ca> | yes | no |
| Billing | <billing@dutiva.ca> | no (prefers authenticated) | no |
| Privacy | <privacy@dutiva.ca> | yes | yes |
| Security | <security@dutiva.ca> | yes | yes |
| Accessibility | <accessibility@dutiva.ca> | yes | yes |
| Sales | <sales@dutiva.ca> | yes | no |

No personal founder email or phone number is exposed anywhere.

## Priority & response targets

Priority is `critical | high | standard | low`. Customers describe **impact** and
**urgency**; `suggestPriority()` derives an initial priority and is **capped at
`high`** — `critical` is only ever set by a human in triage. Published
initial-response targets (service targets, not guarantees, not resolution times):

| Priority | Initial-response target |
| --- | --- |
| Critical | within 4 business hours |
| High | within 1 business day |
| Standard | within 2 business days |
| Low | within 5 business days |

Business days exclude weekends and **Ontario statutory holidays** (9 holidays,
computed per year including Good Friday via the Gregorian computus). Business
hours: Mon–Fri 09:00–17:00 America/Toronto.

Phase-1 triage simplifications, refined with the scheduling work: dates are
treated as UTC calendar dates (callers pass an ET-normalized day); only nominal
statutory dates are modelled (no observed/substitute day when a fixed holiday
falls on a weekend); and due dates are date-granular (no end-of-business-hours
clock time). None affect the published targets, only edge-of-day/edge-of-year
precision.

## Ticket status lifecycle

`new → triaged → in_progress → waiting_on_customer → waiting_on_dutiva →
scheduled_call → resolved → closed`. Customer-facing labels are bilingual
(`STATUS_LABELS`).

## Data model & RLS

Six tables, all with RLS enabled (migration `0014`):

- `support_tickets` — UUID `id`, human-readable `public_reference` (`DUT-YYYY-NNNNNN`
  via `support_ticket_ref_seq` + trigger), category/status/priority/impact/urgency,
  language, preferred response method, source, `restricted` flag, escalation
  fields, `first_response_at`/`resolved_at`/`closed_at`, `retention_review_at`.
- `support_messages` — customer/agent/system messages; `is_internal_note` for
  founder-only notes separate from customer-visible replies.
- `support_attachments` — **metadata only** (never base64); points at the private
  `support-attachments` storage bucket; `scan_status` is the malware-scan hook.
- `support_ticket_events` — audit trail (admin-read only).
- `support_ticket_assignments` — assignment history (admin-read only).
- `support_ticket_feedback` — "Was this helpful?" / closure feedback.

**RLS summary** (helpers `is_admin(uuid)`, `is_org_member(org, uuid)`):

- A ticket is readable by its `requester_user_id`, by members of its
  `workspace_id`, or by an admin. Nothing else.
- Messages: readable on a visible ticket; internal notes only for admins. A
  requester may INSERT a non-internal `customer` reply to their own ticket.
- Attachments/feedback: scoped to a visible ticket; requester may leave feedback
  on their own ticket.
- Events/assignments: **admin-read only**.
- **All ticket creation, triage, status changes, priority assignment, and
  internal notes go through the service-role edge function** (Phase 2) and
  bypass RLS. No authenticated INSERT policy on `support_tickets` exists, so the
  browser cannot forge tickets or spoof `workspace_id`.
- Storage: objects are namespaced `<uid>/<ticket>/<file>`; authenticated users
  may read/write/delete **only under their own uid prefix**. The bucket is
  private (`public = false`) with a 25 MB size limit and a MIME allowlist that
  **excludes executables**. Downloads use short-lived signed URLs.

**Attachments** ([`support-attachment-action`](../supabase/functions/support-attachment-action/index.ts),
deployed): the browser uploads a file straight to the bucket under its own
`<uid>/<ticket>/` prefix (storage RLS permits nothing else), then the function
records the metadata with the service role after re-validating owner + path +
MIME + size — there is no authenticated INSERT policy on `support_attachments`,
so that's the only way a row lands, and an orphaned object is removed if
recording fails. Reads go through a `sign` action that access-checks the caller
(requester / admin / non-restricted workspace member) and mints a 60-second
signed URL. Client:
[`attachmentsApi.ts`](../src/features/support/attachmentsApi.ts) +
[`SupportAttachments.tsx`](../src/features/support/SupportAttachments.tsx), on the
customer thread (upload while open) and the admin view. `scan_status` starts
`pending` and is flipped by the `support-attachment-scan` worker (see
*Attachment malware scanning* below), which also gates the `sign` action. The
**public** intake carries no attachments by design (unauthenticated users can't
write to the bucket).

**Rollback** is documented at the top of the migration file (drop tables in
reverse dependency order, drop the helper functions/sequence, delete the bucket).

## Environment variables

Phase 1 introduces **no new required env vars** — config is code and the
migration is applied. The following are **future** vars for later phases,
documented now in `.env.example`:

- `SUPPORT_EMAIL_PROVIDER_API_KEY` — transactional email (no provider is wired
  yet; an abstraction is the Phase 2 integration point).
- `SUPPORT_INBOUND_WEBHOOK_SECRET` — verifying inbound email→ticket webhooks.
- `STATUS_PAGE_API_URL` — public status provider feed (branded route consumes it).

These are **live** vars — set them and behaviour changes (see the runbook):

- `SUPPORT_ATTACHMENT_SCAN_URL` / `SUPPORT_ATTACHMENT_SCAN_KEY` — the malware-scan
  endpoint. Setting the URL arms both the worker and the download gate.
- `CAPTCHA_SECRET_KEY` / `CAPTCHA_PROVIDER` — server-side CAPTCHA verification,
  paired with the build-time `VITE_CAPTCHA_SITE_KEY` / `VITE_CAPTCHA_PROVIDER`.
  Set the server and client halves together.

## Retention

Every retention-sensitive table carries a `retention_review_at` column. Final
retention durations are **flagged for privacy/legal review** and configured, not
hard-coded — deletion/anonymization workflows are a Phase 2 edge-function job.

## Email & notifications

Notifications use an **outbox**: the edge functions enqueue a row into
`support_notifications` on each event (customer acknowledgement + operator alert
on ticket creation; a customer notification on an agent reply). A **future send
worker** drains `pending` rows, renders the template, sends via the configured
provider, and marks them `sent`/`failed`. Decoupling this way means a missing
email provider never blocks ticket creation, and the outbox stores **nothing
sensitive** — only the public reference and category (never the body or PII).

- Templates: [`src/features/support/email/templates.ts`](../src/features/support/email/templates.ts)
  — 11 bilingual customer templates + an operator alert, pure and unit-tested.
  **Rules enforced:** subjects carry only the reference (never body/PII); bodies
  link back to the authenticated ticket (a secure link) and reuse the approved
  no-secrets / resolution-varies copy.
- Rules: [`notifications.ts`](../src/features/support/email/notifications.ts) —
  `acknowledgementKind` (category → ack), `operatorChannel` (immediate for
  security or high/critical, else digest), and the reminder-rule catalogue for
  the scheduler. The edge functions mirror the first two.
- Provider seam: [`emailService.ts`](../src/features/support/email/emailService.ts)
  — an `EmailProvider` interface; delivery no-ops (logs) when no provider is set.
  [`resendProvider.ts`](../src/features/support/email/resendProvider.ts) is the
  tested reference adapter (Resend request shape + error handling).
- Send worker: [`supabase/functions/support-notify`](../supabase/functions/support-notify/index.ts)
  — **deployed**, scheduled every minute via pg_cron (the job reads its
  `x-notify-secret` from Supabase Vault, so the secret is never inline in
  `cron.job.command`). Drains up to 50 `pending` rows per run, renders the
  bilingual email, sends via Resend, and marks each row `sent`/`failed` (up to 5
  attempts, then `failed`).

**`sent` is not `delivered`.** `status` records what *we* did — the provider
accepted the message. A bounce comes back asynchronously minutes later. This bit
us for real on 2026-07-16: an operator alert to a non-existent `support@dutiva.ca`
mailbox was marked `sent`, then bounced, and nothing in the database knew. So:

- `support_notify` stores Resend's `provider_message_id` on each row.
- [`resend-webhook`](../supabase/functions/resend-webhook/index.ts) (**deployed**)
  receives `email.delivered` / `bounced` / `complained` / `delivery_delayed` and
  writes `delivery_status` + `delivery_detail` against that id (migration `0018`).
- The endpoint is public, so the **Svix signature is the authentication** —
  otherwise anyone could forge `delivered` events and mask real bounces. It
  **fails closed**: no `RESEND_WEBHOOK_SECRET` ⇒ `503`, never accept-unsigned.
  The verification is unit-tested against the published Svix vector in
  [`svixSignature.ts`](../src/features/support/email/svixSignature.ts) and
  mirrored in the function; it rejects replays via a 5-minute timestamp window.

To find undelivered mail: `select * from support_notifications where
delivery_status in ('bounced','complained')`. It mirrors `templates.ts` / `resendProvider.ts` / the
  `src/config/support.ts` labels (kept in sync the same way `suggestPriority`
  is). No sensitive content ever goes in a subject; customer emails link back to
  the authenticated ticket, operator alerts to the admin ticket view.

**Turning email on** (operator steps — see the runbook): the mechanism is built
and deployed; it is inert until configured. (1) Verify a sending domain in
Resend and set `RESEND_API_KEY` (or the agnostic
`SUPPORT_EMAIL_PROVIDER_API_KEY`) + `SUPPORT_EMAIL_FROM`. (2) Set
`SUPPORT_NOTIFY_SECRET` — the worker **fails closed** (403) if a provider key is
set without it, so the drain endpoint is never unauthenticated. (3) Schedule the
worker (pg_cron → the function, passing `x-notify-secret`). Until then the worker
is a safe no-op (`{ note: 'no_provider' }`) and notifications accumulate as
`pending`, so enabling it flushes the backlog rather than dropping anything.
`SUPPORT_OPERATOR_EMAIL` sets the operator-alert recipient (defaults to
`support@dutiva.ca`).

## Help Centre

The public, unauthenticated self-service layer (`/help`, `/fr/aide`) — the first
step of the customer journey before a written request. It lives in the marketing
surface alongside the legal hub and is fully prerendered/indexable in both
locales.

- Content: [`src/features/support/help/helpCenterData.ts`](../src/features/support/help/helpCenterData.ts)
  — six topic categories and bilingual `Bi` articles (product-accurate, never
  legal advice; compliance specifics defer to the legal documents). Pure data,
  so search and the SEO registry consume it directly.
- Search: [`helpSearch.ts`](../src/features/support/help/helpSearch.ts) —
  client-side, accent- and case-insensitive, AND-across-terms, ranked
  title > summary > body. The set is small and bundled, so no index is needed.
- Feedback: [`helpFeedback.ts`](../src/features/support/help/helpFeedback.ts) +
  [`HelpfulnessWidget.tsx`](../src/features/support/help/HelpfulnessWidget.tsx)
  — "Was this article helpful?" stored locally so a returning reader isn't
  re-asked. **Nothing is transmitted** — privacy-conscious analytics is a later
  phase; `recordHelpfulness` is the single seam a future sink would hook.
- Pages: `HelpCenterPage` (hero + live search + browse-by-topic + contact CTA)
  and `HelpArticlePage` (article, feedback widget, related links, contact CTA).
  Both register in the SEO route table (`help` id + `helpDoc:<slug>` dynamic
  pages) so the sitemap, hreflang, and language toggle stay in sync. Entry point:
  the marketing footer's Resources column.

## Public intake (unauthenticated)

The signed-out path — so the flows that must never sit behind a login
(accessibility feedback, privacy requests, security reports) are reachable by
anyone, alongside general product/sales questions.

- Page: `ContactPage` at `/contact` · `/fr/contact` (marketing surface,
  indexable). A `?topic=security|privacy|accessibility|product|sales` deep link
  preselects the category. Entry points: the footer's **Contact** link and the
  Help Centre's contact CTA.
- Form: [`PublicSupportForm`](../src/features/support/PublicSupportForm.tsx) —
  collects an email (no account), offers **only the `allowPublic` categories**,
  carries no diagnostics/workspace context, includes a honeypot, and shows the
  same category-aware notices as the in-app form.
- Function: [`create-public-support-ticket`](../supabase/functions/create-public-support-ticket/index.ts)
  (**deployed**, `verify_jwt` off). Accepts only public categories, re-validates
  everything, assigns priority (capped at `high`), flags `restricted`, writes the
  ticket with the service role (`requester_user_id = null` → admin-only under
  RLS), and enqueues the same acknowledgement + operator-alert notifications.
- Anti-abuse: a honeypot; per-IP (3 / 15 min) and per-email (3 / 60 min) rate
  limits backed by `support_public_intake` (migration `0016`), which stores
  **only salted hashes** (`PUBLIC_INTAKE_SALT`) — never the raw IP or email;
  and a CAPTCHA once configured (see *Anti-abuse on the public intake* below).

An anonymous requester can't sign in to read the ticket, so updates go by email;
account/billing issues are steered to sign-in (those categories aren't public).

## Done so far

Foundation (config, policy, data model + RLS), authenticated request flow +
ticket loop, founder dashboard, email templates + outbox + send worker, Help
Centre, public unauthenticated intake, ticket attachments, public-intake
CAPTCHA, attachment malware scanning, and the entry-point sweep — all shipped.
Six edge functions: `create-support-ticket`, `create-public-support-ticket`,
`support-agent-action`, `support-notify`, `support-attachment-action`, and
`support-attachment-scan`.

Two of those ship **inert by design** and need operator configuration before
they do anything — the CAPTCHA and the attachment scanner. See the runbook.

## First-line self-service (intake forms)

As a requester types on the public Contact form or the in-app request form,
[`FirstLineSuggestions`](../src/features/support/FirstLineSuggestions.tsx) surfaces
the Help Centre articles most likely to answer them, to deflect simple questions
before they become tickets. The links open the public help pages in a new tab so
the draft is never lost.

The safety-critical half is the **escalation policy** in
[`firstLineAssist.ts`](../src/features/support/firstLineAssist.ts): privacy,
security, accessibility, complaint, billing disputes, and account recovery are
`HUMAN_ONLY_CATEGORIES` — they get **no automated first-line answer** (retrieval
*or* generative); the form plainly says a person will handle it. Retrieval
suggestions use the Help Centre search in `any`-term mode (whole-sentence
questions).

**Generative first-line — authenticated only.** On the in-app form
(`allowGenerative`), an opt-in "Get an instant answer" button asks the model
([`support-firstline`](../supabase/functions/support-firstline/index.ts),
deployed) for a short answer **grounded only in the Help Centre excerpts the
client sends** — the system prompt forbids legal advice, guessing, and inventing
policies/citations, and tells the model to defer to a person when the answer
isn't present. It's authenticated and metered by the shared beta usage
guardrails ([`_shared/aiUsage.ts`](../supabase/functions/_shared/aiUsage.ts),
docs/AI_USAGE_STRATEGY.md §7) — drawing on the **same per-user daily budget as
the Advisor**, since both bill to one provider account. It reuses the active
`advisor_chat` model route, and the answer is **advisory only**: labelled
AI-generated / not legal advice, and the user still sends their request. When
the guardrail refuses (429), the form says so plainly and points at the path it
already wanted — send it to a person. The **public** Contact form never enables it —
that endpoint stays retrieval-only to avoid unauthenticated model cost/abuse.
Both the client and the function enforce the `HUMAN_ONLY_CATEGORIES` gate.

## Service status board

A public, **self-reported** status page at `/status` · `/fr/etat` (marketing
surface, indexable). There is no external status provider wired — this table is
the source of truth, so the page is only as truthful as the operator keeps it.

- Data: `service_status` (migration `0017`) — one row per component (platform,
  advisor, documents, support) with `status`
  (`operational|degraded|maintenance|outage`) and an optional public message.
  **Reads are public** (`using (true)` — the point of a status page); there is no
  write policy.
- Writes: [`set-service-status`](../supabase/functions/set-service-status/index.ts)
  (deployed, `is_admin`-gated, service role) — the only way status changes.
- Client: [`statusApi.ts`](../src/features/support/statusApi.ts) (public read with
  an all-`operational` fallback when Supabase isn't configured, e.g. prerender;
  `overallStatus` rolls the banner up to the worst component) and
  `StatusPage.tsx`. The founder control lives in the admin dashboard
  ([`ServiceStatusControl`](../src/features/app/views/support/ServiceStatusControl.tsx)).
- Prerender shows the all-operational baseline; the live status is fetched on
  hydration. Footer entry point under Resources.

## Anti-abuse on the public intake: CAPTCHA

The honeypot and the per-IP/per-email rate limits are the cheap layers, and a
script that rotates addresses and IPs walks through both. A CAPTCHA
(Turnstile **or** hCaptcha — they share one siteverify request/response shape,
so the provider is a config value) is the layer that costs an attacker
something.

- Verification: [`captcha.ts`](../src/features/support/captcha.ts) — pure,
  injectable fetch, unit-tested, and **mirrored** in
  `create-public-support-ticket` (the `svixSignature.ts` convention).
- Widget: [`CaptchaField.tsx`](../src/features/support/CaptchaField.tsx) —
  renders nothing and loads no third-party script unless
  `VITE_CAPTCHA_SITE_KEY` is set, so prerender, tests and local dev are
  untouched. Tokens are single-use, so a rejected submit resets the widget.
- **Configured or absent, never half-on.** With no `CAPTCHA_SECRET_KEY` the
  function skips verification entirely — that is how it ships (AGENTS.md's
  two-halves rule), and the honeypot + rate limits still apply. Once the secret
  IS set, a missing or bad token is a hard `403`: a configured CAPTCHA that
  quietly passes traffic is worse than none, because the operator believes they
  are protected.
- **Unrecognised is never a pass.** A `success: false` with no known error code
  still fails; a wrong secret is reported as `bad_secret` rather than blamed on
  the caller's token, so the operator isn't sent hunting a bot that isn't there.
- The check runs *after* the rate limit, so a flooder is turned away before we
  pay the provider for them.

Set `CAPTCHA_SECRET_KEY` and `VITE_CAPTCHA_SITE_KEY` **together** — the site key
is compiled into the client, so a secret without a redeployed site key locks
every real customer out of the form. See the runbook.

## Attachment malware scanning

`support_attachments.scan_status` existed from migration `0014` and read
`pending` on every row ever inserted, because nothing flipped it. The column
documented an intention, not a control: the MIME allowlist is the *declared*
content type, which an attacker picks freely.

- Worker: [`support-attachment-scan`](../supabase/functions/support-attachment-scan/index.ts)
  — drains `pending` rows (25/run), hands each file to the operator's scanner as
  a **5-minute signed URL** (never a bearer token, never ticket content), and
  writes back `scan_status` + `scan_detail` + `scanned_at`. Scheduled every 10
  minutes by migration `0038`, which also adds the bookkeeping columns and the
  partial index the drain query needs.
- Verdicts: [`attachmentScan.ts`](../src/features/support/attachmentScan.ts) —
  pure, unit-tested, mirrored in the worker. The documented contract is
  `{status: 'clean'|'infected'|'unsupported'}`; the common boolean shapes and a
  bare `OK`/`FOUND` are accepted so an off-the-shelf ClamAV wrapper needs no
  adapter.
- **Unrecognised is never clean.** Every ambiguous answer maps to `unknown`,
  which leaves the row `pending` for a later attempt and settles on `skipped`
  after 5 tries. That asymmetry is the point: a false `flagged` costs a customer
  one re-upload; a false `clean` puts malware behind a download button the
  founder is about to click. `skipped` means "never established as safe" and is
  **not** a synonym for `clean`.
- **Downloads are gated by the verdict**, mirroring `canReleaseAttachment` in
  `support-attachment-action`: `flagged` is refused unconditionally — for admins
  too, and even after the scan URL is removed — while anything not yet `clean`
  is refused only while a scanner is configured. With no scanner the download
  path behaves exactly as it always has, so enabling scanning is the only thing
  that changes behaviour.
- **A flagged object is not deleted.** Downloads stop; the bytes stay so they can
  go to an incident responder. Destroying the only copy of the evidence is not
  the worker's call.

Inert until `SUPPORT_ATTACHMENT_SCAN_URL` is set: rows stay `pending`, downloads
are unaffected, and wiring a scanner later scans the backlog rather than
blessing it.

## Support entry points

Where a customer can reach support from, by surface:

| Surface | Entry point |
| --- | --- |
| Marketing footer | Contact · Help Centre · Status (Resources column) |
| Help Centre | Contact CTA on the hub and every article |
| 404 page | Help Centre + Contact support |
| Route error boundary | Contact support + the `support@` address |
| Pricing | "Ask a question" → `/contact?topic=sales` (ticketed, not a mailto) |
| App sidebar (account menu) | Help Centre · Contact support · Support dashboard (admin) |
| App settings | Help and support section — Help Centre, send a request, address |
| Sign-in / recovery | "Get help" article + the `support@` address |

Two rules hold across all of them: **addresses come from `src/config/support.ts`**
(never inlined — the founder changes one file), and anything that can be a
ticket is one, so the customer gets a reference and a response target instead of
an email into a personal inbox.

The sign-in panel is the deliberate exception that offers an address rather than
the public form: `account_access` is not an `allowPublic` category (the public
function rejects it), and someone locked out cannot reach the in-app form — so
email is the only route that actually works from there.

## Staged (not yet implemented)

- **Turn email on** (operator config): verify a Resend domain, set the secrets,
  schedule `support-notify` (see the runbook). The mechanism is built; it's inert
  until then.
- **Turn on CAPTCHA and attachment scanning** (operator config): both are built
  and inert until their secrets are set — see the runbook. Merging them did not
  arm them.
- **Scheduled-call booking** (TODO.md D3, decided 2026-08-06: Google
  Calendar, full loop) — **built, not deployed.** An admin proposes up to 3
  candidate times on the ticket (`support-agent-action`'s `propose_call`);
  the customer picks one from their own ticket view
  (`support-confirm-call`), which creates a Google Calendar event with an
  auto-generated Meet link. A 15-minute cron sweep
  (`support-call-scheduler`) sends the one reminder this flow sends (~24h
  ahead) and flags a call for a written follow-up once its end time has
  passed. See [SUPPORT_CALL_SCHEDULING.md](SUPPORT_CALL_SCHEDULING.md) for
  the owner deployment steps — none of this runs until they're done.
- **Support analytics** — privacy-conscious support/deflection events. Decided
  2026-08-06 (full support funnel, workspace-scoped, 90-day raw / forever
  aggregate, first-party Supabase sink + GA4 plumbing) and built. See
  [SUPPORT_ANALYTICS.md](SUPPORT_ANALYTICS.md). The `recordHelpfulness` seam
  is now wired to the sink, along with search, article view, ticket
  submission, and ticket status change events. GA4 is built but inert until
  a consent banner ships (needs a design handoff).

## Diagnostic context policy

The authenticated request form (Phase 2) may attach: user id, workspace id,
plan, current route, app version, browser/OS, timestamp, locale, feature/module,
correlation id, and a recent non-sensitive error code — and **never** employee
records, HR case details, document contents, chat transcripts, passwords, or
tokens (see `support_diagnostic_notice`). The notice is shown and the optional
diagnostics are reviewable/removable before submission.
