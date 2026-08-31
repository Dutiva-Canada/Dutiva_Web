# Legal Review Requirements

## Purpose

This document identifies the consumer-product materials that require legal review before public launch or before being relied upon by users. It is derived from the Dutiva legal-review inventory pattern but scoped to consumer products.

---

## Materials requiring legal review

### 1. Public legal pages

All public-facing legal and policy documents in both English and French:

- Terms of use / terms of service.
- Privacy policy.
- AI usage disclosure / AI technology policy.
- AI risk disclosure.
- Accessibility statement.
- Cookie policy.
- Refund and subscription policies.
- Data-processing agreement and subprocessor list.
- Incident-response policy.
- Acceptable-use policy.

`LREV-REQ-001`: Public legal pages SHALL be reviewed by Canadian privacy/commercial counsel before publication.

`LREV-REQ-002`: French versions SHALL be reviewed for Québec legal terminology and civil-law/Law 25 implications.

### 2. Consumer document templates

All document templates, by risk level:

| Risk / review flag                               | Reviewer                                                                                            | Scope                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lawyer_review_recommended` or `high` risk       | Canadian lawyer (employment, tenancy, consumer, or administrative law as appropriate)               | Full template, statutory references, jurisdiction-specific clauses, disclaimers. |
| `medium` risk or `hr_review_required` equivalent | Subject-matter expert (tenant advocate, employment advocate, consumer advocate) + lawyer spot-check | Template content, clarity, boundaries.                                           |
| `low` risk                                       | Knowledge/content reviewer                                                                          | Clarity, disclaimer, plain language.                                             |

`LREV-REQ-003`: No template SHALL be marked `approved_for_use` until the required review is complete and documented.

`LREV-REQ-004`: Templates with statutory references SHALL have those references verified against the current official text by a qualified reviewer.

`LREV-REQ-005`: Templates that involve multiple jurisdictions SHALL be reviewed for each supported jurisdiction.

### 3. Knowledge base / grounding corpus

- Statutory summaries;
- Deadline and notice schedules;
- Procedure summaries;
- Citation tables.

`LREV-REQ-006`: Knowledge items that contain statutory figures, deadlines, rights, or procedural requirements SHALL be reviewed by a qualified Canadian lawyer or the relevant government authority before being marked `valid`.

`LREV-REQ-007`: Knowledge items SHALL be re-reviewed after any known legislative amendment or at the defined review cadence.

### 4. AI safety and escalation content

- Crisis resource lists;
- Crisis phrase sets;
- Escalation triggers;
- Jurisdiction gates;
- Statutory-figure detection rules.

`LREV-REQ-008`: Crisis resources SHALL be verified against official sources and reviewed for accuracy and safety.

`LREV-REQ-009`: Escalation rules that affect whether users are directed to professionals SHALL be reviewed for legal and safety implications.

### 5. Product boundaries and disclaimers

- Product "is / is not" statements.
- Standing legal disclaimer.
- User-facing statements about what the product does and does not do.

`LREV-REQ-010`: Disclaimers and boundary statements SHALL be reviewed to ensure they do not create unintended solicitor-client, advisory, or agency relationships.

### 6. Business model and pricing terms

- Subscription terms;
- Refund policy;
- Free-tier limitations;
- Terms governing document generation and evidence storage.

`LREV-REQ-011`: Commercial terms SHALL be reviewed to ensure they comply with Canadian consumer-protection law and do not undermine trust (e.g., no misleading "legal advice" upsells).

### 7. Privacy and data handling

- Privacy policy;
- Consent flows;
- Data-retention and deletion procedures;
- Data-residency claims;
- Cross-border transfer arrangements;
- AI-provider data-processing terms.

`LREV-REQ-012`: Privacy documentation and practices SHALL be reviewed for compliance with PIPEDA, Québec Law 25, and applicable provincial privacy statutes.

`LREV-REQ-013`: Data-residency and cross-border claims SHALL be verified with each third-party provider before being stated publicly.

---

## Review sequencing

Recommended order to minimize rework:

1. Confirm product relationship to Dutiva and brand strategy.
2. Settle privacy policy, terms, and AI/data-processing disclosures with counsel.
3. Verify data-residency claim with AI provider and infrastructure vendor.
4. Review boundary statements, disclaimers, and crisis resources.
5. Review the first tranche of high-risk templates (e.g., employment, tenancy, consumer complaint escalation).
6. Review the knowledge base and statutory tables used by those templates.
7. Review medium/low-risk templates and public articles.
8. Review commercial terms before any paid tier launches.

---

## Review documentation

`LREV-REQ-014`: Every reviewed item SHALL record:

- reviewer name and credentials;
- review date;
- scope (jurisdictions, languages);
- outcome (approved with/without conditions, needs revision);
- conditions or follow-ups;
- next review due date.

`LREV-REQ-015`: Review records SHALL be stored in a location accessible to product, engineering, and compliance teams.

---

## Open legal questions

- Does offering document-generation templates for tenant/employment/consumer correspondence constitute unauthorized practice of law in any Canadian jurisdiction?
- Are disclaimers sufficient to avoid creating a solicitor-client or consultant-client relationship?
- What are the precise consent requirements for AI processing under Québec Law 25?
- Can the data-residency claim be made for the chosen AI provider and object-storage vendor?
- Do any provincial statutes impose specific record-keeping or evidence-handling obligations on consumer document services?
- What professional-liability insurance is appropriate for the product, if any?

These questions are also tracked in `decisions/open-questions.md`.
