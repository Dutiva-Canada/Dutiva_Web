-- 0179_candidate_job_agent.sql
--
-- Candidate job-search agent. Three tables + a cron trigger that let an
-- opted-in candidate have the portal search configured external job boards
-- (Greenhouse/Lever public job-board APIs), score each new posting against
-- their resume, draft a tailored application package, and either queue it
-- for one-click review or submit it automatically where the source exposes
-- an application endpoint (Greenhouse job-board API accepts submissions;
-- Lever and others become 'manual_required' with the package attached).
--
--   candidate_agent_settings        — per-user opt-in: autonomy mode,
--                                     keywords, locations, board targets,
--                                     min match score, daily apply cap.
--   candidate_discovered_jobs       — postings the agent found, deduped on
--                                     (candidate, source, external_id).
--   candidate_external_applications — the application log: package,
--                                     channel, status, submitted_at.
--
-- Access model: the candidate reads their own rows and may update their own
-- applications (skip). All agent writes happen through the edge function
-- with the service role; no insert for authenticated users on either table.
-- trigger_candidate_job_agent mirrors trigger_law_monitor (0035): reads the
-- existing vault pair (support_scheduler_service_key bearer +
-- support_notify_secret header) and fires the edge function on a daily
-- pg_cron slot — no new secrets to provision.
--
-- ROLLBACK:
--   select cron.unschedule('candidate-job-agent-daily');
--   drop function if exists public.trigger_candidate_job_agent();
--   drop table if exists public.candidate_external_applications;
--   drop table if exists public.candidate_discovered_jobs;
--   drop table if exists public.candidate_agent_settings;

-- ── candidate_agent_settings ─────────────────────────────────────────────

create table if not exists public.candidate_agent_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  autonomy text not null default 'review'
    check (autonomy in ('review', 'auto_submit')),
  keywords text[] not null default '{}',
  locations text[] not null default '{}',
  remote_ok boolean not null default true,
  min_match_score integer not null default 70
    check (min_match_score between 0 and 100),
  -- [{"ats":"greenhouse"|"lever","slug":"board-token"}, ...]
  boards jsonb not null default '[]'::jsonb,
  daily_apply_cap integer not null default 5 check (daily_apply_cap > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.candidate_agent_settings enable row level security;

create policy "Candidates manage their own agent settings"
  on public.candidate_agent_settings for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── candidate_discovered_jobs ────────────────────────────────────────────

create table if not exists public.candidate_discovered_jobs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  source text not null check (source in ('greenhouse', 'lever', 'search')),
  external_id text not null,
  company text not null default '',
  title text not null default '',
  location text not null default '',
  url text not null default '',
  apply_url text,
  description text not null default '',
  match_score integer check (match_score between 0 and 100),
  status text not null default 'discovered'
    check (status in (
      'discovered', 'needs_review', 'queued',
      'submitted', 'manual_required', 'skipped', 'failed'
    )),
  error text,
  discovered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, source, external_id)
);

create index if not exists candidate_discovered_jobs_candidate_idx
  on public.candidate_discovered_jobs (candidate_id, discovered_at desc);
create index if not exists candidate_discovered_jobs_status_idx
  on public.candidate_discovered_jobs (candidate_id, status);

alter table public.candidate_discovered_jobs enable row level security;

create policy "Candidates read their own discovered jobs"
  on public.candidate_discovered_jobs for select
  using (candidate_id in (
    select id from public.candidate_profiles where user_id = (select auth.uid())
  ));

create policy "Candidates update their own discovered jobs"
  on public.candidate_discovered_jobs for update
  using (candidate_id in (
    select id from public.candidate_profiles where user_id = (select auth.uid())
  ))
  with check (candidate_id in (
    select id from public.candidate_profiles where user_id = (select auth.uid())
  ));

-- ── candidate_external_applications ──────────────────────────────────────

create table if not exists public.candidate_external_applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  discovered_job_id uuid not null unique
    references public.candidate_discovered_jobs(id) on delete cascade,
  status text not null default 'needs_review'
    check (status in (
      'needs_review', 'queued', 'submitted', 'manual_required', 'skipped', 'failed'
    )),
  tailored_resume text not null default '',
  cover_letter text not null default '',
  match_score integer check (match_score between 0 and 100),
  channel text check (channel in ('greenhouse_api', 'manual')),
  submitted_at timestamptz,
  response text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidate_external_applications_candidate_idx
  on public.candidate_external_applications (candidate_id, created_at desc);

alter table public.candidate_external_applications enable row level security;

create policy "Candidates read their own external applications"
  on public.candidate_external_applications for select
  using (candidate_id in (
    select id from public.candidate_profiles where user_id = (select auth.uid())
  ));

create policy "Candidates update their own external applications"
  on public.candidate_external_applications for update
  using (candidate_id in (
    select id from public.candidate_profiles where user_id = (select auth.uid())
  ))
  with check (candidate_id in (
    select id from public.candidate_profiles where user_id = (select auth.uid())
  ));

-- ── cron trigger ─────────────────────────────────────────────────────────
-- Mirrors trigger_law_monitor: reads the existing vault pair and posts to
-- the edge function. Missing secrets degrade to a warning, not a failure.

create or replace function public.trigger_candidate_job_agent()
returns void
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
    raise warning '[candidate-job-agent] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;

  perform net.http_post(
    url := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/candidate-job-agent',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(v_key, ''),
      'x-trigger-secret', v_secret
    ),
    body := '{"action":"scan-all"}'::jsonb,
    timeout_milliseconds := 300000
  );
end;
$$;

revoke execute on function public.trigger_candidate_job_agent()
  from public, anon, authenticated;
grant execute on function public.trigger_candidate_job_agent()
  to service_role;

-- 07:30 UTC daily — after the law monitor (07:00) and debt-maturity scan
-- (07:15).
do $$
begin
  perform cron.unschedule('candidate-job-agent-daily');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'candidate-job-agent-daily',
  '30 7 * * *',
  'select public.trigger_candidate_job_agent()'
);
