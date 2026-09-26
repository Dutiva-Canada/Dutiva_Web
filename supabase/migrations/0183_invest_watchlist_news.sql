-- 0183 — watchlist + market news
--
-- invest_watchlist — symbols a user wants priced/tracked without holding
-- them. Feeds two things: the market-sync universe (a watched symbol gets a
-- daily snapshot, so dip-watcher strategies work before the first position)
-- and the per-symbol news queries.
--
-- invest_market_news — shared market headlines, one row per (symbol, url).
-- Public market data, not user data: grant-holders read, only the service
-- role (the market-sync function) writes. '' symbol = general market item.
--
-- Rollback (manual):
--   drop table if exists public.invest_market_news;
--   drop table if exists public.invest_watchlist;

create table if not exists public.invest_watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_class text not null
    check (asset_class in ('equity', 'etf', 'crypto', 'bond', 'cash', 'other')),
  symbol text not null,
  name text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, asset_class, symbol)
);

alter table public.invest_watchlist enable row level security;

drop policy if exists invest_watchlist_owner on public.invest_watchlist;
create policy invest_watchlist_owner on public.invest_watchlist
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.invest_market_news (
  id bigint generated always as identity primary key,
  symbol text not null default '',
  asset_class text not null default '',
  title text not null,
  url text not null,
  source text not null default '',
  summary text not null default '',
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  unique (symbol, url)
);

alter table public.invest_market_news enable row level security;

-- Headlines are third-party content the portal surfaces to invited users;
-- the access grant is the read gate. Writes happen through the service role
-- inside invest-market-sync — anon/auth users get no write policy.
drop policy if exists invest_market_news_read on public.invest_market_news;
create policy invest_market_news_read on public.invest_market_news
  for select
  using (
    exists (
      select 1 from public.invest_access a
      where a.user_id = auth.uid()
    )
  );
