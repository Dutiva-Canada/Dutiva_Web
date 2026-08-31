# Evidence Model

## Purpose

This document defines the conceptual model for evidence in the Personal Evidence Locker: what evidence is, how it is ingested, organized, analyzed, and used.

---

## Core concepts

### Evidence item

The smallest unit of evidence: a single uploaded file, captured image, imported record, or manual note. An evidence item is immutable in its original form.

| Attribute          | Description                              |
| ------------------ | ---------------------------------------- |
| `id`               | Stable identifier.                       |
| `user_id`          | Owning user.                             |
| `title`            | User-provided or system-suggested title. |
| `description`      | User-provided notes.                     |
| `source_type`      | upload, capture, import, manual_entry.   |
| `original_file_id` | Reference to the stored original file.   |
| `mime_type`        | Detected MIME type.                      |
| `file_size`        | Size in bytes.                           |
| `original_hash`    | SHA-256 hash of original file.           |
| `captured_at`      | Date/time the record depicts (if known). |
| `uploaded_at`      | Date/time of ingestion.                  |
| `provenance`       | Source and method of acquisition.        |
| `sensitivity`      | normal, sensitive, highly_sensitive.     |
| `status`           | active, deleted_pending, purged.         |

### Case / situation

A container that groups related evidence items, documents, events, tasks, and deadlines around one administrative matter.

- A case is usually created by the user or suggested by a Life Admin situation.
- Evidence items can belong to multiple cases without duplicating the original file.

### Person / organization

A party linked to evidence or a case, such as an employer, landlord, service provider, or government agency.

### Event

A discrete occurrence with a date, description, and links to evidence and documents. Events form the timeline.

### Evidence interpretation

Machine-generated analysis of an evidence item, stored separately from the original. Examples: summary, extracted dates, parties, amounts, obligations, contradictions.

### Evidence link

A relationship between an evidence item and a case, event, document, person, or other evidence item. Links are metadata, not copies.

---

## Ingestion model

```text
Evidence source
      │
      ▼
Capture (camera, scanner, upload, import, manual entry)
      │
      ▼
Validation (type, size, malware scan)
      │
      ▼
Immutable original file storage
      │
      ▼
Metadata + hash recorded
      │
      ▼
Organization (case, people, tags, categories)
      │
      ▼
Optional analysis (OCR, AI extraction)
      │
      ▼
User review and correction
      │
      ▼
Use in workflows / export
```

---

## Evidence lifecycle states

| State             | Description                                                                            |
| ----------------- | -------------------------------------------------------------------------------------- |
| `active`          | Available to the user, linked to cases, searchable.                                    |
| `deleted_pending` | Soft-deleted; hidden from normal UI; recoverable within the recovery window.           |
| `purged`          | Permanently deleted per retention policy; metadata may be retained in audit logs only. |

---

## Relationships

```text
User 1:N Evidence
User 1:N Case
Case 1:N Event
Case 1:N Task
Case 1:N Deadline
Case N:M Evidence
Event N:M Evidence
Document N:M Evidence (as supporting material)
PersonOrganization N:M Evidence
PersonOrganization N:M Case
Evidence 1:N EvidenceInterpretation
Evidence 1:N UserAnnotation
```

---

## Metadata model

Every evidence item has core metadata and user-extensible metadata.

### Core metadata

- `id`
- `user_id`
- `title`
- `description`
- `source_type`
- `original_file_id`
- `mime_type`
- `file_size`
- `original_hash`
- `captured_at`
- `uploaded_at`
- `provenance`
- `sensitivity`
- `status`
- `created_at`
- `updated_at`

### User-extensible metadata

- `tags[]`
- `category`
- `case_ids[]`
- `event_ids[]`
- `person_ids[]`
- `document_ids[]`
- `custom_fields` (implementation-defined key/value store)

---

## Evidence types and handling

| Type                          | Examples                              | Handling notes                                                                                             |
| ----------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Document (PDF, Word, TXT)     | Contracts, letters, forms, statements | Preserve original; optional OCR; treat text extraction as interpretation.                                  |
| Image (JPEG, PNG, TIFF)       | Photos, screenshots, scans            | Preserve original; generate optional thumbnail; OCR in future.                                             |
| Audio / video (MP3, MP4, MOV) | Recordings, voicemails                | Store as reference; transcripts are interpretations; legal recording consent is the user's responsibility. |
| Email (EML, MSG — future)     | Correspondence                        | Preserve original; parse headers as metadata.                                                              |
| Manual note                   | Typed summary or observation          | Store as structured text; no original file; user is the source.                                            |

---

## Search and discovery

Evidence can be discovered through:

- full-text search over titles, descriptions, and user annotations;
- tag and category filters;
- case/situation filters;
- people/organization filters;
- date range filters;
- OCR-derived text (future);
- AI extraction content (labeled as interpretation, not primary evidence).

Search results SHALL indicate whether a match came from primary evidence or AI interpretation.

---

## AI analysis integration

When AI analysis is requested:

1. User selects evidence items and consents (especially for sensitive items).
2. System sends data to a server-side AI service in a privacy-minimizing way.
3. AI returns structured interpretations (dates, parties, amounts, etc.).
4. System stores each interpretation with confidence, model metadata, and timestamp.
5. User reviews and corrects.

All interpretations are stored separately from the original evidence.

---

## Export model

An export produces a package that may include:

- original evidence files;
- metadata and integrity manifest (hashes, provenance, timestamps);
- timeline;
- user annotations;
- AI interpretations (optional, user-controlled);
- disclaimer.

The integrity manifest SHALL allow a recipient to verify that files have not been altered since export.

---

## Privacy and access

- Evidence is owned by the user.
- Access by invited helpers is explicit, revocable, and logged.
- Support/admin access is read-only except under documented procedures and legal authorization.
- Highly sensitive evidence requires additional confirmation for AI analysis and sharing.

---

## Requirements trace

- `PEL-REQ-001` to `PEL-REQ-004` — evidence types and ingestion.
- `PEL-REQ-005` to `PEL-REQ-006` — organization.
- `PEL-REQ-007` to `PEL-REQ-008` and `PEL-REQ-049` to `PEL-REQ-052` — AI analysis.
- `PEL-REQ-012` to `PEL-REQ-018` and `PEL-REQ-035` to `PEL-REQ-043` — integrity and provenance.
- `PEL-REQ-025` to `PEL-REQ-027` and `PEL-REQ-064` to `PEL-REQ-066` — export.
- `PEL-REQ-028` to `PEL-REQ-029` and `PEL-REQ-067` to `PEL-REQ-068` — deletion.
