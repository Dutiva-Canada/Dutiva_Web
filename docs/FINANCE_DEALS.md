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

Migrations `0171` (deals + ownership + partner types) and `0172`
(commitments) are applied to the Supabase project
(`khtwpxnvziiyplaflwru`) — `check:migrations` reports 172/172 applied, 0
differences. The task hand-off needs no migration — it writes the
existing `compliance_tasks.metadata` jsonb.
