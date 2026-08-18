# Canadian Life Admin — Product Definition

## Purpose

Canadian Life Admin helps individual Canadians answer the question:

> "I have a situation. Tell me what I need to do."

It turns a user's real-world administrative situation into a structured, actionable workflow: identify the domain, determine the relevant jurisdiction, surface authoritative information, list deadlines and documents, suggest next steps, and hand off to document generation or evidence capture where appropriate.

---

## Core proposition

- **Situation-first**: the user describes what is happening in plain language; the product maps it to a structured life event.
- **Jurisdiction-aware**: rules differ by province, territory, federal regime, and sometimes municipality. The product never assumes a national rule.
- **Action-oriented**: output is a sequence of things the user can do, not an essay about the law.
- **Trust-first**: the product is transparent about what it knows, what it does not know, and when a qualified professional is needed.

---

## What it is

- A personal administrative guidance system.
- A situation-to-workflow mapper.
- A source-grounded information tool that points to official legislation, agencies, and tribunals.
- A bridge to Canadian Document Generation and Personal Evidence Locker.

## What it is not

- **Not a law firm or a lawyer.** It does not provide legal advice, legal representation, or solicitor-client advice.
- **Not a government agency.** It does not file forms, issue permits, or make government decisions.
- **Not a financial advisor, tax preparer, or immigration consultant.** It does not prepare tax returns, investment plans, or immigration applications.
- **Not an emergency service.** For emergencies, users must contact 9-1-1 or other crisis services directly.
- **Not a substitute for regulated professional advice** when the situation requires it.

---

## Supported life situations (illustrative)

The product should be designed to handle these categories. The list is not exhaustive.

| Category | Examples |
| --- | --- |
| Employment | Starting a job, losing a job, resigning, changing roles, workplace accommodation, discrimination or harassment concern, record requests. |
| Housing | Renting a home, ending a tenancy, landlord disputes, repair requests, moving between provinces, buying a home. |
| Consumer | Making a complaint, requesting a refund, warranty claim, cancelling a service, escalation to regulator. |
| Government / administrative | Receiving government correspondence, applying for benefits, information requests, address changes, name changes. |
| Family / personal | Getting married, separating, having a child, handling the death of a family member, estate administration basics. |
| Business / side work | Starting a side business, closing a business, contractor status, HST/GST basics, business registration. |
| Insurance / benefits | Managing insurance claims, policy renewals, benefit disputes. |
| Documents and records | Organizing important personal documents, understanding retention obligations, responding to record requests. |

---

## Guidance taxonomy

Every answer or workflow step must be classified into one of five tiers. The UI must make the tier visible to the user.

| Tier | Description | Example |
| --- | --- | --- |
| **1. General information** | Factual, non-legal description of how something works. | "A notice of termination is a written statement that an employer is ending employment." |
| **2. Administrative guidance** | Practical steps a person can take to handle an administrative matter. | "Keep a copy of your termination letter, record your last day, and ask for your Record of Employment." |
| **3. Legal information** | What a statute or regulation says, sourced and jurisdiction-scoped. | "In Ontario, the *Employment Standards Act, 2000* requires written notice of termination in most cases." |
| **4. Regulated professional advice** | A recommendation that must come from a lawyer, accountant, consultant, or other regulated professional. | "If you believe you were dismissed for cause improperly, consider speaking with an employment lawyer." |
| **5. Escalation / crisis** | Requires immediate help or a regulated professional; product stops giving guidance and provides resources. | "If you are unsafe, contact 9-1-1." |

`CLA-REQ-001`: The system SHALL classify every substantive guidance output into one of the five tiers and display the classification clearly.

---

## Jurisdiction handling

`CLA-REQ-002`: The system SHALL determine the user's province or territory, or whether the matter is federally regulated, before presenting jurisdiction-specific rules.

`CLA-REQ-003`: If jurisdiction cannot be determined, the system SHALL present only jurisdiction-neutral guidance and ask the user to confirm the province/territory or federal scope.

`CLA-REQ-004`: The system SHALL name the relevant statute or agency (e.g., *Employment Standards Act, 2000*; *Loi sur les normes du travail*; Canada Labour Code, Part III) and SHALL NOT refer vaguely to "the law" or "the rules."

`CLA-REQ-005`: For any situation that may involve both provincial and federal jurisdiction, the system SHALL help the user identify which applies and flag uncertainty.

---

## User control and transparency

`CLA-REQ-006`: The system SHALL distinguish facts the user has provided from assumptions it has made, and SHALL let the user correct facts and assumptions.

`CLA-REQ-007`: The system SHALL surface its confidence in each recommendation (e.g., established rule vs. fact-dependent outcome) and explain the basis.

`CLA-REQ-008`: The system SHALL let the user save a situation, rename it, revisit it later, and delete it.

`CLA-REQ-009`: The system SHALL provide a clear "start over" path if the user's situation changes.

---

## Handoffs to related products

`CLA-REQ-010`: The system SHALL identify evidence that may be relevant to a situation and offer to capture it in Personal Evidence Locker.

`CLA-REQ-011`: The system SHALL identify documents that may be appropriate to generate and offer to open the corresponding template in Canadian Document Generation.

`CLA-REQ-012`: Handoffs SHALL preserve context (situation, jurisdiction, known facts) but SHALL NOT proceed without explicit user confirmation.

---

## Disclaimers

`CLA-REQ-013`: The system SHALL display a standing disclaimer on every substantive guidance surface: the product provides practical administrative guidance and legal information, not legal advice.

`CLA-REQ-014`: Before a user acts on any high-risk or fact-dependent guidance, the system SHALL recommend consulting a qualified professional.

---

## Escalation triggers

`CLA-REQ-015`: The system SHALL escalate and stop providing administrative guidance when the situation involves:

- imminent safety risk;
- allegations of crime or fraud;
- litigation or threatened litigation;
- statutory deadlines that have already passed or are imminent and require professional assessment;
- complex multi-jurisdiction conflicts;
- matters governed by a profession the product does not cover (e.g., tax, immigration, family-law disputes, estate litigation).

---

## User-facing terminology

- Use plain language. Avoid unnecessary legal jargon.
- Use Canadian terminology (province/territory, CRA, Service Canada, CNESST, landlord/tenant, etc.).
- Every string ships in English and French; see `requirements/bilingual-requirements.md`.
