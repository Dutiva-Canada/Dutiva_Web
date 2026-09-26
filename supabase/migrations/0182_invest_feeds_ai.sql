-- 0182 — invest feeds + AI strategy layer
--
-- Three schema additions that power the effortless-strategies build:
--
--   invest_strategies.cadence           — 'daily' | 'weekly' | 'monthly';
--                                         long-horizon templates (monthly
--                                         accumulation) shouldn't fire on
--                                         every daily sweep.
--   invest_strategies.last_evaluated_at — stamp the bot updates each sweep;
--                                         weekly/monthly strategies are due
--                                         only once the window has elapsed.
--   invest_strategies.template          — provenance slug when a strategy
--                                         was created from the template
--                                         gallery or the AI drafter
--                                         ('tpl:*', 'ai-draft'); '' = custom.
--
--   invest_signals.title_fr / body_fr   — the deterministic engine's bodies
--                                         are locale-neutral data strings;
--                                         AI-authored insights carry both
--                                         languages so the portal can render
--                                         per locale without a second row.
--
-- Plus the market-data sweep: trigger_invest_market_sync() POSTs to the
-- invest-market-sync edge function, which refreshes invest_market_snapshots
-- from free public feeds (CoinGecko for crypto, Stooq for equities/ETFs).
-- It reuses the same vault secret pair as the other schedulers; the cron
-- job runs at 07:20 UTC — twenty minutes before the bot's 07:45 sweep, so
-- strategies always evaluate fresh prices.
--
-- Idempotent: if not exists / or replace / unschedule-guard throughout.
-- Rollback (manual):
--   select cron.unschedule('invest-market-sync-daily');
--   drop function if exists public.trigger_invest_market_sync();
--   alter table public.invest_strategies drop column if exists cadence,
--     drop column if exists last_evaluated_at, drop column if exists template;
--   alter table public.invest_signals drop column if exists title_fr,
--     drop column if exists body_fr;

alter table public.invest_strategies
  add column if not exists cadence text not null default 'daily'
    check (cadence in ('daily', 'weekly', 'monthly')),
  add column if not exists last_evaluated_at timestamptz,
  add column if not exists template text not null default '';

alter table public.invest_signals
  add column if not exists title_fr text,
  add column if not exists body_fr text;

-- ── market-sync trigger + cron ────────────────────────────────────────────

create or replace function public.trigger_invest_market_sync()
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
    body := '{"action":"sync-all"}'::jsonb,
    timeout_milliseconds := 300000
  );
end;
$$;

revoke execute on function public.trigger_invest_market_sync()
  from public, anon, authenticated;
grant execute on function public.trigger_invest_market_sync()
  to service_role;

do $$
begin
  perform cron.unschedule('invest-market-sync-daily');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'invest-market-sync-daily',
  '20 7 * * *',
  'select public.trigger_invest_market_sync()'
);
