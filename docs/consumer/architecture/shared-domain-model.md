# Shared Domain Model

This document defines the conceptual entities and relationships shared across Canadian Life Admin, Canadian Document Generation, and Personal Evidence Locker. It is not a database schema; implementation will map these concepts to tables, columns, and access policies.

---

## Entity definitions

### User

The human account holder.

- `id` — stable account identifier.
- `email` — contact address.
- `full_name` — display name.
- `preferred_language` — `en` or `fr`.
- `preferred_theme` — light/dark preference.
- `created_at`, `updated_at`.
- `account_status` — active, suspended, deleted-pending, etc.

### Profile

Extended personal information attached to a user. Kept separate from `User` to support future family/organization profiles without mixing identity.

- `user_id`.
- `home_jurisdiction` — default province/territory/federal scope.
- `additional_jurisdictions` — jurisdictions the user has declared interest in.
- `phone`, `address` (optional, encrypted at rest).
- `notification_preferences`.

### Jurisdiction

A Canadian legal or administrative scope.

- `code` — stable code (e.g., `ON`, `QC`, `FED`, `BC`, `YT`).
- `name` — bilingual display name.
- `type` — `federal`, `province`, `territory`, `municipality`, `regulator`, `situation_specific`.
- `parent_jurisdiction_id` — for hierarchical resolution.
- `statute_prefix` or `authority` — naming convention used in citations.

### Situation

A user's current administrative matter. The central organizing concept of Canadian Life Admin.

- `id`.
- `user_id`.
- `title` — user-provided or system-suggested label.
- `description` — free-text user description.
- `detected_life_event_keys` — proposed events (e.g., `job_loss`, `tenancy_dispute`).
- `confirmed_life_event_key` — the event the user confirms.
- `jurisdiction_id` — selected jurisdiction.
- `status` — active, resolved, archived.
- `created_at`, `updated_at`, `resolved_at`.

### LifeEvent

A canonical administrative event type. Used to map free-text situations to structured workflows.

- `key` — stable slug.
- `category` — employment, housing, consumer, government, family, business, insurance, documents.
- `name` — bilingual display name.
- `description` — bilingual description.
- `typical_jurisdictions` — jurisdictions commonly involved.
- `workflow_key` — link to a workflow definition.
- `risk_indicators` — flags that suggest escalation.

### Case

A container for related documents, evidence, tasks, and notes. In consumer use, a case usually maps 1:1 to a situation but may also be a manually created container.

- `id`.
- `user_id`.
- `situation_id` (optional).
- `title`.
- `jurisdiction_id`.
- `status` — open, resolved, archived.
- `risk_level` — low, medium, high.
- `created_at`, `updated_at`.

### Document

A generated or uploaded document. Distinct from `Evidence` in that documents are user-facing artifacts, while evidence items are source records.

- `id`.
- `user_id`.
- `case_id` (optional).
- `template_id` (for generated documents, optional).
- `title` — bilingual title.
- `language`.
- `jurisdiction_id`.
- `status` — draft, pending_review, final, exported, voided.
- `version_id` — current version.
- `created_at`, `updated_at`.

### DocumentVersion

An immutable snapshot of a document at a point in time.

- `id`.
- `document_id`.
- `version_number`.
- `answers_snapshot` — structured input answers.
- `rendered_content` — the generated document body.
- `template_version_id`.
- `created_by`, `created_at`.

### Evidence

A source item uploaded or captured by the user.

- `id`.
- `user_id`.
- `case_id` (optional).
- `title`.
- `description`.
- `source_type` — upload, capture, import, manual_entry.
- `original_file_id` — reference to stored original.
- `mime_type`, `file_size`, `original_hash`.
- `captured_at`, `uploaded_at`.
- `sensitivity` — normal, sensitive, highly_sensitive.
- `status` — active, deleted_pending, purged.

### EvidenceInterpretation

Machine-generated analysis of an evidence item. Stored separately from `Evidence`.

- `id`.
- `evidence_id`.
- `type` — summary, extracted_dates, parties, amounts, obligations, contradiction_flag, etc.
- `content` — structured output.
- `confidence` — high, medium, low, or numeric.
- `model_metadata` — model/provider/version used (if AI).
- `generated_at`.
- `user_correction` — optional user override.

### Organization / Person

A party that appears in a user's situations, documents, or evidence.

- `id`.
- `user_id`.
- `display_name`.
- `type` — individual, organization, government_agency, business.
- `role` — e.g., landlord, employer, service_provider, counterparty, agency.
- `contact_info` (optional, encrypted).

### Event

A discrete occurrence in a timeline.

- `id`.
- `case_id`.
- `event_date`.
- `date_precision` — exact, month, year, approximate, unknown.
- `description`.
- `linked_evidence_ids`.
- `linked_document_ids`.
- `source` — user, document, evidence_interpretation.
- `created_at`.

### Task

A concrete action the user can take.

- `id`.
- `user_id`.
- `case_id` (optional).
- `situation_id` (optional).
- `title`.
- `description`.
- `status` — pending, in_progress, done, skipped.
- `due_date` (optional).
- `priority` — low, normal, high.
- `source` — generated from workflow or user-created.

### Deadline

A jurisdiction-dependent or user-defined deadline.

- `id`.
- `case_id`.
- `name`.
- `due_date`.
- `type` — statutory, contractual, user_defined, suggested.
- `authority` — source of the deadline (statute name, contract clause, user note).
- `status` — upcoming, due_soon, overdue, completed.

### Rule / KnowledgeItem

A vetted piece of knowledge used by the system.

- `id`.
- `jurisdiction_id`.
- `life_event_keys`.
- `topic`.
- `statement` — bilingual, plain-language summary.
- `source` — statute, regulation, agency guidance, court decision, etc.
- `source_url`.
- `effective_date`.
- `last_reviewed_at`.
- `review_status` — valid, needs_review, superseded.
- `superseded_by_id`.

### GeneratedDocument

A document produced by Canadian Document Generation. Semantically overlaps `Document` but kept conceptually distinct because generation metadata is important.

- Same fields as `Document` plus:
- `generation_session_id`.
- `template_version_id`.
- `answers_snapshot`.
- `risk_level`.
- `review_status`.

### AIAnalysis

A machine-generated reasoning artifact tied to a turn, situation, or evidence item.

- `id`.
- `user_id`.
- `context_type` — chat_turn, situation, evidence, document.
- `context_id`.
- `prompt_summary` — high-level description of request (no PII).
- `output` — structured result.
- `model_metadata`.
- `grounding_sources` — references to `KnowledgeItem`s used.
- `confidence`.
- `generated_at`.

---

## Cardinality

- One `User` has one `Profile`.
- One `User` has many `Situation`s, `Case`s, `Document`s, `Evidence` items, `Task`s, `Deadline`s.
- One `Situation` maps to zero or one `Case`.
- One `Case` has many `Document`s, `Evidence` items, `Event`s, `Task`s, `Deadline`s.
- One `Evidence` item may link to many `Case`s and `Event`s.
- One `Document` may link to many `Evidence` items as supporting material.
- One `LifeEvent` may trigger one or more `Workflow`s, `Task`s, `Deadline`s, and `Document` suggestions.
- One `Rule` / `KnowledgeItem` applies to one or more `Jurisdiction`s and `LifeEvent`s.

---

## Multi-tenancy model

The consumer product is **single-user by default**. Future family or helper access is a share model, not an organization-tenant model like Dutiva's employer workspace.

- Every entity is owned by a `user_id`.
- Row-level access control filters by `user_id`.
- Shared access (e.g., family members) is explicit, revocable, and audited.
- Support/admin access is read-only except where explicitly authorized by the user and logged.

---

## Audit concepts

- Every meaningful action (create, update, delete, export, share, AI analysis request) is logged with actor, timestamp, and action type.
- The audit log is append-only from the user's perspective; operational staff may purge old records according to retention policy.
- Evidence integrity metadata (hash, provenance) is stored with the evidence item.
