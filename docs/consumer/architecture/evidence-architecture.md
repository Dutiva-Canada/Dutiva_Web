# Evidence Architecture

## Purpose

The Personal Evidence Locker stores, organizes, and preserves evidence for personal administrative matters. Its architecture must make the separation between **primary evidence** and **machine-generated interpretation** irreversible at the storage and UI layers.

---

## Core principles

1. **Original preservation first.** The uploaded file is never modified.
2. **Interpretation is metadata, not truth.** AI-generated summaries, extractions, and analyses are stored separately and labeled.
3. **User control.** The user owns the evidence, can correct interpretations, and can delete data.
4. **Auditability.** Every action on evidence is logged.
5. **Security.** Evidence is encrypted at rest and in transit, access-controlled, and never used for advertising or model training.

---

## Logical components

### Ingestion

- **Upload service** accepts files, validates type/size, and stores originals.
- **Capture service** handles mobile camera/scanner input and produces a normalized file with metadata.
- **Manual entry** lets users type notes or summaries.
- **Import connectors** (future) import from email or cloud storage with explicit user authorization.

### Storage

- **Original object store** holds immutable original files, keyed by hash and user ID.
- **Metadata store** holds structured metadata, links, and audit history.
- **Derivative store** holds redacted exports, thumbnails, and OCR text (if generated).

### Organization

- **Case / situation index** links evidence to a matter.
- **Entity index** links people and organizations to evidence.
- **Timeline builder** orders events and evidence by date.
- **Tagging and search** indexes user annotations, tags, and extracted text.

### Analysis

- **OCR / text extraction** (future) produces searchable text.
- **AI extraction** suggests dates, parties, amounts, obligations, deadlines, contradictions, and missing evidence.
- **Confidence scoring** attaches a confidence level to every machine-generated claim.

### Export

- **Single-item export** returns the original plus metadata.
- **Case package** returns originals, timeline, annotations, and an integrity manifest.
- **Professional handoff** produces a tamper-evident summary with a clear disclaimer.

---

## Primary evidence vs AI interpretation

### Primary evidence

- The original uploaded file.
- File metadata (name, size, MIME type, hash, timestamp).
- Ingestion provenance (source, method, capture timestamp).
- User annotations and notes.

### AI interpretation

- Summary of content.
- Extracted dates, parties, amounts, obligations, deadlines.
- Contradiction or missing-evidence flags.
- Suggested chronology.
- Confidence level and model metadata.
- User corrections (stored as additional annotations, not as replacements).

`PEL-REQ-035`: AI interpretation SHALL be stored in a separate logical layer from primary evidence.

`PEL-REQ-036`: The UI SHALL visually distinguish primary evidence from AI interpretation and SHALL show confidence and source for every interpretation.

`PEL-REQ-037`: Exported packages SHALL separate originals from interpretations unless the user explicitly requests a merged view.

---

## Integrity concepts

`PEL-REQ-038`: Every original file SHALL have a cryptographic hash computed at ingestion and stored with the metadata.

`PEL-REQ-039`: Any access to an original file for preview or export SHOULD verify the hash.

`PEL-REQ-040`: Derivatives (thumbnails, OCR text, redacted copies) SHALL reference the original file's hash and version.

`PEL-REQ-041`: Audit events SHALL be append-only per evidence item and SHALL record actor, action, timestamp, and any resulting state change.

`PEL-REQ-042`: The system SHALL support a "provenance chain" for each evidence item: source → ingestion → analysis → corrections → exports.

`PEL-REQ-043`: Chain-of-custody concepts (e.g., hash verification, audit trail, timestamps) SHALL be documented for users so they understand what the product does and does not guarantee.

---

## Security concepts

`PEL-REQ-044`: Original files SHALL be encrypted at rest with per-user or per-account keys.

`PEL-REQ-045`: Evidence metadata SHALL be encrypted at rest if it includes sensitive information.

`PEL-REQ-046`: All ingestion, preview, and export traffic SHALL be over TLS.

`PEL-REQ-047`: Access SHALL be restricted to the owning user and explicitly invited helpers; support/admin access SHALL be read-only and logged.

`PEL-REQ-048`: Evidence SHALL NOT be used to train third-party AI models without explicit user consent.

---

## AI analysis of evidence

`PEL-REQ-049`: AI analysis of evidence SHALL be opt-in per case or per item, with a clear explanation of what data is sent to the AI provider.

`PEL-REQ-050`: AI analysis SHALL NOT be performed on evidence from cases the user has marked as highly sensitive unless the user explicitly consents.

`PEL-REQ-051`: AI outputs SHALL be stored with model/provider/version metadata and SHALL NOT overwrite primary evidence.

`PEL-REQ-052`: The system SHALL let the user disable AI analysis entirely in account settings.

---

## Evidence lifecycle

1. **Capture** — user uploads/captures/imports.
2. **Ingest** — validation, malware scan, hash, metadata extraction.
3. **Organize** — user links to case/situation, people, events, tags.
4. **Analyze (optional)** — OCR, AI extraction, contradiction checks.
5. **Review/correct** — user reviews interpretations and adds notes.
6. **Use** — evidence is referenced in workflows, document generation, or timeline.
7. **Export** — user exports originals, summaries, or professional handoff packages.
8. **Delete** — soft delete with recovery window, then permanent deletion per retention policy.
