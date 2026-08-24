# Gap audit — engineering completion status (2026-08-23)

This document answers the cross-cutting audit table: what is **complete in code**,
what is **documented as intentionally deferred**, and what remains **blocked on
human or platform action** (not closable by engineering alone).

## Legal content (QC/FED notice bands)

| Status | Detail |
| --- | --- |
| **Complete (hedge path)** | `NOTICE_SCHEDULES` QC/FED stay `bands: null`. Document Studio shows `doclib_gen_floor_unavailable`; Advisor cross-check returns `unverifiable`. |
| **Documented** | [notice-bands-decision.md](notice-bands-decision.md) records the interim **No** decision; [notice-bands-review-pack.md](notice-bands-review-pack.md) §4 updated; TODO.md L6 rewritten. |
| **Blocked** | Populating bands requires qualified legal sign-off on the pack — not an engineering task. |

## Product (documents / signing / memory in production)

| Status | Detail |
| --- | --- |
| **Complete in code** | Repository, generate, detail, signing, and all four Memory surfaces dispatch on `useWorkspaceMode()` with `*ProductionView` + migrations 0076–0087. |
| **Completed this pass** | `DoclibProvider` loads catalogue-only shell in production (no Northgate sample rows); Studio org profile follows signed-in admin identity. |
| **Blocked** | Live E2E on production Supabase (migrations applied, edge functions deployed, Resend/Storage). Production workspace still admin-only toggle. Stripe monetization (OA11). |

## Architecture (dual demo/production surface)

| Status | Detail |
| --- | --- |
| **Complete for core HR modules** | ~17 modules use `*View` / `*ProductionView` dispatch; route-level `ModeGate` removed from `appViews.tsx`. |
| **Documented** | CONVENTIONS.md workspace-mode section updated (2026-08-23). |
| **Intentionally retained** | Demo Northgate experience remains the default for all non-admin and unsigned-in users; demo-only chrome (Workflows in-flight rows, Advisor fixture threads, HR Library gallery) is product policy, not a missing implementation. |

## Security (CSP)

| Status | Detail |
| --- | --- |
| **Complete this pass** | `script-src 'unsafe-inline'` removed; bootstraps externalized to `/bootstrap-auth.js` and `/bootstrap-theme.js`. |
| **Remaining** | `style-src 'unsafe-inline'` still required for React inline styles — documented in [SECURITY_HEADERS.md](SECURITY_HEADERS.md). Removing it needs inline-style refactor or nonce middleware. |

## Maintainability (large files)

| Status | Detail |
| --- | --- |
| **Complete** | `GenerateScreen.tsx` split into `generateScreen/` (shell ~108 lines). |
| **Complete this pass** | `AdvisorView` pure helpers → `advisorViewHelpers.ts` (+ colocated tests); marketing article bodies split into `guideContent/` and `blogContent/` (6 slugs each). |
| **Remaining** | `AdvisorView.tsx` still ~900 lines (state/effects/handlers) — hook extraction is a follow-up PR. `style-src 'unsafe-inline'` requires inline-style refactor across ~25 components. |

## Testing

| Status | Detail |
| --- | --- |
| **Complete this pass** | Unit: AppShell, AdvisorView copy/export, colocated gap tests (PR #203). Production Memory manager empty state test. E2E: magic-link forwarder (`e2e/auth-forwarder.spec.ts`); production documents empty (`e2e/auth/critical-path.spec.ts`). |
| **Remaining** | Full production CRUD matrix across all modules; CSP console regression in Playwright; inbox magic-link click (auth suite mints OTP server-side by design). |

## Not in this engineering scope (audit rows 1–3, Brand/SEO)

| Item | Owner |
| --- | --- |
| L5 Advisor corpus human review | Qualified reviewer |
| OA9 DO residency confirmation | Owner / legal |
| Stripe secrets + annual prices | OA11 / ops |
| CIPO trademark / phone verification | Owner |
