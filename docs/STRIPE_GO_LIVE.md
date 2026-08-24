# Stripe go-live (OA11) — founder checklist

**Status (2026-08-23):** Engineering prep is **complete**. Stripe Dashboard
work (products/prices, Edge Function secrets, webhook subscription, test-mode
smoke) is **deferred** — do it when ready to open paid signup; until then keep
`PAID_PLANS_DISABLED_DURING_BETA` as `true`. Do not flip the flag until §4
passes.

Paid plans are **shown but not sold** while that flag is on. The checkout,
portal, and webhook edge functions are deployed and ready; they fail closed
with 503 until the secrets below exist. This document is the ordered founder
path to re-enable purchases.

Do **not** paste live secrets into chat, PRs, or the repo.

## Pricing numbers (must match the catalogue)

From `src/config/plans.ts` (`ANNUAL_MONTHS_BILLED = 10` — two months free):

| Plan | Monthly CAD | Annual total CAD (`annualTotal`) | Annual per-month display |
| --- | ---: | ---: | ---: |
| Starter | 24 | 240 | 20 |
| Growth | 49 | 492 | 41 |
| Pro | 99 | 996 | 83 |

Create Stripe **Products** + **Prices** in **test mode first**, then repeat in
live mode when ready. Annual prices must be **yearly recurring** charging the
annual total above (not 12× monthly).

## 1. Supabase Edge Function secrets

Dashboard → Project Settings → Edge Functions → Secrets, or
`supabase secrets set … --project-ref khtwpxnvziiyplaflwru`.

| Secret | Used by | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | checkout, portal | `sk_test_…` then later `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | webhook | `whsec_…` for the endpoint in §2 |
| `STRIPE_PRICE_STARTER_MONTHLY` | checkout, webhook | `price_…` |
| `STRIPE_PRICE_GROWTH_MONTHLY` | checkout, webhook | |
| `STRIPE_PRICE_PRO_MONTHLY` | checkout, webhook | |
| `STRIPE_PRICE_STARTER_ANNUAL` | checkout, webhook | Optional for a **monthly-only** first ship; **required** before un-hiding the annual toggle on `/pricing` |
| `STRIPE_PRICE_GROWTH_ANNUAL` | checkout, webhook | same |
| `STRIPE_PRICE_PRO_ANNUAL` | checkout, webhook | same |
| `SITE_URL` | checkout, portal | **`https://dutiva.ca`** (apex — not `www`) |

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

| Function | After redeploy | Notes |
| --- | --- | --- |
| `create-checkout-session` | v14 | monthly + annual price map; `SITE_URL` default `https://dutiva.ca` |
| `create-portal-session` | redeployed | same `SITE_URL` default |
| `stripe-webhook` | v20 | six price env keys; `billing_period` from metadata / price lookup |

Re-check dashboard versions after any later deploy.

Required behaviour on the live project:

- Checkout accepts `period: monthly | annual` and reads
  `STRIPE_PRICE_*_{MONTHLY,ANNUAL}`.
- Webhook `PRICE_ENV_KEYS` includes all six price env vars and writes
  `billing_period` from the matched price (or metadata), not a hardcoded
  `monthly`.
- Default `SITE_URL` fallback is `https://dutiva.ca`.

## 4. Smoke test (Stripe test mode)

With `PAID_PLANS_DISABLED_DURING_BETA` still **true**, checkout CTAs stay
disabled on the marketing site. To exercise Stripe before flipping the flag,
either:

- temporarily flip the flag on a **preview** deployment only, or
- invoke `create-checkout-session` with a signed-in non-`@dutiva.ca` test user
  JWT (internal `@dutiva.ca` accounts bypass Stripe entirely).

Expect after a successful test purchase:

- `profiles.plan` = `starter` | `growth` | `pro`
- `profiles.subscription_status` = `active`
- `profiles.stripe_subscription_id` set
- `profiles.billing_period` = `monthly` or `annual` as purchased
- at least one new row in `public.stripe_webhook_events`

## 5. Eng PR to open paid signup (after §4)

Only then:

1. Set `PAID_PLANS_DISABLED_DURING_BETA = false` in `src/config/plans.ts`.
2. Update `docs/CANONICAL_FACTS.md` beta-state row and
   `src/canonicalFacts.test.ts`.
3. Remove the PricingPage annual “not configured” client guard **only if**
   all three `STRIPE_PRICE_*_ANNUAL` secrets are set.
4. Mark **OA11** done in `docs/TODO.md`.

## Related

- [BILLING_BETA_AUDIT.md](BILLING_BETA_AUDIT.md) — audit history and remaining secrets table
- [TODO.md](TODO.md) — OA11 status
- `src/config/plans.ts` — catalogue + flag
