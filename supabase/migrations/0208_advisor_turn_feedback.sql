-- 0208_advisor_turn_feedback.sql
--
-- Advisor — thumbs up/down on assistant turns. Unlike the portal companions,
-- Advisor turns aren't table rows: they live inside conversations.messages
-- (jsonb), so a feedback column can't attach to a turn. This table keys the
-- rating by (user_id, conversation_id, turn_index) — the index into the
-- filtered user/assistant transcript the client hydrates from the same
-- array, so the key is stable across reloads.
--
--   rating — 1 (helpful) / -1 (not helpful); a deleted row = unrated
--
-- Fresh same-session turns aren't keyed here — only turns rehydrated from
-- conversations.messages carry a stable index.
--
-- ROLLBACK:
--   drop table if exists public.advisor_turn_feedback;

create table if not exists public.advisor_turn_feedback (
  user_id         uuid        not null references auth.users (id) on delete cascade,
  conversation_id uuid        not null references public.conversations (id) on delete cascade,
  turn_index      smallint    not null check (turn_index >= 0),
  rating          smallint    not null check (rating in (-1, 1)),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (user_id, conversation_id, turn_index)
);

alter table public.advisor_turn_feedback enable row level security;

create policy "Users can manage their own advisor turn feedback"
  on public.advisor_turn_feedback
  for all
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

create index if not exists advisor_turn_feedback_conversation_idx
  on public.advisor_turn_feedback (conversation_id);
