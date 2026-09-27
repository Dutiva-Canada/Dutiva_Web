-- 0176_finance_capital_call_notifications.sql
--
-- Capital-call notifications. Until now finance_capital_calls rows (0173)
-- tracked the call lifecycle but nothing alerted anyone when a call was
-- sent to a partner. This migration wires the existing
-- hr_workspace_notifications surface (Topbar bell) to the call lifecycle:
-- when a call's status becomes 'notified', every active owner/admin member
-- gets one bilingual notification row linking to /app/finance/deals.
--
-- Design follows the signing-notification precedent (0085/0163):
--   - _finance_call_notify_admins(p_call_id) builds the bilingual
--     title/body from the call + its commitment + party, then inserts one
--     row per active owner/admin member. security definer, service_role
--     only — never callable from the client.
--   - _finance_call_notify_on_notified() is the trigger wrapper, also
--     security definer so it can fan out rows regardless of which
--     role performed the DML (authenticated admin in the app today).
--   - Two triggers fire only when status *becomes* 'notified' — an
--     INSERT seeded as notified, or an UPDATE where old.status was
--     something else. Re-saving a call that is already notified does
--     not re-notify (no processed_at column needed).
--
-- 'finance_call' joins the hr_workspace_notifications kind check.
--
-- ROLLBACK:
--   drop trigger if exists finance_capital_calls_notify_insert
--     on public.finance_capital_calls;
--   drop trigger if exists finance_capital_calls_notify_update
--     on public.finance_capital_calls;
--   drop function if exists public._finance_call_notify_on_notified();
--   drop function if exists public._finance_call_notify_admins(uuid);
--   alter table public.hr_workspace_notifications
--     drop constraint if exists hr_workspace_notifications_kind_check,
--     add constraint hr_workspace_notifications_kind_check
--       check (kind in ('signing_completed', 'signing_declined',
--             'integration_event', 'inbound_email'));

alter table public.hr_workspace_notifications
  drop constraint if exists hr_workspace_notifications_kind_check;
alter table public.hr_workspace_notifications
  add constraint hr_workspace_notifications_kind_check
  check (kind in (
    'signing_completed', 'signing_declined', 'integration_event',
    'inbound_email', 'finance_call'
  ));

create or replace function public._finance_call_notify_admins(p_call_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_amount numeric;
  v_due date;
  v_ref text;
  v_currency text;
  v_party text;
  v_label text;
  v_ref_suffix text;
  v_en_body text;
  v_fr_body text;
begin
  select
    cc.organization_id,
    cc.amount,
    cc.due_date,
    cc.reference,
    c.currency,
    p.name
  into
    v_org_id, v_amount, v_due, v_ref, v_currency, v_party
  from public.finance_capital_calls cc
  join public.finance_commitments c on c.id = cc.commitment_id
  left join public.finance_parties p on p.id = c.party_id
  where cc.id = p_call_id;

  if v_org_id is null then
    return;
  end if;

  v_label := coalesce(nullif(btrim(v_party), ''), 'Capital partner');
  v_ref_suffix := case
    when nullif(btrim(v_ref), '') is not null then ' · ' || btrim(v_ref)
    else ''
  end;
  v_en_body := v_label
    || ' — ' || v_currency || ' ' || v_amount
    || ' · due ' || v_due
    || v_ref_suffix;
  v_fr_body := v_label
    || ' — ' || v_currency || ' ' || v_amount
    || ' · échéance le ' || v_due
    || v_ref_suffix;

  insert into public.hr_workspace_notifications (
    organization_id, user_id, kind, title_en, title_fr, body_en, body_fr, href
  )
  select
    v_org_id,
    om.user_id,
    'finance_call',
    'Capital call notified',
    'Appel de fonds notifié',
    v_en_body,
    v_fr_body,
    '/app/finance/deals'
  from public.organization_members om
  where om.organization_id = v_org_id
    and om.status = 'active'
    and om.role in ('owner', 'admin');
end;
$$;

revoke execute on function public._finance_call_notify_admins(uuid)
  from public, anon, authenticated;
grant execute on function public._finance_call_notify_admins(uuid)
  to service_role;

create or replace function public._finance_call_notify_on_notified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._finance_call_notify_admins(new.id);
  return new;
end;
$$;

revoke execute on function public._finance_call_notify_on_notified()
  from public, anon, authenticated;

drop trigger if exists finance_capital_calls_notify_insert
  on public.finance_capital_calls;
drop trigger if exists finance_capital_calls_notify_update
  on public.finance_capital_calls;

create trigger finance_capital_calls_notify_insert
  after insert on public.finance_capital_calls
  for each row
  when (new.status = 'notified')
  execute function public._finance_call_notify_on_notified();

create trigger finance_capital_calls_notify_update
  after update of status on public.finance_capital_calls
  for each row
  when (new.status = 'notified' and old.status <> 'notified')
  execute function public._finance_call_notify_on_notified();
