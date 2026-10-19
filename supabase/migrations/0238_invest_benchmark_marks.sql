-- 0238 — benchmark marks for the track record
--
-- invest_benchmark_marks — shared daily closes for the two comparison
--   ETFs the track record can overlay: XEQT.TO for CAD books, SPY for
--   USD books. Public market data, keyed (symbol, mark_date), global
--   like invest_market_news — one row per day regardless of user count.
--   invest-market-sync upserts from the Yahoo daily chart: hourly runs
--   refresh a 1-month tail, the daily full sync refreshes 2y so gaps
--   and backfills heal themselves.
--
--   Reads follow the invest_market_news pattern: the invest_access
--   grant is the gate; writes stay service-role inside the function.

create table if not exists public.invest_benchmark_marks (
  symbol text not null,
  mark_date date not null,
  close numeric not null,
  fetched_at timestamptz not null default now(),
  primary key (symbol, mark_date)
);

alter table public.invest_benchmark_marks enable row level security;

drop policy if exists invest_benchmark_marks_read on public.invest_benchmark_marks;
create policy invest_benchmark_marks_read on public.invest_benchmark_marks
  for select
  using (
    exists (
      select 1 from public.invest_access a
      where a.user_id = auth.uid()
    )
  );
