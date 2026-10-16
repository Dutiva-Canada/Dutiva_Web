-- 0230 — invest_wipe_account must cover every user-owned invest table.
--
-- The wipe's last rewrite (0222) predates the 0223/0224 tables, so a
-- "delete all Invest data" call left rows behind:
--
--   invest_book_snapshots  — book-wide rows carry account_id NULL, so the
--                            invest_accounts cascade never reaches them;
--                            the track-record curve kept its history.
--   invest_stress_scenarios — no account FK at all; saved shock sets
--                             survived.
--   agent_suggestions      — shared review queue; pending 'invest' rows
--                            resurfaced after the wipe pointing at
--                            strategies/theses that no longer exist.
--
-- invest_cash_events, invest_recurring_contributions and
-- invest_order_fills DO cascade (through their account/order FKs), but the
-- deletes are listed explicitly anyway — a function that promises a full
-- wipe should say so rather than lean on cascade order.
--
-- invest_access survives by design (the portal grant; deleting it locks
-- the caller out) and invest_market_news is a shared cache, not user data.
--
-- Rollback (manual): restore the 0222 body (drops the five new deletes).

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
  delete from public.invest_order_fills where user_id = uid;
  delete from public.invest_orders where user_id = uid;
  delete from public.invest_signals where user_id = uid;
  delete from public.invest_bot_runs where user_id = uid;
  delete from public.invest_strategies where user_id = uid;
  delete from public.invest_positions where user_id = uid;
  delete from public.invest_cash_events where user_id = uid;
  delete from public.invest_recurring_contributions where user_id = uid;
  delete from public.invest_book_snapshots where user_id = uid;
  delete from public.invest_accounts where user_id = uid;
  delete from public.invest_watchlist where user_id = uid;
  delete from public.invest_market_snapshots where user_id = uid;
  delete from public.invest_notification_prefs where user_id = uid;
  delete from public.invest_user_profile where user_id = uid;
  delete from public.invest_theses where user_id = uid;
  delete from public.invest_goals where user_id = uid;
  delete from public.invest_scan_items where user_id = uid;
  delete from public.invest_memories where user_id = uid;
  delete from public.invest_stress_scenarios where user_id = uid;
  /* The queue is shared across portals — wipe only the invest surface so
     PR/health suggestions for the same user survive. */
  delete from public.agent_suggestions
    where user_id = uid and surface = 'invest';
end;
$$;
revoke all on function public.invest_wipe_account() from public;
grant execute on function public.invest_wipe_account() to authenticated;
