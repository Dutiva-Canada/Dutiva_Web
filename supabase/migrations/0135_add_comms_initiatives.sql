create table if not exists public.comms_initiatives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title jsonb not null,
  type text not null
    constraint comms_initiatives_type_check
      check (type in ('campaign', 'programme', 'announcement', 'policy_consultation', 'event', 'issue_response', 'standalone')),
  domain text not null
    constraint comms_initiatives_domain_check
      check (domain in ('pr', 'corporate', 'social', 'public_affairs', 'marketing', 'advertising', 'imc')),
  owner text not null,
  audience jsonb,
  intended_outcome jsonb,
  baseline text,
  target text,
  start_date text,
  end_date text,
  risk text
    constraint comms_initiatives_risk_check
      check (risk in ('low', 'medium', 'high', 'critical')),
  budget integer,
  currency text,
  status text not null
    constraint comms_initiatives_status_check
      check (status in ('planning', 'active', 'paused', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_initiatives_organization_id_idx
  on public.comms_initiatives (organization_id);
create index if not exists comms_initiatives_status_idx
  on public.comms_initiatives (status);

alter table public.comms_initiatives enable row level security;

create policy "Org members can view initiatives"
  on public.comms_initiatives for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage initiatives"
  on public.comms_initiatives for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
