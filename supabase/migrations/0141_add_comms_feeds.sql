create table if not exists public.comms_feeds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  url text not null,
  label jsonb not null,
  source_type text not null
    constraint comms_feeds_source_type_check
      check (source_type in ('official_notice', 'news', 'social', 'press_release', 'internal', 'partner', 'manual')),
  initiative_id uuid,
  enabled boolean not null default true,
  format text not null
    constraint comms_feeds_format_check
      check (format in ('rss', 'atom', 'auto')),
  last_fetched_at text,
  last_fetch_status text
    constraint comms_feeds_last_fetch_status_check
      check (last_fetch_status is null or last_fetch_status in ('ok', 'error')),
  last_fetch_message text,
  jurisdiction text
    constraint comms_feeds_jurisdiction_check
      check (jurisdiction is null or jurisdiction in ('federal', 'provincial', 'municipal', 'internal')),
  create_coverage_drafts boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_feeds_organization_id_idx
  on public.comms_feeds (organization_id);
create index if not exists comms_feeds_initiative_id_idx
  on public.comms_feeds (initiative_id);

alter table public.comms_feeds enable row level security;

create policy "Org members can view feeds"
  on public.comms_feeds for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage feeds"
  on public.comms_feeds for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
