-- 0194_dutiva_pr_growth.sql
--
-- Dutiva PR, second pass — closes the intent→actual loop on the content
-- desk, adds a GEO tracker ("AI answers": whether assistants name or cite
-- the brand for tracked prompts), and mirrors the 0193 staff grant so
-- @dutiva.ca accounts get pr_access automatically.
--
--   pr_content_items +published_url / published_at  — where a piece
--     actually went out once the user marks it published by hand
--   pr_geo_prompts    — prompts to spot-check in AI assistants: engine,
--     result (cited | mentioned | absent | unchecked), note, checked_at.
--     Still manual tracking — no automation queries the assistants.
--   pr_access         — @dutiva.ca staff backfill + auto-grant trigger,
--     same pattern as health_access_dutiva_staff (0193)
--
-- ROLLBACK:
--   drop trigger if exists pr_access_dutiva_staff on auth.users;
--   drop function if exists public._pr_grant_dutiva_staff();
--   drop table if exists public.pr_geo_prompts;
--   alter table public.pr_content_items
--     drop column if exists published_url, drop column if exists published_at;

/* ---------- content desk: record where a piece actually went out ------- */

alter table public.pr_content_items
  add column if not exists published_url text not null default '',
  add column if not exists published_at timestamptz;

/* ---------- GEO: prompts to spot-check in AI answer engines ------------ */

create table if not exists public.pr_geo_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  engine text not null default 'chatgpt'
    check (engine in ('chatgpt','perplexity','gemini','copilot','other')),
  result text not null default 'unchecked'
    check (result in ('unchecked','cited','mentioned','absent')),
  note text not null default '',
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pr_geo_prompts_user_idx
  on public.pr_geo_prompts (user_id, created_at desc);

alter table public.pr_geo_prompts enable row level security;
create policy "Users manage their own pr_geo_prompts"
  on public.pr_geo_prompts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

/* ---------- staff access: @dutiva.ca accounts get PR automatically ----- */

insert into public.pr_access (user_id, granted_by, note)
select
  u.id,
  'system',
  '@dutiva.ca staff access (0194).'
from auth.users u
where right(lower(coalesce(u.email, '')), 10) = '@dutiva.ca'
on conflict (user_id) do nothing;

create or replace function public._pr_grant_dutiva_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if right(lower(coalesce(new.email, '')), 10) = '@dutiva.ca' then
    insert into public.pr_access (user_id, granted_by, note)
    values (new.id, 'system', '@dutiva.ca staff access (0194).')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public._pr_grant_dutiva_staff() from public;

drop trigger if exists pr_access_dutiva_staff on auth.users;
create trigger pr_access_dutiva_staff
  after insert or update of email on auth.users
  for each row execute function public._pr_grant_dutiva_staff();
