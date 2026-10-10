-- 0211_advisor_feedback_reason.sql
--
-- Advisor — thumbs-down can say why. Mirrors the portal companions'
-- feedback_reason columns (0210): after a -1 rating the UI offers one-tap
-- reasons and stores the pick on the same feedback row. Clearing or
-- flipping the rating clears the reason with it.
--
--   advisor_turn_feedback — + reason (nullable text)
--
-- ROLLBACK:
--   alter table public.advisor_turn_feedback drop column if exists reason;

alter table public.advisor_turn_feedback
  add column if not exists reason text;
