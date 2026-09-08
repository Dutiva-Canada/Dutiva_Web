create table if not exists public.comms_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  initiative_id uuid not null,
  policy_file_id uuid,
  authority jsonb not null,
  submitted_at text,
  deadline text,
  method jsonb not null,
  confirmation_ref text,
  owner text not null,
  status text not null
    constraint comms_submissions_status_check
      check (status in ('planned', 'submitted', 'recorded', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_submissions_organization_id_idx
  on public.comms_submissions (organization_id);
create index if not exists comms_submissions_initiative_id_idx
  on public.comms_submissions (initiative_id);

alter table public.comms_submissions enable row level security;

create policy "Org members can view submissions"
  on public.comms_submissions for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage submissions"
  on public.comms_submissions for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
