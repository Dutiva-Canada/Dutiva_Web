# Evidence Integrity

## Purpose

The Personal Evidence Locker must preserve the trustworthiness of user evidence. This document defines the conceptual requirements for original-file preservation, metadata, hashing, versioning, chain-of-custody, audit history, provenance, and the separation of source evidence from interpretation.

---

## Core integrity principles

1. **Immutability of originals.** The uploaded or captured file is stored in an unmodified form and never overwritten.
2. **Verifiability.** Every original file has a cryptographic hash stored with its metadata.
3. **Provenance.** The system records where evidence came from, when it was captured or uploaded, and by what method.
4. **Auditability.** Every meaningful action is logged in an append-only audit trail.
5. **Separation.** AI-generated interpretations and user annotations are kept distinct from the primary evidence.
6. **Transparency.** Users can see integrity metadata and understand what the system does and does not guarantee.

---

## Original-file preservation

`INT-REQ-001`: The system SHALL store the original file bit-for-bit without modification.

`INT-REQ-002`: The original file SHALL be immutable: updates, rotations, redactions, or other modifications SHALL create derivative files, not replace the original.

`INT-REQ-003`: The original file SHALL be referenced by a stable `original_file_id` that does not change if the file's metadata or relationships change.

`INT-REQ-004`: The system SHALL store the original file in a secure, access-controlled object store with encryption at rest.

`INT-REQ-005`: The original file SHALL be retrievable by the owning user at any time during the retention period.

---

## Metadata

`INT-REQ-006`: Every evidence item SHALL store the following metadata:

| Field | Purpose |
|---|---|
| `id` | Stable item identifier |
| `user_id` | Owner |
| `original_file_id` | Reference to stored original |
| `original_filename` | Name at time of upload |
| `mime_type` | Detected or declared content type |
| `file_size` | Size in bytes |
| `original_hash` | SHA-256 hash of the original file |
| `source_type` | upload, capture, import, manual_entry |
| `capture_method` | camera, scanner, file_picker, email_import, etc. |
| `captured_at` | Best-known date/time the record depicts |
| `uploaded_at` | Ingestion timestamp |
| `provenance` | Free-text or structured source note |
| `sensitivity` | normal, sensitive, highly_sensitive |
| `status` | active, deleted_pending, purged |

`INT-REQ-007`: Metadata SHALL be stored in a durable, access-controlled database.

`INT-REQ-008`: Metadata updates (title, description, tags, case links) SHALL NOT alter the original file or its hash.

---

## Hashing

`INT-REQ-009`: The system SHALL compute a SHA-256 hash of the original file at ingestion time.

`INT-REQ-010`: The hash SHALL be stored in the evidence metadata.

`INT-REQ-011`: The system SHOULD re-verify the hash whenever the original file is read for preview, download, or export.

`INT-REQ-012`: If hash verification fails, the system SHALL:

- refuse to serve the file;
- log the integrity failure;
- notify the user and support;
- initiate recovery from backup if available.

`INT-REQ-013`: Derivative files (thumbnails, OCR text, redacted copies) SHALL record the original file's hash and the transformation applied.

---

## Versioning

`INT-REQ-014`: The original file is version 1 and never changes. New versions of a file are separate evidence items or clearly identified derivatives.

`INT-REQ-015`: If the user uploads a revised version of a document (e.g., a corrected letter), the system SHALL create a new evidence item rather than overwriting the original.

`INT-REQ-016`: The user MAY link related evidence items (e.g., original and revised letter) to indicate versioning.

`INT-REQ-017`: Generated documents are versioned separately under the `DocumentVersion` model.

---

## Chain-of-custody considerations

`INT-REQ-018`: The system SHALL maintain a provenance chain for each evidence item:

- source (who/what provided it);
- ingestion method and timestamp;
- original hash;
- subsequent accesses, exports, and deletions.

`INT-REQ-019`: The provenance chain SHALL be available to the user as part of the evidence detail and export package.

`INT-REQ-020`: The system SHALL NOT claim court-certified chain-of-custody; it SHALL provide user-level provenance and integrity metadata with a clear disclaimer.

---

## Audit history

`INT-REQ-021`: The system SHALL maintain an append-only audit history per evidence item recording:

- create;
- view / preview;
- download / export;
- metadata edit (title, description, tags, sensitivity);
- link/unlink to case, event, document, person;
- AI analysis request and result;
- user annotation or correction;
- deletion (soft delete and permanent delete).

`INT-REQ-022`: Each audit entry SHALL include actor, action, timestamp, and affected fields or resulting state.

`INT-REQ-023`: Audit entries SHALL be append-only from the user's perspective. Operational deletion of old audit records SHALL follow the retention policy and be itself audited.

`INT-REQ-024`: Audit history SHALL be accessible to the owning user and, with appropriate authorization, support/security staff.

---

## Provenance

`INT-REQ-025`: Provenance information SHALL include:

- source type and description;
- capture/upload method;
- device or platform information if relevant (without tracking identifiers beyond what is necessary);
- date/time of capture or upload;
- identity of the uploader (for shared or helper-uploaded evidence);
- any import source identifier (e.g., email message ID, cloud file ID — future).

`INT-REQ-026`: Provenance SHALL be immutable except to correct obvious errors by authorized staff, with the correction logged.

---

## User annotations

`INT-REQ-027`: Users MAY add annotations (notes, highlights, comments) to evidence items.

`INT-REQ-028`: Annotations SHALL be stored separately from the original file.

`INT-REQ-029`: Annotations SHALL be included in exports only if the user chooses.

`INT-REQ-030`: Annotations SHALL be attributed to the user who created them and timestamped.

---

## AI-generated interpretation separation

`INT-REQ-031`: AI-generated interpretations (summaries, extracted dates, parties, amounts, contradictions) SHALL be stored in a separate logical layer from primary evidence.

`INT-REQ-032`: Each interpretation SHALL be linked to the evidence item by ID but SHALL NOT be embedded into the original file.

`INT-REQ-033`: Interpretations SHALL include:

- type of interpretation;
- generated content;
- confidence level;
- model/provider/version metadata;
- generated-at timestamp;
- user correction (if any).

`INT-REQ-034`: Interpretations SHALL be visually and programmatically distinguishable from primary evidence.

`INT-REQ-035`: Exports SHALL separate originals, annotations, and interpretations unless the user explicitly merges them.

---

## Integrity manifest for exports

`INT-REQ-036`: Evidence exports SHALL include a manifest file with:

- export identifier;
- export timestamp;
- list of included evidence items;
- per-item hash (algorithm and value);
- per-item provenance summary;
- included annotations and interpretations (if any);
- disclaimer that the export is user-provided and not court-certified.

`INT-REQ-037`: A recipient with the manifest SHALL be able to verify that each file matches its recorded hash.

---

## Tamper detection

`INT-REQ-038`: The system SHALL detect and log integrity failures (hash mismatch, unauthorized access attempt, unexpected modification).

`INT-REQ-039`: Integrity failures SHALL trigger an alert to operations and, if appropriate, the affected user.

---

## Limitations and disclaimers

`INT-REQ-040`: The system SHALL clearly communicate that it provides user-level evidence management and integrity metadata, not court-certified chain-of-custody or admissibility guarantees.

`INT-REQ-041`: Export disclaimers SHALL state that admissibility depends on the court, tribunal, or agency's rules and on the user's ability to authenticate the evidence.

---

## Requirements trace

- `PEL-REQ-012` to `PEL-REQ-022` — original preservation, metadata, hashing, versioning, audit, provenance, annotations, interpretation separation.
- `PEL-REQ-035` to `PEL-REQ-043` — interpretation layer, confidence, model metadata.
- `PEL-REQ-064` to `PEL-REQ-066` — export integrity manifest.
