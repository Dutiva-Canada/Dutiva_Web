-- 0196_portal_notifications.sql
--
-- Email notifications for the standalone portals, on the existing
-- SUPPORT_NOTIFY_SECRET / pg_cron / pg_net contract:
--
--   portal_notification_prefs — per-(user, surface) email opt-out. Absent row
--                               means enabled; users flip it from the surface
--                               that sends (PR feeds card, Health habits page).
--   notification_log          — one row per (user, kind, ref_date) so a
--                               notification family can never email twice in a
--                               day. Written by edge functions only (service
--                               role); owner can read as an audit trail.
--   trigger_health_streak_notify / 'health-streak-notify' cron — daily at
--                               23:00 UTC (evening ET): warns when a habit
--                               with a live streak isn't checked off yet.
--                               Coverage emails piggyback on the existing
--                               pr-mentions-feed run — they only exist when
--                               that sync actually inserted rows.
--
-- ROLLBACK:
--   select cron.unschedule('health-streak-notify');
--   drop function if exists public.trigger_health_streak_notify();
--   drop table if exists public.notification_log, public.portal_notification_prefs;

create table if not exists public.portal_notification_prefs (
  user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null check (surface in ('pr','health')),
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, surface)
);

alter table public.portal_notification_prefs enable row level security;
create policy "Users manage their own portal_notification_prefs"
  on public.portal_notification_prefs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('pr_coverage','health_streak_risk')),
  ref_date date not null,
  sent_at timestamptz not null default now(),
  unique (user_id, kind, ref_date)
);

create index if not exists notification_log_user_idx
  on public.notification_log (user_id, ref_date desc);

/* Read-only for the owner — functions write through the service role. */
alter table public.notification_log enable row level security;
create policy "Users read their own notification_log"
  on public.notification_log for select to authenticated
  using ((select auth.uid()) = user_id);

/* ---------- cron: health streak-at-risk nudge ---------------------------- */

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.trigger_health_streak_notify() returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'support_notify_secret';
  if v_secret is null or length(btrim(v_secret)) = 0 then
    raise warning '[health-habit-notify] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;
  perform net.http_post(
    url     := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/health-habit-notify',
    headers := jsonb_build_object(
      'Content-Type',     'application/json',
      'x-trigger-secret', v_secret
    ),
    body                 := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

revoke execute on function public.trigger_health_streak_notify() from public, anon, authenticated;
grant  execute on function public.trigger_health_streak_notify() to service_role;

do $$
begin
  perform cron.unschedule('health-streak-notify');
exception when others then null;
end;
$$;

/* 23:00 UTC ≈ 6–7pm ET — late enough that a done habit is already logged,
   early enough that the day isn't over. */
select cron.schedule(
  'health-streak-notify',
  '0 23 * * *',
  $$select public.trigger_health_streak_notify()$$
);
