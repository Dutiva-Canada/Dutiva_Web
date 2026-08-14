# Phase 2

## Goal

Expand beyond the MVP's two workflows to cover more high-frequency administrative situations, introduce basic document generation and evidence storage if not in MVP, and improve the user experience through reminders, better search, and more jurisdictions/categories.

---

## Canadian Life Admin

### New life-event workflows

Add 4–6 additional workflows, prioritizing situations that are common, well-understood, and lower-risk:

- **Moving between provinces** — address changes, driver's licence, health card, vehicle registration.
- **Service cancellation / refund** — telecom, gym, subscription, online purchase.
- **Starting a job** — record-keeping, contract review, tax forms.
- **Resigning** — resignation letter, notice, final pay, record keeping.
- **Consumer complaint escalation** — when a business ignores a complaint.
- **Receiving government correspondence** — understanding and responding to CRA or provincial agency letters.

### Intake improvements

- Searchable life-event catalogue.
- Suggested next-step chips based on common situations.
- Improved jurisdiction detection with explicit confirmation.
- Better handling of multi-jurisdiction and edge cases.
- Saved situations dashboard with status and progress.

### Tasks and reminders

- Generate tasks from a workflow.
- Allow user-defined deadlines and reminders.
- Optional email/push notifications (opt-in only).
- Due-soon and overdue indicators.

### Knowledge-base expansion

- Add knowledge items for new workflows.
- Implement review cadence and review-status tracking.
- Introduce basic change-detection process for legislation.

---

## Canadian Document Generation

### Expanded template catalogue

Add templates for the new Phase 2 workflows:

- resignation letter;
- repair request (if not in MVP);
- refund / cancellation request;
- consumer complaint letter;
- address/status change notification;
- formal records request to an employer or landlord.

### Template enhancements

- More `ClauseGate` conditions (jurisdiction, answer-based branching).
- Richer question types (address, phone, conditional follow-ups).
- Improved preview and review experience.
- Version history for generated documents.

### Integration with Life Admin

- Life Admin suggests document templates at relevant workflow steps.
- Pre-fill answers from confirmed facts in the situation.
- Link generated documents to the originating situation.

---

## Personal Evidence Locker

If not in MVP, launch the basic locker in Phase 2.

### Core features

- Secure upload and storage with encryption at rest.
- Case/situation organization.
- Tagging and search.
- Simple timeline builder.
- Export case package with integrity manifest.

### Integration

- Evidence upload offered from Life Admin workflows.
- Attach evidence to generated documents.
- Store generated documents back into the locker.

### OCR (optional, deferred if risky)

- Optical character recognition for uploaded document images.
- OCR text treated as an interpretation, not a replacement for the original.
- Search OCR-derived text with clear source labels.

---

## AI and safety

- Introduce or expand AI-assisted intake if not in MVP.
- Add evaluation sets for new workflows.
- Improve safety backstop with more crisis phrase coverage and escalation triggers.
- Add AI telemetry dashboards and safety incident triage.

---

## Privacy and security

- Implement multi-factor authentication.
- Introduce end-to-end encryption for highly sensitive evidence (if feasible).
- Complete privacy impact assessment for AI and evidence features.
- Implement data-residency confirmation and cross-border disclosures.
- Add account deletion and data-export flows.

---

## Accessibility and localization

- Complete WCAG 2.1 AA audit.
- Test all new workflows in French.
- Expand French terminology glossary.
- Improve screen-reader support for document preview and timeline.

---

## Monetization preparation

- Define free-tier limits and paid-tier benefits.
- Document monetization model and trust implications.
- Prepare billing infrastructure (Stripe integration or equivalent) without enabling it.
- Ensure paid features do not undermine trust (no data selling, no ad model, no pay-per-outcome).

---

## Success criteria

- 6–8 life-event workflows live, each with vetted knowledge across jurisdictions.
- At least 6 document templates live and reviewed.
- Evidence Locker has basic upload/organize/export if not in MVP.
- User retention and task-completion metrics improve over MVP.
- No unresolved legal-review items for live templates.
- AI safety gates operate with acceptable false-positive/false-negative rates.
