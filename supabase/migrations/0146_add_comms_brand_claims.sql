create table if not exists public.comms_brand_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  text jsonb not null,
  evidence jsonb not null,
  owner text not null,
  review_date text,
  status text not null
    constraint comms_brand_claims_status_check
      check (status in ('active', 'expired', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_brand_claims_organization_id_idx
  on public.comms_brand_claims (organization_id);

alter table public.comms_brand_claims enable row level security;

create policy "Org members can view brand claims"
  on public.comms_brand_claims for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage brand claims"
  on public.comms_brand_claims for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
