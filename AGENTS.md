# AGENTS.md

Instructions for AI coding agents working in this repository (Claude Code,
Codex, Cursor, Copilot, etc.). See [CONVENTIONS.md](CONVENTIONS.md) for the
full engineering conventions this file summarizes — read it before making any
non-trivial change, and [docs/README.md](docs/README.md) for the documentation
index.

## Facts come from one place

**[docs/CANONICAL_FACTS.md](docs/CANONICAL_FACTS.md) is the source of record**
for every load-bearing fact about Dutiva — template and jurisdiction counts,
pricing, company details, launch status, and the list of claims that must not
be made. Dutiva is a compliance product, so a wrong fact is a product defect,
not a typo.

Read it before writing or changing any customer-facing number, capability
claim, or statement about what Dutiva covers. Its precedence rule: where that
file disagrees with the code, **the code wins and the file gets corrected** —
in the same PR. `npm run check` enforces this and fails on drift
(`src/canonicalFacts.test.ts` plus `npm run check:facts`).

Two standing rules that follow from it:

- **Never state a statutory figure in public editorial content** — no
  notice-week tables, dollar thresholds or deadline counts in `/guides` or
  `/blog`. Name the statute, describe the shape of the rule, point at the
  official text. See `src/features/marketing/articles/articleModel.ts`;
  enforced by `articles.test.ts`.
- **Don't upgrade a hedge into a claim.** "Compliance-oriented" is not
  "compliant"; "monitored" is not "covered". Where the product states a
  limitation, that wording is deliberate.

## Voice and natural language

**[docs/NATURAL_LANGUAGE_COPY.md](docs/NATURAL_LANGUAGE_COPY.md)** is the source
of record for *how* we write user-facing prose (marketing, UI, FAQ, changelog,
Advisor chrome). Model communication — intent, audience, density, rhythm,
revision — not robotic “correct” English. Never upgrade hedges; never invent
claims. Cursor loads a short always-on summary from
`.cursor/rules/natural-language-copy.mdc`.

## Project

Dutiva Web — a Canadian HR-compliance platform (dutiva.ca marketing site +
the AI-Advisor product workspace). React 19 + TypeScript (strict) + Vite +
Tailwind v4 + react-router v7. Proprietary; see [LICENSE.md](LICENSE.md).

## Setup

```bash
npm install
npm run dev        # start the dev server
```

## Commands

| Command             | What it does                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck` | `tsc -b` (strict)                                                                                                                       |
| `npm run lint`      | oxlint                                                                                                                                  |
| `npm run test`      | Vitest (jsdom + Testing Library)                                                                                                        |
| `npm run test:e2e`  | Playwright hermetic smoke on `dist/` ([e2e/README.md](e2e/README.md)) — no Supabase                                                   |
| `npm run test:e2e:auth` | Playwright production CRUD matrix — requires Supabase build env + service role; skips when unset                                  |
| `npm run format`    | Prettier                                                                                                                                |
| `npm run check`     | typecheck + lint + test + `check:migrations` + `check:rls` + `check:facts` + `check:message-scopes` + `check:brand-assets` + `check:architecture` — **must pass before every commit** |
| `npm run db:types`  | Regenerate `src/lib/supabase/database.types.ts` and the edge-function copy from the linked Supabase project |
| `npm run build`     | typecheck + production build + SSR + prerender + SEO validation + entry-graph budget + service worker                                   |

## Non-negotiables

- **Bilingual everything.** Every user-facing string ships as an `{ en, fr }`
  pair (`Bi` / `defineMessages`) — never hardcode English-only UI copy or
  entity data. French comes from the design handoff's own French content
  when present; otherwise mark it `[FR self-authored]` at the definition
  site — never machine-translate silently over an existing prototype string.
- **Design tokens, not hardcoded colors.** If a color exists as a token
  (`bg-surface`, `text-gold-fg`, `border-risk-border`, `var(--token)`), use
  it — don't inline a hex value that duplicates one.
- **lucide-react only** for icons; **no emoji** anywhere in the app or its
  content.
- **Data fixtures, not inline entity data.** Views import from `src/data/`;
  never inline sample people/cases/etc. directly in a component.
- **Colocate tests** as `*.test.ts(x)` next to the unit under test.
- **The standing legal disclaimer** ("Dutiva provides practical HR workflow
  support and compliance-oriented guidance. It does not provide legal
  advice.") must ship near CTAs, generated documents, and Advisor output —
  via the shared `Disclaimer` component, never re-typed.
- **Workspace mode.** The app defaults to a demo experience (Northgate
  Logistics Inc. fixtures) for everyone; a signed-in admin can switch to a
  real, empty "production" workspace via `useWorkspaceMode()`. Demo UI lives
  in `*DemoView.tsx` (or `*DemoFixtures.tsx` for single-view modules) —
  never inline in `*View.tsx`. See CONVENTIONS.md's Workspace mode section
  and [docs/MAINTAINABILITY.md](docs/MAINTAINABILITY.md) before wiring
  fixtures to real persistence.

## Maintainability

**[docs/MAINTAINABILITY.md](docs/MAINTAINABILITY.md)** records the demo/production
file-split program, `check:architecture` guards, Advisor extraction modules,
and template review cadence. Read it before adding a workspace view or growing
a file past the 800-line budget.

## Design handoffs

Feature work in this repo is driven by high-fidelity design handoffs
(prototype HTML + spec docs + screenshots). Prototypes are the source of
truth for pixels and copy — when in doubt, read the prototype, not this
file. Handoffs used to build a feature belong in the repo, not just in the
upload/chat that produced the PR: commit them under
`docs/design-handoff-<slug>/`, following the existing examples
(`docs/design-handoff-hr-documents-library/`,
`docs/design-handoff-advisor-chat/`,
`docs/design-handoff-analytics/`). Scan any handoff package for
credentials/tokens before committing it.

## Before committing

Run `npm run check`. If you add or change a route, update the route table in
CONVENTIONS.md. If you touch anything user-facing, verify both languages and
both themes (light/dark) render correctly.

## Migrations ship in two halves — check both

A migration merged is not a migration applied. Several features have shipped
**inert** because the SQL sat in `supabase/migrations/` and never reached the
project, and nothing in the test suite can see that. Same for edge functions —
merging one does not deploy it.

`npm run check` runs `check:migrations`, which enforces filename discipline
always and, when `SUPABASE_ACCESS_TOKEN` / `SUPABASE_PROJECT_REF` are set,
fails on any migration present in the repo but not applied to the project.
After merging anything that adds a migration or touches
`supabase/functions/**`, apply and deploy it, then record what you verified —
"tests pass" is not evidence that a server-side change is live.
