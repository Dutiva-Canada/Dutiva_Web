# Maintainability guide

How this codebase stays healthy over time — patterns to follow, known hotspots,
and periodic owner tasks.

## Strong foundations (keep doing)

- **Single sources of truth:** `docs/CANONICAL_FACTS.md`, `docs/NATURAL_LANGUAGE_COPY.md`, `src/config/plans.ts`
- **Surface-scoped i18n:** `workspace.ts` / `marketing.ts` / `shared.ts` + `npm run check:message-scopes`
- **Colocated tests:** `*.test.ts(x)` beside the unit under test
- **Custom CI guards:** migrations, RLS, facts, brand assets, entry-graph budget, architecture (`check:architecture`)
- **Lazy workspace routes:** `viewPreloads.ts` shared by routes and nav prefetch

## Maintainability program (stages 1–9, complete)

Structural work shipped in PRs #250–#258. `npm run check:architecture` now enforces:

| Guard | What it catches |
| --- | --- |
| Marketing `@/data` | Demo HR fixtures in the public marketing bundle |
| `landing.ts` monolith | Recreated single-file landing i18n |
| Inline `*DemoView` | Demo UI embedded in a `*View.tsx` shell |
| `@/data` in view shells | Fixture imports outside `*DemoView.tsx` |
| Dispatch pairing | Thin `useWorkspaceMode()` shells when both `*DemoView` and `*ProductionView` exist |
| Production pairing | Every `*ProductionView.tsx` has `*DemoView.tsx` + `*View.tsx` siblings |
| File size (>800 lines) | Hotspots outside the allowlist |

**Deferred:** stage 2 fixture collapse — one module per PR, only when production-default with no
demo-only UX. `/demo`, onboarding, and Northgate fixtures stay until then.

Helper scripts: `scripts/extract-demo-view.mjs`, `scripts/split-t01-offer-letter.mjs`,
`scripts/split-landing-messages.mjs`.

## Landing page i18n

Landing copy lives in **section modules** under `src/i18n/messages/landing/` (hero, pricing, FAQ, etc.).
The barrel `landing/index.ts` merges them for `shared.ts`. Do not recreate a monolithic `landing.ts`.

Regenerate sections from a legacy monolith (if ever needed):

```bash
node scripts/split-landing-messages.mjs
```

## Advisor view complexity

`useAdvisorViewController.ts` orchestrates demo scenarios, production chat, crisis intercept,
and workspace state. Sub-hooks already extracted:

- `useAdvisorThreadSession`
- `useAdvisorProductionThreads`
- `useAdvisorMessageActions`
- `advisorCrisisHandlers.ts` — crisis intercept + dedicated support thread (AGENT.md §8)
- `advisorScenarioHandlers.ts` — demo scenario turns (province pick, web toggle)
- `advisorThreadNavigation.ts` — thread select, new chat, delete
- `advisorProductionChat.ts` — shared real-backend result + failure handling
- `advisorFlowHandlers.ts` — demo flow starts (termination, light flows, fallback)
- `advisorChatSendHandlers.ts` — in-thread send + follow-up chips
- `advisorQuickFormHandlers.ts` — termination quick-form field edits + submit
- `advisorPriorityActions.ts` — Home command-centre action routing inside Advisor
- `advisorViewPresentation.ts` — thread groups, jurisdiction pill, workspace payload
- `advisorComposerHandlers.ts` — idle/home composer sends and suggest-chip routing

When adding behaviour, prefer a **new focused hook** over growing the controller.
Helpers belong in `advisorViewHelpers.ts`; demo scenario data stays in `advisorScenarios.ts`.

## Workspace mode (demo vs production)

Many modules use `*View` + `*ProductionView` with `useWorkspaceMode()` dispatch.
**Do not delete demo fixtures** until the module is product-default for all users.

| Module | Production persistence | Notes |
| --- | --- | --- |
| Documents (repository, generate, detail) | Yes (0076+) | Demo gallery redirects in production |
| Advisor Memory | Yes (0086+) | Four production surfaces |
| Communications, Compensation, Wellbeing | Yes (0039–0041) | Self-dispatch on mode |
| Cases, Employees, Tasks, … | Partial / fixture | Check view before collapsing demo |

**Collapse policy:** when a module is live for all signed-in users with no demo-only UX,
remove the fixture branch in the `*View` wrapper and delete unused `src/data` consumers —
one module per PR, with tests.

**Stage 1 (file split, no behaviour change):** every workspace module with a production
counterpart keeps demo UI in `*DemoView.tsx` (thin `*View.tsx` dispatch only). Regenerate
with `node scripts/extract-demo-view.mjs <ComponentName>` when adding a new inline demo.
**Workflows** uses `WorkflowsDemoFixtures.tsx` instead (single view, `showFixtures` gate).
`check:architecture` fails if a `*View.tsx` embeds `function *DemoView` inline.
Demo/onboarding surfaces (`/demo`, public tour, marketing simulations) are unchanged.

**Stage 2 (fixture collapse):** deferred — remove `src/data` consumers only when a module
is production-default for all users with no demo-only UX (one module per PR).

**Stage 7 (dispatch regression guards):** `check:architecture` enforces the split for any
module with both `*DemoView.tsx` and `*ProductionView.tsx`:

- the `*View.tsx` shell calls `useWorkspaceMode()`, renders both surfaces, and stays under
  45 lines (except `HomeView.tsx`, which wires Advisor navigation).
- `*View.tsx` dispatch shells and `*ProductionView.tsx` files must not value-import `@/data`.
- inline `function *DemoView` in `*View.tsx` remains forbidden (stage 6).

**Stage 8 (demo-only view shells):** Knowledge and Templates now follow the same split —
fixture UI in `*DemoView.tsx`, thin `*View.tsx` re-export. `check:architecture` also fails when
any `*View.tsx` shell (not `*DemoView` / `*ProductionView`) value-imports `@/data`.

## Document template corpus

50 templates under `src/features/app/documents/data/templates/`. Each has a `review`
field (`approved_for_use`, `hr_review_required`, `not_reviewed`).

**Quarterly owner cadence (recommended):**

1. Export templates with `review !== 'approved_for_use'`.
2. Legal/HR review batch — update `review` status in the template file.
3. Run `npm run check` (authored-template tests enforce structure).

See `docs/FOUR_RING_FRAMEWORK.md` for review rings.

**Large template files:** when a hand-maintained template exceeds the 800-line architecture
budget, split wizard `questions` and `preview` blocks into sibling modules (see
`t01-offer-letter.questions.ts` / `t01-offer-letter.preview.ts`). Regenerate with
`node scripts/split-t01-offer-letter.mjs` only if the monolith is restored.

**Stage 9 (T01 template split):** `t01-offer-letter.ts` metadata shell + questions + preview
modules — clears the last `check:architecture` size warning without changing generated output.

**Stage 10 (pairing completeness):** every `*ProductionView.tsx` under `src/features/app/views/`
must have matching `*DemoView.tsx` and `*View.tsx` siblings — closes the maintainability program.

## CI pipelines

| Pipeline | What it gates |
| --- | --- |
| `.woodpecker/check.yml` | typecheck, lint, test:coverage, message-scopes, facts, **architecture**, **brand-assets**, **full build** |
| `.woodpecker/live-checks.yml` | migration drift + RLS (needs Supabase secrets) |
| `.woodpecker/e2e.yml` | Playwright smoke on `dist/` |

**Live checks:** configure `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` in Woodpecker
so green CI implies live DB parity, not just local green.

Local `npm run check` runs architecture + brand-assets; migration drift runs when creds exist.

## File size budget

`npm run check:architecture` warns on source files **>800 lines** outside an allowlist
(generated types, template catalogue, fixture blobs, known hotspots). Raise the allowlist
only with a comment explaining why splitting is deferred.

## French content

Keys marked `[FR self-authored]` need human review before treating FR as production-grade.
Do not machine-translate over handoff strings silently.

## Related

- [CONVENTIONS.md](../CONVENTIONS.md) — engineering rules
- [AGENTS.md](../AGENTS.md) — agent + migration discipline
- [GAP_AUDIT_STATUS.md](GAP_AUDIT_STATUS.md) — audit tracker
- [TODO.md](TODO.md) — open owner actions
