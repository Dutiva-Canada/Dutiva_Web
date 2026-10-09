-- 0207_pr_invest_chat_feedback.sql
--
-- Dutiva PR + Invest — thumbs up/down on assistant turns, same contract as
-- 0205 for health: one smallint on the message row itself. Each table's
-- only writer is its own function (kind 'chat_feedback', which constrains
-- the write to the caller's own assistant rows), so no new table or
-- policy is needed.
--
--   feedback — 1 (helpful) / -1 (not helpful) / null (unrated or cleared)
--
-- ROLLBACK:
--   alter table public.pr_chat_messages drop column if exists feedback;
--   alter table public.invest_chat_messages drop column if exists feedback;

alter table public.pr_chat_messages
  add column if not exists feedback smallint
  check (feedback in (-1, 1));

alter table public.invest_chat_messages
  add column if not exists feedback smallint
  check (feedback in (-1, 1));
