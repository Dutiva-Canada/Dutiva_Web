-- 0203_pr_chat.sql
--
-- Dutiva PR — the chat surface (pr-ai kind 'chat'). One row per turn,
-- owner-scoped like every other pr_* table, so the conversation survives
-- across sessions and the model can see recent turns.
--
--   pr_chat_messages — role/user-authored content + the action the
--                      assistant turn executed (jsonb, null for plain
--                      replies)
--
-- ROLLBACK:
--   drop table if exists public.pr_chat_messages;

create table if not exists public.pr_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  /* Whichever action the assistant turn performed ('add_campaign', …),
     with the descriptor the client rendered. Null on plain replies. */
  action jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pr_chat_messages_user_idx
  on public.pr_chat_messages (user_id, created_at desc);

alter table public.pr_chat_messages enable row level security;
create policy "Users manage their own pr_chat_messages"
  on public.pr_chat_messages for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
