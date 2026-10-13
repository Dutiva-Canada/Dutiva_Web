-- 0219 — per-symbol investment theses
--
-- invest_theses — a standing claim about a holding or watched symbol:
-- the written thesis, the role the position plays (intent), and two rule
-- zones the sweep evaluates every run — break_rules invalidate the thesis
-- outright, drift_rules flag it fraying early. The row keeps the last
-- status + per-rule eval detail so the Theses page renders the conditions
-- live without a client-side engine.
--
-- Rules are the engine's signal-rule wire shape (metric/op/value[/value2]/
-- title) — order proposals make no sense here: a thesis only observes.
-- Status transitions emit invest_signals kind 'thesis' rows; steady-state
-- evals only update eval_detail.
--
-- Rollback (manual):
--   drop table if exists public.invest_theses;

create table if not exists public.invest_theses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_class text not null
    check (asset_class in ('equity', 'etf', 'crypto', 'bond', 'cash', 'other')),
  symbol text not null,
  name text not null default '',
  /* The claim, in the user's own words (or Tally's draft, edited). */
  thesis text not null default '',
  /* The role the position plays — shapes the recommended action when the
     status degrades ('core' holds through noise, 'speculative' doesn't). */
  intent text not null default 'core'
    check (intent in ('core', 'growth', 'income', 'speculative')),
  break_rules jsonb not null default '[]',
  drift_rules jsonb not null default '[]',
  /* Last evaluated state + the per-rule detail behind it (eval_detail:
     rules[{zone,ident,title,metric,fired,value}], fired counts, and the
     posture action line in en/fr). */
  status text not null default 'healthy'
    check (status in ('healthy', 'drifting', 'broken')),
  eval_detail jsonb,
  last_evaluated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, asset_class, symbol)
);

alter table public.invest_theses enable row level security;

drop policy if exists invest_theses_owner on public.invest_theses;
create policy invest_theses_owner on public.invest_theses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

/* Extend the wipe with the new table — same function body as 0217 plus
   the theses delete, so a full wipe still leaves nothing behind. */
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
end;
$$;
revoke all on function public.invest_wipe_account() from public;
grant execute on function public.invest_wipe_account() to authenticated;
