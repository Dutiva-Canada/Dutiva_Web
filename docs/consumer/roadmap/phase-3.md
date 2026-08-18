# Phase 3

## Goal

Deepen the product family into a cohesive consumer platform. Integrate the three products into a seamless flywheel: Life Admin identifies situations, Evidence Locker preserves proof, Document Generation produces correspondence, and the timeline ties it all together. Expand coverage, intelligence, and trust features.

---

## Canadian Life Admin

### Broader situation coverage

Add workflows for:

- buying or selling a home (real-estate administrative steps, not legal conveyance);
- buying or registering a vehicle;
- having a child (parental leave, benefits, registration);
- handling a death in the family (administrative checklist, with strong professional-referral boundaries);
- getting married or separating (name changes, address changes, benefits);
- starting or closing a side business (registration, HST/GST basics, record keeping);
- managing insurance claims and disputes;
- dealing with government benefits and overpayments.

### Situation intelligence

- Suggest follow-up situations based on current situation (e.g., job loss → record keeping → tax slip questions).
- Detect missing information and prompt the user.
- Surface deadlines from the timeline.
- Allow users to mark a situation resolved and archive it.

### User-controlled memory

- Saved facts (employer name, landlord name, addresses) with user confirmation.
- Distinguish confirmed facts from inferred facts.
- Let users correct or delete facts.

---

## Canadian Document Generation

### Larger catalogue

Add templates across all categories, including medium-risk templates with proper review:

- tenant response to a notice;
- formal complaint to a landlord-tenant board;
- escalation to a regulator/ombudsman;
- service-cancellation and refund letters;
- records-request letters for employment, tenancy, and consumer matters;
- simple authorization letters (narrow scope, not power of attorney).

### Document intelligence

- Suggest templates based on the user's situation and evidence.
- Auto-fill from confirmed facts and linked evidence.
- Show relevant statutory reference sections in the review step.
- Support PDF and Word export.

### Review and collaboration

- Optional professional-review flag on high-risk documents.
- Share a document with a helper or professional (access-controlled, logged).
- Comments and annotations on drafts.

---

## Personal Evidence Locker

### AI analysis launch

- Opt-in AI extraction of dates, parties, amounts, obligations, and deadlines from evidence.
- Confidence scoring and user correction.
- Missing-evidence suggestions.
- Contradiction detection across evidence items.

### OCR

- OCR for scanned documents and photos.
- OCR text searchable, labeled as interpretation.
- Language detection for bilingual documents.

### Advanced organization

- Nested tags and smart folders.
- Full-text search across metadata, annotations, OCR, and AI interpretations.
- Bulk upload and import from email or cloud storage (where supported and permitted).

### Sharing and professional handoff

- Secure, expiring share links for professionals.
- Professional handoff report (PDF) with integrity manifest and disclaimer.
- Activity log visible to the user for shared items.

---

## Integration flywheel

- **Life Admin → Document Generation:** suggest templates and pre-fill answers.
- **Life Admin → Evidence Locker:** suggest evidence to capture for each step.
- **Document Generation → Evidence Locker:** save generated documents as artifacts.
- **Evidence Locker → Document Generation:** attach evidence to support facts.
- **Evidence Locker → Timeline:** build chronology automatically and let users edit.
- **Timeline → Life Admin:** surface deadlines and upcoming tasks.

`SHARED-REQ-130`: By Phase 3, the three products SHALL be usable as a single coherent platform while remaining independently accessible.

---

## AI improvements

- More natural multi-turn chat for complex situations.
- Retrieval-augmented generation (RAG) over the vetted consumer knowledge base.
- Better explanation of sources and confidence.
- Improved handling of multi-jurisdiction and edge cases.
- Safety backstop expanded to more life events and document categories.

---

## Monetization launch

- Launch paid subscription tiers:
  - free tier: limited situations, limited documents, limited storage;
  - premium: unlimited workflows, document generation, more storage, AI analysis;
  - family plan: multiple profiles, shared cases.
- Transparent pricing in Canadian dollars.
- No data selling, no ad model.
- Trust-preserving model analysis documented in `strategy/product-strategy.md`.

---

## Trust and safety

- Annual legal review of all live templates and knowledge items.
- Automated drift detection for key legislation pages.
- Bug-bounty or responsible-disclosure program.
- Public trust report or transparency summary.
- Accessibility conformance report.

---

## Success criteria

- 12–15 life-event workflows live.
- 15–20 document templates live and reviewed.
- Evidence Locker supports AI analysis and OCR with high user-correction engagement.
- Platform flywheel metrics: % of situations that generate a document or evidence upload; % of documents linked to evidence.
- Paid conversion and churn metrics within targets.
- No major legal-review or safety incidents.
