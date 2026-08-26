# IP and Data Boundary — Dutiva Open-Core Assessment

This document identifies the boundary between public/legal source material and Dutiva's proprietary intellectual property, and outlines rules for customer data, fixtures, and AI assets.

---

## 1. Public/legal source material

Dutiva's compliance product references Canadian statutes, regulations, and government guidance. These are public sources. Examples include:

- Ontario.ca legislation and employment standards guidance.
- CNESST (Quebec) publications and the Loi sur les normes du travail.
- Canada.ca / Canada Labour Code Part III federal guidance.
- Public regulatory bulletins and fact sheets.

The repository references these sources in:

- `docs/advisor-guidance-corpus*.md` — curated excerpts with source URLs.
- `supabase/migrations/0022_advisor_guidance_chunks.sql` and the `advisor_guidance_chunks` table.
- `src/features/app/documents/data/templates/*` — statutory references embedded in document meta-data.
- `src/features/app/advisor/safety/statutoryNotice.ts` — Ontario ESA s.57 notice schedule.

---

## 2. Dutiva proprietary intellectual property

Public law is the **input**. Dutiva's proprietary work is the **selection, normalization, interpretation, encoding, and workflow integration** of that law. The following are Dutiva IP and should not be open-sourced:

| Proprietary element | Why it is Dutiva IP | Location examples |
|---|---|---|
| **Normalized compliance rules** | Choice of which statutes to cover, which topics to prioritize, and how to present them. | `docs/FOUR_RING_FRAMEWORK.md`, `src/data/compliance.ts` |
| **Decision trees** | Step-by-step workflows that turn legal concepts into employer actions. | `src/features/app/flows/data/mentalHealthResponse.ts`, `src/features/app/documents/data/templates/*` |
| **Mappings** | Jurisdiction → template → risk → obligation mappings. | `src/features/app/documents/catalogue.ts`, `src/data/compliance.ts` |
| **Interpretations** | Decisions about what a statute means in the context of a specific HR workflow. | `docs/notice-bands-review-pack.md`, `docs/advisor-corpus-review-pack-ontario.md` |
| **Workflow logic** | How a termination, accommodation, or leave process flows through Dutiva. | `src/features/app/flows/*`, `src/features/app/documents/screens/GenerateScreen.tsx` |
| **Risk models** | Severity weights, critical-capped scoring, risk classification. | `src/features/app/views/analytics/aggregation.ts`, `docs/SCORING_LOGIC.md` |
| **Internal classifications** | `review_status`, `risk_level`, `restricted`, `provenanced` semantics. | Database migrations, `src/features/support/triage.ts` |
| **Retrieval strategies** | How queries are transformed, ranked, and injected into prompts. | `supabase/functions/advisor-chat/retrievalQuery.ts`, `supabase/migrations/0023_match_advisor_guidance.sql` |
| **Curated summaries** | Machine-curated and human-reviewed chunks in the guidance corpus. | `docs/advisor-guidance-corpus*.md`, `advisor_guidance_chunks` |
| **Proprietary annotations** | `effective_note`, `review_status`, Dutiva-authored warnings. | `advisor_guidance_chunks`, response payload |
| **Internal methodologies** | The "LLM proposes, deterministic code disposes" framework and the five-gate test. | `docs/AI_USAGE_STRATEGY.md` |

**Rule:** Even when a chunk quotes public law verbatim, the surrounding selection, tagging, review workflow, and integration are proprietary. A public release may include only raw statute URLs and citations, not Dutiva's curated corpus or interpretation.

---

## 3. AI / model / prompt boundaries

### What is in the repository

- **System prompts** are embedded in `supabase/functions/advisor-chat/index.ts` and `supabase/functions/support-firstline/index.ts`.
- **Prompt construction logic** (retrieval block, current-time line, notice schedule injection) is in `supabase/functions/advisor-chat/index.ts`.
- **RAG retrieval** uses Postgres full-text search over `advisor_guidance_chunks`; no embeddings or vector database code is in the npm tree.
- **Law monitoring** calls the Hugging Face API with a URL-recovery/summarization prompt (`HF_TOKEN`).
- **No model weights, training datasets, or evaluation datasets** are stored in the repository.

### What must stay private

- All system prompts and prompt-engineering instructions.
- The crisis phrase set and escalation keyword lists in `src/features/app/advisor/safety/crisisSignals.ts` and `supabase/functions/advisor-chat/responsePayload.ts`.
- Jurisdiction detection patterns and statutory-figure detection regexes.
- The retrieval strategy (how chunks are ranked, injected, and cited).
- Model-provider configuration and route definitions.

### AI provider terms

Dutiva uses remote AI APIs (DigitalOcean Gradient AI for the Advisor, Hugging Face for law monitoring). The repository does not contain model weights, but it does contain the prompts and integration code. Before any public release:

- Review the provider terms for the current model (`mistral-3-14B` via DigitalOcean Gradient AI, `mistralai/Mistral-7B-Instruct-v0.3` via Hugging Face).
- Confirm that publishing client/edge-function source that constructs prompts does not violate provider terms.
- **LEGAL REVIEW REQUIRED** for AI provider commercial-use and data-retention terms.
- On-device or customer-LAN completion is not a current path. If it is ever
  offered, the corpus, prompts, and retrieval strategy remain proprietary —
  see [`docs/LOCAL_INFERENCE.md`](../docs/LOCAL_INFERENCE.md). Do not treat
  “local inference” as a reason to ship `advisor_guidance_chunks` to the
  browser.

---

## 4. Fixture and demo data

### What fixtures contain

`src/data/*` implements a fictional demo company, Northgate Logistics Inc., with:

- Fictional employees (`Jordan Mensah`, etc.).
- Fictional cases, tasks, compliance items, compensation records, communications.
- Fictional chat threads and Advisor memory.

### Rules for fixtures

- Fixtures are **not customer data**, but they are Dutiva-authored creative content and scenario design.
- They should not be published as representative content of any open-source package.
- Any public generic package that needs sample data must use clearly synthetic, non-Dutiva fixtures (e.g., "Acme Corp.", generic names).
- The Northgate Logistics identity is hardcoded in multiple places (`src/features/app/shell/navConfig.ts`, `src/features/app/documents/data/meta.ts`, `src/test/productionWorkspace.ts`); these must be abstracted before reuse.

---

## 5. Customer data

### Data that must never be in the repository

- Real customer/employee PII.
- Real support tickets, messages, attachments.
- Real beta signup emails.
- Real telemetry, error reports, or export events.
- Production database dumps.

### Current repository status

No real customer data was detected. The data layer uses fixtures for demo mode and Supabase for production, with no production dumps committed.

### If real data is discovered

1. Do not publish it.
2. Rotate or redact any identifiers.
3. Notify the security team.
4. Consider history rewriting if it was committed.

---

## 6. Design handoffs and confidential documentation

The repository contains three design-handoff directories under `docs/`:

- `docs/design-handoff-hr-documents-library/`
- `docs/design-handoff-advisor-chat/`
- `docs/design-handoff-analytics/`

These include prototype HTML, screenshots, `AGENT.md`, and implementation notes. They are **confidential product design material** and must not be published.

Similarly, these documents contain proprietary methodology and should stay private:

- `docs/AI_USAGE_STRATEGY.md`
- `docs/SCORING_LOGIC.md`
- `docs/EXPORT_PROTECTION.md`
- `docs/FOUR_RING_FRAMEWORK.md`
- `docs/LAW_MONITORING.md`
- `docs/advisor-guidance-corpus*.md`
- `docs/advisor-corpus-review-pack-ontario.md`
- `docs/notice-bands-review-pack.md`
- `docs/LEGAL_REVIEW_INVENTORY.md`
- `docs/DEVIN_PROMPTS.md` and `docs/TODO.md` (operational details)

---

## 7. Trademark and brand assets

The following are protected by trademark or business identity and are not licensed by any open-source code license:

- The **"Dutiva"** word mark.
- The **"Dutiva Advisor"** product name.
- The Dutiva logo and app icon (`public/brand/dutiva-leaf.png`, `public/brand/icon-app.svg`).
- The `dutiva.ca` domain.
- Brand colors described in `src/styles/tokens.css` and `docs/CANONICAL_FACTS.md` (the colors themselves are not trademarked, but their use as Dutiva branding should be restricted in any open package).

A public open-source package must use neutral naming and branding and must include a trademark notice.

---

## 8. Rules for using public-source material in open packages

An open-source package from Dutiva may:

- Include generic references to public statutes by name (e.g., "Employment Standards Act, 2000").
- Include links to official government sources.
- Include neutral, factual descriptions of legal concepts (e.g., "Canadian employers must generally give notice or pay in lieu of notice").

It must **not**:

- Include Dutiva's curated corpus chunks.
- Include statutory figures, notice tables, or thresholds.
- Include interpretations of ambiguous legal language.
- Include document templates that apply law to specific scenarios.
- Include risk scores, severity weights, or compliance methodologies.

---

## 9. Summary

| Material | Status | Can be open-sourced? |
|---|---|---|
| Raw public statutes and government URLs | Public | Yes, by reference only |
| Dutiva's curated corpus, tags, and review status | Proprietary | No |
| Document templates and statutory meta-data | Proprietary | No |
| Compliance scoring formula and risk models | Proprietary | No |
| System prompts and safety phrase sets | Proprietary | No |
| Northgate Logistics fixtures | Dutiva creative content | No (use synthetic samples instead) |
| Customer/employee data | Confidential / regulated | No |
| Design handoffs and methodology docs | Confidential | No |
| Dutiva trademarks and brand assets | Trademark-protected | No |
| Generic UI/i18n/infra code | Reusable tooling | Yes, after removing Dutiva defaults |

---

## 10. Legal review required

Before any public release, legal counsel should review:

1. Whether quoting or summarizing public statutes in the curated corpus creates any database-right or compilation claims.
2. Whether the AI provider terms permit publication of prompt-construction code.
3. Whether the Dutiva trademark application status (CIPO no. 2465617, currently awaiting examination) affects the trademark policy.
4. Whether fixture data, even if fictional, could create personality or corporate-identity claims if reused.
