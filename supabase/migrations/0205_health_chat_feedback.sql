-- 0205_health_chat_feedback.sql
--
-- Dutiva Health — thumbs up/down on assistant turns. One smallint on the
-- message row itself: the table's only writer is the health-ai function
-- (kind 'chat_feedback', which also constrains the write to the caller's
-- own assistant rows), so no new table or policy is needed.
--
--   feedback — 1 (helpful) / -1 (not helpful) / null (unrated or cleared)
--
-- ROLLBACK:
--   alter table public.health_chat_messages drop column if exists feedback;

alter table public.health_chat_messages
  add column if not exists feedback smallint
  check (feedback in (-1, 1));
