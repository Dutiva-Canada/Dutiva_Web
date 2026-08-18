# Non-Functional Requirements

## Performance

`NFR-REQ-001`: Page time-to-interactive for public pages SHOULD be under 3 seconds on a 4G connection for the first visit.

`NFR-REQ-002`: App shell and primary user flows (login, situation intake, document wizard, evidence upload) SHOULD be interactive within 2 seconds after initial load on repeat visits.

`NFR-REQ-003`: AI-assisted responses SHOULD stream or return a meaningful result within 5 seconds under normal load; a loading state SHALL be shown if latency exceeds 2 seconds.

`NFR-REQ-004`: Document preview SHOULD update within 500 ms of a user changing an answer in the wizard.

`NFR-REQ-005`: Evidence upload SHOULD support files up to at least 25 MB per file and provide progress feedback.

## Reliability and availability

`NFR-REQ-006`: The service SHOULD target 99.9% uptime for authenticated core features.

`NFR-REQ-007`: Critical user data mutations (document save, evidence upload, account deletion) SHALL be durable and confirm success/failure to the user.

`NFR-REQ-008`: The system SHALL gracefully degrade when an optional service (e.g., AI provider, OCR) is unavailable; core deterministic features SHALL remain usable.

`NFR-REQ-009`: Scheduled background jobs (reminders, knowledge updates) SHALL be observable and idempotent.

## Scalability

`NFR-REQ-010`: The architecture SHOULD scale horizontally for stateless application servers.

`NFR-REQ-011`: Evidence storage SHOULD scale independently from structured metadata storage.

`NFR-REQ-012`: AI usage SHOULD be metered and capped per user and per platform to control cost and abuse.

## Security and privacy

See `requirements/security-requirements.md` and `requirements/privacy-requirements.md` for detailed requirements. High-level non-functional requirements:

`NFR-REQ-013`: All data SHALL be encrypted in transit using TLS 1.2 or higher.

`NFR-REQ-014`: Sensitive data and evidence files SHALL be encrypted at rest.

`NFR-REQ-015`: Authentication SHALL support strong credentials and optional multi-factor authentication for sensitive operations.

`NFR-REQ-016`: The system SHALL enforce least-privilege access for staff and support.

## Maintainability and operability

`NFR-REQ-017`: The codebase SHOULD follow a modular structure that separates generic infrastructure from product-specific knowledge, documents, and templates.

`NFR-REQ-018`: All AI outputs, document generations, and evidence integrity events SHOULD be auditable without exposing PII in logs.

`NFR-REQ-019`: Feature flags or configuration SHOULD allow gradual rollout and kill switches for AI and document-generation features.

`NFR-REQ-020`: Third-party dependencies SHOULD be pinned, scanned for vulnerabilities, and documented in a dependency inventory.

## Mobile-first and cross-platform

`NFR-REQ-021`: The product SHOULD be usable on mobile devices first, with responsive support for tablet and desktop.

`NFR-REQ-022`: Core evidence capture (camera/scan) SHOULD work on iOS Safari and Android Chrome.

`NFR-REQ-023`: The product SHOULD support offline or degraded-network reading of saved content; evidence upload and AI features may require connectivity.

## Accessibility

See `requirements/accessibility-requirements.md`.

## Internationalization and localization

See `requirements/bilingual-requirements.md`.

## Data residency

`NFR-REQ-024`: Personal data, evidence metadata, and document data SHOULD be stored in Canada or a jurisdiction with equivalent privacy protections, subject to legal review.

`NFR-REQ-025`: AI provider processing locations SHALL be documented and confirmed; if the provider processes outside Canada, a privacy impact assessment and user disclosure SHALL be completed.

## Backup and disaster recovery

`NFR-REQ-026`: Structured data and evidence files SHALL be backed up with a documented recovery point objective (RPO) and recovery time objective (RTO).

`NFR-REQ-027`: Backups SHALL be encrypted and access-controlled.

`NFR-REQ-028`: A tested restore procedure SHALL exist for both structured data and object storage.

## Monitoring and alerting

`NFR-REQ-029`: The system SHALL monitor uptime, error rates, AI latency/cost, abuse signals (rate limits, export velocity), and security events.

`NFR-REQ-030`: Alerts SHALL fire on unusual patterns: spikes in failed AI safety gates, unusual export activity, cross-user data access attempts, and provider outages.

## Testability

`NFR-REQ-031`: Deterministic rules (jurisdiction resolution, document assembly, deadline calculations, safety gates) SHALL be unit-testable with fixture-driven tests.

`NFR-REQ-032`: AI behaviour SHALL be evaluated against a fixed evaluation set for safety, grounding, and escalation coverage.

`NFR-REQ-033`: Document templates SHALL be validated for bilingual completeness, required fields, and unresolved merge tokens before deployment.
