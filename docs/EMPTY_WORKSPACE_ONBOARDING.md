# Empty workspace onboarding

Product note for first-run guidance when a company (or individual) lands in a
**real, empty** production workspace and does not know where to start.

Status: **v1 shipping** — Home checklist + empty→create (`?new=1`) + copy
pass. When this disagrees with code, the code wins and this note should be
updated in the same PR.

Related: [CONVENTIONS.md](../CONVENTIONS.md) (workspace mode),
[GAP_AUDIT_STATUS.md](GAP_AUDIT_STATUS.md) (production still admin-only),
[NATURAL_LANGUAGE_COPY.md](NATURAL_LANGUAGE_COPY.md),
[CANONICAL_FACTS.md](CANONICAL_FACTS.md).

---

## Problem

Production workspaces start empty by design — no Northgate fixtures, no sample
people, cases, or documents. That honesty is correct. Without a clear next
action, it also feels like a blank product.

Demo remains useful for walkthroughs. It must not be the primary answer to
“where do I begin with _my_ workplace?”

---

## Principles

1. **Guide empty, don’t fake full.** No seeding production with sample employees
   or cases. Records in production are the org’s.
2. **One next action.** Prefer a short checklist over a multi-step wizard.
3. **Empty → create.** A CTA that says “Add…” should open the create surface,
   not only navigate to an empty list.
4. **Demo is secondary.** Keep the Demo escape hatch; demote it so production
   feels like the real product.
5. **Don’t invent service claims.** Support stays digital-first; don’t promise
   concierge setup or “HR specialists will load your files.”
6. **Hedges stay hedges.** This is setup help, not a claim that the workspace
   is “complete” or “compliant” once three steps are checked.

---

## Scope for v1

### In (shipped)

1. **Home first-run checklist** on `HomeProductionEmptyState` — three steps
   with light session progress.
2. **Empty → create** for Employees / Cases / Tasks via `?new=1`
   (`useOpenCreateFormFromQuery`) and in-card primary buttons.
3. **Copy pass** — shorter Home body; Demo demoted to a quiet Settings link;
   shared `ProductionEmptyState` hint points at Home’s three steps.

### Out (later)

| Item                                         | Why later                                             |
| -------------------------------------------- | ----------------------------------------------------- |
| Open production mode to beta members         | Access policy / capacity; tracked in gap audit.       |
| Org mini-setup after `bootstrapOrganization` | Confirm company name / province / city — separate PR. |
| Sample-data import into production           | Conflicts with principle 1.                           |
| Full product tour / coach marks              | Noise for v1.                                         |
| Help Centre “Your empty workspace” article   | Follow-up after this ships.                           |

---

## Progress rules (v1 — no new table)

| Step                 | Done when                                                       |
| -------------------- | --------------------------------------------------------------- |
| Add a person         | Org has ≥ 1 employee (usually graduates Home off empty state)   |
| Draft in Studio      | Session visit to Document Studio (`sessionStorage`, org-scoped) |
| Run a guided process | Session visit to Workflows catalog **or** any flow runner       |

Empty Home hides once `totalRecords > 0`. Checklist is not dismissible in v1.

Copy lives in `src/i18n/messages/home.ts` and `workspaceMode.ts`.

---

## Empty → create

- Home step 1 → `/app/employees?new=1`
- Sidebar Create → Employee / Case → same `?new=1` contract
- Employees / Cases / Tasks: `useOpenCreateFormFromQuery` opens the form and
  strips `new` (replace)
- In-list empty cards: primary button opens the same form

---

## Implementation map

| Piece            | Path                                               |
| ---------------- | -------------------------------------------------- |
| Session progress | `emptyWorkspaceOnboarding.ts`                      |
| `?new=1` hook    | `useOpenCreateFormFromQuery.ts`                    |
| Home empty       | `HomeProductionEmptyState.tsx`                     |
| Mark Studio      | `StudioScreen.tsx` (production)                    |
| Mark workflows   | `WorkflowsView.tsx`, `FlowRunner.tsx` (production) |

---

## Decisions locked for v1

1. **Studio “done”** — session visit (not document row count).
2. **Workflow “done”** — session visit to Workflows catalog or any flow.
3. **Beta production access** — still out of scope; ship UI first for admins.
4. **Dismissible checklist** — not in v1.
