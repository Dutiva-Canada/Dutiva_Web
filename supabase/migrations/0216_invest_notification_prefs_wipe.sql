-- Per-user notification preferences + a full invest-data wipe RPC.

create table if not exists public.invest_notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  /* Email-alert cadence: 'immediate' sends one summary per scan with hits;
     'daily'/'weekly' buffer hits into pending_email and flush one
     consolidated digest on the first sweep after the window elapses. */
  email_cadence text not null default 'immediate'
    check (email_cadence in ('immediate', 'daily', 'weekly')),
  pending_email jsonb not null default '[]'::jsonb,
  digest_last_sent_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.invest_notification_prefs enable row level security;
create policy "Users manage their own invest_notification_prefs"
  on public.invest_notification_prefs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

/* Full invest-data wipe — every per-user invest table EXCEPT
   invest_access (the portal grant survives; deleting it would lock the
   caller out) and invest_market_news (a shared cache, not user data).
   security definer makes the multi-table delete atomic; every statement
   is scoped to auth.uid() so the caller can only ever wipe their own
   rows. */
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
end;
$$;
revoke all on function public.invest_wipe_account() from public;
grant execute on function public.invest_wipe_account() to authenticated;
