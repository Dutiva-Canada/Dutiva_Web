# Data Classification

## Purpose

The consumer products handle a wide range of data, from public reference material to highly sensitive personal evidence. This document defines classification levels so that protection, retention, and access controls can be applied proportionately.

---

## Classification levels

| Level                  | Description                                                                                  | Examples                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Public**             | Information intended for public access.                                                      | Marketing pages, public help articles, jurisdiction descriptions, template catalogue metadata (name, category, supported jurisdictions). |
| **Account**            | Information that identifies or describes a user account.                                     | Email, name, language/theme preferences, account status.                                                                                 |
| **Personal**           | Personal information about the user or others.                                               | Address, phone, employment details, tenancy details, case descriptions.                                                                  |
| **Sensitive personal** | Information that could cause harm or discrimination if misused.                              | Health information, financial details, identity documents, family status, immigration status, allegations of misconduct.                 |
| **Evidence**           | Source documents, photos, recordings, and original records uploaded or captured by the user. | Contracts, leases, letters, pay stubs, screenshots, government correspondence, photos.                                                   |
| **Generated document** | Documents produced by Canadian Document Generation.                                          | Resignation letter, repair request, complaint letter.                                                                                    |
| **AI interpretation**  | Machine-generated summaries, extractions, and analyses.                                      | Extracted dates, parties, contradiction flags, chronology suggestions.                                                                   |
| **Audit**              | System-generated records of actions.                                                         | Access logs, export logs, AI telemetry, deletion logs.                                                                                   |

---

## Handling requirements by classification

### Public

`DATA-REQ-001`: Public content SHALL be accurate, up-to-date, and reviewed before release.

`DATA-REQ-002`: Public content SHALL NOT disclose internal system details, unreleased features, or non-public user data.

### Account

`DATA-REQ-003`: Account data SHALL be encrypted at rest and in transit.

`DATA-REQ-004`: Passwords or authentication secrets SHALL be stored using a strong, salted, one-way hash.

`DATA-REQ-005`: Account data SHALL be accessible only to the owning user and authorized support staff under documented procedures.

`DATA-REQ-006`: Users SHALL be able to access, correct, and delete their account data.

### Personal

`DATA-REQ-007`: Personal data SHALL be collected only for the stated purpose.

`DATA-REQ-008`: Personal data SHALL be encrypted at rest and in transit.

`DATA-REQ-009`: Personal data SHALL be retained only as long as necessary for the purpose or as required by law.

`DATA-REQ-010`: Users SHALL be able to access, correct, and delete personal data.

`DATA-REQ-011`: Personal data SHALL NOT be used for advertising, sold, or shared with third parties without explicit consent.

### Sensitive personal

`DATA-REQ-012`: Sensitive personal data SHALL require explicit opt-in consent before collection or processing.

`DATA-REQ-013`: Sensitive personal data SHALL be encrypted at rest with per-user or per-account keys where feasible.

`DATA-REQ-014`: Sensitive personal data SHALL be minimized; the system SHALL NOT request health, financial, identity, immigration, or family-status information unless necessary for the feature.

`DATA-REQ-015`: AI analysis of sensitive personal data SHALL be opt-in per item or per case and SHALL be clearly explained.

`DATA-REQ-016`: Access to sensitive personal data SHALL be logged and restricted.

### Evidence

`DATA-REQ-017`: Evidence files SHALL be stored immutably and encrypted at rest.

`DATA-REQ-018`: Evidence metadata and hashes SHALL be stored in a durable, access-controlled system.

`DATA-REQ-019`: Evidence SHALL NOT be accessible to other users or unauthorized staff.

`DATA-REQ-020`: Evidence SHALL NOT be used for AI training, advertising, or unrelated product improvement without explicit consent.

`DATA-REQ-021`: Evidence deletion SHALL be secure and irreversible after the recovery window, subject to legal hold requirements.

### Generated document

`DATA-REQ-022`: Generated documents SHALL be treated as personal or sensitive personal data depending on content.

`DATA-REQ-023`: Generated documents SHALL be versioned and tied to the template version used.

`DATA-REQ-024`: Generated documents SHALL be accessible only to the owning user and any explicitly authorized viewers.

`DATA-REQ-025`: Generated documents SHALL include a disclaimer and, when exported, an export identifier.

### AI interpretation

`DATA-REQ-026`: AI interpretations SHALL be stored separately from primary evidence and SHALL be labeled as machine-generated.

`DATA-REQ-027`: AI interpretations SHALL include confidence, model metadata, and generated-at timestamp.

`DATA-REQ-028`: AI interpretations SHALL be correctable by the user; corrections SHALL be stored as annotations, not replacements.

`DATA-REQ-029`: AI interpretations SHALL NOT be sent to third parties for model training without explicit consent.

### Audit

`DATA-REQ-030`: Audit logs SHALL be append-only and tamper-evident.

`DATA-REQ-031`: Audit logs SHALL exclude message bodies, evidence content, and PII except where necessary for security investigation.

`DATA-REQ-032`: Audit logs SHALL be retained according to a documented retention schedule.

`DATA-REQ-033`: Audit log access SHALL be restricted and itself audited.

---

## Data flow summary

| Data type          | At rest                          | In transit | Access control            | Retention              |
| ------------------ | -------------------------------- | ---------- | ------------------------- | ---------------------- |
| Public             | encrypted                        | TLS        | public                    | indefinite             |
| Account            | encrypted                        | TLS        | user + support            | account lifetime       |
| Personal           | encrypted                        | TLS        | user + support            | per retention policy   |
| Sensitive personal | encrypted (per-user if feasible) | TLS        | user + limited support    | per retention policy   |
| Evidence           | encrypted                        | TLS        | user + limited support    | per retention policy   |
| Generated document | encrypted                        | TLS        | user + authorized viewers | per retention policy   |
| AI interpretation  | encrypted                        | TLS        | user                      | per retention policy   |
| Audit              | encrypted                        | TLS        | security/ops only         | per retention schedule |

---

## Cross-border considerations

`DATA-REQ-034`: Personal data, evidence metadata, and generated documents SHOULD be stored and processed in Canada or a jurisdiction with substantially similar privacy protections.

`DATA-REQ-035`: Cross-border transfers to third-party services (AI provider, object storage, email) SHALL be documented, justified, and disclosed to users.

`DATA-REQ-036`: **Legal review required** for any cross-border data transfer or data-residency claim before public launch.

---

## Special categories

| Category               | Examples                                            | Extra safeguards                                                             |
| ---------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Health information     | Disability, medical notes, mental health references | Opt-in for AI analysis; per-user encryption; strict access logs.             |
| Financial information  | Bank records, pay stubs, tax documents, debts       | Per-user encryption; no use for credit scoring; access logs.                 |
| Identity documents     | Passport, driver's licence, SIN, birth certificate  | Restricted access; no AI analysis without explicit consent; secure deletion. |
| Children's data        | Information about minors                            | Avoid collection; parental consent if required by law.                       |
| Allegations / disputes | Harassment claims, fraud allegations, litigation    | Strict access control; no unauthorized disclosure; audit logs.               |
