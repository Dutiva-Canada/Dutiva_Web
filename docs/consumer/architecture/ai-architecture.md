# AI Architecture

## Design principle

The products are **AI-assisted**, not **AI-governed**. A large language model is used only where open-ended natural-language understanding is genuinely required. Everything that can be a rule, a lookup, a template, or a search is implemented deterministically.

> The LLM proposes; deterministic code disposes.

This mirrors Dutiva's AI usage strategy (`docs/AI_USAGE_STRATEGY.md`) but applies to a consumer, personal-administrative domain.

---

## Irreducible LLM uses

These are the consumer-product capabilities that cannot be built without a generative model:

| Use case | Why an LLM is needed | What is deterministic around it |
|---|---|---|
| **Situation understanding** | Users describe situations in open-ended prose. The set of possible inputs is unbounded. | Classification into canonical `LifeEvent`s, jurisdiction prompts, confidence scoring. |
| **Memory / fact extraction** | Turning free-text descriptions into structured facts (dates, parties, amounts) is a canonical LLM task. | Facts are `Inferred` until user confirms; provenance and confidence are mandatory. |
| **Evidence summarization / extraction** | Documents are unstructured; users need help identifying dates, parties, obligations, contradictions. | Extracted claims are stored as `EvidenceInterpretation`, never as primary evidence. |
| **Natural-language answers** | Explaining next steps in plain language, in the user's chosen language. | Citations, figures, and deadlines are drawn from deterministic rules; the LLM does not author them. |

---

## Deterministic by design

These MUST remain deterministic, never generative:

| Capability | Why deterministic | Risk if LLM-authored |
|---|---|---|
| Document assembly | Merge tokens + `ClauseGate` conditions produce identical, reproducible output. | Unreproducible legal documents, unfilled placeholders, incorrect clauses. |
| Statutory figures and deadlines | Arithmetic, calendars, and statute tables are auditable. | Hallucinated deadlines or dollar amounts. |
| Jurisdiction-specific clauses | Conditions are explicit and testable. | Wrong-province clauses inserted silently. |
| Citation / legal basis | Only vetted knowledge items marked `valid` are used. | Fabricated statutes or sections. |
| Crisis / escalation detection | Phrase sets and rules fire on the safe side. | A missed crisis or an unflagged high-risk matter. |
| Routing / mode classification | Model classifies; rules enforce the consequences. | A misclassified turn leading to wrong UI surfaces. |

---

## AI behaviour

`AI-REQ-004`: The AI SHOULD:

- identify the user's situation from free-text input;
- ask only necessary clarifying questions;
- determine the relevant jurisdiction before giving jurisdiction-specific guidance;
- distinguish facts from assumptions;
- identify uncertainty and explain it;
- explain relevant information in plain language;
- produce structured next steps;
- identify missing information that affects guidance;
- identify potentially relevant evidence;
- assist with document preparation by suggesting templates, not drafting clauses from scratch;
- reference authoritative sources where appropriate;
- escalate when the situation requires a regulated professional, emergency services, or is beyond the product's scope.

`AI-REQ-005`: The AI SHOULD NOT:

- pretend to be a lawyer, paralegal, or other regulated professional;
- invent laws, regulations, deadlines, government procedures, or rights;
- state uncertain conclusions as facts;
- delete or alter original evidence;
- treat AI-generated interpretations as primary evidence;
- encourage users to fabricate, destroy, or manipulate evidence;
- give statutory figures before jurisdiction is confirmed;
- provide crisis resources that are not from a maintained, verified list;
- generate disclaimers, crisis text, or statutory references from memory.

---

## Safety backstop pattern

The consumer products reuse the same defence-in-depth pattern as Dutiva's Advisor:

1. **Crisis / distress intercept.**
   - A maintained bilingual phrase set detects signals of imminent harm or severe distress.
   - The model's classification is OR'd with the rule-based detection; the rule can raise a crisis but cannot clear one.
   - On crisis detection, the system provides emergency/crisis resources and gates off all other guidance.

2. **Jurisdiction gate.**
   - Jurisdiction defaults to `unknown`.
   - Until confirmed, no province/territory-specific statutory figures, deadlines, or citations are presented.
   - A deterministic check inspects the model's output for figures; if jurisdiction is not confirmed, the figure is withheld and a warning is shown.

3. **Statutory-figure gate.**
   - For situations where an encoded lookup table exists (e.g., a statutory notice schedule), the figure the model states is cross-checked against the table.
   - A mismatch withholds the authoritative basis and warns the user.
   - Where no table exists, the system says so rather than guessing.

4. **Professional-advice / escalation gate.**
   - High-risk keywords, detected life events, or template risk levels trigger an escalation banner and a recommendation to consult a qualified professional.
   - This gate is monotonic: it can only tighten, never loosen.

`AI-REQ-006`: The system SHALL implement a deterministic safety backstop around every generative AI output that affects jurisdiction, crisis, statutory figures, or high-risk situations.

---

## Model routing and telemetry

`AI-REQ-007`: Model calls SHALL be server-side. Provider secrets SHALL NOT be exposed in the browser or client bundle.

`AI-REQ-008`: The system SHALL log every model call to an append-only telemetry store with:

- provider and model identifier;
- operation type (situation classification, evidence extraction, chat reply, etc.);
- token usage and latency;
- status (started, completed, failed);
- request/response metadata (no PII, no message bodies, no evidence content).

`AI-REQ-009`: The system SHALL enforce per-user and platform-wide usage budgets (burst, daily requests, daily tokens) and SHALL fail closed when a limit cannot be evaluated.

`AI-REQ-010`: The system SHALL allow AI analysis of evidence and documents only with explicit user consent and SHALL provide an opt-out in settings.

---

## Retrieval and grounding

`AI-REQ-011`: The AI SHALL ground legal, procedural, and factual claims in the vetted knowledge base described in `architecture/knowledge-architecture.md`.

`AI-REQ-012`: Retrieved knowledge items SHALL be referenced by ID so the system can verify the source, review status, and effective date before presenting them.

`AI-REQ-013`: If no vetted knowledge item is available for a question, the AI SHALL say so and SHALL NOT generate a plausible-sounding answer.

---

## Evidence and AI

`AI-REQ-014`: When analyzing evidence, the AI SHALL:

- treat the original file as immutable;
- store all extracted claims as `EvidenceInterpretation` with confidence and model metadata;
- let the user confirm, edit, or dismiss each claim;
- never present an unconfirmed extraction as fact in a generated document or timeline.

---

## Bilingual AI behaviour

`AI-REQ-015`: The AI SHALL respond in the user's selected language (`en` or `fr`) and SHALL NOT mix languages in a single response except when quoting official statute names or bilingual proper nouns.

`AI-REQ-016`: French legal terminology SHALL be reviewed for Québec-appropriateness; machine translation of legal concepts SHALL NOT be used for user-facing output.

---

## Gate test for new AI features

Before adding any LLM to a feature, it must pass all five:

1. **Open vocabulary?** Is the input genuinely open-ended natural language? If fixed options or a lookup covers it, use those.
2. **Reproducibility.** Does the output need to be identical every time (documents, figures, deadlines)? If yes, it is deterministic.
3. **Grounding.** Are facts/citations retrieved and vetted, never recalled from the model?
4. **Fail-safe gate.** Is there a deterministic guard that fires on the safe side regardless of model output?
5. **Auth + budget.** Is the call authenticated, rate-limited, and logged without PII?

A feature that cannot answer yes to 2–5 should ship deterministic first and add the model only where step 1 truly requires it.
