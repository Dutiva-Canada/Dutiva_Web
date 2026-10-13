-- 0220 — the analysis layer: SMART book goals, an environmental scan
-- board, and a SWOT quadrant per thesis.
--
-- invest_goals — a measurable book objective: a metric + direction +
-- target (+ optional deadline). The sweep re-measures every run and
-- stamps status + eval_detail (current, progress %, days left, a
-- bilingual status line); transitions emit invest_signals kind 'goal'.
-- 'achieved' and 'missed' are terminal — a finished goal doesn't flip
-- back and forth.
--
-- invest_scan_items — the environmental-scan watch board. Each row is a
-- theme-level factor (economy, policy, sector, currency, geopolitical,
-- company) with a direction (tailwind / headwind / monitor) and the
-- held symbols it could touch. The sweep itself doesn't re-score items
-- — it connects them: when a thesis degrades and an item lists that
-- symbol, a kind 'scan' signal links the two. Freshness is the board's
-- own discipline — last_reviewed_at drives the stale badge.
--
-- invest_theses.swot — the qualitative quadrant beside the mechanical
-- drift/break conditions: four string lists (strengths / weaknesses /
-- opportunities / threats). Tally drafts it, the user edits it; it
-- never feeds the evaluator — it's the "why", not the trigger.
--
-- Rollback (manual):
--   alter table public.invest_theses drop column if exists swot;
--   drop table if exists public.invest_scan_items;
--   drop table if exists public.invest_goals;

create table if not exists public.invest_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  detail text not null default '',
  /* The measurable half — every metric is computable from the book the
     sweep already loads (no new data feeds, no model in the verdict). */
  metric text not null
    check (metric in (
      'book_value', 'cash_pct', 'max_weight_pct',
      'unrealized_gain_pct', 'thesis_coverage', 'position_count'
    )),
  op text not null check (op in ('gte', 'lte')),
  target numeric not null,
  /* Metric value at the first sweep after creation — progress bars run
     baseline → target. Null until the first eval stamps it. */
  baseline numeric,
  deadline date,
  status text not null default 'on_track'
    check (status in ('on_track', 'behind', 'achieved', 'missed')),
  eval_detail jsonb,
  last_evaluated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invest_goals enable row level security;

drop policy if exists invest_goals_owner on public.invest_goals;
create policy invest_goals_owner on public.invest_goals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.invest_scan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  theme text not null default 'sector'
    check (theme in ('economy', 'policy', 'sector', 'currency', 'geopolitical', 'company')),
  /* How the factor leans on the book — informational, never a verdict. */
  direction text not null default 'monitor'
    check (direction in ('tailwind', 'headwind', 'monitor')),
  title text not null default '',
  note text not null default '',
  /* Symbols the item could touch — the overlap the sweep connects when
     a thesis degrades. Empty = whole-book factor. */
  symbols text[] not null default '{}',
  last_reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invest_scan_items enable row level security;

drop policy if exists invest_scan_items_owner on public.invest_scan_items;
create policy invest_scan_items_owner on public.invest_scan_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.invest_theses
  add column if not exists swot jsonb not null default
    '{"strengths":[],"weaknesses":[],"opportunities":[],"threats":[]}';

/* Extend the wipe — same function body as 0219 plus the two new tables. */
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
end;
$$;
revoke all on function public.invest_wipe_account() from public;
grant execute on function public.invest_wipe_account() to authenticated;
