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

| Table                     | Role                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invest_access`           | Presence = portal access; `role` = `client` \| `admin`                                                                                                                                                                                                                                                                                        |
| `invest_accounts`         | Books of record: `paper`, `live`, `external` + cash balance                                                                                                                                                                                                                                                                                   |
| `invest_positions`        | Holdings per account across asset classes (`equity`, `etf`, `crypto`, `bond`, `cash`, `other`)                                                                                                                                                                                                                                                |
| `invest_market_snapshots` | Latest price per (user, class, symbol) — `source` records `manual` / `coingecko` / `stooq`                                                                                                                                                                                                                                                    |
| `invest_strategies`       | Bot rule sets: `rules jsonb`, `enabled`, `cadence` (`daily` \| `weekly` \| `monthly`), `last_evaluated_at`, `template` (`tpl:*` / `ai-draft` / `''`), `scope` (`{watchlist, symbols[]}` — never empty, 0184), `notify` (`{in_app, email}`, 0184). `autonomy` is deprecated — per-rule `type` replaced it and all rows were reset to `suggest` |
| `invest_signals`          | Bot output: `screen` \| `insight` \| `alert` \| `thesis`, triage status `new` → `acknowledged`/`dismissed`; `title_fr`/`body_fr` carry AI-authored bilingual insight text                                                                                                                                                                     |
| `invest_orders`           | Order intents: `mode` `paper` \| `live`, status `draft`/`queued`/`executed`/`cancelled`/`failed`; `strategy_id` links a bot-proposed draft to its strategy (0184)                                                                                                                                                                             |
| `invest_bot_runs`         | Run log: counts + summary per sweep + diagnostics (0184): `symbols_scanned[]`, `rule_hits` (title → count), `duration_ms`, `strategy_id` (targeted test scans)                                                                                                                                                                                |

Two more tables came with `0183_invest_watchlist_news.sql`:

| Table                | Role                                                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invest_watchlist`   | User-scoped symbols tracked without a position — feeds the market-sync universe (a watched symbol gets a daily snapshot, so dip-watchers work before the first buy) and the per-symbol news queries |
| `invest_market_news` | **Shared** headlines, unique on `(symbol, url)`; `''` symbol = general market item. Grant-holders read via `invest_market_news_read`; only the service role writes                                  |

## The bot (`supabase/functions/invest-bot`)

- `POST { action: 'run' }` — portal JWT; scans the caller's enabled
  strategies now ("Scan now" — manual runs bypass the cadence window).
- `POST { action: 'run-all' }` — service key, `x-trigger-secret`, or an
  `admin`-role portal JWT; the pg_cron sweep (`invest-bot-daily`, 07:45
  UTC, vault-pair reuse — same secret pair as the candidate agent and
  signing notifications). Cadence-gated.
- `POST { action: 'test-scan', rules, symbols }` — portal JWT; dry-runs a
  draft strategy's rules against current snapshots and returns diagnostics
  (`symbolsScanned`, `ruleHits`, signal/proposal counts, warnings). Writes
  nothing.
- `POST { action: 'execute-order', order_id, fill_price? }` — portal JWT;
  fills a draft/queued **paper** order at the snapshot price, or records a
  **live** order as executed at the caller-supplied fill price. This is the
  only path that mutates positions/cash — always user-invoked.

`planRun` (pure, unit-tested in `handlers.ts`) matches each enabled
strategy's rules against the snapshots inside its **scope**
(`{watchlist, symbols[]}` resolved to a symbol list — watchlist means the
tracked universe: held ∪ watched symbols). Symbol-level metrics:
`day_change_pct`, `vs_ma50`, `value_floor`, `weight_pct` (holding share of
the marked-to-market book), `unrealized_gain_pct` (price vs avg cost).
Book-level metric: `cash_above` (fires once per strategy against total
cash). Operators: `lt`/`gt`.

**Rule types (0184)** — every rule carries `type`: `signal` (severity
`insight` \| `alert` — emits a signal when `notify.in_app`) or
`order_proposal` (`side` + `qty` + `qty_unit` =
`shares` \| `percent_of_position` \| `currency` — resolved to shares at the
snapshot price). A matching order proposal inserts a **draft** order on the
user's first active paper account and dedupes against open drafts. **The
bot never executes** — `paper_execute` autonomy was removed; approval is a
human clicking execute in the Orders tab.

**Cadence gating (0182)** — `strategyDue` skips a strategy whose
`cadence` window hasn't elapsed since `last_evaluated_at` (weekly = 7d,
monthly = 30d; never-run is always due). The sweep stamps
`last_evaluated_at` on every strategy it ran; manual `run` and `test-scan`
calls force evaluation so "Scan now" is never a silent no-op.

**Insight pass** — after the deterministic run, `maybeEmitInsights`
(`insights.ts`) asks the model route for one paragraph of book-level
observations and records them as `insight` signals with both `title`/`body`
and `title_fr`/`body_fr`. AI authors commentary only — it never writes
orders; execution stays in the deterministic engine. Failures degrade to
no insights, never a failed run.

## Market sync (`supabase/functions/invest-market-sync`)

- `POST { action: 'sync' }` — portal JWT; refreshes the caller's snapshots
  from free public feeds: **CoinGecko** for crypto, **Stooq** CSV for
  equities/ETFs (`handlers.ts` holds the pure quote-parsing helpers).
- `POST { action: 'sync-all' }` — service key / `x-trigger-secret` / admin
  JWT; sweeps every user's symbols. pg_cron `invest-market-sync-daily` at
  **07:20 UTC** — twenty minutes before the bot's 07:45 sweep, so
  strategies always evaluate fresh prices.
- Only symbols the user actually references (snapshots ∪ positions ∪
  watchlist) are fetched; unknown symbols land in `failed` and are
  reported back.
- **News refresh (0183)** — both actions also rebuild `invest_market_news`:
  `newsQueries` turns the synced universe into Google News RSS queries
  (one general CA-market feed + one per distinct symbol, company names
  preferred over tickers, 8 feeds max per run), `parseRssItems` normalizes
  `<item>` blocks, and rows upsert on `(symbol, url)` — shared table, so
  repeats across users/runs cost nothing. Google News RSS is free and
  keyless but unofficial — English wire text, surfaced under the standard
  "headlines come from third parties" posture.
- The Portfolios page exposes a "Refresh prices" button wired to `sync`
  (which also refreshes that user's news slice) plus the Watchlist
  section; Overview carries the Market news card filtered to the user's
  held ∪ watched symbols + general items.

## AI strategy drafter (`supabase/functions/invest-ai`)

`POST { action: 'draft-strategy', goal, lang }` — portal JWT. The model
turns a plain-language goal into a draft strategy (`name`, `scope`,
`rules` in the engine's exact shape — typed `signal`/`order_proposal`,
`cadence`). `handlers.ts` holds the system prompt and a tolerant parser —
fenced JSON, bare object, or array all decode; anything malformed drops
rather than throws, and `parseRules` re-validates every rule server-side.
The draft returns **disabled** with `template: 'ai-draft'`; nothing
reaches the book until the user reviews, picks the scope, saves, and
enables it. Reuses the shared `modelUpstream.ts` dispatch (falls back to
the `advisor_chat` route when no `invest_ai` row exists).

## What it deliberately is not

- **No broker calls.** `live` orders are bookkeeping — a human confirms
  the fill. Broker execution is a designed seam (per-user credentials,
  adapter per broker), not shipped.
- **No advice.** The public `/investors` page and the portal chrome state
  plainly: informational and educational tooling, not investment advice;
  Dutiva is not a registered dealer or adviser. AI output is constrained
  the same way — it drafts rules and commentary, never orders.
- **Feed quality.** CoinGecko/Stooq are free public feeds — delayed and
  rate-limited, fine for daily-cadence bookkeeping, not for intraday
  trading. `source` on each snapshot records where the price came from.
- **No demo mode.** The portal is real data only — invited clients see
  their own book.

## UI

`src/features/invest/` — `portal/` (layout, auth panel, five pages,
`StrategyForm.tsx` + `RuleCard.tsx` + `StrategyTemplates.tsx` +
`StrategyAiDraft.tsx`) + `data/` (types, API, provider,
`strategyTemplates.ts`, `strategyRules.ts` — the client mirror of the
engine's rule model). Nav: Overview, Portfolios, Orders,
Signals, Bot. Bilingual via `investMessages`; the language toggle rides
in the header like the candidate portal. Mobile nav collapses to a menu
under 820px.

The Strategies page offers three ways in: the AI drafter first (describe
a goal → reviewable draft), then the bilingual template gallery with
expandable rule previews and inline cadence (`tpl:*` provenance), and a
blank form. The form requires a scope (watchlist and/or symbols) before
saving; rules render as stacked sentence cards split into Notify-me /
Propose-an-order; a health panel shows estimated firing frequency,
cadence-mismatch warnings, and a write-free Test scan. Run history lists
symbols scanned, per-rule hit counts, and duration. Signals render
`title_fr`/`body_fr` when the UI language is French and the fields are
populated; engine signals stay locale-neutral.

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

- `supabase/functions/invest-bot/invest-bot.test.ts` — 31 engine tests
  (rule parsing incl. legacy-shape backfill, the signal/order-proposal
  split, quantity-unit resolution, plan generation, scope filtering,
  proposal dedupe, the never-executes invariant, fill math, book metrics,
  cadence gating, insight parsing).
- `supabase/functions/invest-market-sync/invest-market-sync.test.ts` —
  14 provider-helper tests (CoinGecko/Stooq parsing, symbol mapping, RSS
  parsing, news-query shaping).
- `supabase/functions/invest-ai/invest-ai.test.ts` — 6 drafter tests
  (prompt, tolerant parsing, validation, scope defaults, legacy-rule
  normalization).
- `src/features/invest/portal/InvestPortal.test.tsx` — 7 tests (auth gate,
  access gate, overview render incl. news, signal dismiss, paper-order
  execute, watchlist add/remove).
- Live: `trigger_invest_bot()` → `200 {scanned:0, results:[]}`;
  unauthenticated POST → 401.
