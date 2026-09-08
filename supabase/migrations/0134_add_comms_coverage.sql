create table if not exists public.comms_coverage_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  initiative_id uuid,
  source_id uuid,
  outlet jsonb not null,
  headline jsonb not null,
  language text not null
    constraint comms_coverage_items_language_check
      check (language in ('en', 'fr', 'bilingual')),
  published_date text,
  url text,
  reach integer,
  sentiment text
    constraint comms_coverage_items_sentiment_check
      check (sentiment in ('positive', 'neutral', 'negative', 'mixed')),
  provenance text not null
    constraint comms_coverage_items_provenance_check
      check (provenance in ('manual', 'provider', 'ai_estimate')),
  owner text not null,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_coverage_items_organization_id_idx
  on public.comms_coverage_items (organization_id);
create index if not exists comms_coverage_items_published_date_idx
  on public.comms_coverage_items (published_date desc nulls last);

alter table public.comms_coverage_items enable row level security;

create policy "Org members can view coverage items"
  on public.comms_coverage_items for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage coverage items"
  on public.comms_coverage_items for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
