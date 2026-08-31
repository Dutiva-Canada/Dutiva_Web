# Knowledge Governance

## Purpose

The consumer products depend on a vetted knowledge base of Canadian legal and administrative information. This document defines the governance model for creating, reviewing, updating, and retiring knowledge items.

---

## Knowledge ownership

`KG-REQ-001`: Every knowledge item SHALL have an owner — a person or team responsible for its accuracy, currency, and review.

`KG-REQ-002`: Knowledge owners SHALL be assigned by domain (e.g., employment, tenancy, consumer, government/federal, family, Québec civil law).

`KG-REQ-003`: The knowledge owner SHALL approve changes to items in their domain.

---

## Review cadence

`KG-REQ-004`: Knowledge items SHALL be re-reviewed at least annually, or sooner if:

- a known amendment to the underlying statute or regulation occurs;
- a court or tribunal decision materially affects the item;
- user feedback indicates the item may be inaccurate;
- an internal audit flags the item.

`KG-REQ-005`: High-risk knowledge items (those involving statutory figures, deadlines, rights, or high-stakes procedures) SHOULD be reviewed at least every six months.

`KG-REQ-006`: Items that are unlikely to change (e.g., the existence of a government agency, the name of a statute) may be reviewed annually unless a change is detected.

---

## Knowledge item lifecycle

```text
Draft
  │
  ▼
Under review
  │
  ▼
Valid
  │
  ▼
Superseded
  │
  ▼
Retired
```

| State          | Meaning                                  | User-facing?                                 |
| -------------- | ---------------------------------------- | -------------------------------------------- |
| `draft`        | New item being authored.                 | No.                                          |
| `needs_review` | Item not yet reviewed or review overdue. | No, except as "under review" with a warning. |
| `valid`        | Reviewed and current.                    | Yes.                                         |
| `superseded`   | Replaced by a newer item.                | No; the newer item is used.                  |
| `retired`      | No longer relevant or out of scope.      | No.                                          |

`KG-REQ-007`: Only items marked `valid` SHALL be used as authoritative legal basis in user-facing answers or documents.

`KG-REQ-008`: Items marked `needs_review` MAY be shown to internal reviewers but SHALL NOT be presented as authoritative to users.

---

## Change detection

`KG-REQ-009`: The system SHALL have a process to detect changes in authoritative sources:

- manual legal monitoring by knowledge owners;
- automated or semi-automated checks of official government webpages (where permitted and reliable);
- user feedback triage;
- news and regulator alerts.

`KG-REQ-010`: Detected changes SHALL be triaged and queued for review; they SHALL NOT be applied to user-facing content until reviewed.

`KG-REQ-011`: The system SHALL not claim to automatically detect every amendment merely because a monitoring job runs; the difference between "sweeping a page" and "detecting an amendment" SHALL be documented honestly. (See `docs/LAW_MONITORING.md` for the Dutiva precedent.)

---

## Source provenance and citations

`KG-REQ-012`: Every knowledge item SHALL record:

- source title and URL;
- source rank in the hierarchy (legislation, agency, court, etc.);
- jurisdiction;
- effective date;
- last-reviewed date;
- review status;
- reviewer attribution.

`KG-REQ-013`: Citations SHALL be stable and point to official sources where possible.

`KG-REQ-014`: If a source URL changes or is archived, the knowledge item SHALL be updated with the new authoritative location.

---

## Conflict resolution

`KG-REQ-015`: When two authoritative sources conflict, the knowledge owner SHALL:

- identify the conflict;
- determine whether one source supersedes the other (e.g., a newer regulation overrides an older fact sheet);
- if genuinely conflicting, present both with context and direct users to a qualified professional;
- escalate to legal counsel if the conflict affects a high-stakes area (e.g., deadlines, rights, penalties).

`KG-REQ-016`: Conflicts between federal and provincial/territorial sources SHALL be resolved by determining which level has authority for the user's specific situation; the system SHALL NOT silently prefer one.

---

## Bilingual knowledge maintenance

`KG-REQ-017`: Knowledge items SHALL be maintained in both English and French from the start.

`KG-REQ-018`: Updates to English content SHALL be matched by updates to French content; bilingual drift SHALL be treated as a defect.

`KG-REQ-019`: French legal terminology SHALL be reviewed by a French-speaking content or legal reviewer, ideally with Québec civil-law awareness.

---

## Public content rule

`KG-REQ-020`: Public-facing articles, guides, and marketing content SHALL NOT contain statutory figures, deadlines, or dollar thresholds. They MAY name the statute, describe the shape of the rule, and point to official sources.

`KG-REQ-021`: This rule is enforced by content review and, where possible, automated tests that flag numeric figures in public articles.

---

## Knowledge impact on products

`KG-REQ-022`: When a knowledge item is updated, superseded, or retired, the system SHALL assess the impact on:

- document templates referencing the item;
- workflow steps relying on the item;
- saved user documents and situations;
- AI retrieval results.

`KG-REQ-023`: Users who have saved content affected by a knowledge change SHALL be notified where feasible and appropriate (e.g., a generated document referenced a superseded source).

`KG-REQ-024`: Existing generated documents SHALL NOT be retroactively altered; new versions SHALL use the updated knowledge.

---

## Documentation and changelog

`KG-REQ-025`: The knowledge base SHALL maintain a changelog of updates, including:

- item changed;
- nature of change;
- reason (new legislation, review, correction, user feedback);
- reviewer;
- date;
- affected templates/workflows.

`KG-REQ-026`: The changelog SHALL be accessible to product, engineering, legal, and support teams.

---

## Quality metrics

`KG-REQ-027`: The product team SHOULD track:

- number of knowledge items by state and domain;
- review coverage and overdue reviews;
- number of user reports of inaccuracy;
- number of AI safety gates triggered due to stale or missing knowledge;
- number of public articles/templates affected by knowledge updates.

---

## Requirements trace

- `architecture/knowledge-architecture.md` — source hierarchy, provenance, review requirements.
- `ai/source-and-citation-requirements.md` — citation format, retrieval, and grounding rules.
