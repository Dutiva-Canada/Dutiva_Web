-- 0178_finance_call_comms_log.sql
--
-- Capital-call notices into the communications log. When a call becomes
-- 'notified' the admin has, by definition, sent the partner a notice —
-- but until now that notice left no trace outside the call row itself.
-- This replaces _finance_call_notify_admins (0176) with a version that
-- also inserts one hr_communications row per call-notification: channel
-- 'email', status 'sent', sent_on today, audience = the partner, title
-- carrying the amount/due/reference. The Communications workspace
-- (/app/communications) reads hr_communications, so the notice shows up
-- in the same log as every other outbound message — no UI work needed.
--
-- Trigger wiring is unchanged (finance_capital_calls_notify_insert /
-- _update from 0176); only the fan-out function body changes.
--
-- ROLLBACK:
--   create or replace public._finance_call_notify_admins(uuid) with the
--   0176 body (the same function minus the hr_communications insert).

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

  -- The notice is the event — log it where the team audits outbound mail.
  insert into public.hr_communications (
    organization_id, title, audience, channel, status, sent_on, note
  )
  values (
    v_org_id,
    'Capital call notice — ' || v_label || v_ref_suffix,
    v_label,
    'email',
    'sent',
    current_date,
    v_currency || ' ' || v_amount || ' · due ' || v_due
  );
end;
$$;

revoke execute on function public._finance_call_notify_admins(uuid)
  from public, anon, authenticated;
grant execute on function public._finance_call_notify_admins(uuid)
  to service_role;
