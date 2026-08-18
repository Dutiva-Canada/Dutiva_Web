# Open Questions

This document records unresolved decisions. It is deliberately not filled with invented answers. Each question includes why it matters and what information is needed to resolve it.

---

## 1. Product naming and brand relationship to Dutiva

**Question:** Should these products launch under the Dutiva brand, as a Dutiva sub-brand, or as a completely separate consumer brand?

**Why it matters:** Affects legal entity, liability, privacy policy, terms, marketing, support, and trust transfer from Dutiva.

**Information needed:**

- Founder/executive brand strategy for Dutiva beyond the employer HR market.
- Legal opinion on liability separation and trademark use.
- Whether Dutiva's privacy policy and terms can be adapted or must be separate.
- Customer research on whether Dutiva's employer brand helps or hinders a consumer product.

**Current status:** Open. Three options analyzed in `strategy/positioning.md` and `decisions/architecture-decisions.md`.

---

## 2. Standalone products vs. integrated platform

**Question:** Should the three products be built as separate products/applications, as one consumer platform with three modules, or as Life Admin plus supporting capabilities?

**Why it matters:** Drives architecture, repository structure, shared backend, authentication, billing, data model, and user experience.

**Information needed:**

- Engineering capacity and preference for monolith vs. separate apps.
- Monetization strategy (e.g., can Document Generation be sold standalone?).
- User research on whether consumers understand "one app with three modules."
- Security/privacy risk appetite for a single data breach affecting all three.

**Current status:** Open. Three options analyzed in `strategy/product-strategy.md` and `decisions/architecture-decisions.md`.

---

## 3. Shared backend and authentication

**Question:** If the products are integrated, what is the shared backend? Does it reuse Dutiva's Supabase/Vercel infrastructure, a new tenant of the same stack, or a greenfield stack?

**Why it matters:** Affects data isolation, engineering effort, deployment, security model, and go-to-market timeline.

**Information needed:**

- Dutiva infrastructure roadmap and capacity.
- Security/privacy requirements for consumer data vs. employer data.
- Decision on product relationship (question 2).
- Cost projections for separate vs. shared infrastructure.

**Current status:** Open, tied to questions 1 and 2.

---

## 4. MVP AI scope

**Question:** Should the Life Admin MVP use deterministic intake, a lightweight AI-assisted intake, or both as separate experiments?

**Why it matters:** Affects cost, timeline, safety testing, legal review, and user experience.

**Information needed:**

- Budget for LLM provider and safety/telemetry infrastructure.
- Team expertise in prompt engineering, safety backstops, and AI evaluation.
- Legal opinion on liability of deterministic vs. AI-generated guidance.
- User research on whether a structured form or a chat-style intake feels more trustworthy.

**Current status:** Two options documented in `roadmap/mvp.md`. Deterministic is recommended as lowest risk; AI-assisted is a follow-on.

---

## 5. Data residency and AI provider strategy

**Question:** Where will user data, evidence, and AI processing occur? Can a public "data stored/processed in Canada" claim be made?

**Why it matters:** Central to privacy policy, marketing trust, Québec Law 25 compliance, and vendor selection.

**Information needed:**

- Confirmation from object-storage provider on regions available.
- Confirmation from AI provider on data retention, training opt-out, and processing regions.
- Confirmation from email/analytics/subprocessor vendors on regions.
- Legal review of cross-border transfer mechanisms.

**Current status:** Open. Goal is Canadian or equivalent; claim cannot be made until confirmed.

---

## 6. Storage limits and pricing

**Question:** What are the free/paid storage and document-generation limits, and what is the business model?

**Why it matters:** Defines monetization, free-tier capacity, and user expectations.

**Information needed:**

- Cost of object storage, AI inference, document rendering, and egress.
- Competitive pricing for consumer document and storage services.
- Willingness-to-pay research.
- Decision on whether the primary revenue is subscriptions, usage, or a hybrid.

**Current status:** Open. Monetization models documented in `strategy/product-strategy.md`; no pricing set.

---

## 7. Legal review scope and timing

**Question:** Which legal reviewer(s) should review the consumer products, and when should the review happen relative to build?

**Why it matters:** Legal review is required for templates, knowledge base, terms, privacy, and AI disclosures. It affects timeline and cost.

**Information needed:**

- Availability and rates of Canadian employment, tenancy, consumer, and privacy lawyers.
- Whether a single firm can cover all needed areas or separate specialists are required.
- Decision on MVP scope (fewer templates = smaller review).
- Whether legal review is budgeted for MVP or deferred until broader launch.

**Current status:** Open. Inventory documented in `governance/legal-review-requirements.md`.

---

## 8. Professional liability and insurance

**Question:** What professional-liability insurance, if any, is appropriate for a consumer guidance and document-generation product?

**Why it matters:** Affects risk posture, pricing, and partnership terms.

**Information needed:**

- Insurance broker assessment for E&O, cyber, and professional liability.
- Legal opinion on whether the product's disclaimers sufficiently distance it from regulated professions.
- Comparable products' coverage.

**Current status:** Open.

---

## 9. Evidence admissibility positioning

**Question:** How strongly can the Evidence Locker claim to help users preserve evidence for legal or administrative use without overpromising admissibility?

**Why it matters:** Affects marketing copy, disclaimers, and user trust.

**Information needed:**

- Legal opinion on what evidence-management features can and cannot claim.
- Review of competitor language in the consumer legal-tech space.
- User testing of disclaimers.

**Current status:** Open. Disclaimers drafted in `product/personal-evidence-locker.md`.

---

## 10. Jurisdiction coverage depth

**Question:** Should all 13 provinces and territories be supported equally from MVP, or should the launch focus on a subset (e.g., Ontario, Québec, British Columbia, Federal)?

**Why it matters:** Knowledge-base maintenance burden and MVP scope.

**Information needed:**

- User/market data on where target users live.
- Availability of legal reviewers for each jurisdiction.
- Engineering cost of supporting 14 jurisdictions vs. 3–4.

**Current status:** Open. MVP documentation assumes 14 jurisdictions but only two workflows.

---

## 11. Municipality coverage

**Question:** Should the product model municipality-level rules, or only point users to local resources?

**Why it matters:** Some tenant/consumer issues depend on city bylaws.

**Information needed:**

- List of municipality-level rules that materially affect MVP workflows (e.g., landlord licensing, rent control bylaws).
- Feasibility of maintaining municipal content.
- User research on how often municipality matters vs. province.

**Current status:** Open. Current documentation points to local resources rather than modeling municipalities.

---

## 12. Document categories and prohibited templates

**Question:** What is the exact initial catalogue of document templates, and which categories are permanently prohibited vs. professional-review-only?

**Why it matters:** Defines MVP scope and legal-review surface.

**Information needed:**

- Decision on MVP document-generation inclusion.
- Legal opinion on which templates risk unauthorized practice of law.
- User research on highest-value documents.

**Current status:** Partially documented in `documents/document-taxonomy.md` and `roadmap/mvp.md`; final catalogue open.

---

## 13. Family accounts and helper access

**Question:** Should users be able to share cases or accounts with family members, caregivers, or trusted helpers?

**Why it matters:** Affects data model, privacy, consent, and product value for caregivers and seniors.

**Information needed:**

- User research on helper/family use cases.
- Legal/privacy review of shared access and consent.
- Engineering estimate for granular permissions and audit.

**Current status:** Open; future opportunity documented in `roadmap/future-opportunities.md`.

---

## 14. Data portability

**Question:** What format and granularity should data exports support, and must they support transfer to another service?

**Why it matters:** Privacy-law requirements (PIPEDA, Law 25) and user trust.

**Information needed:**

- Legal interpretation of portability obligations for this product category.
- Engineering feasibility of structured exports (JSON, ZIP) and any standard formats.
- User research on what users would want to export.

**Current status:** Open. Basic export requirements in `requirements/functional-requirements.md` and `data/retention-and-deletion.md`.

---

## 15. Accessibility target and testing

**Question:** Is WCAG 2.1 AA sufficient, or should the product target AAA where possible? What manual testing resources are available?

**Why it matters:** Affects design, engineering, and QA budget.

**Information needed:**

- Accessibility audit budget and vendor availability.
- Regulatory requirements for the product category.
- User research with assistive-technology users.

**Current status:** Documented as AA target with AAA aspiration in `requirements/accessibility-requirements.md`.

---

## 16. Crisis resources and liability

**Question:** Which crisis resources should be displayed, and who is responsible for maintaining them?

**Why it matters:** Safety-critical; incorrect or outdated resources could cause harm.

**Information needed:**

- Review of official Canadian crisis lines (9-8-8, 9-1-1, provincial lines, shelters).
- Legal opinion on liability for providing or failing to provide resources.
- Process for keeping resources current.

**Current status:** Open. General approach documented in `ai/ai-safety.md` and `ai/escalation.md`; specific list not defined.

---

## 17. User feedback and AI hallucination reporting

**Question:** How will users report incorrect or unsafe AI output, and how will the team triage and act on reports?

**Why it matters:** Trust and safety loop for AI-assisted features.

**Information needed:**

- Support workflow design.
- Tooling for capturing and reviewing AI safety incidents.
- Policy for handling reports (response time, escalation, user communication).

**Current status:** Open. Mentioned in requirements; no detailed process defined.

---

## 18. Beta / launch sequencing

**Question:** Should the product launch as a closed beta, an open beta, or general availability, and in which markets/jurisdictions?

**Why it matters:** Affects marketing, support capacity, legal exposure, and feedback quality.

**Information needed:**

- Support capacity for beta users.
- Legal advice on beta disclaimers.
- Marketing strategy and budget.
- Decision on jurisdiction coverage (question 10).

**Current status:** Open.

---

## 19. Third-party integrations

**Question:** Should the product integrate with email, cloud storage, calendars, or government portals? If so, which ones and when?

**Why it matters:** Affects privacy, engineering scope, and user value.

**Information needed:**

- API availability and terms for candidate integrations.
- User research on highest-value integrations.
- Privacy/security review of OAuth scopes and data flows.
- Cost and maintenance estimates.

**Current status:** Open. Future opportunities listed in `roadmap/future-opportunities.md`.

---

## 20. Metrics and success definitions

**Question:** What are the specific measurable goals for the MVP and each phase?

**Why it matters:** Drives prioritization and go/no-go decisions.

**Information needed:**

- North-star metric agreement.
- Baseline data or assumptions.
- Instrumentation plan and analytics privacy review.

**Current status:** Partially documented in `roadmap/mvp.md` and `roadmap/phase-3.md`; needs refinement.

---

## Resolving open questions

`OQ-REQ-001`: Each open question SHALL be assigned an owner and a target resolution date before implementation proceeds past the relevant milestone.

`OQ-REQ-002`: When an open question is resolved, the resolution SHALL be recorded as a new entry in `decisions/architecture-decisions.md` and the question SHALL be marked resolved in this file.

`OQ-REQ-003`: No load-bearing fact (e.g., pricing, jurisdiction coverage, data-residency claim) SHALL be stated publicly until the relevant open question is resolved and reviewed.
