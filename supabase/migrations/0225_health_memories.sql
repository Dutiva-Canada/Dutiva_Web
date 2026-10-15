-- 0225_health_memories.sql
--
-- health_memories — the "tell Mira to remember" layer: durable facts the
-- person wants the companion to hold across sessions (a preference, a
-- standing context, a boundary). Mirrors invest_memories' contract:
--
--   manual — the user writes them on the Home card;
--   mira   — Mira proposes one in chat (propose_memory → agent_suggestions
--            kind 'memory'); accepting on /health/review writes the row.
--
-- Nothing becomes a memory without a human hand — the same review-first
-- rule every surface keeps. Memories are context, not permission: health-ai
-- injects them into the companion prompts under "things they asked you to
-- remember", and the "What Mira can see" disclosure names them.
--
-- RLS mirrors the other health tables — owner-only.
--
-- ROLLBACK:
--   drop table if exists public.health_memories;

create table if not exists public.health_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  source text not null default 'manual'
    check (source in ('manual', 'mira')),
  created_at timestamptz not null default now()
);

create index if not exists health_memories_user_idx
  on public.health_memories (user_id, created_at desc);

alter table public.health_memories enable row level security;
create policy "Users manage their own health_memories"
  on public.health_memories for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
