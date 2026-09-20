# Finance → Portfolio

`/app/finance/portfolio` — the company-investments screen, adapted from the
separate personal-investment-dashboard repo into Dutiva's finance module
semantics. Screen: `src/features/app/views/finance/screens/Portfolio.tsx`;
migration `0160_finance_portfolio.sql`.

## What it is

Three records of a company's investment position, per legal entity
(`finance_entities`):

- **Holdings** — the existing `finance_holdings` table rendered as a
  portfolio summary: label, institution, market vs carrying value, the
  `valuationSource` + `stale` flag. Data was already there; the screen is
  the first place it reads as a portfolio.
- **Watchlist** — `finance_watchlist_items`: instruments under review for
  the treasury, with status `watching / under_review / decided / dropped`
  and optional link back to a holding.
- **Decision journal** — `finance_decision_entries`: dated decision records
  (`buy / sell / hold / add / exit / review`) with summary, rationale,
  optional review date and outcome — the institutional-memory piece the
  source dashboard calls a decision journal.

All three are org-scoped with member-read / admin-write RLS, loaded through
the finance data layer (`supabaseApi` → `FinanceDataProvider` →
`useFinanceCreates`), demo fixtures included.

## What it deliberately is not

- **Not investment advice.** The screen records decisions a company made
  and why; it does not recommend, score, or project. The shared `Disclaimer`
  renders in the finance layout as it does on every finance screen.
- **Not a brokerage feed.** No live market data, no price fetching — values
  are recorded facts with a declared `valuationSource` and staleness flag.
- **Not personal investing.** Everything hangs off `finance_entities`
  (the company's books), not a user profile.

## Data model notes

`finance_watchlist_items.holding_id` and `finance_decision_entries.
{holding_id, watchlist_item_id}` are soft links — a decision can cite the
holding or watchlist item it resolved. `summary`/`rationale`/`outcome` are
JSONB `{en, fr}` bilingual objects, same as every user-facing string in the
module.

## Deploy status

Migration `0160` is applied to project `khtwpxnvziiyplaflwru` (verified via
`to_regclass` on both tables and `check:migrations` reconciliation). The
screen reads live tables in production mode and fixtures in demo mode.
