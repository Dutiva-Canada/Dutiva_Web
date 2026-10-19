-- 0242 — headline kind gains 'filing'
--
-- Position-disclosure churn ('Annex Advisory LLC Raises Holdings in X')
-- is a fact but not an event — it gets its own kind so it can sink to
-- the bottom of the day with its own badge instead of passing as news.
-- Relaxing the check, not adding a column.
--
-- Rollback (manual):
--   alter table public.invest_market_news
--     drop constraint if exists invest_market_news_kind_check;
--   alter table public.invest_market_news
--     add constraint invest_market_news_kind_check
--     check (kind is null or kind in ('event', 'news', 'view', 'move'));

alter table public.invest_market_news
  drop constraint if exists invest_market_news_kind_check;
alter table public.invest_market_news
  add constraint invest_market_news_kind_check
  check (kind is null or kind in ('event', 'news', 'view', 'move', 'filing'));

comment on column public.invest_market_news.kind is
  'Model-assigned headline kind (event/news/view/move/filing); null = unclassified.';
