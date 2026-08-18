# Open Source Assessment — Dutiva Web

**Scope:** Dutiva Web repository (`C:\Users\Marti\Dutiva_Web`), a Canadian HR-compliance SaaS platform.

**Date:** 2026-08-14

**Prepared by:** Devin (read-only assessment; no code changes executed)

**LEGAL REVIEW REQUIRED:** This document recommends license and IP strategies but does not provide legal advice. Canadian legal/IP counsel should review all licensing, trademark, and model/provider terms before any public release.

---

## Executive Summary

Dutiva Web is a React 19 + TypeScript + Vite + Tailwind v4 + React Router v7 + Supabase application. It contains a clearly separated generic infrastructure layer (`src/lib`, `src/i18n`, `src/styles`, `src/components`, `src/seo`) and a large domain-specific layer that encodes Canadian HR/compliance expertise (`src/features/app`, `src/data`, `supabase/functions/advisor-chat`, document templates, compliance scoring, law monitoring).

This assessment recommends a **prepared open-core strategy**, not a public release today.

- **Open (AGPLv3):** Generic UI, bilingual i18n framework, and cross-cutting infrastructure with all Dutiva-specific content removed.
- **Dutiva-controlled shared core (proprietary, architecturally separated but not published):** Document-generation engine, workflow engine, support plumbing, tenant/RLS patterns.
- **Proprietary commercial layer:** Dutiva Advisor, safety backstop, statutory notice tables, compliance scoring formula, 50 document templates, curated legal corpus, law monitoring, reference guides, marketing legal copy, billing/enterprise features, customer data.
- **Never public:** Secrets, service-role credentials, production identifiers, admin allow-lists, unredacted design handoffs, customer/employee records.

The repository follows good security hygiene: secrets are env-driven, RLS is tenant-scoped, and no real production secrets live in source. However, the codebase is not yet cleanly packaged for public release because generic modules still carry Dutiva defaults (brand strings, admin email, rate-limit values) and proprietary domain code is not physically separated from reusable engines.

---

## Recommended Boundary

### Open

Generic, non-domain modules that would be useful to other projects and carry no Dutiva competitive intelligence:

- `src/i18n/core.ts` and the `Bi`/`defineMessages` bilingual framework.
- `src/styles/*` design-token and surface system (with Dutiva brand values made configurable).
- Generic UI primitives in `src/components` (`Disclaimer.tsx` as a generic component, `chips.ts`, etc.).
- Cross-cutting utilities in `src/lib`: theme, prefs, money, Supabase client wrapper, service-worker registration.
- Privacy-first error-reporting *mechanism* (`src/lib/errorReporting/*`) without route allow-list values.
- Export-guardrail *mechanism* (`src/lib/exportProtection/*`) without Dutiva watermarks or configured limits.
- SEO route-registry and prerender helpers (`src/seo/*`) without Dutiva copy.

### Proprietary

Modules that embody Dutiva's product, Canadian HR expertise, or commercial layer:

- `supabase/functions/advisor-chat/*` — system prompt, model routing, RAG wiring.
- `supabase/functions/advisor-chat/responsePayload.ts` — deterministic risk/jurisdiction/legal-basis builder.
- `src/features/app/advisor/*` and `src/features/app/advisor/safety/*` — crisis phrase sets, statutory-figure detection, notice cross-check, `statutoryNotice.ts`.
- `src/features/app/documents/data/templates/*` — 50 curated HR document templates and statutory meta-data.
- `src/features/app/flows/data/*` and `src/features/app/reference/data/*` — domain-specific workflows and reference guides.
- `src/features/app/views/analytics/aggregation.ts` and `supabase/functions/record-score-snapshots/scoring.ts` — compliance score formula v3.
- `src/features/app/guidance/monitoringCoverage.ts` — jurisdiction coverage claims and audit dates.
- `src/data/*` — Northgate Logistics Inc. demo fixtures and all domain scenarios.
- `src/features/marketing/legal/*`, `src/features/marketing/articles/*` — Dutiva legal policies and public content.
- `src/config/plans.ts`, `src/lib/billing/adminAccess.ts`, `supabase/functions/*` billing and admin bypass code.
- `docs/AI_USAGE_STRATEGY.md`, `docs/SCORING_LOGIC.md`, `docs/EXPORT_PROTECTION.md`, `docs/FOUR_RING_FRAMEWORK.md`, `docs/advisor-guidance-corpus*.md`, `docs/notice-bands-review-pack.md`, `docs/design-handoff-advisor-chat/AGENT.md`.

### Never Public

- Environment secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `HF_TOKEN`, `GOOGLE_CALENDAR_PRIVATE_KEY`, salts, webhook secrets, etc.).
- The production Supabase project reference and publishable anon key currently appear in CI/CSP config; these are public identifiers but identify the production project.
- Internal admin email allow-lists (`martin.constantineau@dutiva.ca` in `src/lib/billing/adminAccess.ts` and `supabase/functions/_shared/adminAccess.ts`).
- Customer/employee data, beta signups, support tickets, and telemetry rows.
- Unredacted design handoffs and proprietary corpus review packs.

---

## Competitive Moat Matrix

| Component | Open Potential | Competitive Risk | IP Sensitivity | Security Risk | Community Value | Recommendation |
|---|---:|---:|---:|---:|---:|---|
| Bilingual i18n framework (`src/i18n`) | 5 | 1 | 1 | 1 | 4 | Open |
| Tailwind token / surface system (`src/styles`) | 5 | 1 | 1 | 1 | 4 | Open |
| Generic UI primitives (`src/components`) | 4 | 1 | 1 | 1 | 3 | Open |
| Error reporting pipeline (`src/lib/errorReporting`) | 4 | 1 | 2 | 2 | 4 | Open |
| Export guardrail mechanism (`src/lib/exportProtection`) | 4 | 2 | 3 | 2 | 3 | Open-core (generic mechanism only) |
| Support ticketing/email/outbox plumbing | 4 | 2 | 2 | 2 | 4 | Open-core (generic plumbing only) |
| Document generation engine | 3 | 3 | 3 | 2 | 3 | Dutiva-controlled shared core |
| Workflow engine | 3 | 3 | 3 | 2 | 3 | Dutiva-controlled shared core |
| Tenant / RLS scaffolding | 3 | 2 | 2 | 3 | 3 | Dutiva-controlled shared core |
| Advisor chat + prompts | 1 | 5 | 5 | 4 | 2 | Proprietary |
| Safety backstop / statutory tables | 1 | 5 | 5 | 3 | 2 | Proprietary |
| 50 document templates | 1 | 5 | 5 | 2 | 2 | Proprietary |
| Compliance scoring formula | 1 | 5 | 5 | 2 | 2 | Proprietary |
| Law monitoring / corpus curation | 1 | 4 | 5 | 3 | 2 | Proprietary |
| Marketing site + legal policies | 2 | 3 | 4 | 2 | 3 | Publicly served but not open-source licensed |

Scoring legend: 1 = low, 5 = high.

---

## Risk Matrix

| Risk Category | Level | Notes |
|---|---|---|
| IP risk | High | The Advisor, scoring formula, templates, and curated corpus are the core moat. Any leak materially weakens Dutiva. |
| Competitive risk | High | A competitor with the full source could replicate the Canadian HR compliance surface quickly. |
| Security risk | Medium | No secrets in source, but RLS/rate-limit logic would be fully inspectable; sensitive values must be env-driven before release. |
| Licensing risk | Medium | AGPLv3 is recommended but must be reconciled with Apache-2.0 dev dependencies and MPL-2.0 transitive build tooling. **Legal review required.** |
| Compliance risk | High | Public code could be treated as legal authority; any statutory figure in source becomes a liability. The product already gates figures carefully. |
| Operational risk | Medium | Splitting packages adds build/test/maintenance overhead; current monorepo tooling supports it. |

---

## Business Impact

| Factor | Impact |
|---|---|
| Customer trust | Publishing generic privacy/error-handling infrastructure and a transparent licensing model can increase trust without exposing the compliance engine. |
| Developer adoption | A clean `dutiva-ui`/`dutiva-i18n` package may attract React/Tailwind developers; the moat remains in the proprietary content layer. |
| Sales / enterprise procurement | AGPLv3 may alarm enterprise buyers if they mistake it for applying to the whole Dutiva SaaS; messaging must separate "open UI/i18n tooling" from "proprietary Dutiva service." |
| Competitive differentiation | Keeping the Advisor, scoring, templates, and corpus closed preserves differentiation. |
| Community / ecosystem | Open generic packages can grow an ecosystem around Dutiva's UI/i18n patterns without giving away compliance IP. |
| Integrations | Open generic infra lowers friction for integrations; proprietary APIs remain commercial. |
| Hiring | Public generic tooling can improve engineering brand. |
| Fundraising / valuation | Open-core with a closed moat is generally viewed favorably by investors, provided the IP boundary is defensible. |
| Vendor lock-in | Open generic tooling reduces lock-in for routine frontend concerns while keeping compliance intelligence in Dutiva's SaaS. |

---

## Required Changes

### Must do before open sourcing

1. Move Dutiva-specific defaults out of generic modules: brand strings, admin email, rate-limit values, site origin.
2. Physically separate generic packages from domain packages (e.g., `packages/dutiva-ui`, `packages/dutiva-i18n`, `packages/dutiva-infra`).
3. Scrub repository history for secrets, customer data, and proprietary design handoffs.
4. Obtain legal review of AGPLv3 choice, trademark policy, Apache-2.0 dependency compatibility, and AI provider terms.
5. Publish a trademark policy that reserves the Dutiva name, logo, and "Dutiva Advisor."
6. Remove or replace all Northgate Logistics fixture data with clearly fictional/synthetic samples in any public artifact.

### Should do eventually

1. Add a CLA or DCO process for external contributions.
2. Introduce semantic versioning and a breaking-change policy for published packages.
3. Set up independent CI for each public package.
4. Move document/workflow/support engines into a separate private package so the open/closed boundary is mechanical.
5. Establish a security disclosure policy and security advisory process.

### Nice to have

1. Public Storybook or documentation site for `dutiva-ui`.
2. Example starter app showing how to consume the open packages.
3. Open-core white paper explaining the Dutiva model.

### Do not do

1. Do not publish the current monorepo as-is.
2. Do not apply an open-source license to the root repository or to proprietary modules.
3. Do not publish design handoffs, corpus review packs, or unredacted legal interpretation documents.
4. Do not expose service-role keys, admin emails, or production identifiers even if they are "public."

---

## Migration Plan

**Phase 0 — Assessment (this work):** Document boundaries, risks, and license strategy. No code changes.

**Phase 1 — Internal cleanup:**
- Env-ify site config, admin email, rate-limit defaults.
- Replace hardcoded fixture organization identity with a configurable demo-org constant.
- Add secret-scanning to pre-commit hooks.
- Audit and, if necessary, rewrite git history.

**Phase 2 — Package separation (still private):**
- Extract `src/i18n/core` → `packages/dutiva-i18n`.
- Extract `src/styles` + generic components → `packages/dutiva-ui`.
- Extract generic `src/lib/*` → `packages/dutiva-infra`.
- Keep document/workflow/support engines in a private `packages/dutiva-shared-core`.

**Phase 3 — Security/IP cleanup:**
- Legal review of AGPLv3, trademarks, dependency compatibility, model/provider terms.
- Final history scrub and secret rotation.

**Phase 4 — License preparation:**
- Add AGPLv3 `LICENSE` files to open packages only.
- Add `LICENSE` and trademark policy to each package.
- Update package metadata and READMEs.

**Phase 5 — Private validation:**
- Publish packages to a private GitHub/npm registry.
- Run integration tests against the main Dutiva Web application.

**Phase 6 — Public release (requires explicit executive/legal sign-off):**
- Flip visibility of the selected repositories.
- Announce with clear messaging separating open tooling from proprietary Dutiva services.

---

## Final Recommendation

**Mostly closed today, with a narrow open-core path for generic infrastructure.**

Dutiva should not publish the current repository. It should, however, invest in the Phase 1–2 separation work so that generic UI, i18n, and infrastructure packages can be released later under AGPLv3 without exposing the Canadian HR/compliance intelligence that forms Dutiva's competitive moat. The document-generation engine, workflow engine, and support plumbing should be architecturally separated into a private shared core so they can be published or kept closed as strategy dictates. The Advisor, scoring, templates, corpus, and legal interpretations must remain proprietary.
