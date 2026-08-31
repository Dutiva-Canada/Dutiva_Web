# Canadian Document Generation — Product Definition

## Purpose

Canadian Document Generation helps individual Canadians create appropriate administrative documents from structured information. It is not a law firm and does not provide legal advice. The product's value is to reduce the friction of drafting routine correspondence and personal administrative documents while surfacing when a regulated professional is required.

---

## Core proposition

- **Template-driven**: every document is assembled from a vetted template, user answers, and jurisdiction-aware clauses.
- **User-reviewed**: the user sees a live preview, confirms facts, and acknowledges limitations before using the document.
- **Jurisdiction-aware**: clauses and wording vary by province/territory and by federal scope.
- **Bilingual**: every template ships in English and French; the generated document follows the user's chosen language.
- **Honest boundaries**: high-risk documents, documents requiring a professional signature, and documents that must be filed with a court or government body are either blocked or flagged for professional review.

---

## What it is

- A self-service tool for drafting personal administrative correspondence.
- A structured questionnaire that populates a document template.
- A document repository with versions, audit history, and export options.
- A complement to Canadian Life Admin and Personal Evidence Locker.

## What it is not

- **Not a law firm or legal representation service.** It does not create court pleadings, give legal advice, or act on a user's behalf.
- **Not an automated legal-signing authority.** It does not notarize, commission, or certify documents.
- **Not a filing service.** It does not submit documents to government agencies, courts, or tribunals.
- **Not a replacement for regulated professional advice** when the matter is high-risk or requires a professional's judgment.

---

## Document categories

Categories are illustrative. The exact catalogue will be defined in `documents/document-taxonomy.md` and built out by jurisdiction.

### Employment

- Resignation letter
- Request for Record of Employment
- Workplace accommodation request
- Response to a performance concern
- Reference request

### Housing

- Repair request to landlord
- Notice-related correspondence
- Documentation of a dispute
- Move-out inspection request

### Consumer

- Complaint letter
- Refund request
- Warranty correspondence
- Service cancellation request
- Escalation to regulator or ombudsman

### Government / administrative

- Information request
- Supporting statement
- Formal administrative correspondence

### Personal

- Authorization letter
- Records request
- Personal declaration
- Other routine administrative documents

---

## Template model

`CDG-REQ-001`: Every document template SHALL have the following metadata:

| Field                     | Description                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `id`                      | Stable identifier                                                                                                     |
| `category`                | Document category                                                                                                     |
| `name`                    | Bilingual display name (`{ en, fr }`)                                                                                 |
| `description`             | Bilingual short description of purpose and limits                                                                     |
| `jurisdictions_supported` | List of province/territory/federal codes the template supports                                                        |
| `risk_level`              | `low`, `medium`, `high`                                                                                               |
| `review_status`           | `not_reviewed`, `hr_review_required`, `lawyer_review_recommended`, `approved_for_use` (or consumer-equivalent states) |
| `version`                 | Template version                                                                                                      |
| `effective_date`          | When this version became effective                                                                                    |
| `deprecated_at`           | Optional deprecation date                                                                                             |
| `statutory_references`    | Sourced references used in the template                                                                               |
| `disclaimer`              | Bilingual disclaimer text, injected into every output                                                                 |

`CDG-REQ-002`: Template content SHALL be expressed as an ordered list of **preview blocks** (title, paragraph, clause, note, signature, fill area) with optional `ClauseGate` conditions.

`CDG-REQ-003`: Merge tokens (e.g., `{{user_name}}`, `{{today}}`, `{{jurisdiction}}`) SHALL be resolved from wizard answers and computed context, not generated by a language model.

`CDG-REQ-004`: Conditional clauses SHALL be rendered deterministically based on jurisdiction, answers, and other structured gates; an LLM SHALL NOT decide whether a clause appears.

---

## Structured inputs and variable fields

`CDG-REQ-005`: Each template SHALL declare its input schema:

- field id and type (`text`, `textarea`, `date`, `number`, `select`, `radio`, `checkbox`, `address`, `email`, `phone`);
- bilingual label, placeholder, and hint;
- required/optional;
- validation rules (length, format, range);
- jurisdiction-specific variations (e.g., province names, statutory names);
- help text that explains why the question is asked.

`CDG-REQ-006`: The system SHALL validate inputs before generating a preview and SHALL highlight missing or invalid fields.

`CDG-REQ-007`: The system SHALL NOT allow a document to be finalized with unfilled required merge fields.

---

## Jurisdiction-specific variations

`CDG-REQ-008`: A template SHALL support per-jurisdiction differences in:

- statutory names and citations;
- notice or deadline wording (structure only — no figures without source);
- required clauses;
- prohibited clauses;
- address and salutation conventions.

`CDG-REQ-009`: Where a jurisdiction is not supported for a template, the system SHALL explain that limitation and offer a jurisdiction-neutral alternative or escalation to a professional.

---

## Document validation

`CDG-REQ-010`: Before a document is saved or exported, the system SHALL:

- confirm all required fields are filled;
- confirm no merge tokens remain unresolved;
- run a jurisdiction check against the user's selected province/territory/federal scope;
- flag any `high` risk document for user acknowledgment;
- inject the standing disclaimer.

---

## Citations and evidence

`CDG-REQ-011`: A document MAY include a statutory reference section. Any reference SHALL be sourced from the vetted knowledge base, SHALL include the statute name, and SHALL NOT quote statutory figures unless they have been reviewed and marked as current.

`CDG-REQ-012`: Where a generated document refers to facts, the user SHALL be prompted to confirm those facts and, where possible, link supporting evidence from Personal Evidence Locker.

---

## User review requirements

`CDG-REQ-013`: The user SHALL review the full preview before finalizing.

`CDG-REQ-014`: The system SHALL display a plain-language summary of what the document does and does not do, and what the user should do next.

`CDG-REQ-015`: For `high` risk or `lawyer_review_recommended` templates, the system SHALL require an explicit acknowledgment that the document does not replace professional advice before export.

---

## Versioning and generated-document metadata

`CDG-REQ-016`: Every saved/generated document SHALL be versioned. Old documents SHALL remain tied to the template version used at creation.

`CDG-REQ-017`: Generated-document metadata SHALL include:

- template id and version;
- user account;
- jurisdiction selected;
- language;
- creation and modification timestamps;
- answers snapshot;
- export history.

---

## Bilingual EN/FR support

`CDG-REQ-018`: Every template and generated document SHALL be available in English and French.

`CDG-REQ-019`: The language of a generated document SHALL be selectable and SHALL match the user's chosen locale.

`CDG-REQ-020`: French legal terminology SHALL be reviewed for Québec appropriateness; machine translation SHALL NOT be used without human review.

---

## Disclaimers

`CDG-REQ-021`: Every generated document SHALL include a visible, non-removable disclaimer that:

- the product is not a law firm;
- the document is based on the user's answers and the selected jurisdiction;
- the document does not constitute legal advice;
- the user should consult a qualified professional before relying on it for high-stakes matters.

---

## Prohibited document categories

`CDG-REQ-022`: The system SHALL NOT generate the following unless and until a qualified legal review process has approved them and the user has been explicitly warned:

- court pleadings, affidavits, or sworn statements;
- documents requiring notarization or commissioning;
- immigration or refugee applications;
- tax returns or tax filings;
- wills, powers of attorney, or estate documents;
- documents that purport to create, modify, or terminate legal rights without user understanding (e.g., releases, settlement agreements) — these are flagged for professional review;
- documents intended to deceive, harass, or defraud.

---

## Escalation rules

`CDG-REQ-023`: The system SHALL escalate to a qualified professional when:

- the user's answers indicate the matter is high-risk or litigious;
- the document category is marked `lawyer_review_recommended`;
- the user is unsure which jurisdiction applies;
- the document may affect legal rights or obligations in a way the user does not understand;
- the document must be filed with a court, tribunal, or government body.

---

## Output formats

`CDG-REQ-024`: The system SHALL support, at minimum:

- on-screen preview;
- PDF export;
- plain-text copy;
- Word export (future).

`CDG-REQ-025`: Exported documents SHOULD include an export identifier and a visible watermark/attribution line consistent with the product's export-protection policy.
