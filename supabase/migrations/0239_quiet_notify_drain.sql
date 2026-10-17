-- 0239 — quiet the per-minute notify drain
--
-- support-notify-drain POSTs to the function every minute whether or not
-- there is mail to send. pg_net stores every response in
-- net._http_response — ~1,440 `{"processed":0}` rows a day, which is
-- what drowned out the October agent outage's actual error responses
-- before they could be read back.
--
-- The cadence stays (a support email should still flush inside a
-- minute); the POST now gates on the same predicate the function uses
-- to pick work: status 'pending', attempts < MAX_ATTEMPTS (5). No
-- pending mail → no HTTP call → no response row. When a notification
-- lands, the next minute's run flushes it exactly as before.
--
-- Trigger-function form matches 0049's pattern for this project's cron
-- jobs: the credential comes out of Vault at call time, the function is
-- service_role-only, and the job command becomes a one-word select.

create or replace function public.trigger_support_notify_drain()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_secret text;
begin
  -- support-notify reads the same two predicates; keep them in step with
  -- MAX_ATTEMPTS in supabase/functions/support-notify/index.ts.
  if not exists (
    select 1 from public.support_notifications
    where status = 'pending' and attempts < 5
  ) then
    return;
  end if;

  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'support_notify_secret';

  if v_secret is null or length(btrim(v_secret)) = 0 then
    raise warning '[support-notify-drain] vault secret "support_notify_secret" is not set; skipping run';
    return;
  end if;

  perform net.http_post(
    url     := 'https://khtwpxnvziiyplaflwru.supabase.co/functions/v1/support-notify',
    headers := jsonb_build_object(
      'Content-Type',    'application/json',
      'apikey',          'sb_publishable_4cpptaftDcwRSI0K2KuBjA_0vJcC0-S',
      'x-notify-secret', v_secret
    ),
    body                 := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function public.trigger_support_notify_drain() from public, anon, authenticated;
grant  execute on function public.trigger_support_notify_drain() to service_role;

do $$
begin
  perform cron.unschedule('support-notify-drain');
exception
  when others then null;  -- not scheduled; nothing to remove
end;
$$;

select cron.schedule(
  'support-notify-drain',
  '* * * * *',
  'select public.trigger_support_notify_drain()'
);
