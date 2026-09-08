create table if not exists public.comms_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  type jsonb not null,
  status text not null
    constraint comms_integrations_status_check
      check (status in ('connected', 'disconnected', 'pending')),
  owner text not null,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_integrations_organization_id_idx
  on public.comms_integrations (organization_id);

alter table public.comms_integrations enable row level security;

create policy "Org members can view integrations"
  on public.comms_integrations for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage integrations"
  on public.comms_integrations for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
