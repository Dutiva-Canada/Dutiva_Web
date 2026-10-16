-- 0235 — resolved quote names + quarter-hour market-hours price sync
--
-- invest_market_snapshots.quote_name — the feed-resolved listing name
--   (Yahoo longName, CoinGecko display name). Persisted so the portal can
--   show what a bare ticker actually priced: a mistyped symbol stops
--   being invisible.
--
-- trigger_invest_market_sync(p_light) — the function gains a light flag.
--   The new quarter-hour job calls it with true: price + day-change only
--   (no close-series history, fundamentals, or news calls), and the edge
--   function omits those columns from the upsert so existing rows keep
--   the daily run's technicals. The daily 07:20 UTC job stays a full
--   sync — the 07:45 bot sweep still evaluates fresh technicals and the
--   news table still refreshes once a day.
--
--   Quarter-hour window: */15 13-21 UTC Mon–Fri brackets the
--   North-American session year-round (≈ 8:00–16:45 ET standard /
--   9:00–17:45 daylight). Keyless feeds stay polite at that cadence;
--   crypto books go stale overnight either way and the portal's
--   "Prices as of" line says so honestly.
--
-- The zero-arg function is dropped, not replaced-in-place: a defaulted
-- parameter would leave the old zero-arg overload behind to shadow
-- no-arg calls (the existing daily cron calls it bare).
--
-- Idempotent: if not exists / or replace / unschedule-guard throughout.
-- Rollback (manual):
--   select cron.unschedule('invest-market-sync-quarter-hour');
--   drop function if exists public.trigger_invest_market_sync(boolean);
--   -- recreate the 0182 no-arg version;
--   alter table public.invest_market_snapshots drop column if exists quote_name;

alter table public.invest_market_snapshots
  add column if not exists quote_name text not null default '';

drop function if exists public.trigger_invest_market_sync();

create or replace function public.trigger_invest_market_sync(p_light boolean default false)
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
    body := jsonb_build_object('action', 'sync-all', 'light', p_light),
    timeout_milliseconds := 300000
  );
end;
$$;

revoke execute on function public.trigger_invest_market_sync(boolean)
  from public, anon, authenticated;
grant execute on function public.trigger_invest_market_sync(boolean)
  to service_role;

do $$
begin
  perform cron.unschedule('invest-market-sync-quarter-hour');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'invest-market-sync-quarter-hour',
  '*/15 13-21 * * 1-5',
  'select public.trigger_invest_market_sync(true)'
);
