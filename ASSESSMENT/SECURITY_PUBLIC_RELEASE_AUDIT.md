# Security Public-Release Audit — Dutiva Web

This document assesses whether open-sourcing any part of Dutiva Web would expose authentication weaknesses, authorization logic, attack surface, or sensitive configuration. It is based on a read-only inspection of the repository; no production infrastructure was tested.

---

## Executive summary

The repository follows strong defensive practices for a closed-source product:

- Secrets are externalized to environment variables or Supabase Vault.
- Row-level security (RLS) is used pervasively and is organization-scoped.
- Privileged operations use service-role clients inside Supabase Edge Functions, not client-side keys.
- Rate limits and guardrails are implemented atomically with advisory locks.

However, **a public release would expose every implementation detail** to attackers, including RLS policy patterns, rate-limit constants, cron schedules, and internal admin allow-lists. Public release is safe only after:

1. Moving all rate-limit, site, and admin values to environment configuration.
2. Separating generic packages from proprietary backend logic.
3. Reviewing and redacting historical security fixes that reveal past vulnerabilities.
4. Confirming git history contains no secrets, customer data, or unredacted design handoffs.

No real production secrets were found in the current source tree.

---

## Secrets and sensitive information audit

### Files checked

- `.env.example`
- `.gitignore`
- `vercel.json`
- `vite.config.ts`
- `supabase/config.toml`
- `supabase/functions/*`
- `services/attachment-scanner/*`
- `scripts/*`
- All source files for hardcoded keys, tokens, and connection strings.

### Findings

#### No production cryptographic secrets in source

All of the following are read from environment variables or Supabase Vault:

- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`
- `HF_TOKEN` (Hugging Face, used by law monitoring)
- `GOOGLE_CALENDAR_CLIENT_EMAIL`, `GOOGLE_CALENDAR_PRIVATE_KEY`
- `SUPPORT_NOTIFY_SECRET`, `PUBLIC_INTAKE_SALT`, `ERROR_REPORT_SALT`
- `CAPTCHA_SECRET_KEY`
- `SUPPORT_ATTACHMENT_SCAN_KEY`

`.env.example` contains only placeholder values (e.g., `sb_publishable_your_key_here`, `sk_live_...`).

#### Public identifiers exposed

The following values are not cryptographic secrets but identify the production environment. They are currently committed to source and would be published along with the code:

| Identifier | Location | Risk |
|---|---|---|
| Supabase project reference `khtwpxnvziiyplaflwru` | `vercel.json`, `supabase/config.toml`, `services/attachment-scanner/do-app.yaml`, migration 0049, 0073 | Public by design for Supabase URLs; still reveals production project identity |
| Supabase project URL `https://khtwpxnvziiyplaflwru.supabase.co` | `vercel.json`, multiple migrations | Public by design |
| Supabase anon key in CI | `.woodpecker/live-checks.yml` | Publishable key with limited RLS permissions; still the production key |
| GA4 measurement ID in CI | `.woodpecker/check.yml`, `.woodpecker/e2e.yml` | Public by design |

**Recommendation:** Before any public release, move the project reference and public keys out of the open-source packages. They can remain in private deployment configuration. Publishing them is not a secret leak but it does disclose infrastructure and increases enumeration risk.

#### Internal admin email

- `martin.constantineau@dutiva.ca` is hardcoded in:
  - `src/lib/billing/adminAccess.ts`
  - `supabase/functions/_shared/adminAccess.ts`

This is a business identifier, not a password. It is used for billing-bypass and beta-invite logic. It appears in tests and fixtures throughout the repo.

**Recommendation:** Move to an environment variable before open-sourcing any package that imports these files.

---

## Git history audit

**Status:** Not performed.

The `.git` directory was not accessible in this environment, so historical commits could not be scanned for accidentally committed secrets, customer data, or copyrighted material.

**Required before public release:**

```bash
git log --all --oneline
git log -p --all -S "sk_live_" -- "*.ts" "*.js" "*.mjs"
git log -p --all -S "sbp_" -- "*.ts" "*.js" "*.mjs"
git log -p --all -S "RESEND_API_KEY" -- "*.ts" "*.js" "*.mjs"
git log -p --all -S "SUPABASE_SERVICE_ROLE_KEY" -- "*.ts" "*.js" "*.mjs"
git log --all --name-only --pretty=format: | grep -E "\.(pem|key|p12|pfx)$"
```

If the history contains secrets or customer data, a clean release will require history rewriting or a fresh export.

---

## Authentication and authorization

### Supabase auth pattern

- The browser uses the Supabase anon key with RLS.
- Edge functions use a service-role key for privileged reads/writes.
- Magic-link authentication is used for the workspace.
- Invite-only access is enforced by `current_user_is_workspace_member()` and `is_admin()` RPCs.

### RLS design

RLS policies are generally well-designed:

- Organization-scoped reads/writes via `is_org_member()` / `is_org_admin()`.
- Restricted support tickets exclude workspace peers.
- Admin-only tables (`export_events`, `ai_telemetry_events`, `advisor_guidance_chunks`) have no policies and are service-role only.
- Billing columns on `profiles` are protected by a trigger (`pin_profile_billing_columns`) so clients cannot modify their own plan/subscription.

### Historical RLS/auth issues (now fixed)

| Issue | Location | Fix |
|---|---|---|
| Cron jobs accepted an unverified base64 JWT payload claiming `role: service_role` | `monitor-law-changes`, `support-call-scheduler` | Migration `0049_cron_trigger_shared_secret.sql` replaced JWT parsing with a shared secret from Supabase Vault. |
| Anonymous SELECT on `beta_signups`, `hr_documents`, and token-based write on `signatures` | Out-of-band policies | Migration `0073_close_anon_rls_holes.sql` dropped the offending policies and revoked anon grants. |
| Billing columns on `profiles` were client-editable | `profiles` table | Trigger `pin_profile_billing_columns` blocks client updates to plan/subscription/stripe IDs. |
| `support-firstline` and `advisor-safety-event` telemetry were rejected by CHECK constraints | `ai_telemetry_events` | Migration `0027_ai_usage_guardrails.sql` widened constraints and fixed status values. |

**Security implication for public release:** Publishing the code reveals the exact shape of these historical vulnerabilities and the remediation patterns. This is normal for open source, but it means an attacker can compare old and new code if history is published. A clean release should not include the pre-fix commits.

---

## Attack surface exposed by open sourcing

| Area | Current obscurity benefit | Risk if public |
|---|---|---|
| **RLS policies** | Exact policy logic is not visible | Attacker can craft queries to test edge cases; any subtle bug becomes exploitable faster. |
| **Rate-limit constants** | Values not known | Adversaries can pace attacks just below thresholds. Move to env. |
| **Admin email allow-list** | Not visible | Targeted phishing / account takeover against the single admin. Move to env. |
| **Cron schedules** | Not visible | Timing attacks, DoS planning. These are already partly inferable from migrations. |
| **System prompt / safety phrase sets** | Not visible | Gaming the Advisor to bypass crisis detection or statutory-figure gating. |
| **Export protection mechanism** | Algorithm visible | Fingerprinting/watermark details visible; mechanism is deterrence, not secrecy, but public disclosure may reduce effectiveness. |
| **Public endpoint shapes** | Source reveals URL paths, expected bodies, and auth modes | More targeted abuse of `create-public-support-ticket`, `report-error`, `create-beta-signup`. |

**Key principle:** Public code should be assumed fully inspectable. Security must not rely on obscurity. The current design mostly meets this standard for RLS and auth, but rate-limit values, admin email, and site config still benefit from being hidden.

---

## Security-through-obscurity items

The following are not necessarily vulnerabilities, but they currently benefit from being non-public and should be abstracted before release:

1. `src/lib/billing/adminAccess.ts` — hardcoded admin email list.
2. `supabase/functions/_shared/adminAccess.ts` — duplicate hardcoded admin email.
3. `supabase/functions/_shared/aiUsage.ts` — default AI burst/daily/token/platform limits.
4. `supabase/functions/_shared/exportGuard.ts` — default export burst/daily limits.
5. `src/lib/exportProtection/localAudit.ts` — client-side export velocity defaults.
6. `src/seo/site.ts` — site origin, company name, support email.
7. `supabase/config.toml` — production project id and `verify_jwt` configuration.

---

## Public endpoint security posture

| Endpoint | Auth | Mitigations |
|---|---|---|
| `create-public-support-ticket` | None | Honeypot, CAPTCHA when configured, IP/email salted-hash rate limits, length caps. |
| `create-beta-signup` | None | Same as public support ticket, plus CASL consent recording and cohort limit. |
| `report-error` | None | 64 KB body cap, IP hash rate limit, route allow-list, coarse UA only, no tokens/storage. |
| `resend-webhook` | Svix signature | HMAC-SHA256 verification with 5-minute timestamp tolerance. |
| `stripe-webhook` | Stripe signature | HMAC-SHA256 verification with 5-minute timestamp tolerance. |
| `support-analytics-event` | None | Public sink for privacy-scrubbed analytics; no PII. |
| All other functions | Bearer JWT | Supabase auth; many also check workspace membership or admin status. |

---

## Tenant isolation

- Tenant key is `organization_id`.
- RLS policies use `is_org_member(workspace_id, auth.uid())` or `organization_id` columns.
- Restricted support tickets are not visible to workspace peers.
- Child tables denormalize `organization_id` to avoid join-based RLS.

**Potential issue:** `is_admin()` grants cross-tenant access. The list of admin users is not in source, but the function exists in the project. Admin access must be tightly audited.

---

## Recommendations before public release

1. **Move all configurable values to environment variables:** rate limits, admin emails, site origin, project identifiers.
2. **Do not publish `supabase/config.toml`, `vercel.json`, or Woodpecker CI files** in the open-source packages. Keep them in private deployment repos.
3. **Publish only generic packages** (`dutiva-i18n`, `dutiva-ui`, `dutiva-infra`) that do not contain RLS policies, backend endpoints, or domain logic.
4. **Keep all Edge Functions, migrations, and backend logic private**, even if some are "generic." They reveal Dutiva's auth model and deployment topology.
5. **Audit git history** for secrets, customer data, and unredacted design handoffs.
6. **Rotate any secret that has ever appeared in git history**, even if replaced later.
7. **Add a security disclosure policy** (`SECURITY.md`) before publishing; the current `SECURITY.md` is already present and appropriate.
8. **Consider a bug-bounty or security-review program** after public release because the attack surface becomes inspectable.

---

## Conclusion

The Dutiva Web repository is secure for its current closed-source posture. No production secrets are committed. However, it is **not ready for public release of backend or domain code** because doing so would expose RLS patterns, rate limits, admin identifiers, and the implementation details of the proprietary compliance engine.

A safe public-release scope is limited to generic frontend/infrastructure packages that contain no backend logic, no Dutiva defaults, and no customer data. All backend functions, migrations, and compliance code should remain private.
