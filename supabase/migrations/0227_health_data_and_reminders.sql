-- 0227_health_data_and_reminders.sql
--
-- Two small openings the Health "Your data" page and the daily check-in
-- reminder need:
--
--   1. portal_notification_prefs.reminder_enabled — the evening "haven't
--      checked in yet" email is opt-IN (unlike email_enabled's opt-out),
--      so it gets its own column rather than piggybacking on row
--      presence. health-habit-notify's evening sweep reads it; the client
--      probes for the column and hides the toggle until this lands.
--
--   2. An owner DELETE policy on agent_suggestions — the data page's
--      "delete everything" should empty the person's Health review queue
--      too, not just the rows they typed. Grant stays narrow: delete
--      only, still no authenticated INSERT, and the update grant remains
--      limited to the resolution columns. The client already falls back
--      to resolving pending rows when this policy isn't there yet, so
--      shipping order doesn't matter.
--
-- ROLLBACK:
--   alter table public.portal_notification_prefs
--     drop column if exists reminder_enabled;
--   drop policy if exists "Users delete their own agent_suggestions"
--     on public.agent_suggestions;
--   revoke delete on public.agent_suggestions from authenticated;
--   -- restore the prior kind list if the reminder kind must go:
--   -- alter table public.notification_log drop constraint notification_log_kind_check;
--   -- alter table public.notification_log add constraint notification_log_kind_check
--   --   check (kind in ('pr_coverage','pr_coverage_alert','health_streak_risk'));

alter table public.portal_notification_prefs
  add column if not exists reminder_enabled boolean not null default false;

comment on column public.portal_notification_prefs.reminder_enabled is
  'Opt-in daily check-in reminder (health-habit-notify evening sweep). False/absent = off.';

/* The reminder email gets its own kind so dedupe stays per-day and the
   log distinguishes it from the streak-at-risk nudge it shares the
   sweep with. */
alter table public.notification_log
  drop constraint if exists notification_log_kind_check;
alter table public.notification_log
  add constraint notification_log_kind_check
    check (kind in ('pr_coverage','pr_coverage_alert','health_streak_risk','health_checkin_reminder'));

create policy "Users delete their own agent_suggestions"
  on public.agent_suggestions for delete to authenticated
  using ((select auth.uid()) = user_id);

grant delete on public.agent_suggestions to authenticated;
