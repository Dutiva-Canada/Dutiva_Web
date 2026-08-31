# Dutiva Web — documentation index

This index exists so the documents that matter are found by someone who
doesn't already know they exist — start with **Canonical facts**, which
outranks every other document in this folder on any question of fact.

Repo-root entry points: [README.md](../README.md) (what the project is and how
to run it), [AGENTS.md](../AGENTS.md) (AI coding agents start here),
[CONVENTIONS.md](../CONVENTIONS.md) (full engineering conventions).

## Platform wiki (architecture map)

| Document                         | What it settles                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [wiki/README.md](wiki/README.md) | **In-repo mirror** of the [GitHub wiki](https://github.com/Dutiva-Canada/Dutiva_Web/wiki) — how to sync, and how this folder relates to `docs/`. |
| [wiki/Home.md](wiki/Home.md)     | Platform overview: three surfaces, tech stack, module index. Start here for the big picture.                                                     |

The wiki is copied from `Dutiva_Web.wiki` via `npm run wiki:sync`. Edit the GitHub wiki (or this mirror and `npm run wiki:sync -- --push`), then sync into the main repo when publishing.

## Start here

| Document                                             | What it settles                                                                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [CANONICAL_FACTS.md](CANONICAL_FACTS.md)             | **Source of record for every load-bearing fact** — counts, pricing, jurisdictions, company details, and the claims that must not be made. Read before writing any customer-facing or investor-facing number. |
| [NATURAL_LANGUAGE_COPY.md](NATURAL_LANGUAGE_COPY.md) | **How we write** — natural, human prose for marketing and app UI; AI-tell ban list; draft → revise checklist. Does not override CANONICAL_FACTS on claims.                                                   |

Its rule — _where this file disagrees with the code, the code wins_ — is
enforced by `npm run check`, in two halves: `src/canonicalFacts.test.ts` for
the rows backed by TypeScript values, and `scripts/check-canonical-facts.mjs`
(`npm run check:facts`) for the brand rows, which live in CSS that Vitest
cannot read. Adding a code-backed fact means adding its check.

## What is still open

| Document                                                       | What it settles                                                                                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [TODO.md](TODO.md)                                             | Every open item, swept from the "still staged" / "not done" notes in PRs #1–#132 and the docs below. Separates owner actions (a secret, a filing) from decisions, blockers and build work. |
| [DEVIN_PROMPTS.md](DEVIN_PROMPTS.md)                           | The delegable half of `TODO.md`, written as fourteen self-contained agent prompts — plus the owner actions that no agent can close, and why.                                               |
| [EMPTY_WORKSPACE_ONBOARDING.md](EMPTY_WORKSPACE_ONBOARDING.md) | First-run guidance for empty production workspaces: Home checklist + empty→create; what is in/out of v1; proposed EN/FR copy.                                                              |
| [LEGAL_REVIEW_INVENTORY.md](LEGAL_REVIEW_INVENTORY.md)         | Every document a legal reviewer must see, counted and sized per bucket — the RFQ-ready inventory for quoting lawyer / HR-consultant review, with sequencing.                               |

Each PR here records what it did not do. `TODO.md` is where those notes
accumulate — add to it when a PR leaves something open, and delete the entry
when the thing is done. `DEVIN_PROMPTS.md` is derived from it and goes stale
the moment an item closes; when you close one, delete its prompt too.

## What is true, and how we keep it true

Dutiva is a compliance product, so a wrong fact is a product defect. These
govern what the product is allowed to assert.

| Document                                                                       | What it settles                                                                                                                                                                                    |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [FOUR_RING_FRAMEWORK.md](FOUR_RING_FRAMEWORK.md)                               | Product scope as four rings, and tool by tool what is actually built. Supersedes the April 2026 Drive framework, whose jurisdiction, pricing and launch claims are corrected there.                |
| [AI_USAGE_STRATEGY.md](AI_USAGE_STRATEGY.md)                                   | Where an LLM is used and where it deliberately is not — "the LLM proposes, deterministic code disposes". Statutory clauses, notice math and crisis text are never model-authored.                  |
| [LOCAL_INFERENCE.md](LOCAL_INFERENCE.md)                                       | **Undecided.** On-device / LAN / OS-model Advisor vs DigitalOcean Gradient: physics, product fit, TOR1 Dedicated, and short- vs long-term cost. Do not ship from this doc until the owner decides. |
| [SCORING_LOGIC.md](SCORING_LOGIC.md)                                           | How every score is computed: the compliance score (formula v3 — severity-weighted, critical-capped, obligations, versioned), flow scoring, Advisor risk/confidence, Analytics rules.               |
| [LAW_MONITORING.md](LAW_MONITORING.md)                                         | How law-change monitoring works, the 2026-07-30 coverage audit, and why sweeping a page is not detecting an amendment on it.                                                                       |
| [LAW_CHANGE_NOTIFICATIONS.md](LAW_CHANGE_NOTIFICATIONS.md)                     | Internal-only weekly digest: decided and built 2026-08-06. Nothing sends until the owner deploy steps (§7 / TODO.md OA13) are done.                                                                |
| [advisor-corpus-review-pack-ontario.md](advisor-corpus-review-pack-ontario.md) | The first human-review pass, prepared: all 14 Ontario chunks with figures to verify, priority order, and per-chunk sign-off SQL. Review itself is a human act (TODO L5).                           |
| [notice-bands-review-pack.md](notice-bands-review-pack.md)                     | QC/FED statutory notice band research pack for qualified legal sign-off (TODO L6).                                                                                                                 |
| [notice-bands-decision.md](notice-bands-decision.md)                           | Interim product decision to keep QC/FED at `bands: null` and hard UI hedges until sign-off.                                                                                                        |
| [GAP_AUDIT_STATUS.md](GAP_AUDIT_STATUS.md)                                     | Engineering completion status for the cross-cutting gap audit (legal, product, architecture, security, maintainability, testing).                                                                  |
| [advisor-guidance-corpus-2026-07-26.md](advisor-guidance-corpus-2026-07-26.md) | Grounding corpus seed — ON/QC/FED termination notice. Machine-curated, pending human review.                                                                                                       |
| [advisor-guidance-corpus-2026-07-27.md](advisor-guidance-corpus-2026-07-27.md) | Second tranche — leaves, public holidays, hours of work, accommodation.                                                                                                                            |
| [advisor-guidance-corpus-2026-07-29.md](advisor-guidance-corpus-2026-07-29.md) | Third tranche — pay & deductions, records retention, layoffs & recall, constructive dismissal, workplace injury.                                                                                   |

Editorial rule for public articles — no statutory figures, ever — is stated in
`src/features/marketing/articles/articleModel.ts` and enforced by
`src/features/marketing/articles/articles.test.ts`.

## Privacy, security and data

| Document                                                                     | What it settles                                                                                                                                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [SECURITY_HEADERS.md](SECURITY_HEADERS.md)                                   | HTTP security headers in `vercel.json`: the enforcing set, the Report-Only CSP, and how to promote it.                                                                                                       |
| [ERROR_REPORTING.md](ERROR_REPORTING.md)                                     | First-party crash reporting, the privacy scrubbing rules, and source-map handling.                                                                                                                           |
| [EXPORT_PROTECTION.md](EXPORT_PROTECTION.md)                                 | Watermarking, fingerprinting, velocity limits, audit trail, and the runbook for tracing a leak.                                                                                                              |
| [do-residency-confirmation-request.md](do-residency-confirmation-request.md) | OA9 ticket #12739848 (sent 2026-08-27). Reply: [do-residency-confirmation-response-2026-08-27.md](do-residency-confirmation-response-2026-08-27.md). Serverless not pinable; Dedicated TOR1 for Canada-only. |

## Data and platform

| Document                                       | What it settles                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)       | How the live Supabase schema is tracked against the repo.                   |
| [MIGRATION_LEDGER.md](MIGRATION_LEDGER.md)     | Known migration filename exceptions (e.g. applied duplicate `0024`).        |
| [DATA_MODEL.md](DATA_MODEL.md)                 | HR Documents Library data model, transcribed from the handoff.              |
| [AUTH_MAGIC_LINK.md](AUTH_MAGIC_LINK.md)       | Magic-link sign-in and the Supabase configuration it needs.                 |
| [BILLING_BETA_AUDIT.md](BILLING_BETA_AUDIT.md) | Stripe billing and beta-signup audit, with remediation status.              |
| [STRIPE_GO_LIVE.md](STRIPE_GO_LIVE.md)         | Stripe go-live checklist and OA11 completion record (closed 2026-08-27).    |
| [MAINTAINABILITY.md](MAINTAINABILITY.md)       | Long-term codebase health: patterns, hotspots, template review cadence, CI. |
| [OFFLINE_PWA.md](OFFLINE_PWA.md)               | Service worker, offline behaviour, and how to test it.                      |

## Web surface

| Document                                               | What it settles                                                                         |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [SEO_GEO_IMPLEMENTATION.md](SEO_GEO_IMPLEMENTATION.md) | Search- and answer-engine visibility: prerendering, per-locale routes, structured data. |
| [SEO_ROUTE_MATRIX.md](SEO_ROUTE_MATRIX.md)             | Every route, classified. Derived from the router.                                       |
| [SEO_AUTHORITY_PLAYBOOK.md](SEO_AUTHORITY_PLAYBOOK.md) | The off-site half: listings, associations, citations, and what is deliberately barred.  |
| [DEV_ANNOTATIONS.md](DEV_ANNOTATIONS.md)               | The in-app annotation overlay for AI-assisted editing. Dev and preview only.            |

## Testing

| Document                                           | What it settles                                                                                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [../e2e/README.md](../e2e/README.md)               | Playwright suites: hermetic smoke (`npm run test:e2e`) and authenticated production CRUD (`npm run test:e2e:auth`), env vars, Woodpecker wiring, and the module-by-module matrix in `e2e/auth/critical-path.spec.ts`. |
| [visual-qa-2026-08-23.md](visual-qa-2026-08-23.md) | Browser + Vitest + E2E pass matrix for the end-to-end polish pass (PRs #201–#203); what still needs a signed-in manual spot-check.                                                                                    |

## Support

| Document                                                 | What it settles                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [SUPPORT_ARCHITECTURE.md](SUPPORT_ARCHITECTURE.md)       | The digital-first support model and how its pieces fit.                              |
| [SUPPORT_RUNBOOK.md](SUPPORT_RUNBOOK.md)                 | Operating support solo, in structured review blocks.                                 |
| [SUPPORT_CALL_SCHEDULING.md](SUPPORT_CALL_SCHEDULING.md) | Propose/confirm/remind/follow-up for scheduled calls, and the Google Calendar setup. |
| [SUPPORT_ANALYTICS.md](SUPPORT_ANALYTICS.md)             | Support funnel analytics: privacy model, data schema, and how to query the data.     |

## Consumer product family

| Document                                 | What it settles                                                                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [consumer/README.md](consumer/README.md) | Product definition, architecture, requirements, workflows, AI safety, data governance, roadmaps, and open questions for the Canadian Life Admin / Canadian Document Generation / Personal Evidence Locker product family. |

## Design handoffs

Feature work is driven by high-fidelity handoffs, committed alongside the code
they produced (AGENTS.md § Design handoffs):

- [design-handoff-hr-documents-library/](design-handoff-hr-documents-library/) — Document Studio, template detail, repository, generate wizard.
- [design-handoff-advisor-chat/](design-handoff-advisor-chat/) — Advisor response experience, memory, engineering roadmap. Its `AGENT.md` is the contract for how the Advisor communicates.

## Adding a document

Add the file, then add its row here — an unlisted document is one nobody
finds. If it asserts a fact that also lives in code, say which file wins and
add the check alongside the others (`src/canonicalFacts.test.ts`, or
`scripts/check-canonical-facts.mjs` if the value lives in CSS).
