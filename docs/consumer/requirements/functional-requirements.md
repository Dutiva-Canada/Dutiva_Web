# Functional Requirements

## Scope

This document collects **cross-product and integration** functional requirements. Product-specific requirements are defined in:

- `product/canadian-life-admin.md` (`CLA-REQ-*`)
- `product/canadian-document-generation.md` (`CDG-REQ-*`)
- `product/personal-evidence-locker.md` (`PEL-REQ-*`)

Additional domain-specific requirements are in:

- `ai/ai-behaviour.md` and `ai/ai-safety.md` (`AI-REQ-*`)
- `requirements/bilingual-requirements.md` (`BIL-REQ-*`)
- `requirements/security-requirements.md` (`SEC-REQ-*`)
- `requirements/privacy-requirements.md` (`PRIV-REQ-*`)
- `requirements/accessibility-requirements.md` (`ACC-REQ-*`)

Requirement identifiers use a common prefix map defined in `README.md`. Numbers restart at `001` within each document.

---

## User identity and account

`SHARED-REQ-101`: The system SHALL support user registration, authentication, sign-out, and password/account recovery.

`SHARED-REQ-102`: The system SHALL support a user preference for language (`en` or `fr`) and theme (light/dark/system) persisted across sessions.

`SHARED-REQ-103`: The system SHALL store a user's default jurisdiction(s) in their profile but SHALL confirm jurisdiction per situation rather than applying it automatically.

`SHARED-REQ-104`: The system SHALL support account deletion, including export of user data before deletion where required by law or policy. See `data/retention-and-deletion.md`.

`SHARED-REQ-105`: The system SHALL provide a clear, bilingual account-deletion flow that explains what data is deleted, what is retained, and for how long.

---

## Cross-product navigation and handoff

`SHARED-REQ-106`: The platform SHALL allow a user to move from a Life Admin situation to Document Generation with the selected template pre-filtered by situation and jurisdiction.

`SHARED-REQ-107`: The platform SHALL allow a user to attach evidence from Personal Evidence Locker to a generated document or a Life Admin workflow step.

`SHARED-REQ-108`: Handoffs SHALL preserve context (situation, jurisdiction, confirmed facts) but SHALL require explicit user confirmation before creating or modifying data in the target product.

`SHARED-REQ-109`: Each product SHALL remain usable independently: a user of only Document Generation or only Evidence Locker SHALL not be forced to create a Life Admin situation.

---

## Search and discovery

`SHARED-REQ-110`: The system SHALL provide global search across situations, cases, documents, and evidence items that the user owns.

`SHARED-REQ-111`: Search results SHALL indicate the product area, entity type, and whether a match came from primary evidence or AI interpretation.

`SHARED-REQ-112`: The system SHALL provide a browseable catalogue of document templates and life-event workflows, filterable by jurisdiction and category.

---

## Notifications and reminders

`SHARED-REQ-113`: The system MAY provide optional reminders for user-defined deadlines and tasks. It SHALL NOT send unsolicited reminders without explicit user consent.

`SHARED-REQ-114`: Reminders SHALL be scoped to the user's own data and SHALL not disclose sensitive content in notification text.

`SHARED-REQ-115`: The system SHALL allow users to configure notification channels (email, push, in-app) and frequency.

---

## Export and portability

`SHARED-REQ-116`: The system SHALL support export of a user's own data in a common, machine-readable format (e.g., JSON/ZIP with files).

`SHARED-REQ-117`: Exported data packages SHALL include an integrity manifest and a clear statement of what is included.

`SHARED-REQ-118`: The system SHALL support generating a tamper-evident summary report for professional handoff, with a disclaimer that it is not court-certified.

---

## Billing and plans (future)

`SHARED-REQ-119`: If paid tiers are introduced, the system SHALL enforce feature limits at the backend, not merely in the UI.

`SHARED-REQ-120`: Free-tier limitations SHALL be clearly communicated before a user attempts a paid action.

`SHARED-REQ-121`: The system SHALL NOT use user data or documents as payment or as a condition of access to core privacy/security features.

---

## Support and feedback

`SHARED-REQ-122`: The system SHALL provide a support contact and a feedback mechanism.

`SHARED-REQ-123`: Support responses SHALL reinforce product boundaries and SHALL NOT provide legal, tax, immigration, or financial advice.

`SHARED-REQ-124`: The system SHALL provide a way to report inaccurate, harmful, or unsafe AI output.

---

## Administrative and trust surfaces

`SHARED-REQ-125`: The system SHALL display a standing legal disclaimer on substantive guidance, document preview, and export surfaces.

`SHARED-REQ-126`: The system SHALL provide a "known limitations" or "what this product does not do" page linked from the disclaimer.

`SHARED-REQ-127`: The system SHALL make privacy policy, terms of use, accessibility statement, and AI usage disclosure available in both English and French.
