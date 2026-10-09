-- 0191_health_portal.sql
--
-- Dutiva Health — the standalone, access-gated mental-wellness surface at
-- /health (own auth gate, own layout — the same standalone pattern as the
-- invest portal). Data is per-user, not per-org. Access is invite-only: a
-- row in `health_access` is the gate.
--
--   health_access           — user_id → granted_at; presence = access
--   health_checkins         — mood/energy self-check-ins (1–5) + free note
--   health_journal_entries  — private journal entries (title + body)
--
-- Deliberately not clinical: this surface is a self-tracking and reflection
-- tool. No scores that claim diagnosis, no treatment data, no provider
-- workflow. The product copy says so everywhere it matters.
--
-- ROLLBACK:
--   drop table if exists public.health_journal_entries,
--     public.health_checkins, public.health_access;

create table if not exists public.health_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by text not null default '',
  note text not null default '',
  granted_at timestamptz not null default now()
);

create table if not exists public.health_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood smallint not null check (mood between 1 and 5),
  energy smallint check (energy between 1 and 5),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.health_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists health_checkins_user_idx
  on public.health_checkins (user_id, created_at desc);
create index if not exists health_journal_entries_user_idx
  on public.health_journal_entries (user_id, created_at desc);

-- health_access is read-only for its owner (the gate check); grants are
-- inserted by service role / dashboard, not self-served.
alter table public.health_access enable row level security;
create policy "Users read their own health access"
  on public.health_access for select
  using ((select auth.uid()) = user_id);

do $$
declare
  t text;
begin
  foreach t in array array['health_checkins', 'health_journal_entries']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "Users manage their own %I" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t, t
    );
  end loop;
end
$$;
