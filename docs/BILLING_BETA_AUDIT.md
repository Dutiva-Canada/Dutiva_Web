# Stripe billing & beta-signup audit

> **Status (2026-08-27).** Items 1–3 of "Suggested order of work" have been
> done: the beta form now posts to `create-beta-signup`, migration `0024`
> reconciled the live billing schema, and all three Stripe functions are
> deployed. **B2 (invite-only sign-in) is resolved.** **OA11 (Stripe secrets +
> webhook) is closed** — owner confirmed dashboard configuration 2026-08-27;
> see [STRIPE_GO_LIVE.md § Completion record](STRIPE_GO_LIVE.md). The findings
> below are kept as written, as the record of what was found.

**Date:** 2026-07-27
**Scope:** the paid-signup path (`/pricing` → Stripe Checkout → entitlement) and
the beta waiting-list path (landing `#start` form).
**Method:** repo source review, plus the live Supabase project
(`khtwpxnvziiyplaflwru`) and the live Vercel project (`dutiva-website`, which
deploys `main` of this repo to `dutiva.ca`). Every claim below is grounded in
one of those two, and the evidence is named inline.

## Verdict

**Neither path works today.** A customer cannot complete a payment, and a beta
signup is discarded by the browser rather than recorded.

The _code_ in this repo is largely sound — signature verification, RLS, and the
plan-resolution hardening are genuinely well built. The failures are all at the
seams: code that was never deployed, a schema that was never migrated, and a
form that was never wired to the backend that already exists for it.

Supporting evidence that this is not theoretical:

| Live check                                           | Result                       |
| ---------------------------------------------------- | ---------------------------- |
| `select count(*) from auth.users`                    | **1** (the internal account) |
| `select count(*) from public.beta_signups`           | **0**                        |
| `create-checkout-session` in deployed Edge Functions | **absent**                   |
| `create-portal-session` in deployed Edge Functions   | **absent**                   |
| `to_regclass('public.stripe_webhook_events')`        | **null**                     |

---

## Blockers — payment cannot complete

### B1. The checkout Edge Functions are not deployed

`PricingPage.handleCheckout` calls
`supabase.functions.invoke('create-checkout-session')`
(`src/features/marketing/pages/PricingPage.tsx:312`), and "Manage billing" calls
`create-portal-session` (`:342`). Neither function exists in the Supabase
project — the deployed list contains `stripe-webhook`, `advisor-chat`, the
support functions and others, but not these two.

Every checkout attempt therefore resolves to a `FunctionsHttpError`, is caught
at `:327`, and the customer sees _"Could not start checkout. Please try again or
contact <support@dutiva.ca>."_ There is no way to reach Stripe from the site.

Fix: `supabase functions deploy create-checkout-session create-portal-session`,
then set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_{STARTER,GROWTH,PRO}_MONTHLY` and
`SITE_URL` as function secrets. Both need JWT verification **on** (they
authenticate the caller themselves); `stripe-webhook` must stay **off**, which
it currently is.

### B2. Nobody but one internal address can create an account

`src/features/app/auth/allowedEmail.ts` hard-codes a single address, and
`AuthProvider.signInWithEmail` refuses to even send a magic link to anything
else (`AuthProvider.tsx:49`). `RequireAdminSession` then bounces every other
session away from `/app` (`RequireAdminSession.tsx:42`).

Because `handleCheckout` sends any signed-out visitor to `/app/welcome`
(`PricingPage.tsx:288`), the funnel is closed at its first step: a prospect
clicks _Start Growth_, lands on the sign-in gate, enters their address, and is
told the workspace is restricted. `auth.users` holding exactly one row is that
outcome measured rather than inferred.

This is a deliberate invite-only posture, so the fix is a product decision, not
a bug fix — but as long as it stands, the pricing page is selling something no
visitor can buy.

### B3. The "Pro" plan cannot be provisioned at all

The site sells Pro at $99/mo (`src/config/plans.ts:59`). Production disagrees in
two independent places:

- `profiles_plan_check` in the live database allows
  `free | starter | growth | advanced | enterprise`. **`pro` is not a legal
  value.** Repo migration `0013_add_billing_profiles.sql` defines the correct
  set, but it was never applied to this project (`stripe_webhook_events`,
  created by the same migration, doesn't exist either).
- The **deployed** `stripe-webhook` still carries the older plan vocabulary
  (`starter | growth | advanced | enterprise`) and knows nothing of
  `STRIPE_PRICE_PRO_MONTHLY`.

So a completed Pro checkout resolves to `growth` in the deployed webhook and
writes a Growth entitlement — the customer pays $99 and receives the $49 tier.
Had the repo's newer webhook been deployed instead, the write would attempt
`plan: 'pro'`, be rejected by the check constraint, and — because the update's
error is never inspected (`stripe-webhook/index.ts:119`) — fail silently while
returning `{received: true}` to Stripe. Charged, no entitlement, no alert.

### B4. Beta signups are written to `localStorage` and nowhere else

`BetaSignup.tsx` validates the address, fakes a 700 ms "sending" delay, pushes
the email into `localStorage['dutiva-beta-signups']`, and renders the success
card (`BetaSignup.tsx:69-77`). No network call is made. The visitor is told
they're on the list; nobody at Dutiva ever learns they exist. The "you're
already signed up" branch (`:63`) only knows about that one browser.

What makes this the most fixable item on the list: **the backend already
exists and is deployed.** `create-beta-signup` is live (`verify_jwt: false`,
public by design) and is more careful than the form it's waiting for — honeypot
field, per-IP and per-email rate limits over `beta_signup_intake` storing only
salted hashes, strict validation, a unique index on `lower(email)` whose
violation is deliberately reported as success so the endpoint can't be used to
test list membership, and rows queued into `support_notifications` for both an
operator alert and a bilingual confirmation to the signer. `public.beta_signups`
is there too, with `email / company / province / language / source` columns that
match the form's fields exactly.

Two notes for whoever wires it:

- The function **requires `consent === true`** and returns 422 otherwise. The
  current form has only a passive privacy sentence (`:188`), so a real consent
  checkbox has to be added — that is the CASL express-consent record, not a
  formality.
- Send `source: 'landing'` and the active `language`, and include the
  `contact_fax` honeypot input the function expects.

---

## Significant issues

### S1. The deployed webhook is not the code in this repo

Deployed `stripe-webhook` is version 8 (~2026-06-08) and is the older
implementation from the predecessor repo. Improvements sitting unshipped in
`main`:

- **Plan defaulting.** Deployed code falls back to `plan: "growth"` when it
  recognizes neither the metadata nor the price — an unrecognized checkout
  silently grants a paid tier. The repo version defaults to `'free'`
  (`billing-event.ts:63`). Ship this.
- **Price over metadata.** Deployed code prefers `metadata.plan` over the
  actually-purchased price; the repo version reverses it so the price is
  authoritative. Not exploitable today (metadata is set server-side), but it is
  the difference between "safe" and "safe by construction".
- **Filter injection.** Deployed code interpolates the checkout email into a
  PostgREST `.or()` filter string. The repo version replaced it with a
  parameterized `.eq()` (`stripe-webhook/index.ts:60-63`) precisely to close
  this. Still live.

### S2. Webhook idempotency is inert in production

`stripe-webhook/index.ts:96` inserts into `public.stripe_webhook_events` to
de-duplicate deliveries. That table does not exist, so the insert errors, the
handler logs a warning and continues (`:104`), and every Stripe retry is
reprocessed. The writes are mostly idempotent so the blast radius is small
today, but the guard is providing no protection at all. Applying migration 0013
restores it.

### S3. `line_items` is never present on `checkout.session.completed`

`inferCheckoutPrice` reads `session.line_items` (`billing-event.ts:41`), which
Stripe does not include in webhook payloads — it requires an expansion that
webhooks don't perform. The lookup therefore always misses on the checkout path,
and the plan comes from metadata regardless of which version is deployed. The
price-authoritative design only actually takes effect on the
`customer.subscription.*` events, which do carry `items.data[0].price`.

To make the checkout path match its intent, retrieve the session with
`expand[]=line_items` before resolving the plan, or simply rely on the
subscription event and treat the checkout event as customer-linking only.

---

## Smaller findings

- **Annual billing is a dead end.** The toggle advertises "2 months free" and
  renders annual pricing, then refuses at click time with _"Annual billing is
  coming soon"_ (`PricingPage.tsx:297`). A live pricing page quoting a price
  that cannot be purchased. Either wire the annual price IDs or drop the toggle
  until they exist.
- **Nothing handles the return from Stripe.** `success_url` is
  `/pricing?checkout=success&plan=…` (`create-checkout-session/index.ts:143`),
  but `PricingPage` never reads the `checkout` parameter. A customer who has
  just paid lands back on an unchanged pricing page with no confirmation — and,
  if the webhook hasn't landed yet, still shown as free.
- **`SITE_URL` defaults to a redirected host.** The default is
  `https://www.dutiva.ca`, which `vercel.json` 308-redirects to the apex domain.
  Query strings survive the hop, so it works, but every Stripe return takes an
  unnecessary redirect. Set `SITE_URL=https://dutiva.ca`.
- **Domain-wide paywall bypass.** `bypassesPaywall` grants full access to any
  `@dutiva.ca` address (`adminAccess.ts:35`), duplicated by hand into both Edge
  Functions. Correct while signup is closed; worth revisiting as an explicit
  allowlist when it opens, and the hand-sync of three copies is a standing drift
  risk.
- **`pricing_cta_signin_first` is defined but never rendered** — signed-out
  visitors are redirected instead of prompted.

---

## What is already right

Worth stating plainly, because it is the majority of the code:

- `verify-signature.ts` is a correct manual implementation of Stripe's scheme —
  HMAC-SHA-256 over `${timestamp}.${body}`, a length-aware constant-time
  compare, and a 300 s replay window. No third-party crypto dependency.
- `stripe-webhook` is deployed with `verify_jwt: false`, which is what lets
  Stripe reach it at all — an easy thing to get wrong.
- `profiles` has RLS enabled with a select-only policy scoped to `auth.uid()`;
  all billing writes go through the service role inside functions.
- The checkout function never trusts a client-supplied price: plans are
  allowlisted and mapped to server-side price-ID env vars.
- `create-beta-signup`'s anti-abuse design — hashed rate-limit keys, honeypot,
  and treating a duplicate as a success so the endpoint can't confirm list
  membership — is careful work.

---

## Suggested order of work

1. Wire `BetaSignup.tsx` to `create-beta-signup`, with a consent checkbox
   (B4) — the backend is already live, so this is the shortest path from
   "losing every lead" to "capturing them".
2. Apply migration `0013` to production, or reconcile it against the live
   schema (B3, S2). Decide whether the fourth tier is `pro` or `advanced` and
   make the plan catalogue, the constraint, and the webhook agree.
3. Deploy `stripe-webhook` from `main` (S1) and the two checkout functions
   (B1), with their secrets.
4. Decide the invite-only question (B2). Until it changes, consider hiding or
   relabelling the paid CTAs so the page doesn't promise a purchase it can't
   take.
5. Handle `?checkout=success` and either finish or withdraw annual billing.

Steps 2 and 3 must land together: deploying the newer webhook against the
current constraint converts B3 from a wrong-plan bug into a silent-failure bug.

---

## Remaining work

**Resolved 2026-08-27 (OA11).** Founder configuration is complete — see
[STRIPE_GO_LIVE.md § Completion record](STRIPE_GO_LIVE.md). The checklist
below is retained for re-verification. Optional follow-ons: annual prices
(EF4a), advisor pack secrets, advisor overage meter.

Steps 1–3 are done (see the status note at the top). What was left was **founder
configuration**, tracked in order in [STRIPE_GO_LIVE.md](STRIPE_GO_LIVE.md).
Summary:

### Set the Stripe secrets on the Supabase project

The three functions are deployed but fail closed until these exist as function
secrets (Supabase dashboard → Edge Functions → Secrets, or
`supabase secrets set`). Until then `create-checkout-session` answers 503
`Payments not configured.` and the pricing page shows its generic error.
**Do not flip `PAID_PLANS_DISABLED_DURING_BETA` until the go-live smoke test
passes.**

| Secret                         | Used by           | Note                                                                                   |
| ------------------------------ | ----------------- | -------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`            | checkout, portal  | test key first, then live                                                              |
| `STRIPE_WEBHOOK_SECRET`        | webhook           | the `whsec_…` for the endpoint below                                                   |
| `STRIPE_PRICE_STARTER_MONTHLY` | checkout, webhook |                                                                                        |
| `STRIPE_PRICE_GROWTH_MONTHLY`  | checkout, webhook |                                                                                        |
| `STRIPE_PRICE_PRO_MONTHLY`     | checkout, webhook |                                                                                        |
| `STRIPE_PRICE_STARTER_ANNUAL`  | checkout, webhook | optional for monthly-only first ship; required before un-hiding the annual toggle      |
| `STRIPE_PRICE_GROWTH_ANNUAL`   | checkout, webhook | same                                                                                   |
| `STRIPE_PRICE_PRO_ANNUAL`      | checkout, webhook | same                                                                                   |
| `SITE_URL`                     | checkout, portal  | set to `https://dutiva.ca` — apex only (not `www`; vercel.json redirects www away)   |

Point the Stripe webhook endpoint at
`https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/stripe-webhook` and
subscribe it to `checkout.session.completed`,
`customer.subscription.created|updated|deleted`, and
`invoice.payment_failed`. The function is deployed with `verify_jwt: false`,
which is what lets Stripe reach it.

Verify with a Stripe test-mode purchase: `profiles` should end up with the
right `plan`, `subscription_status: active`, and a `stripe_subscription_id`,
and `stripe_webhook_events` should gain one row per delivery. Then eng flips
the beta flag per [STRIPE_GO_LIVE.md](STRIPE_GO_LIVE.md) §5.

## B2 resolved — sign-in opens to the beta list

B2 was a product decision, not a bug — resolved by asking, not by picking
unilaterally. The chosen model: the admin account or anyone already invited
signs in; nobody else does. "Already invited" turned out to be two sources,
both additive to the admin account:

- **`public.beta_signups`** — the landing-page form now writes here for real
  (see B4 above); any row is an invite, no separate approval step.
- **`public.admin_beta_access`** — a pre-existing admin-managed invite table
  discovered while implementing this, left over from the predecessor repo
  (`status`: `invited`/`active`/`paused`/`removed`, 4 rows already present,
  including the admin's own QA test accounts from a prior launch). Folded in
  as an additional eligible source so those existing invites aren't silently
  revoked; `paused`/`removed` rows stay excluded, respecting that table's own
  revoke lifecycle.

> **Amended 2026-08-07 — capacity cap.** The founder capped the beta at 15
> individuals/organizations to begin. `0067_beta_cohort_capacity.sql`
> narrows the `beta_signups` clause to the first 15 eligible signups
> (`status` not `declined`/`bounced`, by signup order); rows past that are
> the waiting list — still recorded, still confirmed, not admitted.
> "No separate approval step" survives for the cohort itself, and marking a
> row `declined` (the admin UPDATE policy from 0055) frees its seat for the
> next signup in line. `admin_beta_access` stays outside the cap as the
> explicit operator override. `create-beta-signup` now reports the
> aggregate cohort-full bit so the form can tell the two successes apart —
> computed identically for new and repeat addresses, preserving the
> no-oracle property below. The number lives in `src/config/beta.ts`
> (`BETA_COHORT_LIMIT`), stated in `docs/CANONICAL_FACTS.md`, and
> drift-checked by `src/canonicalFacts.test.ts`.

Single source of truth: migration `0026_open_workspace_to_beta_list.sql`
defines `public.current_user_is_workspace_member()` — a Postgres function
with **no parameters**, always evaluated against the calling session's own
`auth.jwt() ->> 'email'`. That's deliberate: a parameterized version would
let any authenticated-but-unapproved caller ask "is address X invited?" for
an address that isn't their own — the exact oracle `create-beta-signup`'s
duplicate-signup handling was built to avoid. Four call sites now share this
one function instead of hand-copying the check:

- The RLS policies on `guidance_sources`/`guidance_chunks`/`law_updates`
  (previously a hardcoded email literal, from `0011_...single_admin.sql`).
- `AuthProvider.tsx`, client-side, via `supabase.rpc(...)` — exposed on
  `useAuth().authorized: boolean | null` (null while pending or signed out).
- `advisor-chat` and `advisor-safety-event`, via the caller's own JWT client
  (`userClient.rpc(...)`) — both used a service-role client that bypasses
  RLS, so each needed its own check regardless.

`signInWithEmail` no longer pre-checks eligibility before sending a magic
link — for the same oracle reason. Every syntactically valid address gets a
link now; a signed-in session that isn't invited sees `AuthPanel`'s existing
"not authorized, sign out" state (this branch existed already but was
unreachable, since nothing before this could ever get a non-admin session
signed in at all).

`src/features/app/auth/allowedEmail.ts` — the single-hardcoded-email module
— is deleted; nothing referenced it once the three call sites above moved to
the shared RPC.

**Found and fixed along the way:** `beta_signups` had no `language` column,
but `create-beta-signup`'s insert has always included one — meaning every
beta signup since the frontend was pointed at that function has been
failing (migration `0025_add_beta_signups_language_column.sql`). Confirmed
via the live schema and an empty table despite the earlier fix landing.

## B2's other half — an open beta needs a metered AI surface

Opening sign-in to the beta list (B2) and disabling paid plans settled who
gets in and what they pay. It left the cost side unaddressed: with every
feature open and nothing sold, the AI API became the only place a signed-in
account turns into a per-request bill, and it had **no usage limit at all**.

`0027_ai_usage_guardrails.sql` and `supabase/functions/_shared/aiUsage.ts`
close that — burst / daily-request / daily-token ceilings per user plus a
platform-wide daily ceiling, claimed atomically before each model call. The
numbers, the design choices, and the reasoning are in
[docs/AI_USAGE_STRATEGY.md §7](AI_USAGE_STRATEGY.md).

**Found and fixed along the way (same shape as the `beta_signups.language`
finding above):** the CHECK constraints on `ai_telemetry_events` predated the
functions writing to it and rejected `operation IN ('support_firstline',
'safety_backstop')` and `status = 'error'`. So `support-firstline`'s per-user
rate limit — the only guardrail on any AI endpoint — counted rows the database
refused to store and **had never once fired**, and `advisor-safety-event` had
been returning 500 on every call. Confirmed against the live project: the table
held rows for `('chat','completed')` and nothing else.

**Live as of 2026-07-28.** Migration 0027 is applied and both functions are
redeployed (`support-firstline` v10, `advisor-chat` v19, `verify_jwt` preserved
on each). `advisor-safety-event` needed no redeploy — its code was already
correct; the constraint was what rejected its writes.

Verified against the live project after applying, by exercising
`claim_ai_usage()` exactly as the edge functions call it:

- a claim reserves a `status = 'started'` row with no tokens yet, and the
  finalize update stamps it with tokens, latency and outcome — one row per call;
- the burst ceiling refuses with `scope = burst` and a retry delay equal to the
  remainder of the window; the platform ceiling refuses with
  `scope = platform_daily` and ~24h;
- all three writes the constraints used to reject (`safety_backstop`,
  `support_firstline`, `status = 'failed'`) now insert cleanly.

Test rows were deleted afterwards. `claim_ai_usage` does not appear in
Supabase's "signed-in users can execute SECURITY DEFINER function" linter
output, confirming the `anon`/`authenticated` revokes took effect.

Not covered by that check: a real end-to-end Advisor turn, which needs a
beta-list user's JWT. The first live turn is the remaining confirmation — expect
exactly one telemetry row for it, `completed` with a token count. A row stranded
at `started` would mean the claim landed but finalize did not.

### Still open from the findings above

- **Annual billing** still advertises a price it refuses at click time.
  **UPDATE 2026-07-30:** resolved — the toggle is now hidden while
  `PAID_PLANS_DISABLED_DURING_BETA` is on (PR #96). No path on `/pricing`
  or `/fr/tarifs` displays a price that cannot be purchased.
- **`inferCheckoutPrice`** still reads `session.line_items`, which webhooks
  never carry. On reflection this is lower-priority than first framed: this
  repo's own `create-checkout-session` always sets `metadata.plan` correctly
  server-side, so the fallback path is what actually resolves the plan
  today — not an active correctness bug, just short of the design's stated
  intent. A real fix means an extra Stripe API call from inside the webhook
  (retrieving the session with `expand[]=line_items`), which is more
  complexity than the current gap justifies.

---

## Re-verification against the live project (2026-07-30)

Checked the three findings from the original audit (S1, S2, S3) against the
live Supabase project `khtwpxnvziiyplaflwru` to assess current state:

### S1 — Deployed webhook vs. repo code

- `profiles_plan_check` constraint now accepts `free | starter | growth | pro
| advanced | enterprise` — `pro` is present, confirming the schema
  reconciliation migration was applied.
- `stripe_webhook_events` table exists with the correct schema (`event_id`,
  `event_type`, `received_at`).
- 3 profiles exist, 0 have a `stripe_customer_id` — consistent with no real
  Stripe purchases having occurred.
- **Resolved 2026-08-23 (OA11 eng prep):** live `stripe-webhook` was still on
  a monthly-only revision; redeployed from repo to **v20** (annual price env
  keys + `billing_period`). `create-checkout-session` redeployed to **v14**
  (annual period + apex `SITE_URL` default). See [STRIPE_GO_LIVE.md](STRIPE_GO_LIVE.md) §3.

### S2 — Webhook idempotency

- `stripe_webhook_events` table exists (was `null` at audit time).
- 0 rows — expected: Stripe secrets are not yet set, so no webhook traffic
  has reached the function.
- **Structurally resolved.** The dedup guard will activate the moment the
  Stripe endpoint and secrets are configured. Cannot be end-to-end tested
  until then.

### S3 — `inferCheckoutPrice` reads `session.line_items`

- Still present at `billing-event.ts:65-68`.
- **Unchanged, documented, low priority.** The fallback to `metadata.plan`
  is what actually resolves the plan on the checkout path. The subscription
  events (`customer.subscription.created/updated`) do carry
  `items.data[0].price`, so the price-authoritative design works there.
- No action taken; the existing assessment stands.
