-- 0209_candidate_chat.sql
--
-- Candidate portal — the chat surface (candidate-ai kind 'chat'). One row
-- per turn, owner-scoped like every other candidate_* table, so the
-- conversation survives across sessions and the model can see recent turns.
--
--   candidate_chat_messages — role/user-authored content + a feedback
--                      rating the client attaches to assistant turns
--                      (1 = helpful, -1 = not, null = unrated — same column
--                      the other portal chats carry, 0205/0207)
--
-- The table's only writer is the candidate-ai function: the owner policy
-- lets the client read its own rows, but chat writes go through the edge
-- function so a client cannot file its own 'assistant' rows.
--
-- ROLLBACK:
--   drop table if exists public.candidate_chat_messages;

create table if not exists public.candidate_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  feedback smallint check (feedback in (-1, 1)),
  created_at timestamptz not null default now()
);

create index if not exists candidate_chat_messages_user_idx
  on public.candidate_chat_messages (user_id, created_at desc);

alter table public.candidate_chat_messages enable row level security;
create policy "Users manage their own candidate_chat_messages"
  on public.candidate_chat_messages for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
