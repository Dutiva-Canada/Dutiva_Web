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
| **Blocked** | Deployed migrations + edge functions on the live project (Woodpecker `check:migrations` gates drift; auth E2E runs when `SUPABASE_SERVICE_ROLE_KEY` is set). Production workspace still admin-only toggle. |

## Architecture (dual demo/production surface)

| Status | Detail |
| --- | --- |
| **Complete for core HR modules** | ~17 modules use `*View` / `*ProductionView` dispatch; route-level `ModeGate` removed from `appViews.tsx`. |
| **Documented** | CONVENTIONS.md workspace-mode section updated (2026-08-23). |
| **Intentionally retained** | Demo Northgate experience remains the default for all non-admin and unsigned-in users; demo-only chrome (Workflows in-flight rows, Advisor fixture threads, HR Library gallery) is product policy, not a missing implementation. |

## Security (CSP)

| Status | Detail |
| --- | --- |
| **Complete this pass** | `script-src 'unsafe-inline'` removed; bootstraps externalized to `/bootstrap-auth.js` and `/bootstrap-theme.js`. `style-src 'unsafe-inline'` removed — inline styles refactored to CSS classes, SVG progress fills, and preset Tailwind heights. CSP regressions guarded by `e2e/csp.spec.ts` (script + style violations). |
| **Remaining** | Re-test after any new third-party widget; hCaptcha may still inject its own styles from allowed origins. |

## Maintainability (large files)

| Status | Detail |
| --- | --- |
| **Complete** | `GenerateScreen.tsx` split into `generateScreen/` (shell ~108 lines). |
| **Complete** | Maintainability program (PRs #250–#258): landing i18n sections; workspace `*DemoView` splits; Advisor controller decomposition; `check:architecture` guards; T01 template modules. See `docs/MAINTAINABILITY.md`. |
| **Complete** | `useAdvisorViewController.ts` orchestration only (~463 lines); behaviour in focused modules under `views/advisor/`. |
| **Remaining** | `SettingsView.tsx` demo fixtures moved to `SettingsDemoFixtures.tsx` (~500 lines shell). Stage 2 fixture collapse per module when production-default (deferred). |

## Testing

| Status | Detail |
| --- | --- |
| **Complete this pass** | Unit: AppShell, AdvisorView copy/export, colocated gap tests (PR #203). Production Memory manager empty state test. E2E: magic-link forwarder (`e2e/auth-forwarder.spec.ts`); production documents empty + employees/cases/tasks/comms/memory CRUD (`e2e/auth/critical-path.spec.ts`); CSP script + style regression (`e2e/csp.spec.ts`). |
| **Remaining** | Inbox magic-link click (auth suite mints OTP server-side by design). |

## Not in this engineering scope (audit rows 1–3, Brand/SEO)

| Item | Owner |
| --- | --- |
| L5 Advisor corpus human review | Qualified reviewer |
| OA9 DO residency confirmation | Owner / legal |
| Annual Stripe prices + `ANNUAL_BILLING_AVAILABLE` | Owner / ops (EF4a; optional) |
| EF11 Workspace entitlement calculators | **Eng complete** — remaining = L6 sign-off (QC/FED bands) + product decision on org payroll / mass-termination count (TODO.md EF11) |
