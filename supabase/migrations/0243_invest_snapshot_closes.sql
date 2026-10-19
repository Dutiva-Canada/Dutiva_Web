-- 0243 — snapshots carry a recent close series for Tally
--
-- Aggregates alone (MA50, RSI, returns) flatten the shape of a move — a
-- 5-day slide and a V-shaped dip can share every one of them. The sync
-- already fetches a year of daily closes to compute those aggregates;
-- persisting the tail lets the chat read slope, streaks, and drawdown
-- off the same numbers instead of guessing.
--
-- Full syncs write it; light runs omit the key entirely, so the daily
-- series survives the 15-minute cadence untouched (same contract as the
-- technicals fields).
--
-- Rollback (manual):
--   alter table public.invest_market_snapshots drop column if exists closes_30d;

alter table public.invest_market_snapshots
  add column if not exists closes_30d jsonb;

comment on column public.invest_market_snapshots.closes_30d is
  'Last ~30 daily closes, oldest first. Written by full syncs only.';
