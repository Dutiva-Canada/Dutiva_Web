# System Overview

## Conceptual platform

The three consumer products share a single conceptual platform built around a user's identity, jurisdiction, situation, documents, evidence, and actions. The relationship between the products is shown below.

```text
Identity
    │
    ▼
User Profile ─── Preferences (language, theme, notifications)
    │
    ▼
Jurisdiction (province/territory/federal scope + optional municipality)
    │
    ▼
Situation / Life Event
    │
    ├──────────────┐
    ▼              ▼
Documents    Evidence
    │              │
    └──────┬───────┘
           ▼
Rules / Knowledge ──► AI Analysis (optional, grounded)
           │
           ▼
Actions / Workflows ──► Tasks, Deadlines, Reminders
           │
           ▼
Generated Documents
```

- **Identity and profile** are the root of every user's account.
- **Jurisdiction** determines which rules, templates, and workflows apply.
- **Situation / Life Event** is the user's reason for using the product; it is the organizing unit for workflows, documents, and evidence.
- **Documents** are templates, drafts, and finalized correspondence.
- **Evidence** is source material uploaded or captured by the user.
- **Rules / Knowledge** are the vetted sources that power deterministic guidance and document assembly.
- **AI Analysis** is an optional, safety-gated layer for natural-language understanding and extraction; it never authorizes facts, deadlines, or legal conclusions.
- **Actions / Workflows** turn a situation into concrete steps, tasks, and deadlines.
- **Generated Documents** are the output of Canadian Document Generation.

---

## Product relationship options

Three deployment options are analyzed. No final choice is made here; see `decisions/architecture-decisions.md`.

### Option A — Three independent products

- Separate brand, repository, backend, and infrastructure for each product.
- Common generic libraries may be shared privately.
- Best for liability separation and clear consumer comprehension.
- Highest engineering and operational cost.

### Option B — One consumer platform with three modules

- Single identity, storage, billing, and navigation surface.
- Each module has a clear product boundary but benefits from shared data:
  - Life Admin can hand off to Document Generation and Evidence Locker.
  - Evidence Locker can supply supporting documents to Document Generation.
- Best for cross-sell and a unified trust surface.
- A single incident affects the whole platform; product boundaries must be strongly maintained.

### Option C — Life Admin as primary, others as supporting capabilities

- The consumer platform is marketed around Life Admin ("I have a situation. Tell me what I need to do.").
- Document Generation and Evidence Locker are surfaced as capabilities inside situations.
- Best for a simple core narrative and low cognitive load.
- Risk that document and evidence features are under-developed or hard to monetize separately.

---

## Deployment architecture (conceptual)

The documentation assumes a modern web architecture but does not prescribe a stack. The implementation may use:

- a static/Vite frontend and an API backend;
- server-side rendering for public/marketing pages;
- a relational database for structured data;
- object/blob storage for original evidence files;
- a server-side AI service for natural-language tasks;
- a queue or cron service for reminders and law-change monitoring;
- an identity provider for authentication.

The actual choices are left to the implementation team and documented in `non-functional-requirements.md` and `security-requirements.md`.

---

## Relation to Dutiva's existing architecture

Dutiva Web is an employer-focused HR-compliance platform. The consumer products may reuse its **generic** architectural concepts, but they must not reuse its employer-specific content.

| Dutiva concept                                                                  | Consumer reuse                                                                |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Bi` / `defineMessages` bilingual string model                                  | Reuse as a pattern (open-core `dutiva-i18n` package).                         |
| Design tokens / surface model                                                   | Reuse as a pattern (open-core `dutiva-ui` package).                           |
| Document engine (`ClauseGate`, merge tokens, preview blocks)                    | Reuse as a pattern; consumer templates are separate.                          |
| AI safety backstop (crisis intercept, jurisdiction gate, statutory-figure gate) | Reuse the pattern; phrase sets and rules are consumer-specific.               |
| Export protection / watermarking                                                | Reuse the pattern with consumer-appropriate watermark text and limits.        |
| Supabase + RLS multi-tenancy for organizations                                  | Not reused directly; consumer model is per-user/family, not organization-RLS. |
| Dutiva HR document templates / compliance corpus                                | **Do not reuse.** Build a separate consumer knowledge base.                   |
| Northgate Logistics fixtures / demo data                                        | **Do not reuse.** Consumer demo fixtures must be synthetic and neutral.       |

---

## Trust surface

The system is trusted when it:

1. Does what it says it does.
2. Does not claim to be a lawyer, government agency, or regulated professional.
3. Names its sources and admits uncertainty.
4. Protects sensitive documents and personal data.
5. Lets users see, correct, and delete their data.
6. Flags high-risk situations for professional help.
7. Keeps AI-generated interpretations separate from source evidence.

These trust properties drive every architectural decision in this documentation.
