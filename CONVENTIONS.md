# Dutiva Web — Engineering Conventions

This codebase implements the high-fidelity design handoff in
`C:\Users\Marti\Downloads\# HR Compliance AI Advisor\design_handoff_dutiva_hr_platform\`
(start with its `README.md`). The prototype HTML files are the **source of truth for
every pixel and every string (EN + FR)** — when in doubt, read the prototype.

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · react-router v7 ·
lucide-react · Vitest + Testing Library · oxlint · Prettier.

Scripts: `npm run dev | build | typecheck | lint | test | format | check`.

## Directory layout

```text
src/
  app/            App root, providers, router, route tables
  components/     Cross-feature shared UI (Disclaimer, chip tone/status classes)
  data/           Entity types + realistic sample fixtures (swap for Supabase later)
  features/
    marketing/    Landing page (dutiva.ca) — sections + its i18n module
    app/
      shell/      EntryStage, AppShell (sidebar, topbar, mobile drawer)
      views/      One folder per workspace view
      advisor/    Shared chat core (bubbles, tone cards, streaming engine)
      search/     Global search overlay
      rail/       Advisor rail (contextual right panel)
      toasts/     Toast context + host
      docstudio/  Guided document-generation overlay (right-hand drawer, live preview)
      documents/  HR Documents Library — repository, template, and studio screens
      workspaceContext/  "Advisor is using …" pinned-entity banner state
  i18n/           Language provider + message catalogue
  lib/            prefs, theme, generic hooks/utils
  styles/         tokens.css, surfaces.css, patterns.css, animations.css, base.css
  test/           Vitest setup
```

## Routes

Public marketing routes are bilingual: English at the unprefixed path,
French under `/fr` with localized slugs. Both trees are generated from the
SEO route registry (`src/seo/routes.ts`) — **adding or renaming a public
route starts there**, see `docs/SEO_GEO_IMPLEMENTATION.md`. Public pages are
prerendered to static HTML at build time (`scripts/prerender.mjs`); `/app…`
stays client-rendered and noindex.

| Path                                                                                                                                                                                                                                                                                            | Renders                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                                                                                                                                                                                                                                             | Marketing landing page                                                                                                 |
| `/about`                                                                                                                                                                                                                                                                                        | About page                                                                                                             |
| `/faq`                                                                                                                                                                                                                                                                                          | FAQ                                                                                                                    |
| `/blog` · `/blog/:slug`                                                                                                                                                                                                                                                                         | Blog index and article                                                                                                 |
| `/pricing`                                                                                                                                                                                                                                                                                      | Plan comparison + Stripe checkout (wrapped in Auth+Plan providers only, not the full `AppProviders`)                   |
| `/templates`                                                                                                                                                                                                                                                                                    | Template catalogue preview — renders the real Document Studio fixture data                                             |
| `/guides` · `/guides/template-usage` · `/guides/:slug`                                                                                                                                                                                                                                          | Guides index, template-usage how-to, and guide article                                                                 |
| `/known-limitations`                                                                                                                                                                                                                                                                            | Known limitations                                                                                                      |
| `/legal` → `/legal/:slug`                                                                                                                                                                                                                                                                       | Policy index → one of 26 policy documents                                                                              |
| `/help` · `/help/:slug`                                                                                                                                                                                                                                                                         | Help centre index and article                                                                                          |
| `/contact`                                                                                                                                                                                                                                                                                      | Contact / support request                                                                                              |
| `/status`                                                                                                                                                                                                                                                                                       | Service status                                                                                                         |
| `/changelog`                                                                                                                                                                                                                                                                                    | Dated public product updates                                                                                           |
| `/vs/hrdownloads` · `/vs/sixfifty`                                                                                                                                                                                                                                                              | Competitor comparison pages (hedged rival claims; FAQ schema)                                                          |
| `/tools/jurisdiction-check`                                                                                                                                                                                                                                                                     | Jurisdiction checker tool                                                                                              |
| `/fr` · `/fr/a-propos` · `/fr/faq` · `/fr/blogue` · `/fr/tarifs` · `/fr/modeles` · `/fr/guides` · `/fr/guides/utilisation-des-modeles` · `/fr/limites-connues` · `/fr/juridique/:frSlug` · `/fr/aide` · `/fr/aide/:frSlug` · `/fr/contact` · `/fr/etat` · `/fr/journal-des-modifications` · `/fr/vs/hrdownloads` · `/fr/vs/sixfifty` · `/fr/outils/verification-juridiction` | The same public pages in French (localized slugs from `src/seo/routes.ts` + `legalHubData.ts`)                         |
| `*`                                                                                                                                                                                                                                                                                             | Bilingual 404 page (noindex; static hosting serves `dist/404.html` with a real 404 status)                             |
| `/app/welcome`                                                                                                                                                                                                                                                                                  | App entry stage (sign-in preview)                                                                                      |
| `/app/auth/confirm`                                                                                                                                                                                                                                                                             | Magic-link confirmation landing                                                                                        |
| `/app` → `/app/home`                                                                                                                                                                                                                                                                            | Workspace shell redirect                                                                                               |
| `/app/home`                                                                                                                                                                                                                                                                                     | Home / command centre                                                                                                  |
| `/app/advisor`                                                                                                                                                                                                                                                                                  | AI Advisor chat                                                                                                        |
| `/app/workflows` · `/app/workflows/:slug`                                                                                                                                                                                                                                                       | Workflows list + flow runner                                                                                           |
| `/app/cases` · `/app/cases/:caseId`                                                                                                                                                                                                                                                             | Cases list + case detail                                                                                               |
| `/app/employees` · `/app/employees/:employeeId`                                                                                                                                                                                                                                                 | Employee roster + profile                                                                                              |
| `/app/compliance`                                                                                                                                                                                                                                                                               | Compliance register                                                                                                    |
| `/app/policies`                                                                                                                                                                                                                                                                                 | Policy register                                                                                                        |
| `/app/analytics`                                                                                                                                                                                                                                                                                | Analytics dashboard                                                                                                    |
| `/app/knowledge` · `/app/knowledge/:slug`                                                                                                                                                                                                                                                       | Knowledge index + reference guide                                                                                      |
| `/app/support` · `/app/support/requests` · `/app/support/requests/:ticketId`                                                                                                                                                                                                                    | Support hub + request list + ticket detail                                                                             |
| `/app/support/admin` · `/app/support/admin/exports` · `/app/support/admin/:ticketId`                                                                                                                                                                                                            | Founder/operator support dashboard + export audit + admin ticket                                                       |
| `/app/communications`                                                                                                                                                                                                                                                                           | Communications register                                                                                                |
| `/app/compensation`                                                                                                                                                                                                                                                                             | Compensation register                                                                                                  |
| `/app/wellbeing`                                                                                                                                                                                                                                                                                | Wellbeing register                                                                                                     |
| `/app/planning` · `/app/planning/tasks` · `/app/planning/calendar`                                                                                                                                                                                                                              | Planning section — Tasks + Calendar as sub-tabs                                                                        |
| `/app/settings` · `/app/settings/memory` · `/app/settings/memory/people/:personId` · `/app/settings/memory/cases/:caseId` · `/app/settings/memory/conversations/:threadId`                                                                                                                      | Settings — General settings + Advisor Memory as sub-tabs                                                               |
| `/app/documents` · `/app/documents/hr-library` · `/app/documents/studio` · `/app/documents/templates/:tid` · `/app/documents/generate/:templateId` · `/app/documents/sign/:envelopeId` · `/app/documents/:docId` · `/sign/:token` · `/fr/sign/:token`                                                                                | HR Documents Library — Repository, HR Library, Studio, template detail, generate wizard, in-workspace signing, external token signing (EN/FR UI), document detail |

Canonical redirects: `/app/reports` → `/app/analytics`; `/app/templates` →
`/app/documents/hr-library`; `/app/tasks` → `/app/planning/tasks`;
`/app/calendar` → `/app/planning/calendar`; `/app/memory` → `/app/settings/memory`.

Navigation between entities (e.g. an Advisor tone-card action "Open case") uses
these routes — never view-state flags.

## Theming & surfaces

- The active theme is `data-theme="dark" | "light"` on `<html>`, set before first
  paint by `index.html` and kept in sync by `ThemeProvider` (persist key
  `dutiva-theme`). Never read `prefers-color-scheme` directly.
- Two token scopes (`src/styles/surfaces.css`): `.surface-marketing` (design-system
  ramp, dark-first) wraps the landing page; `.surface-app` (App v2 ramp,
  light-first) wraps the workspace. Both define `--bg`, `--text`, `--border`, … so
  the same utility (`bg-bg`, `text-text-2`) resolves per surface. Most
  `.surface-marketing` values are ported verbatim from the design system, but a few
  (`--text-3`, `--muted-2`, `--gold-strong`) are intentionally adjusted for WCAG AA
  contrast — see the inline comments. Preserve those overrides if the ramp is
  re-synced upstream.
- **Never hardcode a colour that exists as a token.** Use the mapped Tailwind
  utilities (`bg-surface`, `text-gold-fg`, `border-risk-border`, …) or
  `var(--token)` in rare inline styles. Prototype-exact pixel values without a
  token use arbitrary values: `rounded-[12px]`, `text-[14.5px]`, `px-[18px]`.
- Signature marketing classes (`.premium-card`, `.gold-button`, `.badge`,
  `.dutiva-pill`, `.gradient-text`, `.dutiva-surface`) live in
  `src/styles/patterns.css` — use them, don't re-implement.

## i18n (bilingual everything)

- Every user-facing string ships EN + FR. UI-chrome strings live in per-feature
  modules under `src/i18n/messages/<feature>.ts` using `defineMessages({ key:
{ en, fr } })`; keys are prefixed by feature (`home_`, `advisor_`, `landing_`,
  `shell_` …). Register new modules in `src/i18n/messages/index.ts` (single
  spread — coordinate, don't duplicate keys).
- Entity/sample data carries bilingual fields typed as `Bi` (`{ en, fr }`) from
  `src/i18n/core.ts` — built with `bi('English', 'Français')`.
- Components consume via `const { t, L, x, lang } = useI18n()`:
  `t('home_title')` for catalogue keys, `x(employee.role)` for data fields,
  `L('inline EN', 'FR inline')` sparingly for one-offs.
- French translations come **from the prototype** (its `buildI18n()`, `frDict()`
  and `L(en, fr)` calls) — never machine-translate ad hoc when the prototype has
  the string.
- The language toggle persists to `dutiva-lang` and must update `<html lang>`
  (`en-CA` / `fr-CA`). On public pages the URL is the source of truth for
  language (`ForcedLangProvider`; `/fr…` → French) and the toggle navigates
  to the same page's URL in the other language; the app surface keeps the
  in-place preference toggle (`LangProvider`).

## Data

- Types in `src/data/types.ts`; fixtures per domain (`employees.ts`, `cases.ts`,
  …) exporting typed constants. Views never inline entity data — they import
  fixtures, so a future Supabase provider can replace the module wholesale.
- Sample people/cases (Jordan Mensah, etc.) are realistic fixtures, not shippable
  content — keep them clearly grouped under `src/data/`.

## Workspace mode (demo ⇄ production)

`useWorkspaceMode()` (`src/features/app/workspaceMode/`) resolves to `'demo'`
or `'production'` and exposes the current `identity` (company + user). It
defaults to `'demo'` — today's Northgate Logistics Inc./Riley Summers
experience — for everyone; `'production'` only ever activates for a
signed-in, confirmed admin (`is_admin_user()` RPC, backed by the real
`admin_users` table — today: just Martin) who has explicitly stored that
preference (`workspace_preferences`, RLS-gated to the admin's own row). No
Supabase config, signed-out, or non-admin all resolve to `'demo'`, so this
is safe to read from any view without a route guard or breaking tests
(`VITE_SUPABASE_*` are forced empty for the whole suite).

Phase 1 wired the toggle itself (Settings → Workspace, admin-only), the
shell identity (`Sidebar.tsx`), and Home's tailored empty state
(`HomeProductionEmptyState.tsx`). **Phase 2 onward replaced route-level
`ModeGate` with view-level dispatch:** each module's `*View.tsx` switches
on `useWorkspaceMode()` — demo keeps Northgate fixtures; production renders
a `*ProductionView.tsx` backed by `productionApi.ts` (or an honest empty
state when the org has no rows). `ModeGate.tsx` remains in the repo for
tests and legacy docs but is **not wired to any route** in `appViews.tsx`.
Shell surfaces are mode-aware (topbar notifications, sidebar nav badges,
the global search corpus, Settings' Northgate-only sections, the Advisor's
fixture threads and home widgets). Deliberately ungated:
Advisor chat (real backend), Knowledge (generic HR-law reference + the
real guidance panel), Settings, Advisor Memory (`hr_advisor_memory_facts`,
migration 0086 — views dispatch on mode), Document Studio catalog screens
(real product templates), and the document repository + detail
(`hr_generated_documents`, migration 0076; signing via
`hr_document_signatures` / `hr_document_recipients`, migrations 0077–0078;
signed PDF export via `hr_document_exports`, migration 0079;
external signing tokens via migration 0080; persisted PDFs in Storage via 0081).
The legacy HR Library gallery is demo-only; production redirects to Studio
(`HrLibraryRoute` → `/app/documents/studio`).

Wiring a module to real persistence follows the Employees reference shape
(one module per PR): add org-scoped tables + RLS, a zod-validated
`productionApi.ts`, a `*ProductionView.tsx`, and mode dispatch in the view
shell — don't thread production conditionals through a view that is still
fully fixture-driven without a production counterpart.

**Employees is the reference implementation** (Phase 3): the context
exposes `organizationId` (auto-provisioned via the backend's
`create_organization()` RPC on the admin's first switch to production),
`public.employees` is org-scoped by RLS (`is_org_member` read /
`is_org_admin` write — migration 0006), `EmployeesView` switches on mode,
and the production roster lives in its own lean component
(`EmployeesProductionView` + `productionApi.ts`, zod-validated rows that
throw on failure rather than silently emptying). Follow that shape —
per-tenant table keyed by `organization_id`, a `productionApi.ts`
boundary, a separate production view component — for the next module.
**Cases followed it in Phase 4** (`public.hr_cases`, migration 0007;
`CasesProductionView` adds the first status-update write path and links
cases to real employees via `employee_id`). **Tasks followed in Phase 5
with no migration at all** — it reuses the backend's own
`public.compliance_tasks` table and RLS; when the live schema already has
a fitting per-tenant table, prefer wiring to it over minting a parallel
one (check its RLS and check-constraints first, and tolerate enum values
beyond what the UI writes, the way `tasks/productionApi.ts` treats
statuses it never sets). **Compliance followed in Phase 6**, same
zero-migration pattern on `public.compliance_findings` — the table the
backend's AI assessment pipeline writes to, so pipeline-generated
findings will appear in the register alongside manually logged ones.
**Policies followed in Phase 7** (`public.hr_policies`, migration 0008) —
a register whose rows are written policies or known gaps (`missing`),
where flipping a policy back to `up_to_date` stamps `last_reviewed`.
**Reports followed in Phase 8 with no table and no writes** — it
aggregates live from the other modules' `productionApi.list*` functions;
aggregation-only views should reuse those boundaries rather than issuing
their own queries. **Home followed in Phase 9** the same way: a brand-new
workspace keeps the welcome state (`HomeProductionEmptyState`), and once
records exist `HomeProductionView` renders the real command centre —
stat tiles deep-linking to modules, a due-soon list over cases + tasks
(overdue flagged), and a policy-attention row. **Calendar followed in
Phase 10**: the demo's month grid rebuilt over real case/task due dates,
with month navigation from today. **Case detail followed in Phase 11**
(`public.hr_case_notes`, migration 0009): production case rows open a
real working record — facts header, status select, and a notes thread.
Child tables denormalize `organization_id` so RLS stays a direct
`is_org_member`/`is_org_admin` check instead of a join. **Employee
profiles followed in Phase 12** (`public.hr_employee_notes`, migration
0010), adding the first cross-module linkage: a profile lists the
employee's open `hr_cases`, linking through to the case detail.
**Phase 13 made the sidebar badges live in production**
(`useProductionNavBadges` + `countOpen*` head-count queries in each
productionApi): real open counts for Cases/Tasks/Compliance, refreshed on
every route change, shown only when a module has open work. **Phase 14
exposed the org membership role** (`memberRole` + `isOrgAdmin` on
`useWorkspaceMode()`, mirroring RLS's `is_org_admin`): production write
surfaces render only for org admins — the UI no longer offers writes the
database would refuse — and Analytics carries a declarative per-card
visibility policy (`analytics/cardVisibility.ts`, every card
member-visible today) so hiding a card per role is a one-word change.

After Phase 14, **Communications (migration 0040), Compensation
(migration 0039), and Wellbeing (migration 0041)** were ungated and now
dispatch on mode themselves, following the same shape: per-tenant tables,
`productionApi.ts` boundaries, and separate production view components.
**Documents repository (migration 0076)** followed the same pattern:
`hr_generated_documents` + versions + audit; Generate persists in
production; repository, detail, and signing dispatch on mode and are
ungated (signing envelopes: migration 0077, `dutiva_embedded` adapter).
In production, `DoclibProvider` loads the template catalogue only (no
Northgate sample documents/people); Studio org profile follows the signed-in
admin's company name and province.
**Advisor Memory (migration 0086)** followed next: `hr_advisor_memory_facts`
+ `hr_advisor_memory_audit`; manager / person / case / thread views dispatch
on mode and are ungated. Confirmed non-sensitive facts are injected into
`advisor-chat` when `organization_id` is present; inferred candidates can be
auto-extracted from a stripped `dutiva-memory` fence on replies. Case resume
narratives and timeline events live in migration **0087**
(`hr_advisor_case_narratives` / `hr_advisor_case_timeline_events`); production
chat-recall shows the caller's own `conversations` transcript when the thread
id matches.
The **Support hub** is a real, ungated feature (migrations 0014–0016 plus
`create-support-ticket`) that creates support tickets without an account
and surfaces a founder/operator admin dashboard. Production mode itself
is still platform-admin-gated; opening the workspace to invited members is
the follow-up this scaffolding awaits.

## Billing (Stripe paywall — prep work)

Ported from the production `dutiva-website` repo's Stripe integration, scoped to
prep work only: `/pricing` and its checkout/portal flow are real and wired to
Stripe, but **/app's access gate is unchanged** — it's still `RequireAdminSession`
(one invite-only account), not plan-based. Wiring a paid area to plan access is
follow-up work, not done here.

- `src/config/plans.ts` — canonical plan catalogue (free/starter/growth/pro),
  reusing the landing page Pricing section's `landing_*` i18n keys so the
  teaser and the full page never drift out of copy sync.
- `src/lib/billing/adminAccess.ts` — the paywall-bypass check (explicit
  `ADMIN_EMAILS` list + `@dutiva.ca` domain), independent of
  `features/app/auth/allowedEmail.ts` (which answers "may this account sign
  into the workspace", a different question, even though today it's the same
  person).
- `src/features/app/billing/PlanProvider.tsx` (`usePlan()`) — resolves the
  signed-in account's plan; an internal account always resolves to the top
  plan with billing bypassed. Wraps `/pricing` directly in router.tsx
  (Auth + Plan only — not the full `AppProviders` bundle).
- `src/features/app/billing/PlanGate.tsx` — reusable gate for a future paid
  view; not applied anywhere yet.
- `supabase/functions/{create-checkout-session,create-portal-session,create-advisor-pack-checkout,stripe-webhook}` —
  real Stripe calls via raw `fetch` (no `stripe` npm dependency, matches
  `advisor-chat`'s Deno.serve + bearer-JWT pattern). Plan checkout writes to
  `public.profiles` (migration `0013_add_billing_profiles.sql`). Pack checkout
  credits `ai_advisor_credits` (migration `0091_advisor_usage_credits.sql`) and
  does **not** change `profiles.plan`. All four respond `503`/"not configured"
  until `STRIPE_SECRET_KEY` etc. are set as function secrets — see
  `.env.example`. An admin/internal account short-circuits checkout, packs, and
  portal with a `bypass: true` response instead of ever calling Stripe.

## Icons & assets

- **lucide-react only** (pinned `^0.542.0`), stroke width per prototype (app uses
  1.7–1.9, round caps). **No emoji anywhere.**
- Brand mark: `public/brand/dutiva-leaf.png` (never redraw); app icon
  `public/brand/icon-app.svg`. Wordmark is text: "Duti" in `var(--text)` + "va"
  in gold, Montserrat 700.

## Accessibility & motion

- Icon-only buttons carry `aria-label`; hit targets ≥ 44px on mobile;
  `:focus-visible` outline comes from `base.css` — don't suppress it.
- House motion: `cubic-bezier(.4,0,.2,1)` ~160ms; entrances ~450ms; keyframes in
  `animations.css` (`fadeInUp`, `pulseDot`, `blinkCursor`, `toastIn`,
  `slideInRight`, `shimmer`). Respect `prefers-reduced-motion` (already global).

## Legal disclaimer

The standing disclaimer — "Dutiva provides practical HR workflow support and
compliance-oriented guidance. It does not provide legal advice." — must ship near
CTAs, generated documents, and Advisor output. Use the shared `Disclaimer`
component / `t('disclaimer')`.

## Quality bar

- `npm run check` (typecheck + lint + tests) must pass before every commit.
- Colocate tests as `*.test.ts(x)` next to the unit under test.
- **E2E:** hermetic smoke via `npm run test:e2e` (CSP + routing + hydration);
  authenticated production CRUD via `npm run test:e2e:auth` when Supabase env
  is set — see [e2e/README.md](e2e/README.md) for the module matrix.
- Prefer semantic tokens and shared primitives over copy-pasted styles; keep
  components small and per-view folders self-contained.

### The eager entry graph is budgeted

`npm run build` runs `scripts/check-entry-graph.mjs`, which fails on what a
first-time visitor to a public page downloads before anything is interactive:
the entry chunk plus every `modulepreload`. It bars the workspace
(`src/features/app/**`, outside a short allowlist), the demo fixtures
(`src/data/**`), and three dependency trees (react-markdown, Supabase,
recharts) from that set, and caps the preload count and raw bytes.

This is not a micro-optimisation rule. Every view is already `lazy()`, so the
split looks correct in the source and breaks in the output: a single non-lazy
import from a module the router touches drags its whole tree onto the marketing
critical path, and nothing else notices. If the check fires, the fix is almost
always to import the pure part rather than to widen the allowlist —
`shell/navLabels.ts` exists for exactly that reason.
