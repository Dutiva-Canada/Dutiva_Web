-- 0222 — invest_memories + invest_user_profile.mandate: the "knows you"
-- layer. Confirmed, durable facts Tally retains across sessions (why a
-- position exists, plans, stated preferences, philosophy) plus a free-text
-- mandate on the settings profile row.
--
-- Facts reach this table two ways, both review-first:
--   manual  — the user writes them on /invest/profile;
--   tally   — the review-memories action proposes them from recent chat,
--             filed to agent_suggestions kind 'memory'; accepting writes
--             the row here. Nothing the model infers becomes a memory
--             without the user's accept — same contract as every surface.
--
-- The row's `source` records which path created it so the UI can label
-- provenance. Memories are context, not permission: invest-ai injects them
-- into the system prompt and the draft prompts, but the advice tier still
-- comes from the account email alone.
--
-- RLS mirrors invest_user_profile — owner-only.
-- invest_wipe_account is recreated adding the memories delete.
--
-- Rollback (manual):
--   drop table public.invest_memories;
--   alter table public.invest_user_profile drop column mandate;
--   (and restore the previous wipe body without the memories delete)

alter table public.invest_user_profile
  add column if not exists mandate text;

create table if not exists public.invest_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  /* null symbol = a book-wide memory (a plan, a philosophy, a boundary);
     a set symbol scopes the fact to one holding. */
  symbol text,
  kind text not null default 'fact'
    check (kind in ('preference', 'plan', 'fact', 'philosophy')),
  text text not null,
  source text not null default 'manual'
    check (source in ('manual', 'tally')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invest_memories enable row level security;

create policy "Users manage their own invest_memories"
  on public.invest_memories for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists invest_memories_user_idx
  on public.invest_memories (user_id);

create or replace function public.invest_wipe_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  delete from public.invest_chat_messages where user_id = uid;
  delete from public.invest_chat_threads where user_id = uid;
  delete from public.invest_orders where user_id = uid;
  delete from public.invest_signals where user_id = uid;
  delete from public.invest_bot_runs where user_id = uid;
  delete from public.invest_strategies where user_id = uid;
  delete from public.invest_positions where user_id = uid;
  delete from public.invest_accounts where user_id = uid;
  delete from public.invest_watchlist where user_id = uid;
  delete from public.invest_market_snapshots where user_id = uid;
  delete from public.invest_notification_prefs where user_id = uid;
  delete from public.invest_user_profile where user_id = uid;
  delete from public.invest_theses where user_id = uid;
  delete from public.invest_goals where user_id = uid;
  delete from public.invest_scan_items where user_id = uid;
  delete from public.invest_memories where user_id = uid;
end;
$$;
revoke all on function public.invest_wipe_account() from public;
grant execute on function public.invest_wipe_account() to authenticated;
