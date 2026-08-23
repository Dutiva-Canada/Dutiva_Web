-- HR Documents Library repository on real persistence, following the
-- employees / hr_cases / hr_communications shape (0006 / 0007 / 0040).
--
-- WHY NOT revive `doclib` or reuse `public.documents`:
--   - `doclib` was a demo schema with anon-readable views; migration 0021
--     dropped it so the demo no longer shares a trust boundary with real
--     `public.*` tables. Fixtures are the demo source of truth.
--   - Legacy `public.documents` is a different product path (user-scoped
--     generator docs, different lifecycle enums, different RLS).
--
-- WHAT THIS DELIBERATELY DOES NOT STORE: signature envelopes, recipients,
-- or "lawyer reviewed / signed" claims the product cannot perform. Signing
-- stays ModeGate-empty until a provider-agnostic envelope path exists.
-- review_status is copied from the template's declared requirement at
-- create time — it is not an assertion that a review completed.
--
-- content_json on versions freezes the resolved PreviewBlock[] + merge
-- values at create, so later catalogue edits do not rewrite saved drafts.
-- template_tid is a string (catalogue lives in the repo), not a FK.
create table if not exists public.hr_generated_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ref text not null,
  title_en text not null,
  title_fr text not null,
  template_tid text not null,
  template_key text not null,
  template_version text not null,
  employee_id uuid references public.employees(id) on delete set null,
  case_id uuid references public.hr_cases(id) on delete set null,
  jurisdiction text not null
    check (jurisdiction in ('ON', 'QC', 'FED')),
  language text not null default 'en'
    check (language in ('en', 'fr')),
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'archived')),
  review_status text not null default 'not_reviewed'
    check (review_status in (
      'not_reviewed',
      'hr_review_required',
      'lawyer_review_recommended',
      'approved_for_use'
    )),
  risk text not null default 'medium'
    check (risk in ('low', 'medium', 'high')),
  answers_json jsonb not null default '{}'::jsonb,
  current_version integer not null default 1,
  archived_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, ref)
);

create index if not exists hr_generated_documents_organization_id_idx
  on public.hr_generated_documents (organization_id);

create index if not exists hr_generated_documents_employee_id_idx
  on public.hr_generated_documents (employee_id);

alter table public.hr_generated_documents enable row level security;

create policy "Org members can view generated documents"
  on public.hr_generated_documents for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can insert generated documents"
  on public.hr_generated_documents for insert
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can update generated documents"
  on public.hr_generated_documents for update
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can delete generated documents"
  on public.hr_generated_documents for delete
  using (public.is_org_admin(organization_id, (select auth.uid())));

-- Child versions denormalize organization_id so RLS stays a direct
-- is_org_member / is_org_admin check (same pattern as 0009 hr_case_notes).
create table if not exists public.hr_document_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.hr_generated_documents(id) on delete cascade,
  version_number integer not null,
  change_summary_en text not null default 'Initial version',
  change_summary_fr text not null default 'Version initiale',
  content_json jsonb not null default '{}'::jsonb,
  answers_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create index if not exists hr_document_versions_document_id_idx
  on public.hr_document_versions (document_id);

alter table public.hr_document_versions enable row level security;

create policy "Org members can view document versions"
  on public.hr_document_versions for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can insert document versions"
  on public.hr_document_versions for insert
  with check (public.is_org_admin(organization_id, (select auth.uid())));

-- Append-only audit trail: members read, admins insert, nobody mutates.
create table if not exists public.hr_document_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.hr_generated_documents(id) on delete cascade,
  event_type text not null,
  actor_label text not null,
  meta text,
  created_at timestamptz not null default now()
);

create index if not exists hr_document_audit_events_document_id_idx
  on public.hr_document_audit_events (document_id);

alter table public.hr_document_audit_events enable row level security;

create policy "Org members can view document audit events"
  on public.hr_document_audit_events for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can insert document audit events"
  on public.hr_document_audit_events for insert
  with check (public.is_org_admin(organization_id, (select auth.uid())));
