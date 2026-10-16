-- 0229_local_days_and_tz.sql
--
-- The writer's own calendar day, stored — the same shape health_habit_logs
-- has always had (its `day` is the client's local YYYY-MM-DD). Until now the
-- server bucketed check-ins by the UTC date of created_at: a check-in
-- written at 11pm local lands in the next UTC day, so Mira's facts and the
-- charts could put the same entry on different days. Same edge for a habit
-- created near midnight — the portal's "started" day vs the server's UTC
-- date.
--
--   health_checkins.day — the local day the check-in was written (client-
--                         supplied at insert; chat action add_checkin passes
--                         the same `today` the caller already sends). NULL on
--                         legacy rows — readers fall back to the UTC date of
--                         created_at, which was always the behaviour.
--   health_habits.day   — the local day the habit was created; streak and
--                         progress math use it to ignore logs stamped before
--                         the habit existed. NULL → created_at::date (UTC),
--                         today's behaviour.
--   portal_notification_prefs.tz — the user's IANA timezone, synced by the
--                         portal on load. Lets the 23:00 UTC evening sweep
--                         compute "today" per user instead of per UTC — a
--                         traveller east of Greenwich stops getting nudges
--                         for a day that hasn't started for them.
--
-- ROLLBACK:
--   alter table public.health_checkins drop column if exists day;
--   alter table public.health_habits drop column if exists day;
--   alter table public.portal_notification_prefs drop column if exists tz;

alter table public.health_checkins
  add column if not exists day date;

comment on column public.health_checkins.day is
  'The writer''s local calendar day (client-supplied). NULL on pre-0229 rows — read as created_at::date (UTC).';

alter table public.health_habits
  add column if not exists day date;

comment on column public.health_habits.day is
  'The local calendar day the habit was created (client-supplied). NULL on pre-0229 rows — read as created_at::date (UTC).';

alter table public.portal_notification_prefs
  add column if not exists tz text;

comment on column public.portal_notification_prefs.tz is
  'Last-seen IANA timezone (e.g. America/Toronto), synced by the portal. Used by health-habit-notify to compute the user''s local today; NULL falls back to UTC.';
