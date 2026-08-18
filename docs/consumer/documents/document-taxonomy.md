# Document Taxonomy

## Purpose

This document defines the categories of consumer document templates. The exact catalogue for each jurisdiction is defined separately. This taxonomy provides the organizing structure.

---

## Taxonomy rules

`DTAX-REQ-001`: Every document template SHALL belong to exactly one category.

`DTAX-REQ-002`: Categories SHALL be stable across releases; renaming a category requires a migration plan for saved documents.

`DTAX-REQ-003`: A template SHALL declare the jurisdictions it supports and SHALL NOT be offered for unsupported jurisdictions.

`DTAX-REQ-004`: A template SHALL declare a risk level (`low`, `medium`, `high`) and a review status.

`DTAX-REQ-005`: Prohibited document categories SHALL be clearly identified and SHALL require professional-review workflows before any template can be offered.

---

## Category tree

### Employment

Documents an employee or former employee might need.

| Template | Purpose | Typical risk | Notes |
|---|---|---|---|
| Resignation letter | Notify employer of resignation. | low | |
| Record of Employment request | Ask employer for ROE. | low | |
| Accommodation request | Request workplace accommodation. | medium | May involve health information; privacy warnings. |
| Pay / records request | Request pay statements, hours, or employment records. | low | |
| Reference request | Request a reference from a former employer. | low | |
| Response to performance concern | Reply to a performance warning. | medium | May suggest professional review if discipline is alleged. |

### Housing

Documents a tenant or landlord might need. The product is tenant-first, but landlord-to-tenant documents are included where routine and low-risk.

| Template | Purpose | Typical risk | Notes |
|---|---|---|---|
| Repair request | Ask landlord to make repairs. | low | Jurisdiction-specific repair obligations. |
| Move-out inspection request | Request a move-out inspection. | low | |
| Notice-related correspondence | Respond to or give notices required by local law. | medium | Notices can have legal effect; flagged. |
| Dispute documentation letter | Document a problem in writing. | low/medium | |
| Roommate / sublet request | Request landlord consent. | medium | Varies by lease and jurisdiction. |

### Consumer

Documents a consumer might send to a business or regulator.

| Template | Purpose | Typical risk | Notes |
|---|---|---|---|
| Complaint letter | Complain about a product or service. | low/medium | |
| Refund request | Request a refund. | low | |
| Warranty claim | Claim under warranty. | low | |
| Cancellation request | Cancel a service or subscription. | low | |
| Escalation to ombudsman / regulator | Escalate unresolved complaint. | medium | Identify correct regulator (provincial vs federal). |

### Government / Administrative

Correspondence with government agencies or for administrative processes.

| Template | Purpose | Typical risk | Notes |
|---|---|---|---|
| Information request | Request information from a government agency. | low | |
| Supporting statement | Provide a statement in support of an application or appeal. | medium | Does not replace formal application. |
| Formal administrative correspondence | Routine correspondence with a government body. | low/medium | |
| Address / status change notification | Notify an agency of a change. | low | |

### Personal

Routine personal administrative documents.

| Template | Purpose | Typical risk | Notes |
|---|---|---|---|
| Authorization letter | Authorize someone to act on the user's behalf for a limited purpose. | medium | Power-of-attorney documents are prohibited; this is narrow. |
| Records request | Request personal records from an organization. | low | |
| Personal declaration | A simple, factual written statement. | medium | Must not be notarized; not a sworn statement. |
| Name / address notification | Notify an organization of a name or address change. | low | |

---

## Prohibited categories

`DTAX-REQ-006`: The system SHALL NOT generate the following documents without a professional-review workflow and explicit warnings:

- court pleadings, statements of claim, defence, or affidavit;
- sworn, notarized, or commissioned documents;
- wills, powers of attorney, trusts, or estate documents;
- immigration or refugee applications;
- tax returns or tax filings;
- settlement or release agreements;
- documents intended to harass, deceive, defraud, or intimidate;
- any document the user is legally prohibited from creating themselves.

`DTAX-REQ-007`: Prohibited-category templates, if ever offered, SHALL be clearly labeled as "professional-review required" and SHALL block direct send/export until a qualified professional has reviewed the output.

---

## Jurisdiction-specific templates

`DTAX-REQ-008`: The catalogue SHALL support jurisdiction-specific variants of templates. For example:

- a repair-request letter may reference the applicable landlord-tenant legislation by name for the confirmed province/territory;
- a complaint letter may reference the correct provincial/territorial consumer protection act or federal regulator.

`DTAX-REQ-009`: Where a template does not have a variant for the user's jurisdiction, the system SHALL offer a jurisdiction-neutral fallback or recommend a professional, not an incorrect template.

---

## Review status

| Status | Meaning |
|---|---|
| `not_reviewed` | Template has not been reviewed. Not offered to users unless in a closed beta with explicit warnings. |
| `hr_review_required` | Reviewed by a non-lawyer subject-matter expert (consumer/tenant/employment advocate). Suitable for low-risk templates. |
| `lawyer_review_recommended` | A lawyer should review before users rely on it for high-stakes matters. |
| `approved_for_use` | Reviewed and approved for the declared jurisdictions and effective date. |

`DTAX-REQ-010`: The review status SHALL be visible to users before they begin the wizard.

`DTAX-REQ-011`: A template marked `lawyer_review_recommended` or `high` risk SHALL require explicit user acknowledgment before finalization.

---

## Future categories

Categories that may be added after MVP, pending legal review:

- Small business / side-business correspondence;
- Insurance claim correspondence;
- Estate administration information sheets (not legal documents);
- Municipal / bylaw correspondence.
