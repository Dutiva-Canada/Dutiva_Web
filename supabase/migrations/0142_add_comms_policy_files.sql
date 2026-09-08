create table if not exists public.comms_policy_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  initiative_id uuid,
  jurisdiction jsonb not null,
  authority jsonb not null,
  objective jsonb not null,
  source_url text,
  stage text not null
    constraint comms_policy_files_stage_check
      check (stage in ('proposed', 'enacted', 'in_force', 'consultation_open', 'consultation_closed')),
  deadline text,
  owner text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_policy_files_organization_id_idx
  on public.comms_policy_files (organization_id);
create index if not exists comms_policy_files_initiative_id_idx
  on public.comms_policy_files (initiative_id);

alter table public.comms_policy_files enable row level security;

create policy "Org members can view policy files"
  on public.comms_policy_files for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage policy files"
  on public.comms_policy_files for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
