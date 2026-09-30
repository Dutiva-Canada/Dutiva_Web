# Module readiness checklist

The bar a workspace module must clear before its nav entry ships. It exists
because "module" once meant "a route that renders something" — the 2026-09
hardening audit found screens that looked complete while doing nothing, and
quick-create entries that dead-ended. A module that cannot clear every row
below stays out of the nav, or ships with an honest `ProductionEmptyState`
plus an in-development note — never a dressed-up shell.

## The checklist

1. **Nav entry names what it is.** The label tells a visitor which surface
   they land on; two modules never share near-identical names (see the
   Comms planner / Message log disambiguation). FR label is a real
   translation, not a lazy mirror.
2. **A working route in both modes.** `*DemoView` renders fixtures;
   `*ProductionView` renders the org-scoped implementation or
   `ProductionEmptyState` — never a blank or a fixture in production.
3. **An empty state with a real first action.** `ProductionEmptyState`
   must link somewhere that works (employees, Document Studio, workflows,
   settings) — a first-visit user reaches a working surface in one click.
4. **At least one create/view flow that persists.** For CRUD modules:
   validate → write through `productionApi` (or the module's documented
   local persistence, e.g. CRM's org-scoped localStorage) → render in list
   → survive reload. Read-only modules (Analytics) must show real
   org-scoped data once any exists.
5. **No dead controls.** Every button either works, is hidden where the
   mode cannot use it, or is disabled with a visible reason (inline hint
   or tooltip — the layout-level demo banner is not enough for a disabled
   form field). Quick-create entries must land on a surface whose create
   action exists (prefer `useOpenCreateFormFromQuery` so `?new=1` opens it).
6. **EN + FR complete.** Every string via `defineMessages`; plural strings
   split 1/many (`{n} dossier` / `{n} dossiers`); self-authored FR marked
   `[FR self-authored]`.
7. **A colocated test.** At minimum the production path: list renders
   backend rows (not fixtures), the create flow inserts and re-renders,
   permission gates hide write controls.
8. **Badges derive from one source.** Any nav badge for the module reads
   the same counter the view renders — no second query that can disagree
   (see `useProductionNavBadges`).

## Current verdicts (2026-09-30 audit)

| Module | Persistence | Verdict |
| --- | --- | --- |
| Employees | `productionApi` → `employees` table | Real — create validates, persists, links to detail |
| Cases | `productionApi` → cases tables; `?new=1` honored | Real |
| Comms planner | `data/productionApi` → comms tables | Real; Settings usage-controls read-only in demo with local hint |
| Message log (`/app/communications`) | `productionApi` → communications tables | Real |
| CRM | `useCrmData` → org-scoped localStorage | Real — documented local persistence (browser) |
| Finance | `data/productionApi` → finance tables | Real |
| Governance | `data/productionApi` → governance_* tables | Real |
| Security | `data/productionApi` → security tables | Real |
| Specialists | `data/productionApi` → specialists + engagements | Real |
| Analytics | `productionApi` → org-scoped aggregation | Real (read-only by design) |
| Revenue | `data/productionApi` | Real |
| Compensation / Compliance / Hiring / Memory / Tasks | `productionApi` | Real |
| Workflows | Guided-flow catalog (`flows/`) + plan gates | Real — cards start real flows; gated cards show upgrade nudge |

The "empty shell" symptom the external audit reported was the pre-gate
resolution window (fixed in `f9002c26`): production surfaces mounted before
the org id resolved and rendered the designed empty state. The gate now
holds a blank surface until the workspace pass commits.

## Quick-create menu contract

Every `SidebarCreateMenu` action must satisfy one of:

- `href` to a surface whose create action exists (`?new=1` opens the form
  where the view supports `useOpenCreateFormFromQuery`), or
- `disabled: true` — which renders the "not yet available" hint; nothing
  else may ship that copy.
