# Product Strategy — Consumer Product Family

## North star

Help individual Canadians understand and manage personal administrative obligations, deadlines, documents, rights, and responsibilities — with clear boundaries, strong privacy, and no false claims of legal representation.

## Strategic thesis

1. **Administrative work is hard to do once.** Most people do not know the steps, the deadlines, or the documents required for major life events. A trusted, plain-language guide can reduce the failure rate of first attempts.
2. **Jurisdiction matters.** A rule that applies in Ontario may not apply in Québec or to a federally regulated employer. Canadians moving between provinces repeatedly face this friction.
3. **Documents and evidence belong together.** A workflow that tells someone what to do is more useful when it can also help them generate the right letter and store the supporting evidence in one place.
4. **Trust is the product.** Consumers will share sensitive documents only if the product is transparent about what it is, who can see it, and what it does with AI.
5. **AI is a reasoning assistant, not a legal brain.** The product uses AI for natural-language understanding and structured extraction; it uses deterministic rules and vetted sources for facts, deadlines, and document assembly.

## Product relationship

Three options are documented in full in `decisions/architecture-decisions.md`:

| Option                                             | Short description                                                     | Provisional assessment                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **A — Independent products**                       | Separate brands, repositories, backends.                              | Cleanest liability and brand separation; highest cost.                       |
| **B — Consumer platform with modules**             | Shared auth, storage, and billing.                                    | Best long-term flywheel; requires strong product boundaries.                 |
| **C — Life Admin as core, others as capabilities** | Document generation and evidence locker support the primary workflow. | Best MVP narrative; risk that document/evidence features feel under-powered. |

The documentation does **not** make a final choice. It provides the analysis needed to decide once legal, brand, and engineering constraints are known.

## Sequencing

1. **Phase 1 — Canadian Life Admin MVP**
   - Situation intake, jurisdiction confirmation, structured next steps, handoff to document generation and evidence capture.
   - No or limited generative AI; deterministic rules and a small set of high-value situations.
2. **Phase 2 — Personal Evidence Locker**
   - Secure upload, case/situation organization, timeline, basic search, exports.
   - Evidence integrity model (hash, provenance, audit) from the start.
3. **Phase 3 — Canadian Document Generation**
   - A focused catalogue of low-risk, high-value templates (e.g., repair request, resignation letter, refund request).
   - Full bilingual support and disclaimer framework.
4. **Phase 4 — Integration flywheel**
   - Life Admin proposes documents and evidence; Evidence Locker supplies documents to Document Generation; generated documents return to the Locker.
   - Optional family accounts, municipality coverage, and professional referral handoff.

## Relationship to Dutiva

- The consumer products may share **generic** infrastructure concepts with Dutiva (bilingual string model, design tokens, document-engine patterns, AI safety patterns).
- They must **not** reuse Dutiva's employer-facing knowledge corpus, document templates, compliance scoring, or legal claims.
- If the consumer products ship under a Dutiva brand or sub-brand, the disclaimer must be adapted for consumers, and the privacy/terms must be consumer-appropriate.
- If they ship as an independent brand, the generic packages can still be reused, but all branding, sample data, and legal copy must be neutral.

## Success metrics (illustrative)

- Situation resolution rate: % of users who complete a workflow and report it helped.
- Jurisdiction confirmation rate: % of jurisdiction-dependent sessions where province/territory is confirmed.
- Document generation quality: low refund/abandon rate, high user acknowledgment rate.
- Evidence upload trust: % of users who upload at least one document within the first session.
- Safety: number of escalations triggered, AI hallucination flags, support tickets about incorrect legal information.

## Risk summary

| Risk                                         | Mitigation direction                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Legal information goes stale                 | Source hierarchy, review dates, drift detection, no statutory figures in editorial content. |
| AI hallucination of laws/deadlines           | Deterministic rules for facts, LLM only for natural language, safety backstop.              |
| Consumer confuses guidance with legal advice | Clear disclaimers, tier classification, escalation to professionals.                        |
| Sensitive document breach                    | Encryption, least privilege, audit, no PII in telemetry, data residency.                    |
| Jurisdiction error                           | Default unknown, explicit confirmation, no national assumption.                             |
| Feature creep                                | Phased MVP with explicit exclusions.                                                        |
