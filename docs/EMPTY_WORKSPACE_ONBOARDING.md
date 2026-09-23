# Empty workspace onboarding

Product note for first-run guidance when a company (or individual) lands in a
**real, empty** production workspace and does not know where to start.

Status: **v2 shipping** — foundation-first setup path + inline company-profile
mini-setup + Keep-going card past graduation + plan-as-tasks + Advisor
prompts. When this disagrees with code, the code wins and this note should be
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

v1 shipped a three-step checklist that solved the first ten minutes but not
the first month: step one was "add a person" — wrong for a solo founder who
hasn't hired — and the checklist vanished the moment any single record
existed, taking all orientation with it. "What do I do today?" had no answer
past record one.

Demo remains useful for walkthroughs. It must not be the primary answer to
"where do I begin with _my_ workplace?"

---

## Principles

1. **Guide empty, don't fake full.** No seeding production with sample
   employees or cases. Records in production are the org's. (Tasks the user
   explicitly asks for — "add the steps to Tasks" — are the user's own
   records, not fixtures.)
2. **One next action, in order.** Foundation first: profile → documents →
   policies → explore → people. A workspace with no employees is pre-hire by
   construction, so the path is derived, not asked.
3. **Done means done.** Steps complete from live org data (jurisdictions,
   `hr_generated_documents`, `hr_policies`, employees) — not clicks — so
   progress is honest and survives sessions. The only soft step is the
   guided-process visit, which has no server-side run record yet.
4. **Guidance survives graduation.** The empty state is not the product; the
   Keep-going card carries the path on the populated Home until done or
   dismissed. Graduating early (e.g. by adding setup tasks) loses nothing.
5. **Empty → create.** A CTA that says "Add…" should open the create surface,
   not only navigate to an empty list.
6. **Demo is secondary.** Keep the Demo escape hatch; demoted so production
   feels like the real product.
7. **Don't invent service claims.** Support stays digital-first; don't promise
   concierge setup or "HR specialists will load your files."
8. **Hedges stay hedges.** This is setup help, not a claim that the workspace
   is "complete" or "compliant" once the steps are checked.

---

## Scope for v2

### In (shipped)

1. **Setup path on the empty Home** — five ordered steps in
   `HomeProductionEmptyState`, completion derived from live signals
   (`setupPath.ts` `computeSetupSteps`).
2. **Keep-going card** (`HomeSetupCard`) on the populated production Home —
   remaining steps + `n/m` progress, per-device dismissal
   (`dutiva.setupCard.dismissed.v1.<org>`).
3. **Plan → Tasks** — "Add the remaining steps to Tasks" writes real
   `compliance_tasks` rows (`addTask`, medium priority, no due date — no fake
   urgency). Org-admin only; graduates Home onto the dashboard, where the
   card keeps the path.
4. **Advisor prompts** — two suggestion chips under the composer send a
   pre-written setup question to the Advisor.
5. **Durable soft marks** — onboarding progress moved from `sessionStorage`
   to `localStorage` (key v2) so the workflow-visit step survives sessions.
6. **Org mini-setup on the empty Home** (`HomeOrgProfileSetup`) — while the
   org has no jurisdictions, step 1 is an inline form, not a link to
   Settings: company name / province / city write `profiles` via
   `updateAdminProfile`, and province maps onto `organizations.jurisdictions`
   via `PROVINCE_TO_JURISDICTION`. Saving completes step 1 on the spot.
7. **Empty → create** for Employees / Cases / Tasks via `?new=1`
   (`useOpenCreateFormFromQuery`), unchanged from v1.

### Out (later)

| Item                                          | Why later                                              |
| --------------------------------------------- | ------------------------------------------------------ |
| Open production mode to beta members          | Access policy / capacity; tracked in gap audit.        |
| Org mini-setup after `bootstrapOrganization`  | Superseded by "In" #6 — the inline Home card covers orgs that predate the feature too, without a provisioning-time modal. |
| Server-side onboarding state                  | Card dismissal + visit marks are device-local today.   |
| Durable flow-run records                      | Would make the explore step live-data like the others. |
| Advisor-generated setup plans                 | Chips send fixed prompts; generated plans are bigger.  |
| Sample-data import into production            | Conflicts with principle 1.                            |
| Full product tour / coach marks               | Noise; the path is the tour.                           |
| Help Centre "Your empty workspace" article    | Follow-up after this ships.                            |

---

## Progress rules (v2 — no new table)

| Step                        | Done when                                              |
| --------------------------- | ------------------------------------------------------ |
| Confirm your company profile | `organizations.jurisdictions` non-empty — inline form on the empty Home, or Settings |
| Prepare first-hire documents | ≥ 1 `hr_generated_documents` row                       |
| Start your policy register   | ≥ 1 `hr_policies` row (written policy or flagged gap)  |
| See a guided process         | Workflows catalog or flow runner visited (localStorage, org-scoped) |
| Add your first person        | ≥ 1 employee (usually graduates Home off empty state)  |

Empty Home shows the full path while `totalRecords === 0`. Once any record
exists, the Keep-going card shows the remaining steps on the dashboard until
all five are done or the card is dismissed (device-local). The empty Home
itself is never dismissible — it is the page.

`totalRecords` now counts documents and all tracked policies too, so creating
either graduates Home — safe, because the card keeps orientation.

Copy lives in `src/i18n/messages/home.ts` and `workspaceMode.ts`.

---

## Empty → create

- Path step 5 → `/app/employees?new=1`
- Sidebar Create → Employee / Case → same `?new=1` contract
- Employees / Cases / Tasks: `useOpenCreateFormFromQuery` opens the form and
  strips `new` (replace)
- In-list empty cards: primary button opens the same form

---

## Implementation map

| Piece              | Path                                                        |
| ------------------ | ----------------------------------------------------------- |
| Step derivation    | `views/home/setupPath.ts` (`computeSetupSteps`)             |
| Profile mini-setup | `views/home/HomeOrgProfileSetup.tsx`                        |
| Province→org codes | `workspaceMode/jurisdictionOptions.ts`                      |
| Soft marks + dismiss | `workspaceMode/emptyWorkspaceOnboarding.ts` (localStorage) |
| Keep-going card    | `views/home/HomeSetupCard.tsx`                              |
| Home empty         | `views/home/HomeProductionEmptyState.tsx`                   |
| Card wiring + plan→Tasks | `views/home/HomeProductionView.tsx` (`addStepsAsTasks`) |
| Live signals       | `views/home/useHomeProductionStats.ts` (+ `listDocuments`)  |
| Mark Studio        | `StudioScreen.tsx` (production)                             |
| Mark workflows     | `WorkflowsView.tsx`, `FlowRunner.tsx` (production)          |

---

## Decisions locked for v2

1. **No "where are you?" picker.** `employees === 0` is guaranteed wherever
   the empty state leads the path — the stage is derived, not asked. A second
   question to answer is itself a barrier.
2. **Foundation-first ordering** — "add a person" is the last step, labelled
   "when you're ready," not step one.
3. **Documents/policies steps need real rows.** Visiting Studio or Policies
   without creating anything does not complete the step — honest state for a
   card that persists. (v1 used session visits; superseded.)
4. **No due dates on generated tasks.** The plan goes into Tasks without
   invented deadlines — urgency is the user's to set.
5. **Card dismissal is device-local** (`localStorage`, org-scoped) — same
   tradeoff as Settings prefs; a server-side onboarding column is a
   follow-up, not a prerequisite.
6. **Studio "done"** — generated document row (was: session visit in v1).
