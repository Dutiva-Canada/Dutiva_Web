create table if not exists public.comms_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  initiative_id uuid,
  issue_id uuid,
  source_type text not null
    constraint comms_sources_source_type_check
      check (source_type in ('official_notice', 'news', 'social', 'press_release', 'internal', 'partner', 'manual')),
  url text,
  publisher jsonb not null,
  published_date text,
  retrieved_at text,
  jurisdiction jsonb,
  rights jsonb,
  classification jsonb not null,
  supports jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_sources_organization_id_idx
  on public.comms_sources (organization_id);
create index if not exists comms_sources_initiative_id_idx
  on public.comms_sources (initiative_id);
create index if not exists comms_sources_issue_id_idx
  on public.comms_sources (issue_id);

alter table public.comms_sources enable row level security;

create policy "Org members can view sources"
  on public.comms_sources for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage sources"
  on public.comms_sources for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
