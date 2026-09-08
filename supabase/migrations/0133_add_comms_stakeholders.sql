-- Comms stakeholder management: organizations and contacts.
-- Initial Supabase-backed persistence for the comms module (Phase 2).

create table if not exists public.comms_organizations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  type jsonb,
  jurisdiction jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comms_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  comms_organization_id uuid references public.comms_organizations(id) on delete set null,
  name text not null,
  type text not null
    constraint comms_contacts_type_check
      check (type in ('media', 'institutional', 'partner', 'creator', 'audience')),
  role jsonb,
  purpose jsonb,
  channel_preference jsonb,
  source jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_organizations_organization_id_idx
  on public.comms_organizations (organization_id);
create index if not exists comms_organizations_name_idx
  on public.comms_organizations (name);
create index if not exists comms_contacts_organization_id_idx
  on public.comms_contacts (organization_id);
create index if not exists comms_contacts_comms_organization_id_idx
  on public.comms_contacts (comms_organization_id);
create index if not exists comms_contacts_name_idx
  on public.comms_contacts (name);

alter table public.comms_organizations enable row level security;
alter table public.comms_contacts enable row level security;

create policy "Org members can view comms organizations"
  on public.comms_organizations for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage comms organizations"
  on public.comms_organizations for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org members can view comms contacts"
  on public.comms_contacts for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage comms contacts"
  on public.comms_contacts for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
