create table if not exists public.comms_interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  initiative_id uuid,
  contact_id uuid,
  type text not null
    constraint comms_interactions_type_check
      check (type in ('inquiry', 'comment', 'dm', 'pitch', 'meeting', 'submission')),
  source jsonb not null,
  visibility text not null
    constraint comms_interactions_visibility_check
      check (visibility in ('public', 'internal', 'restricted')),
  summary jsonb not null,
  response_target text,
  owner text not null,
  status text not null
    constraint comms_interactions_status_check
      check (status in ('open', 'pending', 'responded', 'escalated', 'closed')),
  escalation_reason jsonb,
  moderation_reason jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_interactions_organization_id_idx
  on public.comms_interactions (organization_id);
create index if not exists comms_interactions_initiative_id_idx
  on public.comms_interactions (initiative_id);
create index if not exists comms_interactions_contact_id_idx
  on public.comms_interactions (contact_id);

alter table public.comms_interactions enable row level security;

create policy "Org members can view interactions"
  on public.comms_interactions for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage interactions"
  on public.comms_interactions for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
