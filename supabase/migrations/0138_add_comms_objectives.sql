create table if not exists public.comms_objectives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  initiative_id uuid not null,
  label jsonb not null,
  baseline text,
  target text,
  period jsonb,
  owner text not null,
  evidence_source jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_objectives_organization_id_idx
  on public.comms_objectives (organization_id);
create index if not exists comms_objectives_initiative_id_idx
  on public.comms_objectives (initiative_id);

alter table public.comms_objectives enable row level security;

create policy "Org members can view objectives"
  on public.comms_objectives for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage objectives"
  on public.comms_objectives for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
