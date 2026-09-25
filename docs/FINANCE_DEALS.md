# Finance → Deals

`/app/finance/deals` — the transaction-pipeline screen for orgs that are
starting to operate like a holding / investment company alongside their
core business. Screen:
`src/features/app/views/finance/screens/Deals.tsx`; migration
`0171_finance_deals.sql`.

## What it is

A `finance_deals` table plus two small extensions to existing finance
tables, all per legal entity (`finance_entities`):

- **Deal pipeline** — `finance_deals`: one row per transaction
  (acquisition / investment / divestiture / financing / other) moving
  through `sourcing → diligence → negotiation → agreement → closed |
  passed`, with counterparty, value + currency, target date, owner, and
  bilingual notes. Soft links (`watchlist_item_id`, `holding_id`) let a
  deal graduate from the watchlist or point at the holding a closed deal
  produced.
- **Ownership structure** — `finance_entities` gains `parent_entity_id` +
  `ownership_pct`, so the registry reads as a holdings structure
  ("Holdings Inc. owns 100% of Logistics Inc.") and `legal_form` gains
  `trust`. The Entities screen shows an "owned by" line, a parent +
  ownership-% picker, and — once at least one link exists — an "Ownership
  structure" tree that renders the hierarchy (cycle-guarded; a parent id
  outside the registry leaves the entity at the root).
- **Capital partners** — `finance_parties.type` gains `investor` and
  `lender`, so investors and lenders share the existing party table; the
  Deals screen surfaces them in a dedicated section next to the pipeline.
- **Commitments** — `finance_commitments` (migration `0172`): the
  committed / called / uncalled ledger per partner, with an optional
  next-call date. Each partner card in the Deals partners section lists
  its commitments and offers add/edit/remove in production. `called <=
  committed` is enforced by a CHECK constraint and pre-validated in the
  form. Rows hang off `finance_parties` + `finance_entities`, same
  member-read / admin-write RLS as the rest.
- **Capital calls** — `finance_capital_calls` (migration `0173`): discrete
  call events (`scheduled → notified → received | cancelled`) against a
  commitment, with amount, due date, reference, and received date. The
  API layer bumps the commitment's `called` when a call moves into
  `received` (and decrements on un-receive or delete-of-received), so the
  event log and the ledger can't drift; when a commitment has calls, the
  edit form renders `called` read-only. Receiving a call that would push
  `called` past `committed` is refused up front. Partner records also
  gained `contact_name` / `contact_email` / `contact_phone` (0173),
  captured in the Purchases party form and shown on the partner cards.

Same org-scoped model as the rest of finance: members read, admins write,
RLS in `0171`. Loaded through the finance data layer (`supabaseApi` →
`FinanceDataProvider` → `useFinanceCreates`), demo fixtures included —
the fixture set pairs Northgate Logistics Inc. (operating co) with
Northgate Holdings Inc. (holdco, 100% parent) and four deals across the
pipeline stages.

## Lifecycle wiring

A deal row carries two outbound actions (production only — `canWrite`):

- **Log a decision** — a compact journal entry that posts to
  `finance_decision_entries` with the deal's `entityId` plus its
  `holdingId`/`watchlistItemId` links, so a closed acquisition lands in
  the same Portfolio decision journal as a market call.
- **Add follow-up task** — `addDealFollowupTask` inserts a
  `compliance_tasks` row (category `review`, in the table's CHECK
  vocabulary) with `metadata: { deal_id, kind: 'deal_followup' }` and the
  deal's target date as the due date. The task detail page reads
  `metadata.deal_id` back into a "View in Deals" link, closing the loop
  both ways. The success toast deep-links to the new task.

## Treasury debt terms

`finance_debts` has carried `covenant_ref`, `notice_period`, and
`maturity_date` since the debts table shipped, but nothing rendered the
first two. The Treasury debt rows now show a covenant / notice line under
the terms, and an active facility inside 90 days of maturity gets a
"Maturing soon" chip — no schema change.

## Treasury cash sweeps

`finance_cash_sweeps` (migration `0174`) records moving money between
`finance_bank_accounts` (operating → reserve, etc.) with a
`scheduled → executed | cancelled` lifecycle, amount + currency, scheduled
and executed dates, and an optional reference. The Treasury tab renders
the sweep list with status chips and — in production only — a record form
plus mark-executed / cancel / delete controls. `from_account_id <>`
`to_account_id` is a CHECK constraint, pre-validated in the form. Dutiva
records the sweep; it does not execute the transfer — account balances
live on the source systems, and this row is the treasury workflow record.

## Deal/holding document links

`finance_document_links` (migration `0175`) points deals and holdings at
documents in the HR Documents module (`hr_generated_documents`). The row
snapshots the document ref + bilingual title so finance screens render
the link without joining across modules; the deep link resolves to
`/app/documents/<document_id>`. Each link hangs off exactly one target
(two CHECK constraints: at least one target, never both), and deleting
the deal/holding cascades the link. The Deals cards and the Portfolio
holdings list render their linked documents; production orgs attach via a
picker over their generated-document library (manual ref/title fallback
if the picker can't load) and can unlink. Dutiva links records — it does
not move or attach files itself.

## Governance board view

`/app/finance/governance` (tab key `governance`) is the board-oriented
surface for the investment-firm positioning — everything is derived from
existing finance state, so the view reads the same records the workspace
writes:

- **Cap table** — the entity registry with ownership edges: each entity
  shows its legal form, and a held entity shows `100% · Parent: …` from
  `parent_entity_id` + `ownership_pct`.
- **Capital partners** — the investor/lender roster with contact lines
  and per-currency commitment totals (committed / called / uncalled)
  summed across the partner's `finance_commitments`.
- **Audit trail** — the full `finance_audit_events` feed, newest first,
  with actor, action, record type + id, outcome, and date. (The
  Accounting tab keeps its compact 20-row recent-activity list; this is
  the complete trail for board/shareholder review.)

No migration — it renders state that 0171–0173 already persist.

## Overview attention strip

`src/features/app/views/finance/data/financeAttention.ts` derives a
"Needs attention" section on the Finance Overview from dates the user
already entered — nothing is persisted and no jobs run:

- live capital calls (scheduled/notified) due inside 30 days, or overdue;
- commitment `nextCallDate`s inside 30 days (skipped when a live call
  already covers that commitment — the call row is the precise signal);
- active debts maturing inside 90 days (same window as the Treasury
  chip), or past maturity;
- open deals (not closed/passed) whose target date has passed.

Each row links to the tab that owns it (`/app/finance/deals` or
`/app/finance/treasury`) and carries an overdue / due-soon / upcoming
chip. `computeFinanceAttention(input, today)` is a pure function with an
injectable clock, so the window rules are unit-tested against fixed
dates.

## Capital-call notifications

Migration `0176` wires the call lifecycle into the existing
`hr_workspace_notifications` surface (the Topbar bell). When a call's
status *becomes* `notified`, a trigger
(`finance_capital_calls_notify` → `_finance_call_notify_admins`, the
same service-role fan-out pattern signing and integration events use)
inserts one bilingual row per active owner/admin member — party, amount,
due date, optional reference — linking to `/app/finance/deals`. The
trigger's `when` clause fires only on the transition into `notified`, so
re-saving a notified call doesn't double-notify. Scheduling, receiving,
and cancelling calls produce no notifications — `notified` is the
externally meaningful event. The date-driven items stay on the
derived Overview strip above; the bell only carries the event.

## What it deliberately is not

- **Not deal brokerage or investment advice.** The screen records where a
  transaction stands; it does not source, price, negotiate, or settle it.
  The shared `Disclaimer` renders in the finance layout as on every
  finance screen.
- **Not market infrastructure.** No broker feeds, valuations, or
  execution — a `value` is a recorded number, not a live quote.
- **Not a separate app.** It composes with the existing module: deals
  book against `finance_entities`, partners live in `finance_parties`,
  and a closed deal can reference the `finance_holdings` row it created.

## Data model notes

`name` and `notes` are JSONB `{en, fr}` bilingual objects, same as every
user-facing string in the module. `stage` is a lifecycle label, not a
settlement state — there is no "funded" or "wired" status because Dutiva
does not move money.

## Deploy status

Migrations `0171` (deals + ownership + partner types), `0172`
(commitments), `0173` (capital calls + party contacts), `0174`
(cash sweeps), `0175` (deal/holding document links), and `0176`
(capital-call notifications) are applied to the Supabase project
(`khtwpxnvziiyplaflwru`) — `check:migrations` reports 176/176 applied,
0 differences. The task hand-off needs no migration — it writes the
existing `compliance_tasks.metadata` jsonb.
