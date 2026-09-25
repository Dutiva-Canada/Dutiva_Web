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
  `trust`. The Entities screen shows an "owned by" line and a parent +
  ownership-% picker.
- **Capital partners** — `finance_parties.type` gains `investor` and
  `lender`, so investors and lenders share the existing party table; the
  Deals screen surfaces them in a dedicated section next to the pipeline.

Same org-scoped model as the rest of finance: members read, admins write,
RLS in `0171`. Loaded through the finance data layer (`supabaseApi` →
`FinanceDataProvider` → `useFinanceCreates`), demo fixtures included —
the fixture set pairs Northgate Logistics Inc. (operating co) with
Northgate Holdings Inc. (holdco, 100% parent) and four deals across the
pipeline stages.

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

Migration `0171` ships with the feature but must be applied to the
Supabase project (`khtwpxnvziiyplaflwru`) before production mode reads
live rows — until then `selectAll` returns an empty deals slice and the
screen renders its empty state. Verify with `check:migrations` after
applying.
