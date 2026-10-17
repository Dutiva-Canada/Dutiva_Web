-- 0237 — provenance on market news
--
-- invest_market_news.via_theme — the watch-item title whose headline feed
--   surfaced the row. Null means the row arrived through a symbol or the
--   general feed (the longstanding behavior). A non-null value is honest
--   provenance: the story reached the symbol because a watch item claims
--   the theme touches it, not because the story names the holding — and
--   the portal can mark it accordingly instead of letting it read as a
--   direct mention. Nullable, no backfill needed: existing rows keep null
--   and every reader treats null as "not theme-sourced".

alter table public.invest_market_news
  add column via_theme text;

comment on column public.invest_market_news.via_theme is
  'Watch-item title whose feed surfaced the row; null = symbol or general feed.';
