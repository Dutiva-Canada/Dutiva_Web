-- Policy review reminders — auto-flag stale policies and email org admins.
--
-- WHY: Pricing claims "Policy review reminders" for all plans. Status flags
-- alone are not reminders; this cron flags overdue policies and emails admins.
--
-- ROLLBACK:
--   select cron.unschedule('policy-review-sweep');
--   drop function if exists public.policy_review_scheduler_status();
--   drop function if exists public.trigger_policy_review_scheduler();
--   drop function if exists public.hr_policies_orgs_needing_reminder();
--   drop function if exists public.hr_policies_flag_overdue_for_review();
--   alter table public.hr_policies drop column if exists last_reminder_sent_at;
--   alter table public.organizations drop column if exists policy_review_days;

alter table public.organizations
  add column if not exists policy_review_days integer not null default 90;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_policy_review_days_check'
  ) then
    alter table public.organizations
      add constraint organizations_policy_review_days_check
      check (policy_review_days between 30 and 365);
  end if;
end;
$$;

alter table public.hr_policies
  add column if not exists last_reminder_sent_at timestamptz;

create index if not exists hr_policies_review_reminder_idx
  on public.hr_policies (organization_id, last_reviewed, status)
  where status in ('up_to_date', 'needs_review', 'missing');

-- Flag written policies whose last review is older than the org cadence (or never reviewed).
create or replace function public.hr_policies_flag_overdue_for_review()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_updated bigint;
begin
  with overdue as (
    select p.id
    from public.hr_policies p
    join public.organizations o on o.id = p.organization_id
    where p.status = 'up_to_date'
      and (
        p.last_reviewed is null
        or p.last_reviewed::timestamptz
          < now() - (greatest(30, least(365, coalesce(o.policy_review_days, 90))) * interval '1 day')
      )
  )
  update public.hr_policies p
  set status = 'needs_review',
      updated_at = now()
  from overdue
  where p.id = overdue.id;

  get diagnostics v_updated = row_count;
  return coalesce(v_updated, 0);
end;
$$;

revoke execute on function public.hr_policies_flag_overdue_for_review() from public, anon, authenticated;
grant execute on function public.hr_policies_flag_overdue_for_review() to service_role;

-- Orgs with policies that need attention and have not been reminded in 7 days.
create or replace function public.hr_policies_orgs_needing_reminder()
returns table (
  organization_id uuid,
  organization_name text,
  policy_count bigint,
  policy_names text[]
)
language sql
security definer
set search_path = public
stable
as $$
  with due as (
    select
      p.organization_id,
      p.name,
      p.last_reminder_sent_at,
      o.name as org_name,
      greatest(30, least(365, coalesce(o.policy_review_days, 90))) as review_days
    from public.hr_policies p
    join public.organizations o on o.id = p.organization_id
    where p.status in ('needs_review', 'missing')
       or (
         p.status = 'up_to_date'
         and (
           p.last_reviewed is null
           or p.last_reviewed::timestamptz
             < now() - (greatest(30, least(365, coalesce(o.policy_review_days, 90))) * interval '1 day')
         )
       )
  ),
  eligible as (
    select *
    from due
    where last_reminder_sent_at is null
       or last_reminder_sent_at < now() - interval '7 days'
  )
  select
    e.organization_id,
    max(e.org_name) as organization_name,
    count(*)::bigint as policy_count,
    array_agg(e.name order by e.name) as policy_names
  from eligible e
  group by e.organization_id;
$$;

revoke execute on function public.hr_policies_orgs_needing_reminder() from public, anon, authenticated;
grant execute on function public.hr_policies_orgs_needing_reminder() to service_role;

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.trigger_policy_review_scheduler() returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_key text;
  v_secret text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where name = 'support_scheduler_service_key';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'support_notify_secret';

  if v_secret is null or length(btrim(v_secret)) = 0 then
    raise warning '[policy-review-scheduler] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;

  perform net.http_post(
    url := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/policy-review-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(v_key, ''),
      'x-trigger-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

revoke execute on function public.trigger_policy_review_scheduler() from public, anon, authenticated;
grant execute on function public.trigger_policy_review_scheduler() to service_role;

create or replace function public.policy_review_scheduler_status()
returns table (
  secret_configured boolean,
  job_scheduled boolean,
  orgs_awaiting_reminder bigint,
  last_reminder_sent timestamptz
)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select
    exists (select 1 from vault.decrypted_secrets where name = 'support_notify_secret'),
    exists (select 1 from cron.job where jobname = 'policy-review-sweep' and active),
    (select count(*) from public.hr_policies_orgs_needing_reminder()),
    (select max(last_reminder_sent_at) from public.hr_policies);
$$;

revoke execute on function public.policy_review_scheduler_status() from public, anon, authenticated;
grant execute on function public.policy_review_scheduler_status() to service_role;

do $$
begin
  perform cron.unschedule('policy-review-sweep');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'policy-review-sweep',
  '15 13 * * *',
  $$select public.trigger_policy_review_scheduler();$$
);
