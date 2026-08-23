-- Provider-agnostic e-signature envelopes for hr_generated_documents (0076).
-- First concrete provider: dutiva_embedded (in-app pad — no external vendor).
-- Future vendors plug in behind the same tables + adapter interface.
--
-- Dutiva does not send email or deliver envelopes to third parties in this
-- release: "send for signature" creates an envelope + signing links inside
-- the workspace. External provider webhooks belong in a later migration.

-- Widen document lifecycle for signing states (0076 only had draft/approved/archived).
alter table public.hr_generated_documents
  drop constraint if exists hr_generated_documents_status_check;

alter table public.hr_generated_documents
  add constraint hr_generated_documents_status_check
  check (status in (
    'draft', 'approved', 'archived',
    'sent_for_signature', 'partially_signed', 'signed'
  ));

alter table public.hr_generated_documents
  add column if not exists signature_status text not null default 'not_sent'
  check (signature_status in (
    'not_sent', 'sent', 'viewed', 'pending', 'partially_signed',
    'signed', 'declined', 'expired', 'voided'
  ));

-- One envelope row per signing round on a document (provider + external id).
create table if not exists public.hr_document_signatures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.hr_generated_documents(id) on delete cascade,
  provider text not null,
  external_envelope_id text not null,
  status text not null default 'sent'
    check (status in (
      'sent', 'viewed', 'pending', 'partially_signed',
      'signed', 'declined', 'expired', 'voided'
    )),
  sent_at timestamptz not null default now(),
  viewed_at timestamptz,
  signed_at timestamptz,
  declined_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (external_envelope_id)
);

create index if not exists hr_document_signatures_document_id_idx
  on public.hr_document_signatures (document_id);

create index if not exists hr_document_signatures_organization_id_idx
  on public.hr_document_signatures (organization_id);

alter table public.hr_document_signatures enable row level security;

create policy "Org members can view document signatures"
  on public.hr_document_signatures for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can insert document signatures"
  on public.hr_document_signatures for insert
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can update document signatures"
  on public.hr_document_signatures for update
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));

-- Recipients denormalize organization_id for direct RLS checks.
create table if not exists public.hr_document_recipients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.hr_generated_documents(id) on delete cascade,
  signature_id uuid not null references public.hr_document_signatures(id) on delete cascade,
  recipient_type text not null default 'employee'
    check (recipient_type in ('employer', 'employee', 'manager', 'hr', 'external')),
  name text not null,
  email text not null,
  signing_order integer not null default 1,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'viewed', 'signed', 'declined')),
  signed_name text,
  signature_image text,
  signature_text text,
  signed_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists hr_document_recipients_signature_id_idx
  on public.hr_document_recipients (signature_id);

create index if not exists hr_document_recipients_document_id_idx
  on public.hr_document_recipients (document_id);

alter table public.hr_document_recipients enable row level security;

create policy "Org members can view document recipients"
  on public.hr_document_recipients for select
  using (public.is_org_member(organization_id, (select auth.uid())));

create policy "Org admins can insert document recipients"
  on public.hr_document_recipients for insert
  with check (public.is_org_admin(organization_id, (select auth.uid())));

create policy "Org admins can update document recipients"
  on public.hr_document_recipients for update
  using (public.is_org_admin(organization_id, (select auth.uid())))
  with check (public.is_org_admin(organization_id, (select auth.uid())));
