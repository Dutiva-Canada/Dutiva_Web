-- 0197_pr_mention_sentiment_auto.sql
--
-- Marks coverage rows whose tone tag came from the model (feed ingest /
-- "Suggest tone"), not a human read. The UI renders these with an "(AI)"
-- hint so a machine guess is never presented as someone's judgment; any
-- manual tone choice writes sentiment_auto = false.
--
-- ROLLBACK:
--   alter table public.pr_mentions drop column if exists sentiment_auto;

alter table public.pr_mentions
  add column if not exists sentiment_auto boolean not null default false;
