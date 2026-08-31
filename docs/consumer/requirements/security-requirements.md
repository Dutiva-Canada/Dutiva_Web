# Security Requirements

## Scope

This document defines conceptual security requirements for the consumer product family. It does not specify implementation details or production configuration.

---

## Authentication and access control

`SEC-REQ-001`: The system SHALL require authentication for access to any user data, documents, evidence, or AI history.

`SEC-REQ-002`: The system SHALL support strong passwords and SHOULD support multi-factor authentication for sensitive operations (account deletion, bulk export, changing email).

`SEC-REQ-003`: Session tokens SHALL be short-lived and revocable.

`SEC-REQ-004`: The system SHALL enforce row-level or equivalent access control so a user can access only their own data and data explicitly shared with them.

`SEC-REQ-005`: Staff and support access SHALL be read-only by default and SHALL be logged. Any write access SHALL require explicit authorization and SHALL be justified and audited.

`SEC-REQ-006`: The system SHALL not allow privilege escalation through URL manipulation or API parameter tampering.

---

## Encryption

`SEC-REQ-007`: All network traffic SHALL use TLS 1.2 or higher.

`SEC-REQ-008`: Evidence files and sensitive personal data SHALL be encrypted at rest with keys controlled by the service. Per-user encryption is recommended for highly sensitive evidence.

`SEC-REQ-009`: Encryption keys SHALL be stored separately from data and SHALL be rotated on a documented schedule or when compromise is suspected.

`SEC-REQ-010`: Backups of encrypted data SHALL also be encrypted.

---

## Tenant isolation

`SEC-REQ-011`: Each user's data SHALL be logically isolated from other users' data.

`SEC-REQ-012`: In a multi-tenant database, queries SHALL be scoped by user ID, and service-role access SHALL be restricted to documented operations.

`SEC-REQ-013`: Shared infrastructure (object storage, queues, AI provider accounts) SHALL be configured so that one user's data is not accessible to another.

---

## Secure file storage

`SEC-REQ-014`: Uploaded evidence files SHALL be stored in an object store with access controls and direct-upload validation (type, size, hash).

`SEC-REQ-015`: Files SHALL be served to the owner and authorized viewers only through short-lived signed URLs or equivalent access controls.

`SEC-REQ-016`: The system SHALL reject executable, script, and other dangerous file types at upload.

`SEC-REQ-017`: Where supported, the system SHALL scan uploaded files for malware before processing or storing them.

`SEC-REQ-018`: Preview/thumbnail generation SHALL run in a sandboxed environment without network access.

---

## Audit logging

`SEC-REQ-019`: The system SHALL maintain an append-only audit log of security-relevant events:

- authentication success/failure;
- password resets and email changes;
- MFA enrollment/removal;
- data exports and downloads;
- document and evidence deletions;
- account deletion requests and execution;
- support/admin access;
- AI analysis requests (without PII);
- permission changes and sharing events.

`SEC-REQ-020`: Audit logs SHALL include actor, action, timestamp, and affected resource identifiers.

`SEC-REQ-021`: Audit logs SHALL be retained according to the retention policy in `data/retention-and-deletion.md` and SHALL be protected from tampering.

---

## Export protection

`SEC-REQ-022`: Exported documents and evidence packages SHOULD include a visible watermark identifying the exporting user and time.

`SEC-REQ-023`: Exported text SHOULD include an invisible fingerprint or zero-width identifier that can trace a leaked excerpt back to the export event, consistent with the product's privacy policy.

`SEC-REQ-024`: Export velocity SHALL be rate-limited to deter bulk exfiltration.

`SEC-REQ-025`: Exports SHALL be logged in the audit trail.

---

## Third-party AI providers

`SEC-REQ-026`: AI provider credentials SHALL be stored server-side only and SHALL NOT be present in client bundles.

`SEC-REQ-027`: Requests to AI providers SHALL exclude PII and evidence content unless the user has explicitly opted in for a specific analysis, and even then SHALL minimize data.

`SEC-REQ-028`: The system SHALL log model usage (provider, model, operation, tokens, latency, status) without storing message bodies or evidence content.

`SEC-REQ-029`: The system SHALL confirm the AI provider's security, data-retention, and data-residency practices before processing user data.

---

## Input validation and injection prevention

`SEC-REQ-030`: All user inputs (situation text, answers, annotations, tags) SHALL be validated and sanitized before storage.

`SEC-REQ-031`: The system SHALL be protected against prompt injection by using structured prompts, input limits, and deterministic safety backstops.

`SEC-REQ-032`: Document templates and generated output SHALL be escaped to prevent injection when rendered as HTML, PDF, or Word.

`SEC-REQ-033`: File uploads SHALL be validated by content type, extension, and magic bytes; filenames SHALL be sanitized before storage.

---

## Breach response

`SEC-REQ-034`: The system SHALL have a documented incident-response plan for security breaches involving personal data or evidence.

`SEC-REQ-035`: Users SHALL be notified of breaches affecting their data in accordance with applicable Canadian privacy laws (PIPEDA, Québec Law 25, and relevant provincial health/privacy legislation).

`SEC-REQ-036`: The incident-response plan SHALL include steps for containment, eradication, recovery, notification, and post-incident review.

---

## Dependency and supply-chain security

`SEC-REQ-037`: Third-party dependencies SHALL be pinned and regularly reviewed for known vulnerabilities.

`SEC-REQ-038`: The system SHOULD use automated dependency scanning in CI.

`SEC-REQ-039`: Secrets SHALL NOT be committed to the repository and SHALL be rotated on a documented schedule.

---

## Threat model mitigations

| Threat                             | Mitigation                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| Unauthorized account access        | Strong auth, MFA, session expiry, suspicious-login alerts.                            |
| Stolen documents                   | Encryption, access controls, signed URLs, export watermarks/fingerprints, audit logs. |
| Malicious uploads                  | File-type validation, size limits, malware scanning, sandboxed preview.               |
| Prompt injection / AI manipulation | Structured prompts, deterministic safety backstop, input limits, refusal rules.       |
| Malicious document content         | Sanitization, user review gates, prohibited categories.                               |
| AI hallucinations                  | Grounded retrieval, deterministic facts, human review gates, citations.               |
| Data leakage                       | Encryption, least privilege, no PII in logs/telemetry, per-user isolation.            |
| Cross-user data exposure           | Row-level access control, parameterized queries, signed URLs.                         |
| Improper jurisdiction resolution   | Default unknown, explicit confirmation, deterministic checks.                         |
| Incorrect legal information        | Vetted knowledge base, review status, no model-authored law.                          |
| Evidence manipulation/deletion     | Original preservation, hashing, versioning, append-only audit.                        |
| Account takeover                   | MFA, email change verification, suspicious-activity alerts.                           |
| Insider access                     | Role-based access, read-only defaults, audit logs, justification.                     |
| Third-party AI provider exposure   | Data minimization, no PII in prompts, provider due diligence.                         |
| Accidental deletion                | Soft delete, recovery window, export-before-delete.                                   |
| Retention failures                 | Automated retention policies, audit, tested deletion procedures.                      |
