# Privacy Requirements

## Scope

This document defines privacy-by-design requirements for the consumer product family. The products will store highly sensitive personal information, including employment, housing, financial, family, and identity documents. Privacy and trust are central to the product.

---

## Privacy-by-design principles

`PRIV-REQ-001`: The system SHALL be designed with privacy by default:

- collect only what is necessary;
- use data only for the purpose stated to the user;
- retain data only as long as necessary;
- provide transparency, access, correction, and deletion rights;
- protect data with appropriate technical and organizational measures.

## Data minimization

`PRIV-REQ-002`: The system SHALL collect only the personal information and evidence needed to deliver the requested feature.

`PRIV-REQ-003`: Optional fields SHALL be clearly marked as optional, and the system SHALL explain why optional information is requested if it improves the output.

`PRIV-REQ-004`: The system SHALL NOT require users to upload identity documents or sensitive evidence to use general guidance features.

`PRIV-REQ-005`: AI analysis of evidence SHALL be opt-in per item or per case and SHALL explain what data is sent to the AI provider.

## Purpose limitation

`PRIV-REQ-006`: Personal data SHALL be used only to provide the service to the user (generate documents, organize evidence, deliver reminders, improve product safety through aggregated analytics).

`PRIV-REQ-007`: The system SHALL NOT sell, rent, or share personal data or evidence with third parties for advertising, profiling, or unrelated purposes.

`PRIV-REQ-008`: Any use of aggregated or de-identified data SHALL be documented in the privacy policy and SHALL be designed to prevent re-identification of individuals.

## Consent

`PRIV-REQ-009`: The system SHALL obtain clear, affirmative consent before:

- processing sensitive personal information (e.g., health, financial, identity documents);
- sending data to a third-party AI provider;
- enabling optional analytics or crash reporting;
- sharing data with invited helpers or professionals.

`PRIV-REQ-010`: Consent SHALL be revocable, and revocation SHALL be easy to find and use.

`PRIV-REQ-011`: The system SHALL record the time, scope, and method of consent and any subsequent revocation.

## Canadian privacy obligations

`PRIV-REQ-012`: The system SHALL comply with applicable Canadian privacy legislation, including but not limited to:

- the federal _Personal Information Protection and Electronic Documents Act_ (PIPEDA) and its forthcoming replacement legislation;
- Québec _Law 25_ (Act 25, An Act to modernize legislative provisions as regards the protection of personal information);
- provincial private-sector privacy statutes where applicable (e.g., British Columbia, Alberta).

`PRIV-REQ-013`: The system SHALL provide a privacy policy in both English and French that describes:

- what personal information is collected;
- why it is collected and how it is used;
- who it is shared with and why;
- where it is stored and processed;
- how long it is retained;
- user rights (access, correction, deletion, portability, withdrawal of consent);
- how to contact the privacy officer or support.

`PRIV-REQ-014`: The system SHALL implement Quebec Law 25 requirements where they may apply, including:

- valid consent for collection, use, and disclosure;
- privacy impact assessments for high-risk processing;
- breach notification to the Commission d'accès à l'information and affected individuals;
- right to portability and automated decision transparency (where applicable);
- clear retention and destruction obligations.

`PRIV-REQ-015`: **Legal review required** before launch to confirm specific obligations under PIPEDA, Québec Law 25, and any applicable provincial statutes for the chosen business model and data flows.

## Data residency

`PRIV-REQ-016`: Personal data, evidence metadata, and generated documents SHOULD be stored and processed in Canada or in a jurisdiction with substantially similar privacy protections, subject to legal review.

`PRIV-REQ-017`: The data residency and processing locations for each third-party service (AI provider, object storage, email, analytics) SHALL be documented and disclosed to users.

`PRIV-REQ-018`: **Legal review required** to confirm the data-residency claim and any cross-border transfer safeguards (e.g., contractual clauses, adequacy decisions) before public statements are made.

## Third-party model providers

`PRIV-REQ-019`: The system SHALL document each AI provider's data retention, training, and subprocessors practices.

`PRIV-REQ-020`: The system SHALL minimize the data sent to AI providers and SHALL avoid sending evidence content unless the user explicitly consents.

`PRIV-REQ-021`: The system SHALL not allow AI providers to retain user data for training or to use it to improve their models unless explicitly permitted and disclosed.

`PRIV-REQ-022`: Telemetry and audit logs SHALL exclude PII, message bodies, and evidence content.

## Data retention and deletion

See `data/retention-and-deletion.md` for the full policy. High-level requirements:

`PRIV-REQ-023`: The system SHALL define and document retention periods for each data category.

`PRIV-REQ-024`: Users SHALL be able to request deletion of individual evidence items, cases, documents, situations, and their entire account.

`PRIV-REQ-025`: Deleted data SHALL be rendered inaccessible to users and SHALL be permanently erased from active systems within the documented retention period, subject to legal hold requirements.

`PRIV-REQ-026`: Audit and telemetry logs required for security, compliance, or legal purposes may be retained for longer periods but SHALL be anonymized where possible and access-controlled.

## Access and portability

`PRIV-REQ-027`: Users SHALL be able to access their personal data and export it in a structured, machine-readable format.

`PRIV-REQ-028`: Users SHALL be able to correct inaccurate personal information and evidence metadata.

`PRIV-REQ-029`: Users SHALL be able to withdraw consent for optional processing without losing access to core features, unless the processing is essential to the service.

## Security measures

`PRIV-REQ-030`: The system SHALL implement appropriate technical and organizational security measures for personal data and evidence, as specified in `requirements/security-requirements.md`.

`PRIV-REQ-031`: The system SHALL maintain a record of processing activities and data flows for personal information.

## Breach notification

`PRIV-REQ-032`: The system SHALL have a documented breach-response procedure.

`PRIV-REQ-033`: The system SHALL notify affected users and relevant regulators in accordance with applicable law if a breach poses a real risk of significant harm.

## Children's privacy

`PRIV-REQ-034`: The system SHALL be designed for users aged 18 and older. If any feature could be used by minors, the system SHALL comply with applicable children's privacy laws and obtain parental consent where required.

## AI and automated decision-making

`PRIV-REQ-035`: AI-driven suggestions (situation classification, document template recommendations, evidence extraction) SHALL be presented as assistance, not as binding decisions.

`PRIV-REQ-036`: Where an AI output may affect a user's legal or financial interests, the system SHALL provide transparency about the AI's role, confidence, and the user's right to review and override.

`PRIV-REQ-037`: The system SHALL not make solely automated decisions that produce legal or similarly significant effects without meaningful human review, in compliance with applicable law.

---

## Areas requiring legal review

- Specific consent wording under PIPEDA and Québec Law 25.
- Cross-border transfer mechanisms and data-residency claims.
- AI provider terms and whether consumer data may be processed outside Canada.
- Retention periods for evidence and audit logs under applicable statutes.
- Whether any feature constitutes regulated legal/financial advice and triggers additional obligations.
