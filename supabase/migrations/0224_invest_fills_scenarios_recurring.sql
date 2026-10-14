-- 0224 — fills as first-class rows, saved stress scenarios, recurring
-- contributions, and per-account book snapshots.
--
-- invest_order_fills — every fill against an order, not just the final one.
-- A queued order may fill in parts (real fills split); each fill stores the
-- position's avg cost at that instant (avg_cost_at_fill) so realized P&L on
-- sells stays correct even after the position mutates. Legacy executed
-- orders get one backfilled fill each — their avg cost at fill time is
-- unknowable, so realized shows "—" for those.
--
-- invest_stress_scenarios — named shock sets saved from the stress panel.
-- shocks is the jsonb array the client evaluator consumes; server never
-- reads it.
--
-- invest_recurring_contributions — a scheduled deposit. The sweep writes a
-- cash event (and moves cash_balance) when next_run_on lands, then advances
-- the date. Weekly/monthly only — a daily interval duplicates what a
-- recurring transfer at the broker is for.
--
-- invest_book_snapshots.account_id — nullable FK splitting the daily mark
-- per account. The book-wide row keeps account_id null; per-account rows
-- let the curve isolate one book. The old (user_id, as_of) unique becomes
-- two partial indexes — Postgres treats nulls as distinct, so a single
-- three-column unique would allow duplicate book-wide rows.
--
-- Rollback (manual):
--   alter table public.invest_book_snapshots drop column if exists account_id;
--   drop table if exists public.invest_recurring_contributions;
--   drop table if exists public.invest_stress_scenarios;
--   drop table if exists public.invest_order_fills;

create table if not exists public.invest_order_fills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid not null references public.invest_orders (id) on delete cascade,
  quantity numeric(18,8) not null check (quantity > 0),
  price numeric(18,8) not null check (price > 0),
  filled_at timestamptz not null default now(),
  /* The position's avg cost the instant this fill landed — realized P&L on
     sells derives from it, so it survives later position mutations. Null on
     backfilled legacy fills. */
  avg_cost_at_fill numeric(18,8),
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.invest_order_fills enable row level security;

drop policy if exists invest_order_fills_owner on public.invest_order_fills;
create policy invest_order_fills_owner on public.invest_order_fills
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists invest_order_fills_order_idx
  on public.invest_order_fills (order_id);
create index if not exists invest_order_fills_user_idx
  on public.invest_order_fills (user_id, filled_at desc);

/* Backfill: one fill per already-executed order so fills are the single
   source going forward. avg_cost_at_fill stays null — unknowable. */
insert into public.invest_order_fills (user_id, order_id, quantity, price, filled_at)
select o.user_id, o.id, o.quantity, o.executed_price, o.executed_at
from public.invest_orders o
where o.status = 'executed' and o.executed_price is not null
  and not exists (select 1 from public.invest_order_fills f where f.order_id = o.id);

create table if not exists public.invest_stress_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0 and length(name) <= 80),
  shocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invest_stress_scenarios enable row level security;

drop policy if exists invest_stress_scenarios_owner on public.invest_stress_scenarios;
create policy invest_stress_scenarios_owner on public.invest_stress_scenarios
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists invest_stress_scenarios_user_idx
  on public.invest_stress_scenarios (user_id, created_at desc);

create table if not exists public.invest_recurring_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.invest_accounts (id) on delete cascade,
  amount numeric(18,4) not null check (amount > 0),
  currency text not null default 'CAD',
  cadence text not null check (cadence in ('weekly', 'monthly')),
  next_run_on date not null,
  enabled boolean not null default true,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invest_recurring_contributions enable row level security;

drop policy if exists invest_recurring_contributions_owner on public.invest_recurring_contributions;
create policy invest_recurring_contributions_owner on public.invest_recurring_contributions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists invest_recurring_due_idx
  on public.invest_recurring_contributions (next_run_on)
  where enabled;

alter table public.invest_book_snapshots
  add column if not exists account_id uuid references public.invest_accounts (id) on delete cascade;

/* The (user_id, as_of) unique can't cover a nullable account — nulls are
   never equal under unique semantics, which would let book-wide rows
   duplicate. Two partial uniques express the real rule instead. */
alter table public.invest_book_snapshots
  drop constraint if exists invest_book_snapshots_user_id_as_of_key;

create unique index if not exists invest_book_snapshots_book_uniq
  on public.invest_book_snapshots (user_id, as_of)
  where account_id is null;
create unique index if not exists invest_book_snapshots_account_uniq
  on public.invest_book_snapshots (user_id, account_id, as_of)
  where account_id is not null;
