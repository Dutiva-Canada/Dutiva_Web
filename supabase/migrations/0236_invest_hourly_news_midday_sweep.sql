-- 0236 — hourly market-hours news + a midday agent sweep
--
-- trigger_invest_market_sync(p_light, p_news) — the function gains a
--   second flag. The new invest-market-sync-hour-news job calls it with
--   (true, true): a light price pass plus the headline refresh, hourly at
--   :50 during the session (13-20 UTC Mon–Fri ≈ 8:50–15:50 ET). The
--   quarter-hour job keeps passing light:true bare — 15-min headlines
--   would hammer Google News for nothing; hourly is the polite cadence.
--   The daily 07:20 UTC job stays the full sync either way.
--
-- invest-bot-midday — a second daily agent sweep at 17:45 UTC Mon–Fri
--   (mid-session, right after the :15 light sync so marks are fresh).
--   Strategy cadences still gate evaluation — 'daily' rules simply see
--   two fresh passes instead of one, so an intraday breach fires at
--   midday instead of waiting for tomorrow morning. Open signals dedupe
--   as usual, so a breach that already fired just stays open; each
--   sweep also writes its own run/book-mark rows, doubling the chart's
--   intra-day resolution rather than duplicating rows.
--
-- The single-arg function is dropped, not replaced-in-place: same
-- overload-shadowing rule as 0235 (existing jobs call it bare).
--
-- Idempotent: drop if exists / or replace / unschedule-guard throughout.
-- Rollback (manual):
--   select cron.unschedule('invest-market-sync-hour-news');
--   select cron.unschedule('invest-bot-midday');
--   drop function if exists public.trigger_invest_market_sync(boolean, boolean);
--   -- recreate the 0235 single-arg version;

drop function if exists public.trigger_invest_market_sync(boolean);

create or replace function public.trigger_invest_market_sync(p_light boolean default false, p_news boolean default false)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_key text;
  v_secret text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where name = 'support_scheduler_service_key';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'support_notify_secret';

  if v_secret is null or length(btrim(v_secret)) = 0 then
    raise warning '[invest-market-sync] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;

  perform net.http_post(
    url := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/invest-market-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(v_key, ''),
      'x-trigger-secret', v_secret
    ),
    body := jsonb_build_object('action', 'sync-all', 'light', p_light, 'news', p_news),
    timeout_milliseconds := 300000
  );
end;
$$;

revoke execute on function public.trigger_invest_market_sync(boolean, boolean)
  from public, anon, authenticated;
grant execute on function public.trigger_invest_market_sync(boolean, boolean)
  to service_role;

do $$
begin
  perform cron.unschedule('invest-market-sync-hour-news');
exception
  when others then null;
end;
$$;

do $$
begin
  perform cron.unschedule('invest-bot-midday');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'invest-market-sync-hour-news',
  '50 13-20 * * 1-5',
  'select public.trigger_invest_market_sync(true, true)'
);

select cron.schedule(
  'invest-bot-midday',
  '45 17 * * 1-5',
  'select public.trigger_invest_bot()'
);
