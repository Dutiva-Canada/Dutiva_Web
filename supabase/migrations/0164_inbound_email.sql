-- 0164_inbound_email.sql
--
-- Inbound email provider (docs/INTEGRATIONS.md). Each connected
-- inbound_email integration owns a minted address `in-<key>@<inbound
-- domain>`; Resend receives the mail (MX on the inbound domain) and its
-- `email.received` webhook calls the `inbound-email` edge function, which
-- routes by the address key, stores the message here, and notifies the
-- org's owner/admin members — same surface as integration events.
--
--   1. 'inbound_email' joins the workspace_integrations.provider check.
--   2. inbound_emails — org-scoped message table. Members read, admins
--      delete, inserts are service-role only (the edge function).
--      (integration_id, provider_email_id) is unique so a Resend retry
--      can't double-store or double-notify.
--   3. 'inbound_email' joins the hr_workspace_notifications kind check.
--   4. _inbound_email_notify_admins — service-role-only fan-out, mirrors
--      _integration_event_notify_admins (0163).
--
-- Attachment BODIES are not stored — only their metadata (filename,
-- type, disposition). Bodies are fetchable later from the Resend
-- Receiving API by provider_email_id if a download surface ships.
--
-- ROLLBACK:
--   drop function if exists public._inbound_email_notify_admins(uuid);
--   drop table if exists public.inbound_emails;
--   restore both check constraints without 'inbound_email'.

alter table public.workspace_integrations
  drop constraint if exists workspace_integrations_provider_check;
alter table public.workspace_integrations
  add constraint workspace_integrations_provider_check
  check (provider in (
    'github', 'gitlab', 'gmail', 'outlook', 'smtp_email',
    'inbound_webhook', 'inbound_email'
  ));

create table if not exists public.inbound_emails (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  integration_id uuid not null references public.workspace_integrations (id) on delete cascade,
  provider_email_id text not null,
  message_id text,
  from_address text not null,
  to_addresses text[] not null default '{}',
  subject text,
  text_body text,
  html_body text,
  attachments jsonb not null default '[]'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists inbound_emails_provider_email_id_uniq
  on public.inbound_emails (integration_id, provider_email_id);
create index if not exists inbound_emails_organization_id_idx
  on public.inbound_emails (organization_id, received_at desc);
create index if not exists inbound_emails_integration_id_idx
  on public.inbound_emails (integration_id, received_at desc);

alter table public.inbound_emails enable row level security;

create policy "Org members can read inbound_emails"
  on public.inbound_emails for select to authenticated
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can delete inbound_emails"
  on public.inbound_emails for delete to authenticated
  using (public.is_org_admin(organization_id, (select auth.uid())));

alter table public.hr_workspace_notifications
  drop constraint if exists hr_workspace_notifications_kind_check;
alter table public.hr_workspace_notifications
  add constraint hr_workspace_notifications_kind_check
  check (kind in ('signing_completed', 'signing_declined', 'integration_event', 'inbound_email'));

create or replace function public._inbound_email_notify_admins(p_email_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email public.inbound_emails;
  v_body text;
begin
  select * into v_email
  from public.inbound_emails
  where id = p_email_id;

  if v_email.id is null then
    return;
  end if;

  if v_email.processed_at is not null then
    return;
  end if;

  v_body := left(
    v_email.from_address || ' — ' ||
    coalesce(nullif(btrim(v_email.subject), ''), '(no subject)'),
    220
  );

  insert into public.hr_workspace_notifications (
    organization_id, user_id, kind, title_en, title_fr, body_en, body_fr, href
  )
  select
    v_email.organization_id,
    om.user_id,
    'inbound_email',
    'Inbound email received',
    'Courriel entrant reçu',
    v_body,
    v_body,
    '/app/settings'
  from public.organization_members om
  where om.organization_id = v_email.organization_id
    and om.status = 'active'
    and om.role in ('owner', 'admin');

  update public.inbound_emails
  set processed_at = now()
  where id = v_email.id;
end;
$$;

revoke execute on function public._inbound_email_notify_admins(uuid)
  from public, anon, authenticated;
grant execute on function public._inbound_email_notify_admins(uuid)
  to service_role;
