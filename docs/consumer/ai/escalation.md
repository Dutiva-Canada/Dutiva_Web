# Escalation

## Purpose

Escalation ensures that users are directed to qualified professionals or emergency services when a situation is beyond what the product can safely handle. The product escalates while still helping — it does not simply punt.

---

## Escalation categories

| Category | When it applies | Destination | Product behaviour |
|---|---|---|---|
| **Crisis / emergency** | Imminent risk of harm to self or others; medical emergency; immediate danger. | 9-1-1, 9-8-8, crisis lines, emergency services. | Stop administrative guidance; show crisis resources; offer to contact emergency services if technically possible. |
| **Legal complexity** | High-stakes legal matter; potential litigation; rights in dispute; multi-jurisdiction conflict. | Employment lawyer, tenant advocate, family lawyer, immigration lawyer, civil litigator, legal aid clinic. | Explain why a professional is needed; preserve next steps; suggest what documents/evidence to gather; offer to generate a referral-request or records-request letter. |
| **Regulated professional advice** | Tax, immigration, financial planning, insurance underwriting, estate administration, regulated health professions. | Accountant, immigration consultant, financial planner, insurance broker, estate lawyer, health professional. | Flag the boundary; provide general information only; recommend professional; avoid specific advice. |
| **Government filing / tribunal** | A document must be filed with a court, tribunal, or government body; deadlines have passed or are imminent. | Relevant tribunal, government office, ombudsman, or lawyer. | Provide procedural orientation and deadlines (where sourced); recommend professional or direct filing assistance; do not imply the product can file for the user. |
| **Jurisdiction uncertainty** | The system cannot determine which jurisdiction applies or jurisdictions conflict. | User must confirm; if high-stakes, recommend a professional. | Ask clarifying questions; offer jurisdiction-neutral guidance; flag if the matter is too uncertain to proceed safely. |
| **AI confidence too low** | The model is unsure and cannot ground its answer in vetted knowledge. | Human review or professional. | State the uncertainty clearly; do not present a fabricated answer; recommend verification or professional help. |

---

## Escalation UX

`AI-REQ-070`: Escalation SHALL be communicated clearly and calmly, without alarming the user unnecessarily.

`AI-REQ-071`: Every escalation message SHALL:

- state the reason for escalation;
- explain what the product will and will not do next;
- provide safe, immediate next steps the user can take;
- suggest the type of professional or service to contact;
- include relevant resources (e.g., legal aid finder, tenant hotline, crisis line) where available.

`AI-REQ-072`: Escalation SHALL be presented as a helpful boundary, not as a refusal. For example: "This situation may affect your legal rights, so a lawyer is the right person to assess it. While you arrange that, here are steps you can take now to protect your position."

`AI-REQ-073`: The system SHALL allow the user to save their situation, evidence, and generated drafts before leaving the product to contact a professional.

---

## Escalation in document generation

`CDG-REQ-048`: The system SHALL refuse to generate a document and escalate when:

- the template is in a prohibited category (e.g., court pleadings, notarized documents);
- the user's answers indicate high legal risk (e.g., fraud allegations, threatened litigation);
- the required professional review has not been acknowledged;
- the document must be filed with a court, tribunal, or government body.

`CDG-REQ-049`: The refusal SHALL explain why, suggest alternatives (e.g., records request, professional referral letter), and offer to connect with the Evidence Locker to organize supporting material.

---

## Escalation in evidence handling

`PEL-REQ-075`: The system SHALL escalate when evidence analysis suggests:

- criminal activity or fraud;
- safety risk;
- imminent legal deadline that has passed;
- need for a regulated professional (e.g., forensic accountant, lawyer).

`PEL-REQ-076`: The system SHALL NOT claim that stored evidence will be admissible in court or sufficient to win a dispute.

---

## Professional referral information

`AI-REQ-074`: The system MAY provide general guidance on how to find a qualified professional (e.g., law society referral service, legal aid, tenant advocacy groups, provincial/territorial consumer protection offices). It SHALL NOT recommend a specific paid service or individual unless independently vetted.

`AI-REQ-075`: The system SHALL clearly distinguish between public services (legal aid, government offices, hotlines) and private professionals.

---

## When escalation is optional vs. mandatory

| Mandatory escalation | Optional recommendation |
|---|---|
| Crisis/emergency signals | Complex but manageable consumer complaint |
| Prohibited document category | High-dollar dispute where a lawyer could help |
| Litigation or threatened litigation | Cross-border move with tax implications |
| Past or imminent statutory deadline | Unclear jurisdiction but low stakes |
| Allegations of crime, fraud, or safety violations | User simply says "I want to talk to a lawyer" |

`AI-REQ-076`: Mandatory escalations SHALL block the action that triggered them. Optional recommendations SHALL be presented clearly but SHALL NOT block the user from continuing if they understand the limitation.

---

## Logging and review

`AI-REQ-077`: Every escalation event SHALL be logged with the trigger category, the action taken, and the user-facing message, without storing PII.

`AI-REQ-078`: Escalation patterns SHALL be reviewed periodically to ensure the rules are neither over- nor under-escalating.
