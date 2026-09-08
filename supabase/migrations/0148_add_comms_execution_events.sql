create table if not exists public.comms_execution_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_item_id uuid not null,
  action text not null
    constraint comms_execution_events_action_check
      check (action in ('schedule', 'unschedule', 'pause', 'resume', 'mark_sent', 'mark_failed', 'retry', 'reconcile', 'cancel')),
  previous_status text
    constraint comms_execution_events_previous_status_check
      check (previous_status is null or previous_status in ('not_queued', 'ready', 'scheduled', 'paused', 'sending', 'confirmed', 'failed', 'unknown', 'cancelled')),
  new_status text
    constraint comms_execution_events_new_status_check
      check (new_status is null or new_status in ('not_queued', 'ready', 'scheduled', 'paused', 'sending', 'confirmed', 'failed', 'unknown', 'cancelled')),
  actor text not null,
  note jsonb,
  timestamp text not null,
  created_at timestamptz not null default now()
);

create index if not exists comms_execution_events_organization_id_idx
  on public.comms_execution_events (organization_id);
create index if not exists comms_execution_events_content_item_id_idx
  on public.comms_execution_events (content_item_id);

alter table public.comms_execution_events enable row level security;

create policy "Org members can view execution events"
  on public.comms_execution_events for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage execution events"
  on public.comms_execution_events for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
