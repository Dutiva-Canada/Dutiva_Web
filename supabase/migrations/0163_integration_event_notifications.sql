-- 0163_integration_event_notifications.sql
--
-- Event consumption for inbound webhooks (docs/INTEGRATIONS.md phase 2).
-- Until now integration_events rows landed but nothing read them. This
-- migration adds the first consumer: the integration-webhook ingest
-- function calls _integration_event_notify_admins after storing an event,
-- which fans out one hr_workspace_notifications row to each active
-- owner/admin member — the same surface signing notifications use — and
-- marks the event processed.
--
-- Two changes:
--   1. 'integration_event' joins the hr_workspace_notifications kind check.
--   2. _integration_event_notify_admins(p_event_id) — service-role only —
--      builds the bilingual title/body from provider + event_type + a
--      short detail string pulled from the payload (summary/title/message,
--      whichever the sender supplied), inserts one row per owner/admin,
--      then stamps integration_events.processed_at.
--
-- The event row stays stored either way: if the notify RPC errors the
-- ingest still returns 202 and processed_at stays NULL, so a later
-- consumer can pick the row up.
--
-- ROLLBACK:
--   drop function if exists public._integration_event_notify_admins(uuid);
--   alter table public.hr_workspace_notifications
--     drop constraint if exists hr_workspace_notifications_kind_check,
--     add constraint hr_workspace_notifications_kind_check
--       check (kind in ('signing_completed', 'signing_declined'));

alter table public.hr_workspace_notifications
  drop constraint if exists hr_workspace_notifications_kind_check;
alter table public.hr_workspace_notifications
  add constraint hr_workspace_notifications_kind_check
  check (kind in ('signing_completed', 'signing_declined', 'integration_event'));

create or replace function public._integration_event_notify_admins(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.integration_events;
  v_label text;
  v_detail text;
  v_body text;
begin
  select * into v_event
  from public.integration_events
  where id = p_event_id;

  if v_event.id is null then
    return;
  end if;

  -- Already fanned out — the ingest calls this once, but keep it
  -- idempotent so a retried delivery can't double-notify.
  if v_event.processed_at is not null then
    return;
  end if;

  v_label := coalesce(nullif(btrim(v_event.event_type), ''), 'event');
  v_detail := left(coalesce(
    nullif(btrim(v_event.payload ->> 'summary'), ''),
    nullif(btrim(v_event.payload ->> 'title'), ''),
    nullif(btrim(v_event.payload ->> 'message'), ''),
    ''), 180);
  v_body := v_label || case when v_detail <> '' then ' — ' || v_detail else '' end;

  insert into public.hr_workspace_notifications (
    organization_id, user_id, kind, title_en, title_fr, body_en, body_fr, href
  )
  select
    v_event.organization_id,
    om.user_id,
    'integration_event',
    'Inbound integration event',
    'Événement d’intégration entrant',
    v_body,
    v_body,
    '/app/settings'
  from public.organization_members om
  where om.organization_id = v_event.organization_id
    and om.status = 'active'
    and om.role in ('owner', 'admin');

  update public.integration_events
  set processed_at = now()
  where id = v_event.id;
end;
$$;

revoke execute on function public._integration_event_notify_admins(uuid)
  from public, anon, authenticated;
grant execute on function public._integration_event_notify_admins(uuid)
  to service_role;
