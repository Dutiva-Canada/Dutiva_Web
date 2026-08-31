# Architecture and Product Decisions

## How to read this log

Each decision includes context, options considered, the decision taken, rationale, trade-offs, consequences, and status. Decisions marked **open** have not been finalized. Decisions marked **provisional** are working assumptions subject to confirmation.

---

## Decision 1: Product relationship to Dutiva

| Field            | Content                                                                                                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context**      | The three products are conceptually related to Dutiva's HR-compliance platform but serve a different audience (individuals vs. employers). They may share generic infrastructure but must not inherit employer-specific content or claims.                                      |
| **Options**      | **A**: Three independent products (separate brands, repos, backends). **B**: One consumer platform with three modules (shared auth/storage/billing). **C**: Life Admin as primary, Document Generation + Evidence Locker as supporting capabilities.                            |
| **Decision**     | **Open / deferred**. The documentation analyzes all three options without choosing. A provisional recommendation is Option C for MVP narrative, Option B for scale, but this requires brand/legal/engineering confirmation.                                                     |
| **Rationale**    | The correct choice depends on unresolved business factors: brand strategy, liability appetite, technical architecture, monetization model, and relationship to Dutiva's open-core plan. There is no obviously dominant answer.                                                  |
| **Trade-offs**   | Option A minimizes cross-product risk and maximizes separation but duplicates generic infrastructure. Option B maximizes cross-sell and data flywheel but concentrates risk. Option C simplifies the go-to-market story but may under-invest in document/evidence capabilities. |
| **Consequences** | Implementation cannot assume a single shared backend or a fully separate stack. Any generic code reuse must be Dutiva-owned and configurable; consumer-specific knowledge, templates, and legal copy must be isolated.                                                          |
| **Status**       | Open — see `open-questions.md` Q1.                                                                                                                                                                                                                                              |

---

## Decision 2: Reuse of Dutiva generic infrastructure

| Field            | Content                                                                                                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context**      | Dutiva is moving toward an open-core package structure: `dutiva-i18n`, `dutiva-ui`, `dutiva-infra` as open packages, plus proprietary `dutiva-shared-core`, `dutiva-advisor`, `dutiva-compliance`, `dutiva-knowledge`.                  |
| **Options**      | (a) Reuse only concepts/patterns. (b) Reuse the open packages as dependencies. (c) Build all generic infrastructure from scratch.                                                                                                       |
| **Decision**     | **Provisional — reuse concepts and, where available, the generic packages (`dutiva-i18n`, `dutiva-ui`, `dutiva-infra`) as configurable dependencies; do not reuse Dutiva's proprietary employer content, templates, or corpus.**        |
| **Rationale**    | The consumer products need the same foundational capabilities (bilingual strings, design tokens, export guard patterns) but are a separate domain. Reusing mature packages reduces rework; building from scratch adds unnecessary cost. |
| **Trade-offs**   | Reuse creates a dependency on Dutiva's package structure and release cadence. Building from scratch preserves independence but duplicates effort.                                                                                       |
| **Consequences** | Consumer products must abstract brand defaults, legal text, and rate-limit values from the start. Dutiva-specific fixtures (e.g., Northgate Logistics) must be replaced with neutral, synthetic samples.                                |
| **Status**       | Provisional — requires confirmation of package availability and licensing.                                                                                                                                                              |

---

## Decision 3: Jurisdiction default = unknown

| Field            | Content                                                                                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context**      | Canada has overlapping federal, provincial/territorial, municipal, and sometimes contractual jurisdictions. A wrong jurisdiction can produce wrong guidance.                      |
| **Options**      | (a) Default to user's profile province. (b) Default to Ontario for English users. (c) Default to unknown and require explicit confirmation.                                       |
| **Decision**     | **Adopted — jurisdiction defaults to `unknown`. The system asks for confirmation and withholds jurisdiction-specific figures until confirmed.**                                   |
| **Rationale**    | Defaulting to any jurisdiction risks misleading users, especially for federally regulated matters or users who have moved. Asking first is a small friction that preserves trust. |
| **Trade-offs**   | Adds one step to intake; may feel repetitive for returning users.                                                                                                                 |
| **Consequences** | Intake flow must include a jurisdiction confirmation step. The knowledge base must support jurisdiction-neutral fallback content.                                                 |
| **Status**       | Adopted.                                                                                                                                                                          |

---

## Decision 4: Evidence original-preservation-first

| Field            | Content                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context**      | The Evidence Locker must preserve the trustworthiness of user-uploaded records. The biggest integrity risk is accidental or malicious modification of originals. |
| **Options**      | (a) Allow in-place editing of uploaded files. (b) Keep originals immutable and store derivatives separately.                                                     |
| **Decision**     | **Adopted — original files are immutable. Derivatives (redacted exports, OCR text, thumbnails) are stored separately.**                                          |
| **Rationale**    | Immutability preserves the user's trust that the uploaded record has not been altered. Derivatives are clearly labeled as transformations.                       |
| **Trade-offs**   | Storage cost is slightly higher because derivatives are separate objects. User cannot "edit" an original directly.                                               |
| **Consequences** | Storage model must treat originals as write-once. Derivative generation must record the original hash and transformation.                                        |
| **Status**       | Adopted.                                                                                                                                                         |

---

## Decision 5: AI-generated interpretation separation

| Field            | Content                                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context**      | AI can help users understand evidence, but AI errors must not be mistaken for the original record.                                                                      |
| **Options**      | (a) Store AI summaries alongside originals without distinction. (b) Store AI interpretations in a separate layer with provenance and confidence.                        |
| **Decision**     | **Adopted — AI interpretations are stored separately from primary evidence, clearly labeled, and user-correctable.**                                                    |
| **Rationale**    | Separation prevents AI hallucinations from corrupting the factual record. It also supports user correction and audit.                                                   |
| **Trade-offs**   | More complex data model and UI. Exports must handle multiple layers.                                                                                                    |
| **Consequences** | Evidence architecture must have a distinct `EvidenceInterpretation` layer. UI must visually distinguish interpretations. Exports must separate or merge by user choice. |
| **Status**       | Adopted.                                                                                                                                                                |

---

## Decision 6: Document generation deterministic, not LLM-authored

| Field            | Content                                                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context**      | Legal-adjacent documents must be reproducible, auditable, and jurisdictionally correct.                                                                                |
| **Options**      | (a) Let an LLM draft documents from scratch. (b) Use deterministic templates with merge tokens and `ClauseGate` conditions.                                            |
| **Decision**     | **Adopted — documents are assembled from deterministic templates. An LLM only suggests templates and pre-fills answers; it does not author clauses.**                  |
| **Rationale**    | Deterministic assembly prevents hallucinated clauses, unfilled placeholders, and wrong-jurisdiction content. It aligns with Dutiva's existing Document Studio pattern. |
| **Trade-offs**   | Less flexible for novel situations; template catalogue must be maintained.                                                                                             |
| **Consequences** | Template engine must support merge tokens, conditional clauses, bilingual content, versioning, and audit. New document types require new templates and review.         |
| **Status**       | Adopted.                                                                                                                                                               |

---

## Decision 7: Bilingual source-language model

| Field            | Content                                                                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context**      | The product is Canadian and must support English and French as first-class languages. French legal content must be Québec-appropriate.                                                                         |
| **Options**      | (a) Write in English and machine-translate to French. (b) Author bilingual pairs from the start, with French legal review. (c) Separate English-first and French-first workflows.                              |
| **Decision**     | **Adopted — every user-facing string is an `{ en, fr }` pair authored from the start; French legal terminology is reviewed for Québec appropriateness; machine translation is not used for reviewed strings.** |
| **Rationale**    | Word-for-word translation of legal content is risky. Bilingual authorship ensures parity and quality.                                                                                                          |
| **Trade-offs**   | Slower content authoring; requires French-speaking legal/content reviewer.                                                                                                                                     |
| **Consequences** | Message catalogue must enforce parity. Content review process must include a French step. New features cannot ship English-only.                                                                               |
| **Status**       | Adopted.                                                                                                                                                                                                       |

---

## Decision 8: Consumer multi-tenancy is per-user, not organization

| Field            | Content                                                                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context**      | Dutiva uses an organization/RLS model for employers. Consumers do not have organizations in the same sense.                                                                   |
| **Options**      | (a) Reuse Dutiva's organization model. (b) Build a per-user model with optional family/helper sharing.                                                                        |
| **Decision**     | **Adopted — data is owned by a user; future family/helper access is explicit sharing, not organization tenancy.**                                                             |
| **Rationale**    | An organization model would misrepresent the consumer relationship and create unnecessary complexity. Per-user ownership with optional sharing matches consumer expectations. |
| **Trade-offs**   | Helper/family access must be built as a separate sharing layer.                                                                                                               |
| **Consequences** | Access control filters by `user_id`. Sharing records must be explicit, revocable, and audited.                                                                                |
| **Status**       | Adopted.                                                                                                                                                                      |

---

## Decision 9: AI-assisted intake has two MVP options

| Field            | Content                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Context**      | The user asked that both deterministic and AI-assisted MVP options be documented.                                                                      |
| **Options**      | (a) Deterministic MVP only. (b) AI-assisted MVP only. (c) Document both and defer the choice.                                                          |
| **Decision**     | **Adopted — document both options with trade-offs; recommend deterministic as the lowest-risk MVP and AI-assisted as a follow-on if resources allow.** |
| **Rationale**    | Both are valid depending on risk tolerance, budget, and timeline. The documentation should support either decision.                                    |
| **Trade-offs**   | Deterministic MVP is safer but less flexible. AI-assisted MVP is more natural but requires provider, safety, and monitoring investment.                |
| **Consequences** | The architecture must support both; deterministic rules and safety backstop are required regardless of whether an LLM is used for intake.              |
| **Status**       | Adopted as documentation position; implementation choice remains open.                                                                                 |

---

## Decision 10: No statutory figures in public editorial content

| Field            | Content                                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Context**      | Statutory deadlines and figures go stale and become product defects or compliance misrepresentations.                                                                                                                    |
| **Options**      | (a) Publish figures with a review date. (b) Avoid figures in public editorial content; name the statute and point to official text.                                                                                      |
| **Decision**     | **Adopted — public articles, guides, and marketing content shall not contain statutory figures, deadlines, or dollar thresholds; they shall name the statute, describe the rule's shape, and link to official sources.** |
| **Rationale**    | Same rule as Dutiva's `/guides` and `/blog` articles. It prevents stale figures in public content and reduces liability.                                                                                                 |
| **Trade-offs**   | Users must visit official sources for exact numbers; less "complete" feel in articles.                                                                                                                                   |
| **Consequences** | Content guidelines must enforce the rule. Automated tests may flag numeric figures in public articles for review.                                                                                                        |
| **Status**       | Adopted.                                                                                                                                                                                                                 |

---

## Decision 11: Evidence locker AI analysis is opt-in

| Field            | Content                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context**      | Evidence may be highly sensitive (health, financial, identity). Sending it to an AI provider without explicit consent would undermine trust.                   |
| **Options**      | (a) AI analysis on by default. (b) AI analysis off by default, opt-in per item/case.                                                                           |
| **Decision**     | **Adopted — AI analysis is opt-in per item or case; highly sensitive evidence requires explicit consent; users can disable AI analysis globally in settings.** |
| **Rationale**    | Opt-in preserves user control and trust. It also reduces privacy risk and third-party AI costs.                                                                |
| **Trade-offs**   | Lower AI feature adoption until users understand the value.                                                                                                    |
| **Consequences** | UX must clearly explain what is sent to the AI provider and what is returned. Consent records must be stored.                                                  |
| **Status**       | Adopted.                                                                                                                                                       |

---

## Decision 12: Export protection / watermarking

| Field            | Content                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Context**      | Exported documents and evidence packages could be shared or leaked. The product should deter misuse and support traceability.                                                                    |
| **Options**      | (a) No protection beyond standard access controls. (b) Add visible watermark and invisible fingerprint, with export logging.                                                                     |
| **Decision**     | **Adopted — adopt an export-protection pattern similar to Dutiva's: visible identity line, invisible fingerprint, artifact metadata, and audit trail. This is deterrence/attribution, not DRM.** |
| **Rationale**    | Deterrence and traceability are practical protections once a user can view content. DRM is both ineffective and user-hostile.                                                                    |
| **Trade-offs**   | Watermarks may be visually present on documents; some users may dislike them. Fingerprinting adds implementation complexity.                                                                     |
| **Consequences** | Export function must compute and embed identifiers. Audit logs must record exports. Watermark text must be brand-neutral if reused across products.                                              |
| **Status**       | Adopted in principle; implementation details require legal/privacy review.                                                                                                                       |

---

## Decision 13: Data residency

| Field            | Content                                                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Context**      | Canadian consumers expect their personal and legal documents to be stored in Canada or a jurisdiction with equivalent privacy protections.                                                                                                                   |
| **Options**      | (a) Commit to Canadian data residency now. (b) Document as a goal pending vendor confirmation. (c) Default to common cloud regions and disclose.                                                                                                             |
| **Decision**     | **Open / provisional — data residency in Canada or an equivalent jurisdiction is a goal; no public claim can be made until the AI provider, object storage, and email/analytics vendors confirm processing locations and cross-border transfer safeguards.** |
| **Rationale**    | Data-residency claims are easy to make and costly to correct. They require legal review and vendor confirmation.                                                                                                                                             |
| **Trade-offs**   | Delay in marketing a Canada-only claim; avoids later retraction or policy rewrite.                                                                                                                                                                           |
| **Consequences** | Vendor due diligence is a launch prerequisite. The privacy policy must accurately reflect actual processing locations.                                                                                                                                       |
| **Status**       | Open — see `open-questions.md` Q5.                                                                                                                                                                                                                           |
