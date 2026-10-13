-- Per-user invest profile — what Tally calibrates its answers to. Register
-- and focus only: the advice tier stays derived from the account email, so
-- nothing here can grant a user permissions their account lacks.

create table if not exists public.invest_user_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  /* All dimensions nullable — unset means "don't shape this one". */
  risk_tolerance text check (risk_tolerance in ('conservative', 'balanced', 'aggressive')),
  horizon text check (horizon in ('short', 'medium', 'long')),
  goal text check (goal in ('growth', 'income', 'preservation', 'learn')),
  experience text check (experience in ('new', 'intermediate', 'experienced')),
  answer_style text check (answer_style in ('concise', 'balanced', 'teach')),
  sectors text[] not null default '{}',
  exclusions text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.invest_user_profile enable row level security;
create policy "Users manage their own invest_user_profile"
  on public.invest_user_profile for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

/* Extend the wipe with the new table — same function body as 0216 plus
   the profile delete, so a full wipe still leaves nothing behind. */
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
end;
$$;
revoke all on function public.invest_wipe_account() from public;
grant execute on function public.invest_wipe_account() to authenticated;
