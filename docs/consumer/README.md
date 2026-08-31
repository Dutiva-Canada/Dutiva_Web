# Consumer Product Family — Documentation

This directory contains the product definition for three related Canadian consumer products:

1. **Canadian Life Admin** — helps Canadians understand and manage personal administrative obligations, deadlines, documents, rights, and responsibilities.
2. **Canadian Document Generation** — helps users create appropriate administrative documents from structured information.
3. **Personal Evidence Locker** — a secure personal evidence/document repository designed around preserving and organizing evidence.

---

## Status

This is **documentation-only**. No application code, database schemas, migrations, APIs, UI components, routes, or infrastructure are defined here. The purpose is to give a senior engineering/product team a complete foundation for later implementation.

---

## How to read this documentation

- Start with the **product definitions** in `product/`.
- Read `strategy/product-strategy.md` and `strategy/product-boundaries.md` next.
- Use the **architecture** and **requirements** sections for implementation planning.
- Cross-reference **workflows**, **AI**, **data**, **documents**, and **evidence** sections for detailed behaviour.
- Check `governance/legal-review-requirements.md` and `decisions/open-questions.md` before committing to build decisions.

---

## Precedence rules

- `docs/CANONICAL_FACTS.md` remains the source of record for every load-bearing fact about **Dutiva**.
- The consumer products are a separate product surface. Any consumer-specific canonical facts belong in `governance/canonical-facts-consumer.md` if and when they exist.
- Where this documentation disagrees with a later implementation, **the implementation wins** and this documentation must be updated in the same change.
- No document here may state a statutory figure, deadline, or dollar threshold unless it is explicitly sourced to an official government text and marked with `review_status` and `effective_date`.

---

## Requirement identifiers

Requirement IDs are scoped by domain:

| Prefix           | Domain                            |
| ---------------- | --------------------------------- |
| `CLA-REQ-NNN`    | Canadian Life Admin               |
| `CDG-REQ-NNN`    | Canadian Document Generation      |
| `PEL-REQ-NNN`    | Personal Evidence Locker          |
| `SHARED-REQ-NNN` | Cross-product requirements        |
| `AI-REQ-NNN`     | AI behaviour and safety           |
| `SEC-REQ-NNN`    | Security and privacy              |
| `ACC-REQ-NNN`    | Accessibility                     |
| `BIL-REQ-NNN`    | Bilingualism / localization       |
| `NFR-REQ-NNN`    | Non-functional requirements       |
| `PRIV-REQ-NNN`   | Privacy requirements              |
| `DATA-REQ-NNN`   | Data classification               |
| `RET-REQ-NNN`    | Retention and deletion            |
| `INT-REQ-NNN`    | Evidence integrity                |
| `TM-REQ-NNN`     | Timeline model                    |
| `DTAX-REQ-NNN`   | Document taxonomy                 |
| `DSPEC-REQ-NNN`  | Document generation specification |
| `SOURCE-REQ-NNN` | Source and citation               |
| `LREV-REQ-NNN`   | Legal review                      |
| `KG-REQ-NNN`     | Knowledge governance              |
| `CM-REQ-NNN`     | Change management                 |
| `OQ-REQ-NNN`     | Open questions                    |

Each file restarts numbering at `001`.

---

## Relationship to Dutiva

The consumer products are conceptually related to the Dutiva HR-compliance platform but serve a different audience (individuals and families, not employers). They may reuse Dutiva's **generic** infrastructure patterns — bilingual string handling, design tokens, document-engine concepts, and AI safety patterns — but they must not reuse Dutiva's employer-facing knowledge corpus, templates, or legal claims. See `strategy/product-strategy.md` and `architecture/system-overview.md`.

---

## Index

| Section      | Documents                                                                                                                                                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product      | `product/canadian-life-admin.md`, `product/canadian-document-generation.md`, `product/personal-evidence-locker.md`                                                                                                                                                |
| Strategy     | `strategy/product-strategy.md`, `strategy/product-boundaries.md`, `strategy/target-users.md`, `strategy/positioning.md`                                                                                                                                           |
| Architecture | `architecture/system-overview.md`, `architecture/shared-domain-model.md`, `architecture/jurisdiction-model.md`, `architecture/knowledge-architecture.md`, `architecture/evidence-architecture.md`, `architecture/ai-architecture.md`                              |
| Requirements | `requirements/functional-requirements.md`, `requirements/non-functional-requirements.md`, `requirements/security-requirements.md`, `requirements/privacy-requirements.md`, `requirements/accessibility-requirements.md`, `requirements/bilingual-requirements.md` |
| Workflows    | `workflows/life-admin-workflows.md`, `workflows/document-generation-workflows.md`, `workflows/evidence-workflows.md`                                                                                                                                              |
| AI           | `ai/ai-behaviour.md`, `ai/ai-safety.md`, `ai/escalation.md`, `ai/source-and-citation-requirements.md`                                                                                                                                                             |
| Data         | `data/conceptual-data-model.md`, `data/data-classification.md`, `data/retention-and-deletion.md`                                                                                                                                                                  |
| Documents    | `documents/document-taxonomy.md`, `documents/document-generation-specification.md`                                                                                                                                                                                |
| Evidence     | `evidence/evidence-model.md`, `evidence/evidence-integrity.md`, `evidence/timeline-model.md`                                                                                                                                                                      |
| Governance   | `governance/legal-review-requirements.md`, `governance/knowledge-governance.md`, `governance/change-management.md`                                                                                                                                                |
| Roadmap      | `roadmap/mvp.md`, `roadmap/phase-2.md`, `roadmap/phase-3.md`, `roadmap/future-opportunities.md`                                                                                                                                                                   |
| Decisions    | `decisions/architecture-decisions.md`, `decisions/open-questions.md`                                                                                                                                                                                              |
