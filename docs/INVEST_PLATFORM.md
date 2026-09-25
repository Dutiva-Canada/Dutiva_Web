# Dutiva Invest — the standalone invest portal

`/invest` is a standalone, invite-only portal for selected clients — a
portfolio tracking, rules-based signal, and paper-trading surface. It ships
in the same repo and deployment as everything else, but sits outside the
`/app` workspace shell: its own layout, its own nav, its own data model —
the same architecture as the candidate portal at `/careers/portal`.

## Access model

- **Shared auth** — the same passwordless email-code sign-in the candidate
  portal uses (`AuthProvider`). Anyone can request a code.
- **`invest_access`** — the gate. A row keyed by `user_id` is the grant;
  the firm inserts rows manually (service role / dashboard). Signed-in
  users without a row see a localized "Access required" card; the edge
  function returns `403 no_access` for the same condition. RLS lets a user
  read only their own grant row — they cannot grant themselves.
- **Roles (0181)** — grants carry `role`: `client` (default) or `admin`.
  Admins can invoke `run-all` with their own portal JWT; clients cannot
  (`403 not_admin`).
- **Owner grant** — `martin.constantineau@dutiva.ca` holds a permanent
  `admin` grant. Migration 0181 seeds the row and installs
  `invest_access_owner_signup`, an `auth.users` trigger that re-asserts it
  on any future signup under that address (covers account re-registration).

## Data model (migration `0180_invest_platform.sql`)

All tables are **user-scoped** — `user_id` on every row, RLS
`auth.uid() = user_id`. No organization dependency.

| Table | Role |
|---|---|
| `invest_access` | Presence = portal access; `role` = `client` \| `admin` |
| `invest_accounts` | Books of record: `paper`, `live`, `external` + cash balance |
| `invest_positions` | Holdings per account across asset classes (`equity`, `etf`, `crypto`, `bond`, `cash`, `other`) |
| `invest_market_snapshots` | Latest price per (user, class, symbol) — `source: 'manual'` today; feed adapters are a deliberate seam |
| `invest_strategies` | Bot rule sets: `rules jsonb`, `autonomy` (`suggest` \| `paper_execute`), `enabled`, `asset_classes[]` |
| `invest_signals` | Bot output: `screen` \| `insight` \| `alert` \| `thesis`, triage status `new` → `acknowledged`/`dismissed` |
| `invest_orders` | Order intents: `mode` `paper` \| `live`, status `draft`/`queued`/`executed`/`cancelled`/`failed` |
| `invest_bot_runs` | Run log: counts + summary per sweep |

## The bot (`supabase/functions/invest-bot`)

- `POST { action: 'run' }` — portal JWT; evaluates the caller's enabled
  strategies against their snapshots once.
- `POST { action: 'run-all' }` — service key, `x-trigger-secret`, or an
  `admin`-role portal JWT; the pg_cron sweep (`invest-bot-daily`, 07:45
  UTC, vault-pair reuse — same secret pair as the candidate agent and
  signing notifications).
- `POST { action: 'execute-order', order_id, fill_price? }` — portal JWT;
  fills a queued **paper** order at the snapshot price, or records a
  **live** order as executed at the caller-supplied fill price.

`planRun` (pure, unit-tested in `handlers.ts`) matches each enabled
strategy's rules against snapshots: `day_change_pct`, `vs_ma50`,
`value_floor` metrics with `lt`/`gt` thresholds. A matching rule emits a
signal; a rule with `side`+`qty` additionally produces an order intent —
queued for `suggest` strategies, paper-executed for `paper_execute` ones
against the user's first active paper account (cash check included).

## What it deliberately is not

- **No broker calls.** `live` orders are bookkeeping — a human confirms
  the fill. Broker execution is a designed seam (per-user credentials,
  adapter per broker), not shipped.
- **No advice.** The public `/investors` page and the portal chrome state
  plainly: informational and educational tooling, not investment advice;
  Dutiva is not a registered dealer or adviser.
- **No market-data feeds yet.** Prices are manual (`upsertSnapshot`);
  `source` is the column feed adapters would write later.
- **No demo mode.** The portal is real data only — invited clients see
  their own book.

## UI

`src/features/invest/` — `portal/` (layout, auth panel, five pages) +
`data/` (types, API, provider). Nav: Overview, Portfolios, Orders,
Signals, Bot. Bilingual via `investMessages`; the language toggle rides
in the header like the candidate portal. Mobile nav collapses to a menu
under 820px.

Public door: `/investors` (EN) · `/fr/investisseurs` (FR) — marketing
page linked from the footer's Investors column; CTA points at `/invest`.

## Granting access

```sql
insert into public.invest_access (user_id, role, granted_by, note)
values ('<auth user uuid>', 'client', 'martin', 'client name');
```

The user signs in at `/invest` with the invited email; the grant check
runs on layout mount and inside the edge function.

## Verification

- `supabase/functions/invest-bot/invest-bot.test.ts` — 14 engine tests
  (rule parsing, plan generation, fill math, dedupe).
- `src/features/invest/portal/InvestPortal.test.tsx` — 5 tests (auth gate,
  access gate, overview render, signal dismiss, paper-order execute).
- Live: `trigger_invest_bot()` → `200 {scanned:0, results:[]}`;
  unauthenticated POST → 401.
