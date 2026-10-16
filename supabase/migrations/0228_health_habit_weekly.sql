-- 0228_health_habit_weekly.sql
--
-- Optional weekly cadence for habits — "3× this week" instead of the
-- daily all-or-nothing streak. NULL keeps the daily behaviour; 1..6 is
-- the times-per-week target (7 would just be daily again, so the check
-- caps at 6). The client probes for the column and hides the cadence
-- control until this lands, so ship order doesn't matter.
--
-- ROLLBACK:
--   alter table public.health_habits drop column if exists weekly_target;

alter table public.health_habits
  add column if not exists weekly_target smallint
    check (weekly_target between 1 and 6);

comment on column public.health_habits.weekly_target is
  'Opt-in times-per-week goal; NULL = daily habit. A weekly habit still logs per-day — the target just reframes the progress readout.';
