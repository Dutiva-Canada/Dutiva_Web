create table if not exists public.comms_issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  initiative_id uuid,
  title jsonb not null,
  severity text not null
    constraint comms_issues_severity_check
      check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null
    constraint comms_issues_status_check
      check (status in ('open', 'monitoring', 'resolved', 'closed')),
  lead text not null,
  spokesperson text,
  affected_channels text[] not null default '{}',
  restricted boolean not null default false,
  summary jsonb,
  resolution jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_issues_organization_id_idx
  on public.comms_issues (organization_id);
create index if not exists comms_issues_initiative_id_idx
  on public.comms_issues (initiative_id);

alter table public.comms_issues enable row level security;

create policy "Org members can view issues"
  on public.comms_issues for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage issues"
  on public.comms_issues for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
