# Architecture Boundary — Dutiva Open-Core Assessment

This document maps the Dutiva Web repository, identifies actual dependencies and coupling, and proposes a clean boundary between open/generic infrastructure and Dutiva's proprietary Canadian HR-compliance intelligence.

---

## 1. Current repository layout

```text
C:\Users\Marti\Dutiva_Web
├── src/
│   ├── app/                  # Router, surface composition, error boundaries
│   ├── components/           # Shared UI primitives (Disclaimer, chips, advisor markdown)
│   ├── config/               # Pricing, beta capacity, support config
│   ├── data/                 # Demo workspace fixtures (Northgate Logistics Inc.)
│   ├── devtools/             # Dev-only annotation overlay
│   ├── features/
│   │   ├── app/              # Workspace (Advisor, Documents, Cases, Analytics, ...)
│   │   ├── marketing/        # Public marketing site + legal policies + blog/guides
│   │   └── support/          # Support ticketing, email, Help Centre
│   ├── i18n/                 # Bilingual framework + message catalogues
│   ├── lib/                  # Cross-cutting utilities (Supabase client, theme, export protection, error reporting, billing)
│   ├── seo/                  # Route registry, metadata, JSON-LD, prerender support
│   ├── styles/               # Tailwind v4 tokens, surfaces, patterns, animations
│   └── test/                 # Vitest helpers and production-workspace fixtures
├── supabase/
│   ├── functions/            # 26 Edge Functions + _shared modules
│   ├── migrations/           # Production schema migrations
│   ├── legacy-migrations/    # Older schema work
│   └── schema.sql            # Dump of live schema
├── services/attachment-scanner/  # Standalone malware-scan sidecar (Docker)
├── docs/                     # Extensive product methodology and design handoffs
├── scripts/                  # Build, prerender, SEO, fact-check scripts
├── package.json              # 11 production deps, 17 dev deps
├── vite.config.ts
├── vercel.json
└── LICENSE.md               # Proprietary
```

---

## 2. Module-by-module analysis

### 2.1 Generic infrastructure (strong open-source candidates)

| Module                                                              | Purpose                                                   | Dependencies            | Dependents                     | Proprietary content?                                                 |
| ------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------- | ------------------------------ | -------------------------------------------------------------------- |
| `src/i18n/core.ts`                                                  | `Bi`, `defineMessages`, `pick`, language providers        | None                    | Every feature                  | No                                                                   |
| `src/i18n/context.ts`, `LangProvider.tsx`, `ForcedLangProvider.tsx` | React language context and URL/lang preference wiring     | `core.ts`               | `src/app/*`, `src/features/*`  | No                                                                   |
| `src/styles/*`                                                      | Tailwind v4 design tokens, surfaces, patterns, animations | None                    | Build + all components         | Brand colors are public facts; brand assets are trademark-controlled |
| `src/components/Disclaimer.tsx`                                     | Generic "not legal advice" callout component              | `lucide-react`, i18n    | Many app/marketing views       | No (component is generic; copy is product-specific)                  |
| `src/components/chips.ts`                                           | Tone/status chip CSS classes                              | Tailwind tokens         | Many views                     | No                                                                   |
| `src/lib/theme.tsx`                                                 | Theme provider and `data-theme` persistence               | None                    | App shell                      | No                                                                   |
| `src/lib/prefs.ts`                                                  | Local-storage preference helpers                          | None                    | Theme, lang, etc.              | No                                                                   |
| `src/lib/money.ts`                                                  | Currency formatting                                       | None                    | Pricing, analytics             | No                                                                   |
| `src/lib/supabaseClient.ts`                                         | Optional Supabase browser client wrapper                  | `@supabase/supabase-js` | Features that talk to Supabase | No (config comes from env)                                           |
| `src/lib/registerServiceWorker.ts`                                  | PWA service-worker registration                           | None                    | App entry                      | No                                                                   |
| `src/lib/errorReporting/*`                                          | Privacy-scrubbed crash reporter                           | i18n, deploy/release    | App                            | Mechanism is generic; allow-list values are site-specific            |
| `src/lib/exportProtection/*`                                        | Watermark/fingerprint/velocity/audit mechanism            | i18n                    | Document Studio, Advisor copy  | Mechanism is generic; watermark text and limits are product-specific |
| `src/seo/*`                                                         | Route registry, `<head>`, JSON-LD, sitemap helpers        | i18n, marketing content | Router, build scripts          | Generic tooling; route copy is product-specific                      |

**Observation:** These modules are genuinely reusable. The main coupling risk is that some contain hardcoded Dutiva defaults (e.g., `src/seo/site.ts` hardcodes `legalName: 'Dutiva Canada Inc.'`, `supportEmail: 'support@dutiva.ca'`). Those defaults must be made configurable before the modules are published.

### 2.2 Domain fixtures and demo workspace (proprietary)

| Module | Purpose | Dependencies | Dependents |
|---|---|---|---|---|
| `src/data/types.ts` | Entity type definitions for fixtures | `Bi`, `CardTone` | All fixture files and many views |
| `src/data/{employees,cases,tasks,compliance,policies,communications,documents,chats,...}.ts` | Northgate Logistics Inc. demo data | i18n | Workspace views in demo mode |
| `src/data/index.ts` | Barrel export | All fixture files | Demo mode |

**Observation:** `types.ts` is partially generic HR types but also contains Dutiva-specific concepts (`FixtureToneCard`, `ChatFlowKey`, `MemoryFact`, `Obligation`). The fixture data is explicitly fictional and should never be published as representative content.

### 2.3 Workspace features (proprietary)

| Module                                                                                                          | Purpose                                                            | Why proprietary                                                                             |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `src/features/app/advisor/*`                                                                                    | AI Advisor UI, chat API client, safety backstop client             | Embeds the Advisor response contract, safety logic, and chat UX tied to proprietary backend |
| `src/features/app/documents/*`                                                                                  | Document Studio, template catalogue, generation wizard, repository | Contains 50 curated templates and statutory meta-data                                       |
| `src/features/app/views/analytics/*`                                                                            | Analytics dashboard and score formula                              | Compliance score v3 is proprietary methodology                                              |
| `src/features/app/views/{cases,employees,compliance,policies,planning,communications,compensation,wellbeing}/*` | Domain registers                                                   | Specific to Dutiva's HR/compliance data model                                               |
| `src/features/app/flows/*`                                                                                      | Guided flow runner + flow content                                  | Mental-health/accommodation/leave flows are domain-specific                                 |
| `src/features/app/reference/data/*`                                                                             | Knowledge guides                                                   | Educational content authored by Dutiva                                                      |
| `src/features/app/guidance/*`                                                                                   | Guidance API and law-monitoring coverage                           | Jurisdiction coverage claims and audit dates                                                |
| `src/features/app/shell/*`                                                                                      | Workspace shell, nav, workspace mode                               | Tightly coupled to Dutiva routes, demo identity, and workspace model                        |
| `src/features/app/auth/*`                                                                                       | Magic-link auth and invite-only gate                               | Admin/beta list logic is Dutiva-specific                                                    |
| `src/features/app/billing/*`                                                                                    | Stripe plan gates                                                  | Dutiva pricing and billing model                                                            |

### 2.4 Marketing surface (mixed)

| Module                                                 | Status                                    | Notes                                                            |
| ------------------------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------- |
| `src/features/marketing/LandingPage.tsx`, `sections/*` | Publicly served, not open-source licensed | Contains Dutiva copy and claims                                  |
| `src/features/marketing/pages/*`                       | Publicly served, not open-source licensed | Pricing, FAQ, legal hub, etc.                                    |
| `src/features/marketing/articles/articleModel.ts`      | Generic article model (open candidate)    | The model is generic; the article content is not                 |
| `src/features/marketing/legal/content/*`               | Proprietary                               | Dutiva's legal policies and disclaimers                          |
| `src/features/marketing/analytics/*`                   | Open candidate (mechanism)                | GA4 consent loader is generic; measurement ID is Dutiva-specific |

### 2.5 Support system (generic plumbing, proprietary content)

| Module                                                                           | Status              | Notes                                                                                                       |
| -------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/features/support/supportApi.ts`, `publicSupportApi.ts`, `attachmentsApi.ts` | Generic             | HTTP/Supabase API wrappers                                                                                  |
| `src/features/support/email/*`                                                   | Generic mechanism   | Resend wrapper; content/templates are Dutiva-specific                                                       |
| `src/features/support/help/*`                                                    | Proprietary content | Help Centre articles and search ranking                                                                     |
| `src/features/support/triage.ts`                                                 | Mixed               | Priority arithmetic is generic; categories/impact/urgency definitions are Dutiva-specific                   |
| `supabase/functions/support-*/`                                                  | Generic plumbing    | Ticket CRUD, outbox, attachment scan, call scheduling; categories and operator workflow are Dutiva-specific |

### 2.6 Supabase edge functions

| Function                                                                                                                                            | Status                       | Notes                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| `advisor-chat`                                                                                                                                      | Proprietary                  | System prompt, model routing, RAG, response payload              |
| `advisor-safety-event`                                                                                                                              | Proprietary                  | Telemetry for the safety backstop                                |
| `monitor-law-changes`                                                                                                                               | Proprietary                  | Law-change monitoring strategy and AI summarization              |
| `send-law-updates`                                                                                                                                  | Proprietary                  | Digest delivery of law changes                                   |
| `record-score-snapshots`                                                                                                                            | Proprietary                  | Compliance score formula v3                                      |
| `record-export` / `export-audit-trail`                                                                                                              | Proprietary product feature  | Export authorization and audit viewer                            |
| `create-checkout-session` / `create-portal-session` / `stripe-webhook`                                                                              | Proprietary commercial layer | Stripe billing integration                                       |
| `create-beta-signup`                                                                                                                                | Proprietary                  | Beta admission logic tied to Dutiva cohort                       |
| `create-support-ticket` / `create-public-support-ticket` / `support-agent-action` / `support-confirm-call` / `support-firstline` / `support-notify` | Mixed                        | Generic plumbing; Dutiva categories, triage, Help Centre content |
| `support-attachment-scan`                                                                                                                           | Generic mechanism            | Malware-scan sidecar integration                                 |
| `support-call-scheduler`                                                                                                                            | Generic mechanism            | Cron scheduler for reminders                                     |
| `support-analytics-event`                                                                                                                           | Generic mechanism            | Analytics event sink                                             |
| `report-error`                                                                                                                                      | Generic mechanism            | Privacy-scrubbed error telemetry                                 |
| `resend-webhook`                                                                                                                                    | Generic mechanism            | Email delivery webhook verification                              |
| `set-service-status`                                                                                                                                | Generic mechanism            | Status board updates                                             |

### 2.7 Shared Supabase modules

| Module                                                 | Status            | Notes                                                                |
| ------------------------------------------------------ | ----------------- | -------------------------------------------------------------------- |
| `_shared/aiUsage.ts`                                   | Generic mechanism | AI rate-limit guardrails; values should be env-driven before release |
| `_shared/exportGuard.ts`                               | Generic mechanism | Export velocity limits; values should be env-driven                  |
| `_shared/adminAccess.ts`                               | Proprietary       | Hardcoded internal admin email                                       |
| `_shared/googleCalendar.ts`                            | Generic mechanism | JWT-bearer Google Calendar client                                    |
| `_shared/resendSend.ts`                                | Generic mechanism | Resend email wrapper                                                 |
| `_shared/scheduledCalls.ts`                            | Mixed             | Scheduling logic is generic; Dutiva call cadence is not              |
| `_shared/supportAnalytics.ts`                          | Mixed             | Validation is generic; metrics schema is Dutiva-specific             |
| `_shared/lawUpdateDigest.ts` / `lawUpdateRelevance.ts` | Proprietary       | Law-update filtering and digest logic                                |
| `_shared/caslConsent.ts`                               | Generic mechanism | CASL consent recording                                               |

---

## 3. Hidden coupling and risks

### 3.1 Generic modules with Dutiva-specific defaults

- `src/seo/site.ts` hardcodes Dutiva legal name, support email, and logo path.
- `src/lib/billing/adminAccess.ts` hardcodes `ADMIN_EMAILS = ['martin.constantineau@dutiva.ca']`.
- `supabase/functions/_shared/adminAccess.ts` duplicates the same admin email.
- `src/lib/exportProtection/*` and `supabase/functions/_shared/exportGuard.ts` contain configured velocity limits (12/100 client, 10/80 server).
- `supabase/functions/_shared/aiUsage.ts` contains default AI usage ceilings.

**Impact:** These prevent generic packages from being published without either making values configurable or replacing defaults with non-Dutiva placeholders.

### 3.2 Domain logic in UI components

- `src/features/app/views/analytics/aggregation.ts` implements the compliance score formula; it is imported by analytics UI but also mirrored server-side in `supabase/functions/record-score-snapshots/scoring.ts`.
- `src/features/app/documents/screens/GenerateScreen.tsx` contains template-specific rendering logic.

**Impact:** Splitting the engine from the UI is needed for a clean open-core boundary.

### 3.3 Proprietary prompts mixed into generic AI infrastructure

- The `advisor-chat` edge function contains both a generic model-routing HTTP client and a domain-specific system prompt.
- The support-firstline function contains a domain-specific prompt tied to the Dutiva Help Centre.

**Impact:** Any "generic AI client" abstraction would need to accept prompts as configuration, not embed them.

### 3.4 Fixture data leaked into tests and generic utilities

- Northgate Logistics Inc. identity appears in `src/test/productionWorkspace.ts`, `src/features/app/shell/navConfig.ts`, `src/features/app/documents/data/meta.ts`, and many tests.

**Impact:** Public packages must use synthetic or clearly fictional fixtures, and tests should not depend on real product data.

---

## 4. Proposed repository structure

### Recommended end state (multi-repo when ready to publish)

```text
github.com/dutiva/dutiva-i18n          # Open, AGPLv3 — bilingual framework
github.com/dutiva/dutiva-ui            # Open, AGPLv3 — generic components + tokens
github.com/dutiva/dutiva-infra         # Open, AGPLv3 — error reporting, export guard, Supabase client, service worker
github.com/dutiva/dutiva-shared-core   # Private — document engine, workflow engine, support plumbing, tenant patterns
github.com/dutiva/dutiva-advisor       # Private — AI Advisor, prompts, safety backstop, RAG
github.com/dutiva/dutiva-compliance    # Private — scoring, statutory tables, law monitoring, corpus
github.com/dutiva/dutiva-knowledge     # Private — 50 templates, reference guides, curated corpus
github.com/dutiva/dutiva-web           # Private — marketing site, workspace app, legal policies
github.com/dutiva/dutiva-enterprise    # Private — billing, admin, enterprise features
```

### Preparation state (monorepo, no public release)

During Phase 1–2 the monorepo is kept, but directories are reorganized so the boundary is mechanical:

```text
src/
  lib/                   # Keep generic; move Dutiva defaults out
  i18n/
    core/                # Generic framework (future dutiva-i18n)
    messages/            # Dutiva catalogues (stay in dutiva-web)
  styles/                # Keep generic; make brand tokens configurable
  components/            # Keep generic
  features/
    app/                 # Proprietary workspace
    marketing/           # Proprietary marketing content
    support/             # Mixed; split generic plumbing from content
packages/                # New private packages during preparation
  dutiva-i18n/
  dutiva-ui/
  dutiva-infra/
  dutiva-shared-core/    # Private
```

**Why multi-repo for the eventual public boundary:**

- Strong IP boundary and independent licensing.
- External contributors can work on generic packages without access to proprietary repos.
- Clearer public/private separation and release management.

**Why monorepo during preparation:**

- Easier refactoring and type sharing while the boundaries are still being drawn.
- `npm run check` and existing CI continue to work.
- Lower synchronization overhead during the cleanup phase.

---

## 5. API and security boundaries

### Open packages

- **No Supabase service-role keys.**
- **No Dutiva-specific prompts, templates, or scoring weights.**
- **No real customer/employee data.**
- Configuration via props/env; sensible non-Dutiva defaults.
- Tests use synthetic fixtures.

### Private packages

- Service-role logic, model routing, RAG, prompts, and rate-limit enforcement remain server-side.
- Document/workflow engines accept content via configuration or API, not by embedding it.
- All tenant isolation and RLS policies stay proprietary and reviewable internally.

---

## 6. Migration complexity

| Boundary change                                                             | Complexity | Risk                                                                    |
| --------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| Extract `src/i18n/core`                                                     | Low        | Breaking change to import paths; easily aliased                         |
| Extract `src/styles` + generic components                                   | Low-Medium | Tailwind v4 setup must move with tokens; vite config references tokens  |
| Extract generic `src/lib` utilities                                         | Low        | Some modules read `import.meta.env`; need config injection              |
| Env-ify Dutiva defaults in `src/seo/site.ts`, `adminAccess.ts`, rate limits | Low        | Straightforward replacements                                            |
| Split document engine from templates                                        | Medium     | Template rendering and ClauseGate logic is embedded in document screens |
| Split workflow engine from flow data                                        | Medium     | Flow runner and data are coupled in `flowModel.ts` and screens          |
| Split support plumbing from content                                         | Low-Medium | Help Centre content and triage categories are separate files already    |
| Move engines to `dutiva-shared-core`                                        | Medium     | Requires build/publish pipeline and integration tests                   |

---

## 7. Conclusion

The Dutiva Web repository already has a conceptual infrastructure/domain split, but generic modules still carry Dutiva-specific defaults and domain engines are not separated from domain content. The highest-value preparation work is to:

1. Remove Dutiva defaults from generic modules.
2. Extract `dutiva-i18n`, `dutiva-ui`, and `dutiva-infra` as reusable private packages.
3. Keep document/workflow/support engines in a private shared core, accepting content via configuration.
4. Leave all Canadian HR/compliance intelligence (Advisor, scoring, templates, corpus, prompts) in private repositories.
