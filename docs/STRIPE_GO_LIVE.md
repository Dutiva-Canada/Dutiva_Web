# Stripe go-live (OA11) — founder checklist

**Status (2026-08-27): OA11 closed.** Monthly paid checkout is configured and
live. Founder confirmed Stripe products/prices, Supabase Edge Function secrets,
and the webhook subscription (see [Completion record](#completion-record-2026-08-27)
below). `/pricing` shows monthly CTAs (`PAID_PLANS_DISABLED_DURING_BETA =
false`). Annual billing stays hidden (`ANNUAL_BILLING_AVAILABLE = false`) until
the annual price secrets exist and eng flips the flag (EF4a).

Do **not** paste live secrets into chat, PRs, or the repo.

## Completion record (2026-08-27)

Owner confirmed the following are in place on the live Supabase project
(`khtwpxnvziiyplaflwru`):

| Step                                                                                                 | Status                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Stripe Products + monthly Prices (Starter / Growth / Pro, CAD)                                       | Done                                    |
| Supabase secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*_MONTHLY`, `SITE_URL` | Done                                    |
| Webhook → `…/functions/v1/stripe-webhook` with subscription events                                   | Done                                    |
| Edge functions match `main` (annual wiring, apex `SITE_URL` default)                                 | Done (v23 / v28 / v21 as of 2026-08-27) |
| `PAID_PLANS_DISABLED_DURING_BETA = false`                                                            | Done (2026-08-26)                       |

**Optional follow-ons** (documented separately — not required to close OA11):

- **Annual** — create yearly Prices + `STRIPE_PRICE_*_ANNUAL` secrets, then set
  `ANNUAL_BILLING_AVAILABLE = true` ([EF4a in TODO.md](TODO.md)).
- **Advisor packs** — `STRIPE_PRICE_ADVISOR_PACK_50` / `_200` for one-time pack
  checkout (`create-advisor-pack-checkout`).
- **Advisor overage meter** — `STRIPE_ADVISOR_METER_EVENT_NAME` for opt-in
  usage billing beyond included replies.
- **Plan feature gates** — `PLAN_FEATURE_GATES_ENABLED` stays `false`; paying
  buys support membership, not extra modules, until limits are enforced.

**Smoke verification** (run after any secret or webhook change): signed-in
non-`@dutiva.ca` user completes a test checkout → `profiles.plan` and
`subscription_status: active` update, row in `stripe_webhook_events`. See §4.

The checklist sections below remain the reference for re-verification or
onboarding a second operator.

## Pricing numbers (must match the catalogue)

From `src/config/plans.ts` (`ANNUAL_MONTHS_BILLED = 10` — two months free):

| Plan    | Monthly CAD | Annual total CAD (`annualTotal`) | Annual per-month display |
| ------- | ----------: | -------------------------------: | -----------------------: |
| Starter |          24 |                              240 |                       20 |
| Growth  |          49 |                              492 |                       41 |
| Pro     |          99 |                              996 |                       83 |

Create Stripe **Products** + **Prices** in **test mode first**, then repeat in
live mode when ready. Annual prices must be **yearly recurring** charging the
annual total above (not 12× monthly). Monthly-only is enough for the first
public sell.

## 1. Supabase Edge Function secrets

Dashboard → Project Settings → Edge Functions → Secrets, or
`supabase secrets set … --project-ref khtwpxnvziiyplaflwru`.

| Secret                            | Used by                         | Notes                                                                                                     |
| --------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`               | checkout, portal                | `sk_test_…` then later `sk_live_…`                                                                        |
| `STRIPE_WEBHOOK_SECRET`           | webhook                         | `whsec_…` for the endpoint in §2                                                                          |
| `STRIPE_PRICE_STARTER_MONTHLY`    | checkout, webhook               | `price_…`                                                                                                 |
| `STRIPE_PRICE_GROWTH_MONTHLY`     | checkout, webhook               |                                                                                                           |
| `STRIPE_PRICE_PRO_MONTHLY`        | checkout, webhook               |                                                                                                           |
| `STRIPE_PRICE_STARTER_ANNUAL`     | checkout, webhook               | Optional for a **monthly-only** first ship; **required** before un-hiding the annual toggle on `/pricing` |
| `STRIPE_PRICE_GROWTH_ANNUAL`      | checkout, webhook               | same                                                                                                      |
| `STRIPE_PRICE_PRO_ANNUAL`         | checkout, webhook               | same                                                                                                      |
| `STRIPE_PRICE_ADVISOR_PACK_50`    | pack checkout, webhook          | One-time **$5 CAD** / 50 replies. Create Product “Advisor replies (50)”.                                  |
| `STRIPE_PRICE_ADVISOR_PACK_200`   | pack checkout, webhook          | One-time **$15 CAD** / 200 replies. Create Product “Advisor replies (200)”.                               |
| `STRIPE_ADVISOR_METER_EVENT_NAME` | advisor-chat                    | Stripe Billing Meter event name for opt-in overage. Unset = overage denied.                               |
| `SITE_URL`                        | checkout, portal, pack checkout | **`https://dutiva.ca`** (apex — not `www`)                                                                |

Until `STRIPE_SECRET_KEY` (and the price id for the clicked plan) are set,
`create-checkout-session` answers `503 Payments not configured.`

## 2. Stripe webhook endpoint

URL:

```text
https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/stripe-webhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

The function is deployed with `verify_jwt: false` so Stripe can reach it;
authentication is the `Stripe-Signature` header + `STRIPE_WEBHOOK_SECRET`.

## 3. Confirm deployed functions match `main`

Verified **2026-08-23** (eng prep): live `create-checkout-session` (v12) and
`stripe-webhook` (v19) were still on an older monthly-only revision (no annual
price env map; checkout defaulted `SITE_URL` to `www`). Repo `main` already
had annual wiring. Eng redeployed from this repo the same day:

| Function                  | After redeploy | Notes                                                              |
| ------------------------- | -------------- | ------------------------------------------------------------------ |
| `create-checkout-session` | v14            | monthly + annual price map; `SITE_URL` default `https://dutiva.ca` |
| `create-portal-session`   | redeployed     | same `SITE_URL` default                                            |
| `stripe-webhook`          | v20            | six price env keys; `billing_period` from metadata / price lookup  |

Re-check dashboard versions after any later deploy.

Required behaviour on the live project:

- Checkout accepts `period: monthly | annual` and reads
  `STRIPE_PRICE_*_{MONTHLY,ANNUAL}`.
- Webhook `PRICE_ENV_KEYS` includes all six price env vars and writes
  `billing_period` from the matched price (or metadata), not a hardcoded
  `monthly`.
- Default `SITE_URL` fallback is `https://dutiva.ca`.

After merge, also redeploy `create-support-ticket` and
`create-public-support-ticket` so new tickets snapshot `requester_plan`.

## 4. Smoke test (Stripe test mode)

Click a paid CTA on `/pricing` (or a preview) with a signed-in non-`@dutiva.ca`
test user. Internal `@dutiva.ca` accounts bypass Stripe entirely.

Expect after a successful test purchase:

- `profiles.plan` = `starter` | `growth` | `pro`
- `profiles.subscription_status` = `active`
- `profiles.stripe_subscription_id` set
- `profiles.billing_period` = `monthly` or `annual` as purchased
- at least one new row in `public.stripe_webhook_events`
- `current_user_is_workspace_member()` is true for that user (paid-profile
  path from migration `0089_paid_subscribers_are_workspace_members`)

Expect after a successful pack purchase:

- a row in `public.ai_advisor_credits` for that `user_id` with `remaining_replies` 50 or 200
- `stripe_checkout_id` unique — replaying the webhook must not double-credit
- `profiles.plan` **unchanged**

Internal `@dutiva.ca` accounts skip pack payment.

## 5. After smoke (annual, later)

1. Set `ANNUAL_BILLING_AVAILABLE = true` in `src/config/plans.ts` **only if**
   all three `STRIPE_PRICE_*_ANNUAL` secrets are set.
2. Record annual go-live in [TODO.md](TODO.md) EF4a.

`PLAN_FEATURE_GATES_ENABLED` stays `false` until product limits are actually
enforced. Paying buys support membership, not extra modules.

## Related

- [BILLING_BETA_AUDIT.md](BILLING_BETA_AUDIT.md) — audit history and remaining secrets table
- [TODO.md](TODO.md) — OA11 status
- `src/config/plans.ts` — catalogue + flags
