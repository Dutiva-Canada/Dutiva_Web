-- 0180_invest_platform.sql
--
-- Invest portal — the standalone, access-gated investment analysis /
-- signals / paper-trading surface at /invest (own auth gate, own layout —
-- same standalone pattern as the candidate portal at /careers/portal).
-- Data is per-user, not per-org: clients sign in with their own account and
-- see only their own rows. Access is invite-only: a row in `invest_access`
-- is the gate; the firm grants it manually for the select few.
--
--   invest_access             — user_id → granted_at; presence = access
--   invest_accounts           — a book of record: paper | live | external
--   invest_positions          — holdings per account across asset classes
--   invest_market_snapshots   — latest price per (user, class, symbol);
--                               source 'manual' today, feed adapters later
--   invest_strategies         — bot rule sets (rules jsonb, autonomy,
--                               enabled, asset_classes[])
--   invest_signals            — bot output: screen/insight/alert/thesis
--   invest_orders             — order intents: paper orders execute against
--                               snapshots; live orders are recorded and
--                               confirmed manually (mode 'live')
--   invest_bot_runs           — engine run log
--   trigger_invest_bot        — daily pg_cron → edge function
--
-- The surface is informational/educational only: no advice, and live
-- execution is recorded as order state, not placed — broker adapters are a
-- deliberate seam, not an integration this migration pretends to ship.
--
-- ROLLBACK:
--   select cron.unschedule('invest-bot-daily');
--   drop function if exists public.trigger_invest_bot();
--   drop table if exists public.invest_bot_runs, public.invest_orders,
--     public.invest_signals, public.invest_strategies,
--     public.invest_market_snapshots, public.invest_positions,
--     public.invest_accounts, public.invest_access;

create table if not exists public.invest_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by text not null default '',
  note text not null default '',
  granted_at timestamptz not null default now()
);

create table if not exists public.invest_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'paper' check (kind in ('paper', 'live', 'external')),
  base_currency text not null default 'CAD',
  cash_balance numeric(18,4) not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invest_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.invest_accounts(id) on delete cascade,
  asset_class text not null
    check (asset_class in ('equity', 'etf', 'crypto', 'bond', 'cash', 'other')),
  symbol text not null,
  name text not null default '',
  quantity numeric(18,8) not null default 0 check (quantity >= 0),
  avg_cost numeric(18,4) not null default 0,
  currency text not null default 'CAD',
  last_price numeric(18,4),
  last_price_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, asset_class, symbol)
);

create table if not exists public.invest_market_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_class text not null
    check (asset_class in ('equity', 'etf', 'crypto', 'bond', 'cash', 'other')),
  symbol text not null,
  price numeric(18,4) not null,
  day_change_pct numeric(9,4),
  ma50 numeric(18,4),
  currency text not null default 'CAD',
  source text not null default 'manual',
  as_of timestamptz not null default now(),
  unique (user_id, asset_class, symbol)
);

create table if not exists public.invest_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  enabled boolean not null default false,
  asset_classes text[] not null default '{equity}',
  -- [{metric:'day_change_pct'|'vs_ma50'|'value_floor', op:'lt'|'gt',
  --   value:number, kind:'screen'|'alert', title:string,
  --   side?:'buy'|'sell', qty?:number}]
  rules jsonb not null default '[]'::jsonb,
  autonomy text not null default 'suggest' check (autonomy in ('suggest', 'paper_execute')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invest_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  strategy_id uuid references public.invest_strategies(id) on delete set null,
  asset_class text not null
    check (asset_class in ('equity', 'etf', 'crypto', 'bond', 'cash', 'other')),
  symbol text not null default '',
  name text not null default '',
  kind text not null default 'insight' check (kind in ('screen', 'insight', 'alert', 'thesis')),
  title text not null,
  body text not null default '',
  score numeric(5,1) check (score between 0 and 100),
  status text not null default 'new' check (status in ('new', 'acknowledged', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.invest_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.invest_accounts(id) on delete cascade,
  signal_id uuid references public.invest_signals(id) on delete set null,
  asset_class text not null
    check (asset_class in ('equity', 'etf', 'crypto', 'bond', 'cash', 'other')),
  symbol text not null,
  name text not null default '',
  side text not null check (side in ('buy', 'sell')),
  quantity numeric(18,8) not null check (quantity > 0),
  order_type text not null default 'market' check (order_type in ('market', 'limit')),
  limit_price numeric(18,4),
  mode text not null default 'paper' check (mode in ('paper', 'live')),
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'executed', 'cancelled', 'failed')),
  requested_price numeric(18,4),
  executed_price numeric(18,4),
  executed_at timestamptz,
  note text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invest_bot_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ran_at timestamptz not null default now(),
  signals_emitted integer not null default 0,
  orders_suggested integer not null default 0,
  orders_executed integer not null default 0,
  summary text not null default '',
  status text not null default 'ok' check (status in ('ok', 'partial', 'failed'))
);

-- Indexes + RLS: every table is owned rows only — auth.uid() = user_id,
-- the same contract candidate portal tables use.
create index if not exists invest_positions_user_idx
  on public.invest_positions (user_id);
create index if not exists invest_positions_account_idx
  on public.invest_positions (account_id);
create index if not exists invest_signals_user_idx
  on public.invest_signals (user_id, created_at desc);
create index if not exists invest_orders_user_idx
  on public.invest_orders (user_id, created_at desc);
create index if not exists invest_bot_runs_user_idx
  on public.invest_bot_runs (user_id, ran_at desc);

-- invest_access is read-only for its owner (the gate check); grants are
-- inserted by service role / dashboard, not self-served.
alter table public.invest_access enable row level security;
create policy "Users read their own invest access"
  on public.invest_access for select
  using ((select auth.uid()) = user_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'invest_accounts', 'invest_positions', 'invest_market_snapshots',
    'invest_strategies', 'invest_signals', 'invest_orders', 'invest_bot_runs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "Users manage their own %I" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t, t
    );
  end loop;
end
$$;

-- ── cron trigger ─────────────────────────────────────────────────────────
-- Mirrors trigger_candidate_job_agent: existing vault pair, daily 07:45 UTC
-- (after the 07:30 candidate-agent slot).

create or replace function public.trigger_invest_bot()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_key text;
  v_secret text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where name = 'support_scheduler_service_key';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'support_notify_secret';

  if v_secret is null or length(btrim(v_secret)) = 0 then
    raise warning '[invest-bot] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;

  perform net.http_post(
    url := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/invest-bot',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(v_key, ''),
      'x-trigger-secret', v_secret
    ),
    body := '{"action":"run-all"}'::jsonb,
    timeout_milliseconds := 300000
  );
end;
$$;

revoke execute on function public.trigger_invest_bot()
  from public, anon, authenticated;
grant execute on function public.trigger_invest_bot()
  to service_role;

do $$
begin
  perform cron.unschedule('invest-bot-daily');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'invest-bot-daily',
  '45 7 * * *',
  'select public.trigger_invest_bot()'
);
