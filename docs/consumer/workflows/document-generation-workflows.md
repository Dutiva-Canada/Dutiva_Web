# Document Generation Workflows

## Purpose

Canadian Document Generation lets users create appropriate administrative documents from structured information. The workflow is designed to ensure the user understands the document's limits, reviews it carefully, and acknowledges when professional advice is needed.

---

## Universal document-generation workflow

```text
Select template
      │
      ▼
Confirm jurisdiction and language
      │
      ▼
Answer structured questions
      │
      ▼
Live preview updates
      │
      ▼
Risk / review gate
      │
      ▼
User review and edit
      │
      ▼
Save version
      │
      ▼
Export / download / share
      │
      ▼
Audit trail
```

---

## Step 1: Select template

- User browses or searches templates by category and jurisdiction.
- System shows only templates that support the user's confirmed province/territory/federal scope and language.
- Each template displays:
  - name and description (bilingual);
  - supported jurisdictions;
  - risk level;
  - estimated time to complete;
  - a clear statement of what the document does and does not do;
  - review status (e.g., `approved_for_use`, `lawyer_review_recommended`, `not_reviewed`).

`CDG-REQ-029`: The system SHALL NOT present a template as suitable for a jurisdiction it does not support.

`CDG-REQ-030`: The system SHALL display the template's risk level and review status before the user begins the wizard.

---

## Step 2: Confirm jurisdiction and language

- The system asks the user to confirm the jurisdiction that governs the document.
- The system asks the user to select the output language.
- If the jurisdiction is unknown or unsupported for the selected template, the system explains and suggests alternatives or escalation.

`CDG-REQ-031`: Jurisdiction-specific clauses SHALL be determined by the confirmed jurisdiction, not inferred from the user's profile alone.

`CDG-REQ-032`: The system SHALL warn if the selected jurisdiction differs from the user's default profile jurisdiction.

---

## Step 3: Answer structured questions

- The wizard presents questions in the order defined by the template.
- Questions may branch based on previous answers (`ClauseGate`-style conditions).
- Help text explains why the question is asked and what information is needed.
- The system validates inputs in real time.
- The user can save a draft and return later.

`CDG-REQ-033`: The system SHALL validate inputs against the template schema and SHALL block advancement on invalid or missing required fields.

`CDG-REQ-034`: The system SHALL explain validation errors in plain language and in the user's selected language.

`CDG-REQ-035`: The system SHALL allow the user to save a draft at any point.

---

## Step 4: Live preview

- As the user answers, the document preview updates in real time.
- The preview shows the rendered document with merge tokens resolved.
- Conditional clauses appear/disappear based on answers and jurisdiction.
- The preview includes the non-removable disclaimer.

`CDG-REQ-036`: The preview SHALL render the document exactly as it will be exported, including the disclaimer and any jurisdiction-specific clauses.

`CDG-REQ-037`: Unresolved merge tokens SHALL be visually highlighted and SHALL block finalization.

---

## Step 5: Risk / review gate

- Before finalization, the system checks the template risk level and the user's answers.
- For `medium` or `high` risk templates, the system presents a review screen:
  - summary of the document's purpose;
  - list of facts the user confirmed;
  - clear statement that the document is not legal advice;
  - recommendation to consult a professional if the situation is complex, disputed, or high-stakes;
  - checkbox or explicit acknowledgment required.

`CDG-REQ-038`: The system SHALL require explicit acknowledgment for `high` risk and `lawyer_review_recommended` templates.

`CDG-REQ-039`: The system SHALL record the acknowledgment in the document audit trail.

---

## Step 6: User review and edit

- The user can review the final document, edit answers, or regenerate.
- The user can link supporting evidence from Personal Evidence Locker.
- The user can add free-form notes that do not appear in the generated document.

`CDG-REQ-040`: The user SHALL be able to return to any wizard step from the review screen.

`CDG-REQ-041`: The system SHALL allow linking evidence items to specific facts in the generated document.

---

## Step 7: Save version

- On finalization, the system creates a saved document and an immutable version.
- The version includes:
  - rendered content;
  - answer snapshot;
  - template id and version;
  - jurisdiction and language;
  - timestamp;
  - risk level and acknowledgment.

`CDG-REQ-042`: Every saved/generated document SHALL have at least one immutable version.

`CDG-REQ-043`: The original template version SHALL be frozen for that document; later template updates SHALL NOT retroactively change existing documents.

---

## Step 8: Export / download / share

- The user can export the document as PDF, plain text, or Word (future).
- Exports include the disclaimer, metadata, and an export identifier.
- Export is rate-limited and logged.
- The user can share a document with a trusted helper or professional via a secure mechanism (future feature, if implemented, must be access-controlled and logged).

`CDG-REQ-044`: Exports SHALL include a visible disclaimer and an export identifier.

`CDG-REQ-045`: Exports SHALL be logged in the audit trail with format, timestamp, and actor.

---

## Step 9: Audit trail

- The system records:
  - template opened;
  - generation started;
  - draft saved;
  - document created;
  - version created;
  - risk acknowledgment;
  - document exported;
  - document deleted/archived.

`CDG-REQ-046`: The audit trail SHALL be append-only from the user's perspective.

---

## Prohibited-document workflow

For templates that require professional review or are prohibited:

1. The system detects the condition from answers or template metadata.
2. The system stops the generation workflow.
3. The system explains why the document cannot be generated and recommends the appropriate professional or resource.
4. The system logs the attempted generation and the reason for refusal.

`CDG-REQ-047`: The system SHALL NOT generate documents in prohibited categories without the required professional-review workflow and explicit warnings.

---

## Integration workflows

### From Life Admin

- A Life Admin situation can suggest one or more document templates.
- Selecting a template pre-fills jurisdiction and some answers based on confirmed facts.
- The user reviews and completes the wizard.

`SHARED-REQ-128`: Context from Life Admin SHALL be pre-filled as suggested answers, not locked-in values; the user SHALL be able to edit them.

### To Evidence Locker

- A generated document can be saved to the Evidence Locker as a generated document, linked to the relevant case/situation.

`SHARED-REQ-129`: Generated documents saved to Evidence Locker SHALL be labeled as user-generated documents, not source evidence.
