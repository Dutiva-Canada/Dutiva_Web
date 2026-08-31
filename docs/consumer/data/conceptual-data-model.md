# Conceptual Data Model

## Purpose

This document defines the logical data model for the consumer product family. It is conceptual only; implementation will map these entities to concrete database tables, columns, object storage, and access policies.

---

## Entity relationship overview

```text
User ──1:1── Profile
User ──1:N── Situation
User ──1:N── Case
User ──1:N── Document
User ──1:N── Evidence
User ──1:N── Task
User ──1:N── Deadline
User ──1:N── AIAnalysis

Situation ──0:1── Case
Situation ──N:M── LifeEvent

Case ──1:N── Document
Case ──1:N── Evidence
Case ──1:N── Event
Case ──1:N── Task
Case ──1:N── Deadline

Evidence ──1:N── EvidenceInterpretation
Evidence ──N:M── Case
Evidence ──N:M── Event
Evidence ──N:M── Document (as supporting material)

Document ──1:N── DocumentVersion

Person / Organization ──N:M── Case
Person / Organization ──N:M── Evidence

Jurisdiction ──1:N── Rule / KnowledgeItem
Jurisdiction ──1:N── Situation
Jurisdiction ──1:N── Document
Jurisdiction ──1:N── Case

LifeEvent ──1:N── Workflow
Workflow ──1:N── TaskTemplate
```

---

## Detailed entities

### User

Represents the authenticated account holder.

| Attribute          | Type         | Notes                                         |
| ------------------ | ------------ | --------------------------------------------- |
| id                 | UUID/string  | Stable identifier.                            |
| email              | string       | Contact address, verified.                    |
| full_name          | string       | Optional display name.                        |
| preferred_language | `en` \| `fr` | Default UI and document language.             |
| preferred_theme    | string       | light / dark / system.                        |
| created_at         | timestamp    | Account creation.                             |
| updated_at         | timestamp    | Last profile change.                          |
| status             | enum         | active, suspended, deletion_pending, deleted. |

### Profile

Extended personal information. Kept separate from `User` to support future helper/family profiles.

| Attribute                   | Type        | Notes                                            |
| --------------------------- | ----------- | ------------------------------------------------ |
| id                          | UUID/string |                                                  |
| user_id                     | reference   | 1:1 with User.                                   |
| home_jurisdiction_id        | reference   | Default province/territory/federal scope.        |
| additional_jurisdiction_ids | list        | Jurisdictions the user has declared interest in. |
| phone                       | string      | Optional, encrypted.                             |
| address                     | object      | Optional, encrypted.                             |
| notification_preferences    | object      | Email/push/in-app settings.                      |
| ai_opt_in                   | boolean     | Global AI analysis consent.                      |

### Jurisdiction

A Canadian legal or administrative scope.

| Attribute              | Type         | Notes                                                                      |
| ---------------------- | ------------ | -------------------------------------------------------------------------- |
| code                   | string       | `ON`, `QC`, `FED`, `BC`, `YT`, etc.                                        |
| name                   | `{ en, fr }` | Display name.                                                              |
| type                   | enum         | federal, province, territory, municipality, regulator, situation_specific. |
| parent_jurisdiction_id | reference    | Hierarchical parent, if any.                                               |
| authority_name         | `{ en, fr }` | e.g., employment standards office.                                         |
| authority_url          | string       | Official website.                                                          |

### Situation

A user's current administrative matter.

| Attribute                | Type                   | Notes                                                          |
| ------------------------ | ---------------------- | -------------------------------------------------------------- |
| id                       | UUID/string            |                                                                |
| user_id                  | reference              | Owner.                                                         |
| title                    | `{ en, fr }` or string | User or system label.                                          |
| description              | string                 | Free-text user description.                                    |
| detected_life_event_keys | list                   | Proposed canonical events.                                     |
| confirmed_life_event_key | string                 | Event confirmed by user.                                       |
| jurisdiction_id          | reference              | Confirmed or assumed jurisdiction.                             |
| jurisdiction_status      | enum                   | unknown, suggested, confirmed, assumed, multi, not_applicable. |
| status                   | enum                   | active, resolved, archived.                                    |
| created_at, updated_at   | timestamps             |                                                                |

### LifeEvent

A canonical administrative event type.

| Attribute             | Type         | Notes                                                                              |
| --------------------- | ------------ | ---------------------------------------------------------------------------------- |
| key                   | string       | Stable slug, e.g., `job_loss`, `tenancy_repair`.                                   |
| category              | enum         | employment, housing, consumer, government, family, business, insurance, documents. |
| name                  | `{ en, fr }` |                                                                                    |
| description           | `{ en, fr }` |                                                                                    |
| typical_jurisdictions | list         | Jurisdictions commonly involved.                                                   |
| risk_indicators       | list         | Flags that suggest escalation.                                                     |
| workflow_key          | string       | Link to workflow definition.                                                       |

### Case

A container for related documents, evidence, events, tasks, and deadlines.

| Attribute              | Type        | Notes                                    |
| ---------------------- | ----------- | ---------------------------------------- |
| id                     | UUID/string |                                          |
| user_id                | reference   | Owner.                                   |
| situation_id           | reference   | Optional link to a Life Admin situation. |
| title                  | string      |                                          |
| description            | string      |                                          |
| jurisdiction_id        | reference   |                                          |
| risk_level             | enum        | low, medium, high.                       |
| status                 | enum        | open, resolved, archived.                |
| created_at, updated_at | timestamps  |                                          |

### Document

A generated or uploaded document artifact.

| Attribute              | Type         | Notes                                           |
| ---------------------- | ------------ | ----------------------------------------------- |
| id                     | UUID/string  |                                                 |
| user_id                | reference    | Owner.                                          |
| case_id                | reference    | Optional case container.                        |
| template_id            | reference    | For generated documents.                        |
| title                  | `{ en, fr }` |                                                 |
| language               | `en` \| `fr` |                                                 |
| jurisdiction_id        | reference    |                                                 |
| status                 | enum         | draft, pending_review, final, exported, voided. |
| risk_level             | enum         | low, medium, high.                              |
| current_version_id     | reference    | Latest version.                                 |
| created_at, updated_at | timestamps   |                                                 |

### DocumentVersion

An immutable snapshot of a document.

| Attribute              | Type          | Notes                    |
| ---------------------- | ------------- | ------------------------ |
| id                     | UUID/string   |                          |
| document_id            | reference     |                          |
| version_number         | integer       |                          |
| answers_snapshot       | JSON/object   | Wizard answers used.     |
| rendered_content       | string/object | Generated document body. |
| template_version_id    | reference     | Exact template version.  |
| risk_acknowledgment    | boolean       | For high-risk templates. |
| created_by, created_at |               |                          |

### Evidence

A source item uploaded or captured by the user.

| Attribute        | Type        | Notes                                  |
| ---------------- | ----------- | -------------------------------------- |
| id               | UUID/string |                                        |
| user_id          | reference   | Owner.                                 |
| case_id          | reference   | Optional primary case.                 |
| title            | string      |                                        |
| description      | string      |                                        |
| source_type      | enum        | upload, capture, import, manual_entry. |
| original_file_id | string      | Reference to stored original.          |
| mime_type        | string      |                                        |
| file_size        | integer     | Bytes.                                 |
| original_hash    | string      | e.g., SHA-256.                         |
| captured_at      | timestamp   | When the document/event occurred.      |
| uploaded_at      | timestamp   | When ingested.                         |
| sensitivity      | enum        | normal, sensitive, highly_sensitive.   |
| status           | enum        | active, deleted_pending, purged.       |

### EvidenceInterpretation

Machine-generated analysis of an evidence item.

| Attribute       | Type           | Notes                                                                                                          |
| --------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| id              | UUID/string    |                                                                                                                |
| evidence_id     | reference      |                                                                                                                |
| type            | enum           | summary, dates, parties, amounts, obligations, deadlines, claims, contradiction, missing_evidence, chronology. |
| content         | JSON/object    | Structured output.                                                                                             |
| confidence      | enum or number | high, medium, low / 0–1.                                                                                       |
| model_metadata  | object         | model, provider, version.                                                                                      |
| generated_at    | timestamp      |                                                                                                                |
| user_correction | string/object  | Optional user override.                                                                                        |

### PersonOrganization

A party in a user's cases or evidence.

| Attribute    | Type        | Notes                                                                      |
| ------------ | ----------- | -------------------------------------------------------------------------- |
| id           | UUID/string |                                                                            |
| user_id      | reference   | Owner.                                                                     |
| display_name | string      |                                                                            |
| type         | enum        | individual, organization, government_agency, business.                     |
| role         | enum        | employer, landlord, tenant, service_provider, counterparty, agency, other. |
| contact_info | object      | Encrypted; optional.                                                       |

### Event

A discrete occurrence in a case timeline.

| Attribute           | Type        | Notes                                     |
| ------------------- | ----------- | ----------------------------------------- |
| id                  | UUID/string |                                           |
| case_id             | reference   |                                           |
| event_date          | date        | Best-known date.                          |
| date_precision      | enum        | exact, month, year, approximate, unknown. |
| description         | string      |                                           |
| linked_evidence_ids | list        |                                           |
| linked_document_ids | list        |                                           |
| source              | enum        | user, document, evidence_interpretation.  |
| created_at          | timestamp   |                                           |

### Task

A concrete action for the user.

| Attribute    | Type        | Notes                                |
| ------------ | ----------- | ------------------------------------ |
| id           | UUID/string |                                      |
| user_id      | reference   | Owner.                               |
| case_id      | reference   | Optional.                            |
| situation_id | reference   | Optional.                            |
| title        | string      |                                      |
| description  | string      |                                      |
| status       | enum        | pending, in_progress, done, skipped. |
| due_date     | date        | Optional.                            |
| priority     | enum        | low, normal, high.                   |
| source       | enum        | workflow_generated, user_created.    |

### Deadline

A date by which something must be done.

| Attribute | Type        | Notes                                            |
| --------- | ----------- | ------------------------------------------------ |
| id        | UUID/string |                                                  |
| case_id   | reference   |                                                  |
| name      | string      |                                                  |
| due_date  | date        |                                                  |
| type      | enum        | statutory, contractual, user_defined, suggested. |
| authority | string      | Source of the deadline.                          |
| status    | enum        | upcoming, due_soon, overdue, completed.          |

### Rule / KnowledgeItem

A vetted piece of knowledge.

| Attribute        | Type         | Notes                            |
| ---------------- | ------------ | -------------------------------- |
| id               | UUID/string  |                                  |
| jurisdiction_id  | reference    |                                  |
| life_event_keys  | list         |                                  |
| topic            | string       |                                  |
| statement        | `{ en, fr }` | Plain-language summary.          |
| source           | string       | Statute, agency, court, etc.     |
| source_url       | string       |                                  |
| effective_date   | date         |                                  |
| last_reviewed_at | timestamp    |                                  |
| review_status    | enum         | valid, needs_review, superseded. |
| superseded_by_id | reference    |                                  |

### AIAnalysis

A machine-generated reasoning artifact.

| Attribute         | Type           | Notes                                     |
| ----------------- | -------------- | ----------------------------------------- |
| id                | UUID/string    |                                           |
| user_id           | reference      |                                           |
| context_type      | enum           | chat_turn, situation, evidence, document. |
| context_id        | reference      |                                           |
| prompt_summary    | string         | High-level description, no PII.           |
| output            | JSON/object    | Structured result.                        |
| grounding_sources | list           | KnowledgeItem IDs used.                   |
| model_metadata    | object         |                                           |
| confidence        | enum or number |                                           |
| generated_at      | timestamp      |                                           |

---

## Multi-tenancy and ownership

- Every entity except canonical reference data (Jurisdiction, LifeEvent, Rule) is owned by a `user_id`.
- Future helper/family access is modelled as explicit sharing records (not shown here), not as organization tenancy.
- Row-level access control filters all queries by the owning user or explicitly granted viewers.

---

## Audit concepts

- Every meaningful mutation creates an audit event.
- Audit events are append-only from the user's perspective.
- Audit events reference actor, action, resource, and timestamp but do not store message bodies or evidence content.
