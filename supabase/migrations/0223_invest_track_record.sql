-- 0223 — the track record, the cash ledger, and rebalance targets.
--
-- invest_book_snapshots — one row per user per sweep-day: the book's
-- marked value split into its cash and invested legs, in book currency.
-- The sweep upserts it every run (the (user_id, as_of) pair keeps one
-- row per calendar day); the Overview performance curve reads it. Cold
-- start is honest — history begins with the first sweep after this
-- lands, so the curve labels its first point.
--
-- invest_cash_events — deposits, withdrawals, and dividends the user
-- records against an account. The ledger is what separates "the market
-- moved" from "I moved money" in the performance story. Recording an
-- event also moves the account's cash_balance (the client does both
-- writes — insert, then balance update, with a compensating delete if
-- the balance write fails).
--
-- invest_positions.target_weight_pct — the rebalance anchor: the share
-- of book value the position should hold. Null = untargeted; the
-- Portfolio rebalance card measures drift against it and drafts the
-- orders to close the gap — always drafts, never fills itself.
--
-- Rollback (manual):
--   alter table public.invest_positions drop column if exists target_weight_pct;
--   drop table if exists public.invest_cash_events;
--   drop table if exists public.invest_book_snapshots;

create table if not exists public.invest_book_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  /* Sweep-day (UTC) the marks describe — one row per user per day, later
     sweeps refresh it rather than stack intraday duplicates. */
  as_of date not null,
  book_value numeric(18,4) not null,
  cash numeric(18,4) not null,
  invested numeric(18,4) not null,
  currency text not null default 'CAD',
  created_at timestamptz not null default now(),
  unique (user_id, as_of)
);

alter table public.invest_book_snapshots enable row level security;

drop policy if exists invest_book_snapshots_owner on public.invest_book_snapshots;
create policy invest_book_snapshots_owner on public.invest_book_snapshots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists invest_book_snapshots_user_idx
  on public.invest_book_snapshots (user_id, as_of);

create table if not exists public.invest_cash_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.invest_accounts (id) on delete cascade,
  kind text not null check (kind in ('deposit', 'withdrawal', 'dividend')),
  amount numeric(18,4) not null check (amount > 0),
  /* Amounts are in the account's base currency — the form says so
     rather than guess an FX rate for a past date. */
  currency text not null default 'CAD',
  occurred_at date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.invest_cash_events enable row level security;

drop policy if exists invest_cash_events_owner on public.invest_cash_events;
create policy invest_cash_events_owner on public.invest_cash_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists invest_cash_events_user_idx
  on public.invest_cash_events (user_id, occurred_at desc);

alter table public.invest_positions
  add column if not exists target_weight_pct numeric(7,4);

comment on column public.invest_positions.target_weight_pct is
  'Share of book value this position should hold — the rebalance card measures drift against it. Null = untargeted.';
