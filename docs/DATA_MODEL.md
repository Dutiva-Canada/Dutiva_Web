# HR Documents Library — data model

Transcribed from the handoff's "Data Model & Handoff" screen (the authoritative
starting spec). The prototype shipped this as an in-app dev view; per the handoff
README it is deliberately NOT a product route — it lives here as engineering
documentation instead.

**Demo vs production.** The live demo catalogue and sample repository are
**bundled fixtures** under `src/features/app/documents/data/` (the old anon-
readable `doclib` schema was dropped in migration `0021`). Production
repository persistence is **`public.hr_generated_documents`** (plus
`hr_document_versions` and `hr_document_audit_events`) from migration
`0076` — org-scoped RLS, catalogue tids as strings, frozen content snapshots
on versions. **Dutiva Signature** (migrations `0077`–`0078`) is the proprietary
in-app workflow — consent, signing order, content fingerprint, audit trail,
completion records, and per-recipient external signing tokens (migration `0080`).
Signed PDF export (migration `0079`, table
`hr_document_exports`; Storage persistence migration `0081`) records each download
and links to `export_events` when the export-protection pipeline wrote a server
row. Org admins can email per-recipient `/sign/:token` links via the
`send-signing-invite` edge function (Resend); delivery verdicts from Resend
webhooks land on `hr_document_recipients.invite_delivery_*` (migration `0082`).
Turn-aware invites email only the current signer; partial completion auto-emails
the next signer (migration `0083`). Stale invites get reminder emails every
6 hours via `signing-reminder-scheduler`. French documents use `/fr/sign/:token`.
Org admins are emailed on envelope completion or decline (`notify-signing-status`,
migration `0084`); admins can refresh expired signing links from the detail view.
Migration `0085` hardens public `/sign/:token` (noindex headers + Seo, per-IP and
per-token RPC rate limits), makes the reminder cadence configurable per org
(`organizations.signing_reminder_days`, 1–14), and writes in-app admin
notifications (`hr_workspace_notifications`) into the workspace bell.
No third-party e-sign vendor is required.

The full design handoff this was transcribed from — README, prototype HTML,
`dutiva-data.js`, and reference screenshots — is committed at
[`docs/design-handoff-hr-documents-library/`](./design-handoff-hr-documents-library/README.md),
so it's reproducible for contributors instead of living only on one machine.

**Stack:** React 19 + Vite,Supabase (Postgres + RLS + Storage),Vercel,Provider-agnostic e-signature

## Entities

### `organizations` (identity, RLS)

The tenant + its compliance profile (size, union, sector) that drives conditional obligations.

- **Fields:** `id`, `name`, `employee_count`, `size_tier`, `unionized`, `sector`, `federally_regulated`, `primary_jurisdiction`, `created_at`; production also stores `signing_reminder_days` (1–14, default 3; migration `0085`)
- **Relations:** has many organization_members, employees, documents, templates
- **Surfaces in UI:** Workspace switcher

### `profiles` (identity, RLS)

A user account (mirrors auth.users).

- **Fields:** `id`, `full_name`, `email`, `avatar_url`
- **Relations:** belongs to many organizations via organization_members
- **Surfaces in UI:** User menu, created_by/updated_by

### `organization_members` (identity, RLS)

Join of profile ↔ organization + role. The heart of RLS.

- **Fields:** `id`, `organization_id`, `profile_id`, `role (owner|hr|manager|viewer|external)`, `created_at`
- **Relations:** → organizations; → profiles
- **Surfaces in UI:** Role switcher, permission gating

### `employees` (records, RLS)

The workforce roster.

- **Fields:** `id`, `organization_id`, `name`, `role`, `jurisdiction`, `status`
- **Relations:** has many documents; has many employee_cases
- **Surfaces in UI:** Generation context, repository filter

### `hr_advisor_memory_facts` (records, RLS — migration `0086`)

Org-scoped Advisor Memory facts (one row = one governed fact). Distinct from
legacy `advisor_memories` (preference / context blobs). Soft-forget via
`forgotten_at`. Org members read; org admins write.

- **Fields:** `id`, `organization_id`, `scope` (person|case|thread), `entity_id`,
  `category`, `statement_en`/`statement_fr`, `confidence`, `source_type` /
  `source_detail_*`, `learned_at`, `confirmed_at`, `visibility`, `sensitive`,
  `forgotten_at`, `created_by`/`updated_by`, timestamps
- **Relations:** → organizations; audited by `hr_advisor_memory_audit`
- **Surfaces in UI:** Settings → Advisor Memory (manager, person, case, thread)

### `hr_advisor_memory_audit` (audit, RLS — migration `0086`)

Append-only log of create / confirm / correct / forget on memory facts.

- **Fields:** `id`, `organization_id`, `fact_id`, `actor_user_id`, `action`,
  `statement_en`/`statement_fr` (prior snapshot), `created_at`
- **Relations:** → `hr_advisor_memory_facts`
- **Surfaces in UI:** Memory manager audit rail (production)

### `employee_cases` (records, RLS)

A case file (termination, accommodation…) grouping related documents.

- **Fields:** `id`, `organization_id`, `employee_id`, `title`, `jurisdiction`, `risk`
- **Relations:** → employees; has many documents
- **Surfaces in UI:** Generation context, repository filter

### `document_template_categories` (library)

Global category taxonomy (hiring, policies…).

- **Fields:** `id`, `key`, `name_en`, `name_fr`, `order`
- **Relations:** has many document_templates
- **Surfaces in UI:** Studio category sections & filter

### `document_templates` (library)

The reusable template record (T01–T16). Content lives in versions.

- **Fields:** `id`, `category_id`, `template_key`, `name_en/fr`, `description_en/fr`, `jurisdictions_supported[]`, `risk_level`, `requires_lawyer_review`, `is_active`, `status`, `created_at`, `updated_at`
- **Relations:** → category; has many document_template_versions
- **Surfaces in UI:** Studio template cards & detail

### `document_template_versions` (library)

A versioned content payload. Old documents stay tied to the exact version used.

- **Fields:** `id`, `template_id`, `version_number`, `language`, `body_content`, `schema_json`, `question_flow_json`, `clause_library_json`, `statutory_references_json`, `effective_date`, `deprecated_at`, `created_by`
- **Relations:** → document_templates; referenced by documents.template_version_id
- **Surfaces in UI:** Template detail, generation questions & preview

### `document_generation_sessions` (documents, RLS)

An in-progress generation (answers + autosave) before a document exists.

- **Fields:** `id`, `organization_id`, `template_version_id`, `employee_id?`, `case_id?`, `answers_json`, `language`, `jurisdiction`, `created_by`
- **Relations:** → template_version; becomes a documents row on save
- **Surfaces in UI:** The guided generation wizard

### `documents` (documents, RLS)

The organization's real saved/generated document.

- **Fields:** `id`, `organization_id`, `employee_id?`, `case_id?`, `template_id`, `template_version_id`, `title`, `language`, `jurisdiction`, `status`, `risk_level`, `review_status`, `signature_status`, `current_version_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `archived_at`
- **Relations:** → template_version (frozen); → employee/case; has many document_versions, recipients, signatures, audit_events
- **Surfaces in UI:** Repository row + document detail header

### `document_versions` (documents, RLS)

Every generated/revised version with the answers and rendered content.

- **Fields:** `id`, `document_id`, `version_number`, `content`, `answers_json`, `generated_fields_json`, `change_summary`, `created_by`, `created_at`
- **Relations:** → documents
- **Surfaces in UI:** Versions tab

### `document_recipients` (audit, RLS)

Signers/reviewers, supporting multiple parties and signing order.

- **Fields:** `id`, `document_id`, `recipient_type (employee|manager|hr|external)`, `name`, `email`, `signing_order`, `status`, `signed_at`, `last_invite_sent_at`, `last_reminder_sent_at`, `invite_provider_message_id`, `invite_delivery_status`, `invite_delivery_detail`, `invite_delivery_updated_at`
- **Relations:** → documents
- **Surfaces in UI:** Recipients & signatures tab

### `document_signatures` (audit, RLS)

Provider-agnostic envelope status — not tied to one vendor.

- **Fields:** `id`, `document_id`, `provider`, `external_envelope_id`, `status`, `sent_at`, `viewed_at`, `signed_at`, `declined_at`, `expires_at`
- **Relations:** → documents
- **Surfaces in UI:** Recipients & signatures tab

### `document_exports` (audit, RLS)

A record of each export (PDF/DOCX) for traceability.

- **Fields:** `id`, `document_id`, `format`, `exported_by`, `created_at`
- **Relations:** → documents
- **Surfaces in UI:** Export action + audit entries

### `document_audit_events` (audit, RLS)

Append-only log of every meaningful action.

- **Fields:** `id`, `organization_id`, `document_id`, `actor_id`, `event_type`, `event_metadata`, `created_at`
- **Relations:** → documents; → profiles (actor)
- **Surfaces in UI:** Audit trail tab

## End-to-end flow

1. {"n":1,"key":"studio","label_en":"Template library","label_fr":"Bibliothèque de modèles","entity":"document_templates"}
2. {"n":2,"key":"detail","label_en":"Template detail","label_fr":"Détail du modèle","entity":"document_template_versions"}
3. {"n":3,"key":"questions","label_en":"Guided questions","label_fr":"Questions guidées","entity":"document_generation_sessions"}
4. {"n":4,"key":"preview","label_en":"Live preview","label_fr":"Aperçu en direct","entity":"generation_sessions.answers_json"}
5. {"n":5,"key":"review","label_en":"Review / risk check","label_fr":"Révision / risque","entity":"documents.review_status"}
6. {"n":6,"key":"save","label_en":"Save to repository","label_fr":"Enregistrer au dépôt","entity":"documents + document_versions"}
7. {"n":7,"key":"sign","label_en":"Export / e-sign","label_fr":"Export / signature","entity":"document_signatures"}
8. {"n":8,"key":"audit","label_en":"Versions & audit trail","label_fr":"Versions et journal d’audit","entity":"document_audit_events"}

## Audit event catalogue

`template_opened`, `generation_started`, `draft_saved`, `document_created`, `document_updated`, `version_created`, `review_requested`, `review_approved`, `review_rejected`, `sent_for_signature`, `signing_invite_sent`, `signing_invite_reminded`, `signing_link_reissued`, `signing_admin_notified`, `signature_viewed`, `signature_applied`, `signature_declined`, `signature_completed`, `document_exported`, `document_archived`, `document_restored`, `document_voided`, `permission_changed`, `comment_added`

`document_audit_events` is append-only: no UPDATE/DELETE is granted on it, even
to service roles.
