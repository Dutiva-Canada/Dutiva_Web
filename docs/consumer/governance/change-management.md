# Change Management

## Purpose

This document defines how changes to the consumer products — documents, templates, knowledge, workflows, AI behaviour, and policy — are proposed, reviewed, approved, and communicated.

---

## Scope of change management

Changes subject to this process include:

- document templates and their statutory references;
- knowledge-base items;
- AI system prompts, safety phrase sets, and escalation rules;
- workflow definitions and task templates;
- legal/policy pages (terms, privacy, disclaimers);
- product boundaries and risk classifications;
- data-retention periods and deletion procedures;
- major UX or navigation changes that affect user understanding of boundaries.

---

## Change proposal

`CM-REQ-001`: Every non-trivial change SHALL be proposed as a change request containing:

- description of the change;
- reason / problem being solved;
- affected products and documents;
- jurisdiction and language scope;
- risk assessment;
- required reviews (legal, content, engineering, accessibility, privacy);
- user-facing impact;
- rollback plan.

`CM-REQ-002`: Emergency changes (e.g., removing a harmful AI output, fixing a dangerous template error) MAY follow an expedited process, but SHALL still be documented and reviewed after the fact.

---

## Review and approval

`CM-REQ-003`: Changes SHALL be reviewed by the appropriate owners:

- **Legal / policy changes** → privacy/commercial counsel.
- **Template content changes** → domain reviewer + legal spot-check if risk is medium/high.
- **Knowledge-base changes** → knowledge owner + legal review if statutory figures are involved.
- **AI safety changes** → safety reviewer + legal review if escalation/crisis content changes.
- **Workflow changes** → product + legal review if user handoffs or risk classifications change.
- **UX/navigation changes** → product + accessibility review.
- **Data/retention changes** → privacy/legal review.

`CM-REQ-004`: Approval SHALL be recorded with approver name, date, and scope.

`CM-REQ-005`: Changes that affect the meaning of legal information or product boundaries SHALL NOT be deployed without the required reviews.

---

## Versioning

`CM-REQ-006`: Document templates, knowledge items, and workflow definitions SHALL be versioned.

`CM-REQ-007`: New versions SHALL NOT retroactively alter existing user documents or saved situations. Existing documents remain tied to the version used at creation.

`CM-REQ-008`: Deprecated versions SHALL be retained until no active user document references them, or for the documented retention period, whichever is longer.

`CM-REQ-009`: A changelog SHALL record version changes, effective dates, and superseded-by relationships.

---

## Testing before release

`CM-REQ-010`: Changes SHALL be tested in a non-production environment before release.

`CM-REQ-011`: Deterministic rule changes (jurisdiction gates, ClauseGates, deadline calculations, safety phrase sets) SHALL have fixture-driven tests.

`CM-REQ-012`: Template changes SHALL be validated for:

- bilingual completeness (`en` and `fr` values for all user-facing strings);
- unresolved merge tokens;
- valid jurisdiction references;
- required questions and validation rules;
- disclaimer presence;
- accessibility of generated output (where applicable).

`CM-REQ-013`: AI behaviour changes SHALL be evaluated against a fixed evaluation set for safety, grounding, and escalation coverage.

`CM-REQ-014`: UX changes SHALL be tested in both languages and both light/dark themes for accessibility.

---

## Deployment and rollout

`CM-REQ-015`: Changes SHOULD be rolled out gradually using feature flags or staged releases where feasible.

`CM-REQ-016`: High-risk changes (e.g., new high-risk template, new jurisdiction coverage, new AI model) SHOULD be released to a limited beta group before general availability.

`CM-REQ-017`: Rollbacks SHALL be possible for changes that introduce errors, safety failures, or legal exposure.

---

## User communication

`CM-REQ-018`: Users SHALL be notified of changes that materially affect their rights, data handling, or the product's boundaries:

- changes to terms, privacy policy, or disclaimers;
- changes to AI-provider terms or data residency;
- changes to retention periods;
- removal of previously offered templates or features;
- changes that affect existing saved documents or situations.

`CM-REQ-019`: User-facing change notices SHALL be bilingual and SHALL explain the practical impact.

`CM-REQ-020`: For knowledge-base changes that affect saved documents (e.g., a statutory reference becomes outdated), the system SHOULD notify affected users and offer to regenerate or review the document.

---

## Documentation updates

`CM-REQ-021`: Every change SHALL update the relevant documentation in `docs/consumer/`:

- product definition documents;
- architecture and requirements documents;
- workflow documents;
- governance documents;
- decision logs.

`CM-REQ-022`: The `docs/consumer/README.md` index SHALL be updated if new documents are added.

`CM-REQ-023`: `docs/CANONICAL_FACTS.md` or a consumer-specific canonical-facts document SHALL be updated if the change affects a load-bearing fact (e.g., number of jurisdictions covered, number of templates, pricing).

---

## Post-change review

`CM-REQ-024`: After deployment, the team SHALL monitor for:

- error rates;
- AI safety gate triggers;
- support tickets about accuracy or boundaries;
- user feedback;
- legal/regulatory developments that may affect the change.

`CM-REQ-025`: Critical changes SHALL have a scheduled post-implementation review within 30 days.

---

## Requirements trace

- `governance/knowledge-governance.md` — knowledge update process.
- `governance/legal-review-requirements.md` — review requirements.
- `architecture/knowledge-architecture.md` — versioning and supersession.
