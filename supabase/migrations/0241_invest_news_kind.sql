-- 0241 — model-assigned headline kind
--
-- invest_market_news.kind — what the story is, not whether it matters:
--   'event' something happened; 'news' a fact story naming no single new
--   event; 'view' an analyst note, rating, or opinion/listicle; 'move' a
--   writeup whose substance is the price itself. Assigned by a batched
--   model pass inside invest-market-sync; nullable — rows the pass misses
--   (no route, truncated reply, pre-column history) stay null and the
--   portal falls back to its title heuristic, which classifies the same
--   four labels.
--
-- Rollback (manual):
--   alter table public.invest_market_news drop column kind;

alter table public.invest_market_news
  add column kind text;

alter table public.invest_market_news
  drop constraint if exists invest_market_news_kind_check;
alter table public.invest_market_news
  add constraint invest_market_news_kind_check
  check (kind is null or kind in ('event', 'news', 'view', 'move'));

comment on column public.invest_market_news.kind is
  'Model-assigned headline kind (event/news/view/move); null = unclassified.';
