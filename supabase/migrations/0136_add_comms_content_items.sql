create table if not exists public.comms_content_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  initiative_id uuid not null,
  title jsonb not null,
  language text not null
    constraint comms_content_items_language_check
      check (language in ('en', 'fr', 'bilingual')),
  channel text not null
    constraint comms_content_items_channel_check
      check (channel in ('email', 'intranet', 'social_linkedin', 'social_x', 'press_release', 'website', 'newsletter', 'meeting', 'other')),
  status text not null
    constraint comms_content_items_status_check
      check (status in ('draft', 'in_review', 'changes_requested', 'approved', 'superseded', 'withdrawn', 'rejected')),
  delivery_status text not null
    constraint comms_content_items_delivery_status_check
      check (delivery_status in ('not_queued', 'ready', 'scheduled', 'paused', 'sending', 'confirmed', 'failed', 'unknown', 'cancelled')),
  body jsonb,
  revision_note jsonb,
  due_date text,
  scheduled_for text,
  time_zone text,
  owner text not null,
  source_revision_id text,
  needs_translation_review boolean,
  delivery_note jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_content_items_organization_id_idx
  on public.comms_content_items (organization_id);
create index if not exists comms_content_items_initiative_id_idx
  on public.comms_content_items (initiative_id);

alter table public.comms_content_items enable row level security;

create policy "Org members can view content items"
  on public.comms_content_items for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can manage content items"
  on public.comms_content_items for all
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
