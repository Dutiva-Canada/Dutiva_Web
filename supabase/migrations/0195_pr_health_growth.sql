-- 0195_pr_health_growth.sql
--
-- Third pass on the PR portal + the first Health expansion.
--
--   pr_feeds          — RSS/Atom feeds the user pastes in (Google Alerts,
--                       outlet feeds). pr-mentions-feed polls them daily and
--                       logs new items as coverage; dedupe is on
--                       (user_id, url) against pr_mentions.
--   pr_connections    — one row per external platform the desk can connect
--                       (buffer | linkedin | meta | search_console). Rows are
--                       written by the OAuth flows when those exist; until
--                       then the UI renders every provider as pending and
--                       the table stays empty. No dead buttons.
--   pr_geo_prompts    — +checked_via ('manual' | 'auto'): a scheduled
--                       pr-geo-check run writes 'auto' so model-knowledge
--                       results are never confused with a human spot-check.
--   health_habits /   — daily wellness habits (non-clinical): a habit name
--     health_habit_logs plus a done-marker per day. Streaks/rates are derived
--     client-side like check-in stats.
--   cron triggers     — trigger_pr_mentions_sync / trigger_pr_geo_check,
--                       same x-trigger-secret + pg_cron contract as 0049/0117.
--
-- ROLLBACK:
--   select cron.unschedule('pr-mentions-sync'); select cron.unschedule('pr-geo-check');
--   drop function if exists public.trigger_pr_mentions_sync();
--   drop function if exists public.trigger_pr_geo_check();
--   drop table if exists public.health_habit_logs, public.health_habits,
--     public.pr_feeds, public.pr_connections;
--   alter table public.pr_geo_prompts drop column if exists checked_via;

/* ---------- PR: coverage feeds (user-pasted RSS/Atom) ------------------ */

create table if not exists public.pr_feeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  label text not null default '',
  last_synced_at timestamptz,
  last_item_count integer,
  created_at timestamptz not null default now(),
  unique (user_id, url)
);

create index if not exists pr_feeds_user_idx
  on public.pr_feeds (user_id, created_at desc);

alter table public.pr_feeds enable row level security;
create policy "Users manage their own pr_feeds"
  on public.pr_feeds for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

/* ---------- PR: platform connections (OAuth lands later) --------------- */

create table if not exists public.pr_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null
    check (provider in ('buffer','linkedin','meta','search_console')),
  status text not null default 'pending'
    check (status in ('pending','connected','error','disconnected')),
  account_label text not null default '',
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.pr_connections enable row level security;
create policy "Users manage their own pr_connections"
  on public.pr_connections for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

/* ---------- GEO: mark who produced a check result ---------------------- */

alter table public.pr_geo_prompts
  add column if not exists checked_via text not null default 'manual'
    check (checked_via in ('manual','auto'));

/* ---------- Health: daily habits ---------------------------------------- */

create table if not exists public.health_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists health_habits_user_idx
  on public.health_habits (user_id, created_at desc);

alter table public.health_habits enable row level security;
create policy "Users manage their own health_habits"
  on public.health_habits for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.health_habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.health_habits(id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, day)
);

create index if not exists health_habit_logs_user_idx
  on public.health_habit_logs (user_id, day desc);

alter table public.health_habit_logs enable row level security;
create policy "Users manage their own health_habit_logs"
  on public.health_habit_logs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

/* ---------- cron: coverage feed sync + GEO auto-check ------------------- */
/* Same contract as 0049/0117: pg_cron → trigger fn → net.http_post with
   x-trigger-secret read from the vault. The edge functions also accept a
   portal JWT for the manual "sync now" / "run checks" buttons. */

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.trigger_pr_mentions_sync() returns void
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
    raise warning '[pr-mentions-feed] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;
  perform net.http_post(
    url     := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/pr-mentions-feed',
    headers := jsonb_build_object(
      'Content-Type',     'application/json',
      'x-trigger-secret', v_secret
    ),
    body                 := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

revoke execute on function public.trigger_pr_mentions_sync() from public, anon, authenticated;
grant  execute on function public.trigger_pr_mentions_sync() to service_role;

create or replace function public.trigger_pr_geo_check() returns void
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
    raise warning '[pr-geo-check] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;
  perform net.http_post(
    url     := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/pr-geo-check',
    headers := jsonb_build_object(
      'Content-Type',     'application/json',
      'x-trigger-secret', v_secret
    ),
    body                 := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

revoke execute on function public.trigger_pr_geo_check() from public, anon, authenticated;
grant  execute on function public.trigger_pr_geo_check() to service_role;

do $$
begin
  perform cron.unschedule('pr-mentions-sync');
exception when others then null;
end;
$$;
do $$
begin
  perform cron.unschedule('pr-geo-check');
exception when others then null;
end;
$$;

/* Coverage feeds at 13:05 UTC (morning ET), GEO checks at 13:20 — staggered
   off the other sweeps. Both functions self-lock via acquire_cron_lock. */
select cron.schedule(
  'pr-mentions-sync',
  '5 13 * * *',
  $$select public.trigger_pr_mentions_sync()$$
);

select cron.schedule(
  'pr-geo-check',
  '20 13 * * *',
  $$select public.trigger_pr_geo_check()$$
);
