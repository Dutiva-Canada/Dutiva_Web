-- 0177_finance_debt_maturity_notifications.sql
--
-- Debt-maturity alerts in the workspace bell. The Overview attention strip
-- already derives maturing debts at render time (financeAttention.ts), but
-- that surface requires someone to open Finance. This migration makes the
-- signal proactive: a daily pg_cron scan (pg_cron is already installed for
-- monitor-law-changes-daily, 0035) fans out one bilingual
-- hr_workspace_notifications row per active owner/admin when an active
-- facility enters its 90-day maturity window — matching the Treasury
-- "Maturing soon" chip.
--
-- Three pieces:
--   1. finance_debts.maturity_notified_at — stamps when the facility was
--      last alerted on, so the daily scan is idempotent. A renewed facility
--      (maturity pushed forward after a notification) re-alerts on the new
--      date because the stamp ends up older than maturity - 90 days.
--   2. 'finance_debt' joins the hr_workspace_notifications kind check, and
--      _finance_debt_notify_admins(p_debt_id) builds the bilingual
--      title/body from the debt's label/lender/balance/maturity and fans
--      out to owner/admin members — the signing/integration/finance_call
--      pattern again.
--   3. _finance_debt_maturity_scan() walks the window and calls the
--      notify fn; scheduled daily at 07:15 UTC (15 min after the law
--      monitor's slot).
--
-- ROLLBACK:
--   select cron.unschedule('finance-debt-maturity-daily');
--   drop function if exists public._finance_debt_maturity_scan();
--   drop function if exists public._finance_debt_notify_admins(uuid);
--   alter table public.finance_debts drop column if exists maturity_notified_at;
--   alter table public.hr_workspace_notifications
--     drop constraint if exists hr_workspace_notifications_kind_check,
--     add constraint hr_workspace_notifications_kind_check
--       check (kind in ('signing_completed', 'signing_declined',
--             'integration_event', 'inbound_email', 'finance_call'));

alter table public.finance_debts
  add column if not exists maturity_notified_at timestamptz;

alter table public.hr_workspace_notifications
  drop constraint if exists hr_workspace_notifications_kind_check;
alter table public.hr_workspace_notifications
  add constraint hr_workspace_notifications_kind_check
  check (kind in (
    'signing_completed', 'signing_declined', 'integration_event',
    'inbound_email', 'finance_call', 'finance_debt'
  ));

create or replace function public._finance_debt_notify_admins(p_debt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_label_en text;
  v_label_fr text;
  v_lender_en text;
  v_lender_fr text;
  v_balance numeric;
  v_currency text;
  v_maturity date;
  v_en_body text;
  v_fr_body text;
begin
  select
    organization_id,
    label ->> 'en',
    label ->> 'fr',
    lender ->> 'en',
    lender ->> 'fr',
    balance,
    currency,
    maturity_date
  into
    v_org_id, v_label_en, v_label_fr, v_lender_en, v_lender_fr,
    v_balance, v_currency, v_maturity
  from public.finance_debts
  where id = p_debt_id;

  if v_org_id is null then
    return;
  end if;

  v_en_body := coalesce(nullif(btrim(v_label_en), ''), 'Debt facility')
    || case when nullif(btrim(v_lender_en), '') is not null
            then ' — ' || btrim(v_lender_en) else '' end
    || ' · ' || v_currency || ' ' || v_balance
    || ' · matures ' || v_maturity;
  v_fr_body := coalesce(nullif(btrim(v_label_fr), ''), nullif(btrim(v_label_en), ''), 'Facilité de dette')
    || case when nullif(btrim(v_lender_fr), '') is not null
            then ' — ' || btrim(v_lender_fr)
            when nullif(btrim(v_lender_en), '') is not null
            then ' — ' || btrim(v_lender_en)
            else '' end
    || ' · ' || v_currency || ' ' || v_balance
    || ' · échéance le ' || v_maturity;

  insert into public.hr_workspace_notifications (
    organization_id, user_id, kind, title_en, title_fr, body_en, body_fr, href
  )
  select
    v_org_id,
    om.user_id,
    'finance_debt',
    'Debt maturity approaching',
    'Échéance de dette proche',
    v_en_body,
    v_fr_body,
    '/app/finance/treasury'
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.status = 'active'
    and om.role in ('owner', 'admin');

  update public.finance_debts
     set maturity_notified_at = now()
   where id = p_debt_id;
end;
$$;

revoke execute on function public._finance_debt_notify_admins(uuid)
  from public, anon, authenticated;
grant execute on function public._finance_debt_notify_admins(uuid)
  to service_role;

create or replace function public._finance_debt_maturity_scan()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debt_id uuid;
begin
  for v_debt_id in
    select id
    from public.finance_debts
    where status = 'active'
      and maturity_date <= current_date + 90
      and (
        maturity_notified_at is null
        or maturity_notified_at::date < maturity_date - 90
      )
  loop
    perform public._finance_debt_notify_admins(v_debt_id);
  end loop;
end;
$$;

revoke execute on function public._finance_debt_maturity_scan()
  from public, anon, authenticated;
grant execute on function public._finance_debt_maturity_scan()
  to service_role;

-- 07:15 UTC daily — 15 minutes after the law monitor's 07:00 slot.
do $$
begin
  perform cron.unschedule('finance-debt-maturity-daily');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'finance-debt-maturity-daily',
  '15 7 * * *',
  'select public._finance_debt_maturity_scan()'
);
