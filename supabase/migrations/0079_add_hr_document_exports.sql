-- Signed document export audit rows (handoff document_exports entity).
-- PDF bytes are delivered client-side via export protection; this table
-- records that an export occurred and links to export_events when present.

alter table public.hr_generated_documents
  drop constraint if exists hr_generated_documents_status_check;

alter table public.hr_generated_documents
  add constraint hr_generated_documents_status_check
  check (status in (
    'draft', 'approved', 'archived',
    'sent_for_signature', 'partially_signed', 'signed', 'voided', 'exported'
  ));

create table if not exists public.hr_document_exports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.hr_generated_documents(id) on delete cascade,
  version_number integer not null,
  format text not null check (format in ('pdf', 'docx')),
  export_event_id uuid references public.export_events(id) on delete set null,
  exported_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists hr_document_exports_document_id_idx
  on public.hr_document_exports (document_id);

create index if not exists hr_document_exports_organization_id_idx
  on public.hr_document_exports (organization_id);

alter table public.hr_document_exports enable row level security;

create policy "Org members can view document exports"
  on public.hr_document_exports for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can insert document exports"
  on public.hr_document_exports for insert
  with check (public.is_org_admin(organization_id, (select auth.uid())));
