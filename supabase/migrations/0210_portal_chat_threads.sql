-- 0210_portal_chat_threads.sql
--
-- Portal chats — conversations, plural, plus feedback detail. Each of the
-- four standalone assistants (invest/health/pr/candidate) gains a threads
-- table so the user can hold more than one conversation instead of a single
-- eternal thread that "Clear" is the only reset for. Messages carry
-- thread_id — NULL is the default conversation, so every existing row stays
-- visible without a backfill. Clearing or deleting a named thread cascades
-- its messages.
--
-- feedback_reason lets a thumbs-down say why — the client asks one tap
-- after rating -1; stored on the assistant row next to the rating.
--
--   *_chat_threads   — id / user_id / title / created_at; title is set
--                      server-side from the thread's first message
--   *_chat_messages  — + thread_id (nullable FK → threads), + feedback_reason
--
-- The tables' only writer stays the edge functions: the owner policies let
-- the client read its own rows, but writes go through the functions.
--
-- ROLLBACK:
--   alter table public.invest_chat_messages    drop column if exists feedback_reason, drop column if exists thread_id;
--   alter table public.health_chat_messages    drop column if exists feedback_reason, drop column if exists thread_id;
--   alter table public.pr_chat_messages        drop column if exists feedback_reason, drop column if exists thread_id;
--   alter table public.candidate_chat_messages drop column if exists feedback_reason, drop column if exists thread_id;
--   drop table if exists public.invest_chat_threads, public.health_chat_threads, public.pr_chat_threads, public.candidate_chat_threads;

create table if not exists public.invest_chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);
create index if not exists invest_chat_threads_user_idx
  on public.invest_chat_threads (user_id, created_at desc);
alter table public.invest_chat_threads enable row level security;
create policy "Users manage their own invest_chat_threads"
  on public.invest_chat_threads for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.invest_chat_messages
  add column if not exists thread_id uuid references public.invest_chat_threads(id) on delete cascade,
  add column if not exists feedback_reason text;
create index if not exists invest_chat_messages_thread_idx
  on public.invest_chat_messages (user_id, thread_id, created_at desc);

create table if not exists public.health_chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);
create index if not exists health_chat_threads_user_idx
  on public.health_chat_threads (user_id, created_at desc);
alter table public.health_chat_threads enable row level security;
create policy "Users manage their own health_chat_threads"
  on public.health_chat_threads for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.health_chat_messages
  add column if not exists thread_id uuid references public.health_chat_threads(id) on delete cascade,
  add column if not exists feedback_reason text;
create index if not exists health_chat_messages_thread_idx
  on public.health_chat_messages (user_id, thread_id, created_at desc);

create table if not exists public.pr_chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);
create index if not exists pr_chat_threads_user_idx
  on public.pr_chat_threads (user_id, created_at desc);
alter table public.pr_chat_threads enable row level security;
create policy "Users manage their own pr_chat_threads"
  on public.pr_chat_threads for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.pr_chat_messages
  add column if not exists thread_id uuid references public.pr_chat_threads(id) on delete cascade,
  add column if not exists feedback_reason text;
create index if not exists pr_chat_messages_thread_idx
  on public.pr_chat_messages (user_id, thread_id, created_at desc);

create table if not exists public.candidate_chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);
create index if not exists candidate_chat_threads_user_idx
  on public.candidate_chat_threads (user_id, created_at desc);
alter table public.candidate_chat_threads enable row level security;
create policy "Users manage their own candidate_chat_threads"
  on public.candidate_chat_threads for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.candidate_chat_messages
  add column if not exists thread_id uuid references public.candidate_chat_threads(id) on delete cascade,
  add column if not exists feedback_reason text;
create index if not exists candidate_chat_messages_thread_idx
  on public.candidate_chat_messages (user_id, thread_id, created_at desc);
