# Evidence Workflows

## Purpose

The Personal Evidence Locker helps users preserve, organize, and use evidence for personal administrative situations. These workflows describe the user journey and system responsibilities.

---

## Universal evidence workflow

```text
Capture / upload / import evidence
              │
              ▼
Ingest and validate
              │
              ▼
Record metadata and compute integrity hash
              │
              ▼
Organize (case, people, events, tags)
              │
              ▼
Optionally request AI analysis
              │
              ▼
Review AI interpretations and add notes
              │
              ▼
Build timeline
              │
              ▼
Use in Life Admin / Document Generation
              │
              ▼
Export package
              │
              ▼
Delete or archive (per retention policy)
```

---

## Workflow 1: Capture evidence

### Trigger

User has a document, photo, email, screenshot, or other record they want to preserve.

### Steps

1. **Choose capture method.**
   - Upload file from device.
   - Take a photo with mobile camera.
   - Paste from clipboard (screenshots).
   - Forward an email (future).
   - Type a manual note.
2. **Provide initial metadata.**
   - Title and optional description.
   - Date of the document/event.
   - Associated case/situation (existing or new).
   - Associated people/organizations.
   - Category and tags.
3. **Ingest.**
   - System validates file type and size.
   - System computes SHA-256 hash of the original file.
   - System stores the original file immutably.
   - System records capture method, timestamp, and provenance.

`PEL-REQ-053`: The original file SHALL be stored in an unmodified form immediately after validation.

`PEL-REQ-054`: The system SHALL reject dangerous file types and SHALL scan for malware where feasible.

---

## Workflow 2: Organize evidence into a case/situation

### Trigger

User wants to group related evidence around a matter (e.g., job loss, tenancy dispute).

### Steps

1. **Create or select a case.**
   - Title, jurisdiction, description.
   - Optionally link to a Life Admin situation.
2. **Add evidence items.**
   - From the case view, user selects existing evidence or captures new evidence.
   - Each item is linked to the case.
3. **Add people/organizations.**
   - User names the parties (employer, landlord, service provider).
   - The system stores contact info if provided.
4. **Add tags and categories.**
   - Pre-defined categories: contract, lease, correspondence, receipt, photo, etc.
   - User-defined tags for personal organization.
5. **Set sensitivity.**
   - Normal, sensitive, highly sensitive.
   - Highly sensitive items trigger additional access controls and opt-in for AI analysis.

`PEL-REQ-055`: Evidence SHALL be linkable to multiple cases without duplicating the original file.

`PEL-REQ-056`: Sensitivity labels SHALL be set at ingestion and SHALL be editable by the user.

---

## Workflow 3: AI analysis of evidence (optional)

### Trigger

User wants help understanding what a document says or what evidence may be missing.

### Steps

1. **Request analysis.**
   - User selects one or more evidence items from a case.
   - System confirms language and purpose.
   - If any item is marked highly sensitive, the system asks for explicit consent.
2. **System performs analysis.**
   - System sends data to an AI service in a privacy-minimizing way (server-side, no PII beyond what is necessary, no evidence content unless consented).
   - AI extracts or summarizes dates, parties, amounts, obligations, deadlines, claims, contradictions, and missing evidence.
3. **Store interpretations.**
   - Each AI output is stored as an `EvidenceInterpretation` with confidence, model metadata, and timestamp.
   - Interpretations are linked to the evidence items but kept separate from originals.
4. **User reviews.**
   - User sees suggested dates, parties, etc.
   - User can confirm, edit, or dismiss each suggestion.
   - Corrections are stored as user annotations.

`PEL-REQ-057`: AI analysis SHALL be opt-in and SHALL require explicit consent for highly sensitive evidence.

`PEL-REQ-058`: AI interpretations SHALL be stored separately from primary evidence and SHALL include confidence and model metadata.

`PEL-REQ-059`: The user SHALL be able to correct or dismiss every AI interpretation.

---

## Workflow 4: Build a timeline

### Trigger

User wants to see the chronological order of events in a case.

### Steps

1. **System suggests timeline.**
   - From evidence dates, AI-extracted dates, and user notes.
   - Each event shows: description, date, date precision, linked evidence, source.
2. **User edits.**
   - Add, remove, reorder, or edit events.
   - Mark date precision (exact, approximate, month/year only, unknown).
   - Link evidence items and documents.
   - Add notes.
3. **Export timeline.**
   - As part of a case package or standalone PDF.
   - Includes source references and disclaimer.

`PEL-REQ-060`: The system SHALL support a chronological timeline view with date uncertainty indicators.

`PEL-REQ-061`: Timeline exports SHALL distinguish between confirmed user-entered facts and AI-inferred dates.

---

## Workflow 5: Use evidence in a document or situation

### Trigger

User is generating a document or reviewing a Life Admin situation and wants to cite supporting evidence.

### Steps

1. **Reference evidence.**
   - In Document Generation, the user links an evidence item to a fact or answer.
   - In Life Admin, the user marks evidence as supporting a step or task.
2. **System records the link.**
   - The generated document metadata includes evidence references.
   - The situation/task notes the evidence.
3. **User can view the evidence from the document/situation.**

`PEL-REQ-062`: Evidence links SHALL be stored as metadata and SHALL be included in exports.

`PEL-REQ-063`: The system SHALL not automatically insert evidence content into documents without user review.

---

## Workflow 6: Export an evidence package

### Trigger

User wants to hand evidence to a lawyer, landlord, tribunal, or regulator.

### Steps

1. **Select export scope.**
   - Single item, entire case, or custom selection.
2. **Choose format.**
   - ZIP with originals + metadata + manifest;
   - PDF summary report;
   - Professional handoff report (future).
3. **Configure options.**
   - Include/exclude AI interpretations;
   - Include/exclude user annotations;
   - Redact sensitive metadata if desired.
4. **Generate package.**
   - System includes integrity manifest (hashes, provenance, timestamps).
   - System adds disclaimer that the package is user-provided, not court-certified.
   - System logs export event.
5. **Download or share.**
   - User downloads the package.
   - Future: secure share link with expiration.

`PEL-REQ-064`: Evidence packages SHALL include an integrity manifest and a disclaimer.

`PEL-REQ-065`: Exports SHALL be logged in the audit trail.

`PEL-REQ-066`: AI interpretations SHALL be separated from originals in the export unless the user explicitly includes them.

---

## Workflow 7: Delete or archive

### Steps

1. **User selects item/case/account for deletion.**
2. **System shows what will be deleted and offers export before deletion.**
3. **Soft delete.**
   - Item/case is hidden and marked deleted.
   - Recovery window is available (duration defined in retention policy).
4. **Permanent delete.**
   - After recovery window, original files, metadata, and interpretations are permanently erased per retention policy.
   - Audit logs required for compliance/security may be retained in anonymized form.

`PEL-REQ-067`: Deletion SHALL require explicit confirmation and SHALL offer export before deletion.

`PEL-REQ-068`: Soft-deleted items SHALL be recoverable within the defined recovery window.

---

## System responsibilities across all workflows

`PEL-REQ-069`: The system SHALL preserve the original uploaded file in an unmodified state.

`PEL-REQ-070`: The system SHALL compute and store a cryptographic hash for every original file.

`PEL-REQ-071`: The system SHALL maintain an append-only audit trail for every meaningful action on evidence.

`PEL-REQ-072`: The system SHALL keep AI-generated interpretations logically and visually separate from primary evidence.

`PEL-REQ-073`: The system SHALL support search across evidence metadata, annotations, tags, and extracted text, indicating the source of each match.

`PEL-REQ-074`: The system SHALL enforce access controls so that only the owning user and explicitly invited helpers can view evidence.
