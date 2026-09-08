-- Comms contact segmentation: segments and per-contact memberships.
-- Supports targeted outreach (e.g. tier-1 media, bilingual creators).

create table if not exists public.comms_contact_segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name jsonb not null,
  description jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comms_contact_segment_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  comms_contact_id uuid not null references public.comms_contacts(id) on delete cascade,
  comms_segment_id uuid not null references public.comms_contact_segments(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint comms_contact_segment_memberships_unique_membership unique (comms_contact_id, comms_segment_id)
);

create index if not exists comms_contact_segments_organization_id_idx
  on public.comms_contact_segments (organization_id);

create index if not exists comms_contact_segment_memberships_organization_id_idx
  on public.comms_contact_segment_memberships (organization_id);
create index if not exists comms_contact_segment_memberships_contact_id_idx
  on public.comms_contact_segment_memberships (comms_contact_id);
create index if not exists comms_contact_segment_memberships_segment_id_idx
  on public.comms_contact_segment_memberships (comms_segment_id);

alter table public.comms_contact_segments enable row level security;
alter table public.comms_contact_segment_memberships enable row level security;

create policy "Org members can view contact segments"
  on public.comms_contact_segments for select to authenticated
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage contact segments"
  on public.comms_contact_segments for all to authenticated
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org members can view contact segment memberships"
  on public.comms_contact_segment_memberships for select to authenticated
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage contact segment memberships"
  on public.comms_contact_segment_memberships for all to authenticated
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));

-- updated_at triggers
create or replace function public.comms_contact_segments_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists comms_contact_segments_set_updated_at on public.comms_contact_segments;
create trigger comms_contact_segments_set_updated_at
  before update on public.comms_contact_segments
  for each row execute function public.comms_contact_segments_set_updated_at();

create or replace function public.comms_contact_segment_memberships_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists comms_contact_segment_memberships_set_updated_at on public.comms_contact_segment_memberships;
create trigger comms_contact_segment_memberships_set_updated_at
  before update on public.comms_contact_segment_memberships
  for each row execute function public.comms_contact_segment_memberships_set_updated_at();
