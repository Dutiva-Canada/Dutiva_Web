-- 0190 — strategy-level multi-match mode
--
-- The strategy builder's notification model gains one real field:
--
--   invest_strategies.multi_match — 'each'    → one in-app signal per
--                                                 rule×symbol hit (the
--                                                 behavior since 0184);
--                                   'summary' → one signal per scan
--                                                 listing every rule that
--                                                 matched. Notification
--                                                 collapse only: order
--                                                 proposals still emit one
--                                                 draft order per hit — each
--                                                 proposal needs its own
--                                                 explicit approval, so they
--                                                 can never be merged.
--
-- Default 'each' preserves every existing row's behavior; the constraint
-- keeps the vocabulary the edge engine understands.
--
-- Rollback (manual):
--   alter table public.invest_strategies
--     drop constraint if exists invest_strategies_multi_match_values,
--     drop column if exists multi_match;

alter table public.invest_strategies
  add column if not exists multi_match text not null default 'each';

alter table public.invest_strategies
  drop constraint if exists invest_strategies_multi_match_values;
alter table public.invest_strategies
  add constraint invest_strategies_multi_match_values
    check (multi_match in ('each', 'summary'));
