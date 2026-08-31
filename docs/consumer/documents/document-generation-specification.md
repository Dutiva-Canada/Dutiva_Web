# Document Generation Specification

## Purpose

This document specifies the conceptual template format and generation process for Canadian Document Generation. It is designed to produce deterministic, reproducible, bilingual documents from structured inputs.

The specification is inspired by Dutiva's Document Studio model (`src/features/app/documents/data/types.ts`) but adapted for consumer documents.

---

## Template structure

A document template is a declarative definition consisting of:

```text
Template
├── metadata
│   ├── id, tid, key
│   ├── category
│   ├── name (en/fr)
│   ├── description (en/fr)
│   ├── jurisdictions_supported
│   ├── risk_level
│   ├── review_status
│   ├── version
│   ├── effective_date
│   └── statutory_references[]
├── questions[]
│   └── id, section (en/fr), label (en/fr), type, required, placeholder, hint, options, validation
├── preview_blocks[]
│   └── type, text (en/fr), heading (en/fr), n, roles, lines, tone, when
└── clause_gates
    └── juris, min_headcount, answer, union, etc.
```

`DSPEC-REQ-001`: Every template SHALL include all required metadata fields.

`DSPEC-REQ-002`: Every template SHALL include at least one question and one preview block.

`DSPEC-REQ-003`: Every template SHALL include the standing disclaimer in its preview blocks.

---

## Metadata fields

| Field                     | Description                          | Bilingual       |
| ------------------------- | ------------------------------------ | --------------- |
| `id`                      | Stable UUID/slug                     | no              |
| `tid`                     | Display id (e.g., `C01`)             | no              |
| `key`                     | Stable code for lookups              | no              |
| `category`                | Category slug from document taxonomy | no              |
| `name`                    | Display name                         | yes (`{en,fr}`) |
| `description`             | Short description and limitations    | yes             |
| `jurisdictions_supported` | Array of jurisdiction codes          | no              |
| `risk_level`              | `low` / `medium` / `high`            | no              |
| `review_status`           | review status enum                   | no              |
| `version`                 | Semantic version or integer          | no              |
| `effective_date`          | ISO date                             | no              |
| `deprecated_at`           | Optional ISO date                    | no              |
| `statutory_references`    | Citations used by the template       | yes             |
| `disclaimer`              | Default disclaimer text              | yes             |

---

## Question schema

```text
{
  id: string,
  section: { en: string, fr: string },
  label: { en: string, fr: string },
  type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'radio' | 'checkbox' | 'address' | 'email' | 'phone',
  required: boolean,
  placeholder?: { en: string, fr: string },
  hint?: { en: string, fr: string },
  options?: [
    { value: string, label: { en: string, fr: string } }
  ],
  validation?: {
    maxLength?: number,
    minLength?: number,
    pattern?: string,
    min?: number,
    max?: number
  },
  when?: ClauseGate
}
```

`DSPEC-REQ-004`: Question IDs SHALL be stable within a template version.

`DSPEC-REQ-005`: Required questions SHALL block advancement and finalization if unanswered.

`DSPEC-REQ-006`: Validation errors SHALL be displayed in the user's selected language.

---

## Preview block types

| Type     | Purpose                           | Example fields             |
| -------- | --------------------------------- | -------------------------- |
| `title`  | Document title                    | `text`                     |
| `meta`   | Date, recipient, sender block     | `text`                     |
| `para`   | Body paragraph                    | `text`                     |
| `clause` | Numbered clause or section        | `text`, `n`, `heading`     |
| `sig`    | Signature block                   | `roles`                    |
| `ack`    | Acknowledgment / checkbox         | `text`, `roles`            |
| `note`   | Callout / warning / info box      | `text`, `tone`             |
| `fill`   | Prompt the reader answers by hand | `heading`, `text`, `lines` |

`DSPEC-REQ-007`: Preview blocks SHALL be ordered as they appear in the final document.

`DSPEC-REQ-008`: Conditional blocks SHALL use a `ClauseGate` to determine visibility.

---

## Merge tokens

Text in preview blocks MAY contain merge tokens. Tokens are replaced deterministically from question answers and computed context.

Common tokens:

| Token                   | Source                                                   |
| ----------------------- | -------------------------------------------------------- |
| `{{user_name}}`         | User profile or question answer                          |
| `{{user_address}}`      | Question answer                                          |
| `{{user_email}}`        | User profile or question answer                          |
| `{{today}}`             | System current date, formatted by locale                 |
| `{{jurisdiction}}`      | Confirmed jurisdiction display name                      |
| `{{recipient_name}}`    | Question answer                                          |
| `{{recipient_address}}` | Question answer                                          |
| `{{case_title}}`        | Linked case title                                        |
| `{{statute_name}}`      | Jurisdiction-specific statute name from vetted knowledge |
| `{{custom_field_id}}`   | Answer to a question with matching `id`                  |

`DSPEC-REQ-009`: Merge tokens SHALL be resolved before finalization. Unresolved tokens SHALL block finalization.

`DSPEC-REQ-010`: Merge-token resolution SHALL be deterministic: the same answers and context SHALL always produce the same resolved text.

`DSPEC-REQ-011`: The system SHALL support bilingual merge-token output (e.g., `{{jurisdiction}}` resolves to the French name in a French document).

---

## ClauseGate

A `ClauseGate` determines whether a preview block renders. All present conditions must be true.

```text
{
  juris?: 'ON' | 'QC' | 'FED' | ... ,  // single jurisdiction or list
  answer?: { id: string, equals: string[] },
  // future gates as needed
}
```

`DSPEC-REQ-012`: `ClauseGate` SHALL be evaluated deterministically from structured answers and context.

`DSPEC-REQ-013`: An LLM SHALL NOT decide whether a clause renders.

`DSPEC-REQ-014`: For the template-detail preview (before answers are supplied), conditional blocks SHOULD render to show the full capability of the template, unless the gate would make the preview misleading.

---

## Statutory references

`DSPEC-REQ-015`: Statutory references SHALL be stored as structured objects:

```text
{
  title: { en: string, fr: string },
  jurisdiction: string,
  section?: string,
  url?: string,
  effective_date: string,
  review_status: 'valid' | 'needs_review' | 'superseded'
}
```

`DSPEC-REQ-016`: A template SHALL NOT reference a knowledge item marked `needs_review` or `superseded` as authoritative.

`DSPEC-REQ-017`: Statute names in generated documents SHALL match the document's language (e.g., French statute name for a French document in Québec).

---

## Bilingual documents

`DSPEC-REQ-018`: Every template SHALL have a complete French equivalent.

`DSPEC-REQ-019`: The user SHALL select the output language before generation. The selected language SHALL apply to all preview blocks, merge-token resolution, statutory references, and the disclaimer.

`DSPEC-REQ-020`: A generated document SHALL be monolingual; English and French SHALL NOT be mixed in the same document except for bilingual proper names, official titles, or statutory references.

`DSPEC-REQ-021`: Date, currency, and address formatting SHALL follow the selected locale (`en-CA` or `fr-CA`).

---

## Document generation process

```text
1. Select template
2. Confirm jurisdiction and language
3. Initialize generation session
4. Present questions step-by-step
5. Validate answers
6. Resolve merge tokens
7. Evaluate ClauseGates
8. Render preview blocks to document model
9. Inject disclaimer
10. User review and acknowledgment
11. Create immutable DocumentVersion
12. Save Document
13. Export / download
14. Record audit events
```

`DSPEC-REQ-022`: Each generation SHALL be associated with a `generation_session` or equivalent that autosaves answers.

`DSPEC-REQ-023`: The preview SHALL update live as the user answers questions.

`DSPEC-REQ-024`: Finalization SHALL require a valid review step and, for high-risk templates, explicit acknowledgment.

---

## Versioning

`DSPEC-REQ-025`: Every saved/generated document SHALL be tied to the exact template version used at creation.

`DSPEC-REQ-026`: Subsequent template updates SHALL NOT retroactively change existing documents.

`DSPEC-REQ-027`: The document version SHALL record the template version, answer snapshot, and rendered output.

`DSPEC-REQ-028`: The user MAY create a new version from the same or an updated template.

---

## Output formats

`DSPEC-REQ-029`: The generation engine SHALL support, at minimum:

- on-screen preview (HTML or equivalent);
- PDF export;
- plain-text export.

`DSPEC-REQ-030`: Future formats MAY include Word (DOCX) and accessible tagged PDF.

`DSPEC-REQ-031`: Exported documents SHALL include the disclaimer, metadata, and an export identifier.

`DSPEC-REQ-032`: Exported PDFs SHOULD include accessible structure (headings, lists, language attribute) where feasible.

---

## Validation rules

`DSPEC-REQ-033`: Before finalization, the system SHALL validate:

- all required questions answered;
- all answers pass per-question validation;
- no unresolved merge tokens remain;
- jurisdiction is confirmed or the document is explicitly jurisdiction-neutral;
- risk/review acknowledgment is recorded for high-risk templates;
- disclaimer is present in the rendered output.

`DSPEC-REQ-034`: Validation errors SHALL name the field and explain how to fix it, in the user's selected language.

---

## Audit events

`DSPEC-REQ-035`: The system SHALL record, at minimum:

- `template_opened`;
- `generation_started`;
- `draft_saved`;
- `document_created`;
- `version_created`;
- `risk_acknowledged` (for high-risk templates);
- `document_exported`;
- `document_deleted` / `document_archived`.

`DSPEC-REQ-036`: Audit events SHALL include actor, timestamp, document/template identifiers, and format (for exports), but SHALL NOT include PII or message bodies.
