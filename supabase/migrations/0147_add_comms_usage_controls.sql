create table if not exists public.comms_usage_controls (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  monthly_content_budget numeric,
  monthly_interaction_budget numeric,
  alert_threshold_percent numeric,
  default_review_days numeric,
  content_retention_days numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.comms_usage_controls enable row level security;

create policy "Org members can view usage controls"
  on public.comms_usage_controls for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage usage controls"
  on public.comms_usage_controls for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
