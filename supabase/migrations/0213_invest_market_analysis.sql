-- 0213_invest_market_analysis.sql
--
-- Invest — Tally gets numbers to reason over, not just book rows. The
-- market sync already downloads full daily price history (Stooq, CoinGecko
-- market_chart) and keeps only price + MA50; the rest is real technical
-- material that was being discarded. These columns store the computed
-- pack on the snapshot row so invest-ai can inject it into chat context:
--
--   ma200 / rsi14 / ret_1m / ret_3m / ret_12m / vol_20d / high_52w / low_52w
--     — computed from the same close series MA50 already comes from
--   fundamentals (jsonb)
--     — per-asset-class basics from free feeds: {market_cap, pe_trailing,
--       pe_forward, eps_ttm, price_to_book, dividend_yield, beta} for
--       equities (Yahoo quote, keyless, best-effort) and {market_cap,
--       volume_24h, circulating_supply, ath, ath_change_pct} for crypto
--       (CoinGecko /coins/markets). Shape varies by class — jsonb, not
--       columns per field.
--   fundamentals_as_of — when the fundamentals blob was last refreshed;
--     technicals ride the row's existing as_of.
--
-- All nullable: unknown tickers, feed gaps, and pre-0213 rows simply carry
-- NULL and the prompt tells Tally to say "no data on file" rather than
-- invent figures.
--
-- ROLLBACK:
--   alter table public.invest_market_snapshots
--     drop column if exists ma200, drop column if exists rsi14,
--     drop column if exists ret_1m, drop column if exists ret_3m,
--     drop column if exists ret_12m, drop column if exists vol_20d,
--     drop column if exists high_52w, drop column if exists low_52w,
--     drop column if exists fundamentals, drop column if exists fundamentals_as_of;

alter table public.invest_market_snapshots
  add column if not exists ma200 double precision,
  add column if not exists rsi14 double precision,
  add column if not exists ret_1m double precision,
  add column if not exists ret_3m double precision,
  add column if not exists ret_12m double precision,
  add column if not exists vol_20d double precision,
  add column if not exists high_52w double precision,
  add column if not exists low_52w double precision,
  add column if not exists fundamentals jsonb,
  add column if not exists fundamentals_as_of timestamptz;
