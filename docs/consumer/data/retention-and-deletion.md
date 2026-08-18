# Retention and Deletion

## Purpose

This document defines conceptual data-retention and deletion requirements. It balances user control (delete what they want), legal/compliance needs, and operational reliability.

---

## Principles

1. **User control.** Users can delete their data, but the system explains what is deleted immediately, what is retained for legal/audit/security purposes, and for how long.
2. **Legal and security retention.** Some data (e.g., payment records, audit logs, evidence of abuse) may need to be retained longer than the user's account lifetime.
3. **Secure deletion.** When data is deleted, it is rendered inaccessible to users and permanently erased from active systems within a defined period.
4. **Account deletion.** Users can request full account deletion; the process is documented and transparent.

---

## Retention periods by data classification

These are conceptual defaults. Final periods require legal/privacy review and may differ by jurisdiction or business model.

| Data type | Active retention | After deletion request | Notes |
|---|---|---|---|
| User account & profile | Account lifetime | Soft delete 30 days, then permanent deletion unless legally required. | Users can recover within soft-delete window. |
| Situations, cases, tasks | Account lifetime + export opportunity | Soft delete 30 days, then purge. | |
| Evidence originals | Account lifetime | Soft delete 30 days, then secure deletion from object store and backups. | Legal holds may extend. |
| Evidence metadata | Account lifetime | Same as originals. | |
| AI interpretations | Account lifetime | Same as related evidence/case. | May be deleted with the case or separately. |
| Generated documents | Account lifetime | Soft delete 30 days, then purge. | Users should export before deletion. |
| Document versions | Account lifetime | Same as generated documents. | |
| Shared data / invitations | Until revoked or account deletion. | Revoked immediately; records retained in audit log. | |
| Support tickets | Account lifetime + 2 years | Anonymized after 2 years unless legally required. | |
| Audit logs | Account lifetime + 1–7 years depending on event | Anonymized; retained for security/fraud/legal compliance. | |
| AI telemetry | 90 days operational + 1 year anonymized aggregate | Anonymized; no PII. | |
| Export logs / fingerprints | Account lifetime + 2 years | Anonymized; retained for abuse/leak tracing. | |
| Payment/billing records | Account lifetime + 7 years (legal requirement) | Retained as required by law. | |
| Public reference data | Indefinite (Dutiva-owned) | Not user data; retained as product knowledge. | |

---

## Account deletion flow

`RET-REQ-001`: The system SHALL provide a clear, bilingual account-deletion option in settings.

`RET-REQ-002`: Before confirming deletion, the system SHALL:

- explain what will be deleted and what may be retained;
- warn that deletion is irreversible after the recovery window;
- offer an export of user data;
- require explicit confirmation (e.g., type email or confirm through email).

`RET-REQ-003`: Account deletion SHALL be a soft delete for a recovery window (default 30 days), after which data is permanently purged from active systems.

`RET-REQ-004`: The system SHALL retain minimal records required for legal, tax, fraud-prevention, and security purposes after account deletion, and SHALL anonymize them where possible.

`RET-REQ-005`: The system SHALL not use retained anonymized data to re-identify the deleted user.

---

## Item-level deletion

`RET-REQ-006`: Users SHALL be able to delete individual evidence items, cases, documents, situations, and generated documents.

`RET-REQ-007`: Deletion of an evidence item SHALL:

- remove it from case/situation links;
- soft-delete the metadata;
- mark the original file for secure deletion after the recovery window;
- log the deletion event.

`RET-REQ-008`: Deletion of a case SHALL:

- delete or unlink associated tasks and deadlines;
- soft-delete linked evidence items unless the user chooses to keep them;
- preserve generated documents if the user chooses to keep them;
- log the deletion event.

`RET-REQ-009`: Soft-deleted items SHALL be recoverable within the recovery window.

---

## AI interpretation deletion

`RET-REQ-010`: Users SHALL be able to delete AI interpretations without deleting the underlying evidence.

`RET-REQ-011`: Deletion of AI interpretations SHALL be logged and SHALL not affect the original evidence or user annotations.

---

## Backup retention

`RET-REQ-012`: Backups SHALL retain deleted user data only for the documented backup retention period, after which secure deletion SHALL occur.

`RET-REQ-013`: Restores from backup SHALL respect deletion status: soft-deleted data SHALL remain inaccessible to users; permanently deleted data SHALL NOT be restored to active systems.

---

## Legal holds

`RET-REQ-014`: The system SHALL support the ability to place a legal hold on specific accounts or data when required by law or a lawful order.

`RET-REQ-015`: Legal holds SHALL be authorized by designated personnel, logged, and reviewed periodically.

`RET-REQ-016`: Users under a legal hold SHALL be notified only to the extent required by law.

---

## Anonymization

`RET-REQ-017`: Anonymized aggregate data used for product improvement, analytics, or legal compliance SHALL be designed so that individual users cannot be re-identified.

`RET-REQ-018`: Anonymization procedures SHALL be reviewed before use in published analytics or model training.

---

## Jurisdiction-specific requirements

`RET-REQ-019`: The system SHALL comply with applicable Canadian privacy-law deletion requirements, including:

- PIPEDA's principles of accuracy, access, and correction;
- Québec Law 25's right to erasure and destruction obligations;
- any applicable provincial private-sector privacy statutes.

`RET-REQ-020`: **Legal review required** to confirm retention periods and deletion procedures before launch, especially for evidence, audit logs, and payment records.

---

## User communication

`RET-REQ-021`: The privacy policy and account-deletion UI SHALL explain retention in plain language, including:

- what is deleted immediately;
- what enters a recovery window;
- what is retained for legal/security purposes and for how long;
- how to request a data export before deletion.

`RET-REQ-022`: Deletion confirmations SHALL be sent to the user's email in their preferred language.
