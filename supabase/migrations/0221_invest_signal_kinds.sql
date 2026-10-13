-- 0221 — widen invest_signals.kind for the analysis layer and index the
-- 0220 tables' owner lookups.
--
-- 0180 forward-declared 'thesis' in the kind enum, so the thesis pass's
-- transition signals landed; 'goal' and 'scan' (0220) were never added
-- to the CHECK, so every analysis-pass signal insert would violate it
-- and drop silently — the never-fatal contract would hide it as a
-- warning on the run plan. Same drop/re-add pattern every enum widening
-- uses (0056, 0198).
--
-- invest_goals / invest_scan_items get the same invest_*_user_idx as
-- every other owner-scoped table — the sweep reads rows per user and
-- RLS filters on user_id.
--
-- Rollback (manual):
--   alter table public.invest_signals drop constraint invest_signals_kind_check;
--   alter table public.invest_signals add constraint invest_signals_kind_check
--     check (kind in ('screen','insight','alert','thesis'));
--   drop index if exists public.invest_goals_user_idx;
--   drop index if exists public.invest_scan_items_user_idx;

alter table public.invest_signals
  drop constraint if exists invest_signals_kind_check;
alter table public.invest_signals
  add constraint invest_signals_kind_check
    check (kind in ('screen', 'insight', 'alert', 'thesis', 'goal', 'scan'));

create index if not exists invest_goals_user_idx
  on public.invest_goals (user_id);
create index if not exists invest_scan_items_user_idx
  on public.invest_scan_items (user_id);
