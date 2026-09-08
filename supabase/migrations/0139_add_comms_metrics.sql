create table if not exists public.comms_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  initiative_id uuid not null,
  name jsonb not null,
  period jsonb,
  value numeric,
  baseline numeric,
  target numeric,
  provenance text not null
    constraint comms_metrics_provenance_check
      check (provenance in ('manual', 'provider', 'ai_estimate')),
  owner text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_metrics_organization_id_idx
  on public.comms_metrics (organization_id);
create index if not exists comms_metrics_initiative_id_idx
  on public.comms_metrics (initiative_id);

alter table public.comms_metrics enable row level security;

create policy "Org members can view metrics"
  on public.comms_metrics for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage metrics"
  on public.comms_metrics for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
