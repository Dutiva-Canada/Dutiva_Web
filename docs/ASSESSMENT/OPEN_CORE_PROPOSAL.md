# Open-Core Proposal — Dutiva Web

This document proposes a future repository and package structure that separates Dutiva's generic, reusable infrastructure from its proprietary Canadian HR-compliance intelligence. It reflects the user's decisions:

- Open layer: generic UI/i18n/infra packages under AGPLv3.
- Shared core: document engine, workflow engine, and support plumbing are architecturally separated but remain Dutiva-controlled and proprietary for now.
- Proprietary layer: Advisor, compliance engine, templates, corpus, and all Dutiva content remain closed.

---

## Architectural boundary diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PROPRIETARY DUTIVA                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ dutiva-web   │  │ dutiva-advisor│  │ dutiva-compliance │  │ dutiva-    │
│  │ (marketing + │  │ (AI Advisor,  │  │ (scoring, law    │  │ knowledge  │
│  │  workspace)  │  │  prompts, RAG) │  │  monitoring,      │  │ (templates,│
│  │              │  │              │  │  corpus)         │  │  guides)   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │                 │              │
│  ┌──────▼─────────────────▼─────────────────▼─────────────────▼──────┐     │
│  │            dutiva-shared-core (proprietary, not published)          │     │
│  │  Document engine · Workflow engine · Support plumbing · Tenant/RLS │     │
│  └──────┬────────────────────────────────────────────────────────────┘     │
└─────────┼───────────────────────────────────────────────────────────────────┘
          │ imports
┌─────────▼───────────────────────────────────────────────────────────────────┐
│                              OPEN LAYER (AGPLv3)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ dutiva-i18n  │  │ dutiva-ui    │  │ dutiva-infra │  │ (support     │    │
│  │ bilingual    │  │ design system│  │ error        │  │  plumbing,   │    │
│  │ framework    │  │ + components │  │ reporting,   │  │  if opened)  │    │
│  │              │  │              │  │ export guard,│  │              │    │
│  │              │  │              │  │ Supabase     │  │              │    │
│  │              │  │              │  │ client wrapper│  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Package / repository map

### 1. `dutiva-i18n` (open, AGPLv3)

**Purpose:** Reusable bilingual string framework with type-safe message definitions and React language providers.

**Contents:**

- `src/i18n/core.ts` → `Bi` type, `defineMessages`, `pick`, `pickL`, `keyOfL`.
- `src/i18n/context.ts` and `LangProvider.tsx`/`ForcedLangProvider.tsx` (refactored to accept configuration).

**Public API:**

- `defineMessages<T>(messages: T): T`
- `pick(value: Bi, lang: Lang): string`
- `useI18n()` hook returning `t`, `x`, `L`, `lang`.
- `LangProvider`, `ForcedLangProvider`.

**Security boundary:**

- No network calls. No secrets. No customer data.
- Language preference can be stored in `localStorage`; default key names should be configurable.

**Dependencies:** React only.

**Licensing recommendation:** AGPLv3.

**Migration complexity:** Low. The core is already isolated. The only cleanup is removing Dutiva-specific default language constants if any.

**Risks:** API surface is small and stable. Risk is that the `Bi` type and `useI18n` API become a de facto standard and harder to change.

---

### 2. `dutiva-ui` (open, AGPLv3)

**Purpose:** Generic design-system package built on Tailwind v4 with configurable tokens, surfaces, and React components.

**Contents:**

- `src/styles/*` (tokens, surfaces, patterns, animations, base).
- Generic components from `src/components/` (`Disclaimer` as a generic callout, `chips.ts`).
- Theme provider from `src/lib/theme.tsx`.

**Public API:**

- CSS variables / Tailwind theme configuration.
- `ThemeProvider`, `useTheme()`.
- `Disclaimer` component accepting localized text.
- Chip/tone helpers.

**Security boundary:**

- Pure CSS/React. No secrets. No backend.
- Brand assets must be configurable so the open package ships with neutral placeholders.

**Dependencies:** React, Tailwind v4, `lucide-react` (or make icons optional).

**Licensing recommendation:** AGPLv3.

**Migration complexity:** Medium. The token system is already clean, but the build setup (Vite + `@tailwindcss/vite`) must move with it. The `Disclaimer` copy must become a prop.

**Risks:** Tailwind v4 is still new; API churn possible. Brand tokens must not be confused with Dutiva branding.

---

### 3. `dutiva-infra` (open, AGPLv3)

**Purpose:** Reusable cross-cutting infrastructure: optional Supabase client wrapper, privacy-scrubbed error reporting, export-guardrail mechanism, preference storage, and service-worker registration.

**Contents:**

- `src/lib/supabaseClient.ts` (refactored to accept env names).
- `src/lib/errorReporting/*` (privacy scrubbing, coarse UA, route patterns, reporter).
- `src/lib/exportProtection/*` (watermark/fingerprint/audit mechanism, without Dutiva text or limits).
- `src/lib/prefs.ts`.
- `src/lib/money.ts`.
- `src/lib/registerServiceWorker.ts`.

**Public API:**

- `createSupabaseClient(url, key)`.
- `createErrorReporter(config)`.
- `authorizeExport(config, audit)`.
- `fingerprint(text, id)` / `decodeInvisibleTag(text)`.

**Security boundary:**

- No hardcoded endpoints, keys, or rate-limit values.
- Export limits, site origin, and allowed routes are passed via configuration.

**Dependencies:** React, `@supabase/supabase-js`.

**Licensing recommendation:** AGPLv3.

**Migration complexity:** Medium. The main work is making all Dutiva-specific defaults and limit values configurable.

**Risks:** The export-protection mechanism is valuable IP. Publishing it may reduce its deterrence value; this is acceptable if the mechanism is not secrecy-dependent, but Dutiva should evaluate whether to keep even the algorithm private.

---

### 4. `dutiva-shared-core` (proprietary, Dutiva-controlled)

**Purpose:** Architecturally separated engines and plumbing that could be published later if strategy changes, but remain Dutiva-controlled for now.

**Contents:**

- Document-generation engine (`src/features/app/documents/*` minus templates).
- Workflow engine (`src/features/app/flows/flowEngine.ts`, `flowModel.ts`).
- Support ticketing/email/outbox/attachment-scan plumbing (`src/features/support/*`, relevant `supabase/functions/support-*`).
- Tenant/RLS scaffolding and multi-tenant patterns.

**Status:** Private. Not open-sourced now.

**Dependencies:** Depends on `dutiva-i18n`, `dutiva-ui`, `dutiva-infra`.

**Licensing recommendation:** Proprietary / to be decided later.

**Migration complexity:** Medium-High. Requires splitting the engine code from Dutiva content (templates, Help Centre articles, triage categories) and from the workspace UI.

**Risks:**

- Splitting too early may introduce maintenance overhead without strategic benefit.
- Keeping it private preserves the option to use a source-available license later.

---

### 5. `dutiva-advisor` (proprietary)

**Purpose:** AI-powered Canadian HR compliance advisor.

**Contents:**

- `supabase/functions/advisor-chat/*`.
- `supabase/functions/advisor-safety-event/*`.
- `src/features/app/advisor/*`.
- RAG corpus and retrieval logic.
- System prompts and safety backstop.

**Status:** Private. Never open-source.

**Dependencies:** `dutiva-i18n`, `dutiva-ui`, `dutiva-infra`, `dutiva-shared-core` (future).

**Licensing recommendation:** Proprietary.

**Migration complexity:** N/A — stays closed.

**Risks:** This is the core competitive moat. Public disclosure would expose prompt engineering, safety logic, and the compliance reasoning surface.

---

### 6. `dutiva-compliance` (proprietary)

**Purpose:** Compliance scoring, statutory tables, law monitoring, and curated corpus.

**Contents:**

- `src/features/app/views/analytics/aggregation.ts`.
- `supabase/functions/record-score-snapshots/*`.
- `src/features/app/advisor/safety/statutoryNotice.ts`.
- `src/features/app/guidance/monitoringCoverage.ts`.
- `supabase/functions/monitor-law-changes/*`, `send-law-updates/*`.
- `docs/advisor-guidance-corpus*.md` and migration-generated corpus.

**Status:** Private. Never open-source.

**Dependencies:** `dutiva-i18n`, `dutiva-ui`, `dutiva-infra`.

**Licensing recommendation:** Proprietary.

**Migration complexity:** N/A — stays closed.

**Risks:** The scoring formula and statutory tables are load-bearing proprietary IP.

---

### 7. `dutiva-knowledge` (proprietary)

**Purpose:** 50 HR document templates, reference guides, and educational content.

**Contents:**

- `src/features/app/documents/data/templates/*`.
- `src/features/app/reference/data/*`.
- Design handoffs for documents and reference content.

**Status:** Private. Never open-source.

**Dependencies:** `dutiva-i18n`, `dutiva-ui`, `dutiva-shared-core` (document engine).

**Licensing recommendation:** Proprietary.

**Migration complexity:** High templates are tightly coupled to the document engine and to each other.

**Risks:** Templates are a primary deliverable; opening them would directly enable competitors.

---

### 8. `dutiva-web` (proprietary)

**Purpose:** Dutiva's public marketing site and authenticated workspace application.

**Contents:**

- `src/app/*`, `src/features/marketing/*`, `src/features/app/views/*` workspace shells.
- `src/seo/*` (configured for Dutiva).
- `src/data/*` (Northgate Logistics fixtures).
- Public legal policies and blog/guides.

**Status:** Private. Publicly served but not open-source licensed.

**Dependencies:** All other packages.

**Licensing recommendation:** Proprietary.

**Migration complexity:** High — the app ties all packages together.

**Risks:** Even the marketing site copy and legal policies are Dutiva IP.

---

### 9. `dutiva-enterprise` (proprietary)

**Purpose:** Billing, enterprise features, admin tooling, and customer-specific functionality.

**Contents:**

- `src/config/plans.ts`, `src/features/app/billing/*`, `src/lib/billing/*`.
- `supabase/functions/create-checkout-session/*`, `create-portal-session/*`, `stripe-webhook/*`.
- Support admin dashboard, export audit trail, analytics.

**Status:** Private.

**Dependencies:** `dutiva-i18n`, `dutiva-ui`, `dutiva-infra`.

**Licensing recommendation:** Proprietary.

**Migration complexity:** Medium.

---

## Open-core package boundaries in detail

### `dutiva-i18n` boundary

**What moves out (open):**

- `Bi`, `Lang`, `LText`, `defineMessages`.
- `pick`, `pickL`, `keyOfL`.
- React providers and `useI18n` hook (generic).

**What stays in `dutiva-web`:**

- All `src/i18n/messages/*.ts` catalogues (`landing.ts`, `advisor.ts`, `workspace.ts`, etc.).
- Dutiva-specific message keys and copy.

### `dutiva-ui` boundary

**What moves out (open):**

- Token system, surface system, patterns, animations, base CSS.
- Generic `Disclaimer` component that accepts a message prop.
- Generic chip/tone helpers.

**What stays in `dutiva-web`:**

- Brand-specific token values (Dutiva gold/navy) — replaced with neutral defaults in the open package.
- Marketing page sections and landing copy.

### `dutiva-infra` boundary

**What moves out (open):**

- Optional Supabase client wrapper accepting URL/key arguments.
- Privacy-scrubbed error reporter accepting allow-list config.
- Export authorization/fingerprint/watermark mechanism accepting config.
- `money.ts`, `prefs.ts`, service-worker registration.

**What stays in `dutiva-web` / proprietary packages:**

- Dutiva site origin, route allow-lists, error-report endpoint.
- Dutiva watermark text, export velocity limits, audit log shape.
- Admin email and beta configuration.

### `dutiva-shared-core` boundary (private)

**What moves in (separated from `dutiva-web` but kept private):**

- Document generation engine (template registry, ClauseGate, merge tokens, preview, PDF/Word rendering).
- Workflow engine (flow graph, choice nodes, scoring, branching).
- Support plumbing (ticket CRUD, outbox pattern, attachment signed URLs, malware scan integration).
- Tenant/RLS patterns (organizations, members, per-tenant tables, `is_org_member` helpers).

**What stays in `dutiva-knowledge` / proprietary content packages:**

- The 50 templates.
- Help Centre articles.
- Flow content (mental-health triage, duty-to-accommodate, etc.).
- Triage categories and operator workflow.

---

## Migration plan (proprietary cleanup before any publish)

### Step 1 — Make generic modules configurable

- `src/seo/site.ts`: accept `siteName`, `supportEmail`, `legalName`, `origin`, `logoPath` from environment/config.
- `src/lib/billing/adminAccess.ts`: read `ADMIN_EMAILS` from env.
- `supabase/functions/_shared/adminAccess.ts`: same.
- `src/lib/errorReporting/*`: accept route allow-list and endpoint from config.
- `src/lib/exportProtection/*`: accept watermark text and limits from config.
- `supabase/functions/_shared/aiUsage.ts`: make default limits env-driven.
- `supabase/functions/_shared/exportGuard.ts`: make default limits env-driven.

### Step 2 — Extract `dutiva-i18n` (private package first)

- Create `packages/dutiva-i18n/` containing the core and generic providers.
- Update `src/i18n/messages/index.ts` to import from the private package.
- Run `npm run check`.

### Step 3 — Extract `dutiva-ui`

- Create `packages/dutiva-ui/` containing styles and generic components.
- Replace brand defaults with neutral placeholders.
- Update imports in `dutiva-web`.

### Step 4 — Extract `dutiva-infra`

- Create `packages/dutiva-infra/` containing generic utilities.
- Move Dutiva defaults into `dutiva-web` config.

### Step 5 — Create `dutiva-shared-core` (private)

- Move document engine, workflow engine, and support plumbing into `packages/dutiva-shared-core/`.
- Split Dutiva content into a separate private package or keep in `dutiva-web`.

### Step 6 — Legal review and history scrub

- Obtain legal sign-off on AGPLv3, trademark policy, dependency compatibility, and AI provider terms.
- Audit and clean git history.

### Step 7 — Private pilot

- Publish `dutiva-i18n`, `dutiva-ui`, and `dutiva-infra` to a private registry with AGPLv3 licenses.
- Run integration tests against `dutiva-web`.

### Step 8 — Public release (only with explicit sign-off)

- Flip the three open repositories to public.
- Publish packages to npm.
- Announce with clear trademark and scope messaging.

---

## Risks and mitigation

| Risk                                        | Impact | Mitigation                                                                                                 |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Open packages leak Dutiva defaults          | High   | Env-ify all defaults before extraction; use neutral placeholders in open packages.                         |
| Copyleft confusion for enterprise customers | Medium | Clearly document that only the open UI/i18n/infra packages are AGPLv3; the Dutiva SaaS is proprietary.     |
| AGPLv3 + Apache-2.0 compatibility question  | Medium | **Legal review required**; keep Apache-2.0 deps as dev-only where possible.                                |
| Competitor forks open packages              | Low    | Generic UI/i18n/infra are not the moat; the moat stays closed.                                             |
| Reduced export-protection deterrence        | Low    | The mechanism is deterrence through traceability, not secrecy; still, evaluate whether to keep it private. |
| Maintenance overhead of package split       | Medium | Start with private packages in the monorepo; only move to multi-repo after validation.                     |
| History contains secrets or customer data   | High   | Mandate history audit and rotation before public release.                                                  |

---

## Recommendation

Adopt this package structure internally as the long-term target. Begin with the low-risk extraction of `dutiva-i18n`, `dutiva-ui`, and `dutiva-infra` as private packages. Keep `dutiva-shared-core`, `dutiva-advisor`, `dutiva-compliance`, `dutiva-knowledge`, `dutiva-web`, and `dutiva-enterprise` closed. Public release of the open packages should happen only after legal review, history scrub, and internal pilot testing.
