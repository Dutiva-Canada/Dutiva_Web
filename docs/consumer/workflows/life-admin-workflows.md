# Life Admin Workflows

## Purpose

Canadian Life Admin turns a user's described situation into a structured, actionable workflow. These workflows are conceptual descriptions of the user journey and the system's responsibilities.

## Universal workflow: situation → action

Every Life Admin interaction follows this pattern:

```text
User describes situation
        │
        ▼
System confirms jurisdiction (province/territory/federal scope)
        │
        ▼
System classifies the life event (employment, housing, consumer, etc.)
        │
        ▼
System asks clarifying questions
        │
        ▼
System retrieves vetted knowledge and identifies tasks, deadlines, documents, evidence
        │
        ▼
System presents structured next steps with confidence and source links
        │
        ▼
User can save situation, generate a document, capture evidence, or escalate
```

---

## Workflow 1: Losing a job

### User goal

Understand what to do after a termination or layoff, including pay, notice, records, and next steps.

### Steps

1. **Intake.** User describes: "I was let go today after three years."
2. **Jurisdiction.** System asks: which province/territory is the job in? Is the employer federally regulated?
3. **Clarifying questions.** System asks: written or verbal notice? Cause or without cause? Is there a written contract? Was a Record of Employment provided?
4. **Knowledge retrieval.** System retrieves jurisdiction-neutral and jurisdiction-specific legal information from the vetted knowledge base.
5. **Next steps.** System suggests:
   - request a written termination letter if not provided;
   - request a Record of Employment from Service Canada or the employer;
   - review final pay statement;
   - preserve emails, letters, contract, pay stubs as evidence;
   - understand the difference between statutory minimums and potential common-law notice;
   - consider whether the termination appears proper or whether to consult an employment lawyer.
6. **Confidence and boundaries.** System labels which steps are statutory, which are fact-dependent, and which require professional advice.
7. **Handoffs.** System offers to:
   - open Personal Evidence Locker with a "job loss" case;
   - generate a request letter for the Record of Employment;
   - add a task reminder for deadline tracking.

### Escalation triggers

- Allegations of discrimination, harassment, or reprisal.
- Suspicion of constructive dismissal.
- Termination for cause.
- User is a union member or covered by a collective agreement.
- User is in a safety-sensitive or regulated profession.

---

## Workflow 2: Renting a home / repair dispute

### User goal

Get a landlord to make repairs or document a tenancy problem.

### Steps

1. **Intake.** User describes: "My landlord hasn't fixed the heat in two weeks."
2. **Jurisdiction.** System asks: province/territory and municipality.
3. **Clarifying questions.** System asks: what does the lease say? Has the issue been reported in writing? Is there a local bylaw or tenant hotline?
4. **Knowledge retrieval.** System retrieves jurisdiction-specific landlord-tenant obligations and procedures.
5. **Next steps.** System suggests:
   - document the problem with photos, temperature logs, and written communication;
   - send a formal written repair request;
   - know the local rent abatement or maintenance remedy process;
   - contact the landlord-tenant board or tribunal if unresolved.
6. **Handoffs.** System offers:
   - generate a repair-request letter;
   - create an Evidence Locker case for the tenancy;
   - build a timeline of events.

### Escalation triggers

- Health/safety emergency (e.g., no heat in winter, flooding, mould).
- Threats or harassment by landlord.
- Eviction notice already served.
- Retaliation by landlord.

---

## Workflow 3: Moving between provinces

### User goal

Understand administrative tasks when moving from one province/territory to another.

### Steps

1. **Intake.** User describes origin and destination provinces.
2. **Jurisdiction.** System confirms both.
3. **Clarifying questions.** System asks about vehicle, health card, driver's licence, employment, tenancy, dependents, etc.
4. **Knowledge retrieval.** System retrieves address-change, health coverage, driver's-licence, vehicle-registration, and tax obligations for both jurisdictions.
5. **Next steps.** System produces a personalized checklist:
   - change of address with CRA/postal service;
   - update driver's licence and vehicle registration by deadline;
   - apply for health coverage in destination province (noting waiting periods);
   - notify employer/pension/insurer;
   - update tenancy/address records.
6. **Handoffs.** System offers to:
   - generate an address-change letter;
   - set deadline reminders;
   - create an Evidence Locker case for moving documents.

### Escalation triggers

- Employment relocation packages with tax implications.
- Cross-border (Canada/U.S. or international) moves.
- Mobility/disability-related moves requiring accommodation.

---

## Workflow 4: Consumer complaint / refund

### User goal

Get a refund or resolve a dispute with a business.

### Steps

1. **Intake.** User describes: "I bought a defective appliance and the store refuses a refund."
2. **Jurisdiction.** System asks: province/territory of purchase.
3. **Clarifying questions.** System asks: was it paid by credit card? Is there a warranty? Has a written complaint been sent? Is the business federally regulated (e.g., telecom, bank, airline)?
4. **Knowledge retrieval.** System retrieves consumer protection rules and complaint pathways.
5. **Next steps.** System suggests:
   - gather receipt, warranty, photos, communications;
   - send a formal written complaint/request;
   - if unresolved, escalate to provincial/territorial consumer protection office or federal regulator (e.g., CCTS, FCAC, CTA) as appropriate;
   - consider small-claims court for larger amounts (with professional-advice warning).
6. **Handoffs.** System offers:
   - generate a complaint or refund request letter;
   - create an Evidence Locker case with the purchase record.

### Escalation triggers

- Significant dollar amount.
- Allegations of fraud.
- Product safety issue.
- Business is unresponsive or threatening.

---

## Workflow 5: Handling the death of a family member

### User goal

Understand immediate and short-term administrative steps.

### Steps

1. **Intake.** User indicates the life event.
2. **System response.** Because this is a high-sensitivity and legally complex area, the system provides:
   - a short, gentle checklist of immediate administrative steps (register death, obtain death certificate, notify employer/pension/insurer, secure property);
   - clear statements that estate matters vary by province/territory and complexity;
   - a strong recommendation to contact a lawyer, funeral director, or estate administrator as appropriate.
3. **Handoffs.** System offers:
   - an Evidence Locker case for estate documents;
   - a task list for user tracking;
   - no document generation for estate-legal documents.

### Escalation triggers

- This workflow is largely treated as high-risk and professional-advice-recommended from the start.

---

## General system responsibilities

`CLA-REQ-016`: The system SHALL confirm jurisdiction before presenting jurisdiction-specific steps.

`CLA-REQ-017`: The system SHALL classify the life event, ask only necessary clarifying questions, and avoid over-collecting sensitive data.

`CLA-REQ-018`: The system SHALL present next steps with confidence indicators and source links.

`CLA-REQ-019`: The system SHALL identify escalation triggers and recommend a qualified professional or emergency service when appropriate.

`CLA-REQ-020`: The system SHALL offer clear handoffs to Document Generation and Personal Evidence Locker without forcing them.

`CLA-REQ-021`: The system SHALL let the user save the situation, edit it, or start over at any point.

---

## AI vs deterministic workflow modes

| Mode              | User experience                                        | System behaviour                                                                                     |
| ----------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Deterministic** | Structured intake with branching questions.            | Rule-based classification, fixed knowledge retrieval, deterministic next steps.                      |
| **AI-assisted**   | Free-text description + optional clarifying questions. | LLM proposes situation, jurisdiction, and next steps; deterministic rules confirm, gate, and ground. |

Both modes SHALL use the same safety backstop (crisis intercept, jurisdiction gate, statutory-figure gate, escalation gate).
