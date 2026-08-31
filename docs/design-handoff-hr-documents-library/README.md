# Handoff: HR Documents Library (Document Studio + Repository)

## Overview

This feature is Dutiva's guided HR document system: a **Document Studio** (16 reusable,
jurisdiction-aware templates — Ontario / Québec / Federal), a guided **generation wizard**
that turns a template into a real document, a **Document Repository** of everything an
organization has generated (with status/review/signature/risk tracking), a **Document
Detail** view (preview, fields, versions, recipients & signatures, audit trail), and a
**Data Model & Handoff** view that documents the intended Supabase schema. Bilingual
(EN/FR), role-gated (owner/HR/manager/viewer/external signer), and responsive down to
phone width.

## About the Design Files

**The files in this bundle are design references, not production code.** They were built
as an interactive prototype in a design tool, using that tool's own templating runtime
(`support.js`) to simulate a real app. That runtime is proprietary to the design tool —
**do not copy `support.js` or try to run the `.dc.html` file inside the product.** Nothing
in `HR Documents Library.dc.html` should be lifted verbatim into the codebase.

Your task is to **recreate this design in the target stack** — React 19 + TypeScript +
Vite + Tailwind v4, backed by Supabase (Postgres + RLS + Storage), deployed on Vercel —
using the existing Dutiva Canada Design System (components + tokens) already in that
codebase. Where this document says "the prototype does X," read that as intended
behavior to reimplement idiomatically, not code to transcribe.

`dutiva-data.js` is different: it's seed/sample data, but it was **deliberately structured
1:1 against an intended Supabase schema** (see "Data Model" below) and is genuinely useful
as a starting spec and as seed-row content for local dev/staging.

## Fidelity

**High-fidelity visuals, mocked everything else.** Colors, type, spacing, chip/status
system, card and layout composition, and responsive behavior are final-intent and use the
real design-system tokens (`_ds/.../tokens/*.css`, `.surface-app` ramp). Recreate the UI
closely.

Everything _behind_ the UI is illustrative:

- All data (16 templates, 14 sample documents, 7 employees, 4 cases) is fictional sample
  content for a fictional org ("Northgate Logistics Inc.").
- There is no backend. No auth, no persistence, no real e-signature integration, no PDF
  export. Actions like "send for signature," "approve," "export," and autosave are all
  simulated client-side with `setTimeout` and in-memory array mutation.
- **The legal content is not legal advice and has not been reviewed by counsel.** Clause
  text, statutory references, and risk/review classifications throughout the 16 templates
  are illustrative sample content written for this prototype (a few — noted in
  `dutiva-data.js`'s `BODIES` comment — were adapted from a reference HR document library;
  most were drafted to match that style). **Every template must go through qualified
  Canadian employment-law review before it is used to generate a real document a customer
  can send.** This is the single most important caveat in this handoff — get it in front
  of legal before scoping engineering work, not after.

## Screens / Views

The prototype is a single-page shell that swaps a `view` state between six screens. There
is no real routing — recommend real routes in production (e.g.
`/app/documents/studio`, `/app/documents/:id`, `/app/documents/generate/:templateId`, etc.)
so links, back button, and refresh all work.

### 1. Document Studio (template library)

Grid of the 16 templates, grouped by category (Hiring & onboarding · Agreements & IP ·
Policies & handbook · Performance & discipline · Termination & offboarding), each card
showing: template ID (T01–T16), risk chip, name, 2-line description, jurisdiction pills,
an HR/lawyer-review flag chip, an **applicability chip** (see "Applicability engine"
below), version, est. completion time, and a "Generate" button.

Above the grid: an **organization compliance profile** bar (headcount tier, sector,
union toggle — editable inline, drives applicability live) and a toolbar (search + category

- jurisdiction + risk filters). Empty state when filters match nothing.

### 2. Template Detail

Single template: risk/review chips, full description, per-jurisdiction legal notes,
statutory references, "what's included" checklist, and an applicability card explaining
_why_ this template does/doesn't apply to the current org profile. Right rail (sticky):
a sample rendered preview of the document and a "Generate document" CTA. Below the fold,
the standing Dutiva disclaimer ("not legal advice").

### 3. Generation flow (3-step wizard)

- **Step 0 — Context:** who/where this document is for (employee picker — required for
  employee-scoped templates, optional/linked for candidate templates, hidden for org-wide
  templates), case file, jurisdiction, document language.
- **Step 1 — Guided questions:** dynamic form, sectioned per the template's question
  schema (text / textarea / date / number / select / radio), required-field markers.
- **Step 2 — Review & risk check:** merge-field fill progress (X/Y fields, %), risk level,
  review posture, and a final "Save to repository" button.

Right rail (sticky) across all three steps: **live preview** of the actual document text,
with unfilled merge fields highlighted differently from filled ones (`.mf` vs `.mf.filled`)
so the user always sees what they're producing. Step header shows a 3-dot progress
control (click any completed step to jump back) and an autosave indicator
(unsaved → saving… → all changes saved).

### 4. Document Repository

Every generated document for the org. Search, group-by (none/employee/status/category),
show-archived toggle, and six independent filters (status, review, signature, risk,
jurisdiction, employee). Desktop: an 8-column table (title, employee/scope, jurisdiction,
status, review, signature, risk, updated). **Below 768px this becomes stacked label/value
cards** — see "Responsive behavior."

### 5. Document Detail

Header: title, reference number, template name, and all four status chips. Tabs:
**Preview** (rendered document), **Fields** (every merge field and its current value or
"not filled"), **Versions** (change history), **Recipients & signatures** (signing order,
per-recipient status, provider + envelope id — provider-agnostic by design), **Audit
trail** (append-only event log, newest first). Right rail: a metadata card that literally
labels each row with the Supabase column it maps to (e.g. "Current version → `documents.current_version_id`") —
this was built specifically to make the handoff obvious; treat those labels as authoritative.
Action buttons (Edit, Request review, Approve, Send for signature, Export, Archive,
Restore, Void) are role-gated and status-gated — see `docActionsFor()` logic described
below.

### 6. Data Model & Handoff (dev-only view)

A visual walkthrough of the intended schema: end-to-end flow, entity cards (table name,
domain group, RLS flag, key fields, relations, "where it surfaces in the UI"), status
enums, a roles × permissions matrix, and the audit event catalogue. **This screen's
content is reproduced in full below** — it is the authoritative starting spec.
Recommend NOT shipping this screen to production end users; keep its content alive as
engineering documentation instead (this README, a docs site, or a role-gated internal
route).

Plus, on every screen: a collapsible **sidebar** (workspace switcher stub, primary nav,
Document Studio/Documents/Data-model links, user identity footer) and a **topbar**
(page title, role switcher labeled "Viewing as" — a prototype-only control for demoing
permissions, EN/FR toggle, light/dark toggle). Toasts confirm actions bottom-right.

## Interactions & Behavior

- **Role switching** ("Viewing as" in the topbar — a prototype convenience, not a real
  feature) changes which action buttons render and shows read-only/permission-denied
  banners on Document Detail. Backing logic: a static `capability → role[]` permission
  map (reproduced under "Roles & permissions" below).
- **Language toggle** (EN/FR) re-renders all UI copy and the generated-document preview
  text in the other language, including jurisdiction-specific statute names.
- **Theme toggle** (light/dark) flips the design system's `.surface-app` token ramp.
- **Org profile controls** (headcount, sector, union) recompute template applicability
  live, client-side, against every template's `size_trigger`/`union_sensitive` rule. See
  "Applicability engine" below — this logic has real legal consequences and should not
  stay purely client-side in production (see "Known Gaps").
- **Search/filters** are instant, in-memory substring/equality filters — fine for a
  prototype, not for a large real repository (see "Known Gaps").
- **Wizard autosave** is simulated: any answer change sets state to "unsaved," then after
  ~800ms flips to "saving…", then ~650ms later to "all changes saved." Replace with real
  debounced writes to `document_generation_sessions`.
- **Applicability engine** (`applicability(template)` in the prototype logic): given the
  org's headcount, union status, and sector, returns one of _required for you_ / _applies
  to you_ / _applies above your size_ / _collective agreement governs_, plus the specific
  legal reason text. Drives both the Studio card chip and the Detail applicability card.
  Rules encoded in the sample data: ON disconnecting-from-work policy triggers at 25+
  employees; mass/group termination provisions trigger at 50+; several termination/
  discipline templates flag "collective agreement governs" when the org is unionized.
  **These specific thresholds must be legally verified before ship** — they are correct
  to the prototype author's research but are exactly the kind of fact that needs a
  lawyer's sign-off for a compliance product.
- **Conditional clauses:** a document's rendered body isn't static — blocks in a
  template's `preview` array can carry a `when: { juris, min_headcount, union }` gate, so
  (for example) an Ontario employer with 25+ staff automatically gets an extra
  "Disconnecting from work" clause injected, and a unionized workplace gets a "collective
  agreement governs" clause injected into termination/discipline templates. This is a
  genuinely useful pattern worth preserving — just move the evaluation server-side.
- **Responsive behavior** — three breakpoints, mobile-first priority per your request:
  - **≤1023px:** sidebar becomes an off-canvas drawer (slide-in, backdrop, hamburger
    button in the header); the two-column split layouts (detail/generate/document screens)
    stack to full width.
  - **≤767px:** the repository table drops its header row and columns entirely and
    renders each document as a wrapped label/value card (`data-label` attrs drive
    generated `::before` labels per cell) — chosen over horizontal scrolling because the
    table has 8 columns and would be unreadable scrolled.
  - **≤640px:** header padding/gaps tighten, the "Viewing as" text label and language
    text hide (icon-only), the role `<select>` truncates with an ellipsis instead of
    overflowing, two-column form/detail grids collapse to one column, wizard step text
    labels hide (numbers only), and toasts go full-width instead of right-anchored.

## State Management

The prototype's state (for parity — re-derive properly in real state management, don't
port this shape verbatim):

- **Navigation:** `view` (studio/detail/generate/repository/document/datamodel),
  `templateId`, `docId`, `docTab`, `sidebarOpen`.
- **Global UI:** `lang` (en/fr), `theme` (light/dark), `role` (owner/hr/manager/viewer/
  external), `toasts[]`.
- **Studio filters:** `q`, `fCat`, `fJuris`, `fRisk`.
- **Org compliance profile:** `orgHeadcount`, `orgUnion`, `orgSector` — in production this
  is `organizations` row data, not local UI state.
- **Generation wizard:** a single `gen` object — `{ step, employeeId, caseId,
jurisdiction, language, answers: {}, saveState }`. `answers` is a flat `{questionId:
value}` map keyed by the active template's question schema.
- **Repository:** `rq` (search), `rf` (an object of 7 independent filter values),
  `showArchived`, `groupBy`.
- **Data-model view:** `dmGroup` (entity-group filter chip).

Recommended real split: server state (templates, documents, employees, cases,
organization profile) via TanStack Query/Supabase client hooks; local UI state (wizard
step, filters, sidebar open, active tab) via component state or a small store. Don't
recreate the prototype's single global `window.DUTIVA_DATA` object — that only exists
because the prototype has no backend.

## Data Model (Supabase) — authoritative starting spec

This is transcribed from the prototype's own "Data Model & Handoff" screen
(`dutiva-data.js` → `DUTIVA_DATA.dataModel`), which was purpose-built as the spec for this
handoff. Treat it as the starting migration plan, not a final one — see "Known Gaps" for
what it doesn't yet cover.

**Target stack:** React 19 + Vite · Supabase (Postgres + RLS + Storage) · Vercel ·
provider-agnostic e-signature.

### Entities

| Table                          | Domain              | RLS | Key fields                                                                                                                                                                                                                                           | Relations                                                                                          | Surfaces in UI as                                       |
| ------------------------------ | ------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `organizations`                | Identity & access   | ✓   | `id, name, employee_count, size_tier, unionized, sector, federally_regulated, primary_jurisdiction, created_at`                                                                                                                                      | has many members/employees/documents/templates                                                     | Workspace switcher; org compliance profile bar          |
| `profiles`                     | Identity & access   | ✓   | `id, full_name, email, avatar_url`                                                                                                                                                                                                                   | belongs to many orgs via `organization_members`                                                    | User menu; `created_by`/`updated_by`                    |
| `organization_members`         | Identity & access   | ✓   | `id, organization_id, profile_id, role (owner\|hr\|manager\|viewer\|external), created_at`                                                                                                                                                           | → organizations, → profiles                                                                        | Role switcher; permission gating (**the heart of RLS**) |
| `employees`                    | People & cases      | ✓   | `id, organization_id, name, role, jurisdiction, status`                                                                                                                                                                                              | has many documents, employee_cases                                                                 | Generation context picker; repository filter            |
| `employee_cases`               | People & cases      | ✓   | `id, organization_id, employee_id, title, jurisdiction, risk`                                                                                                                                                                                        | → employees; has many documents                                                                    | Generation context picker; repository filter            |
| `document_template_categories` | Template library    | –   | `id, key, name_en, name_fr, order`                                                                                                                                                                                                                   | has many document_templates                                                                        | Studio category sections & filter                       |
| `document_templates`           | Template library    | –   | `id, category_id, template_key, name_en/fr, description_en/fr, jurisdictions_supported[], risk_level, requires_lawyer_review, is_active, status, created_at, updated_at`                                                                             | → category; has many versions                                                                      | Studio cards & detail                                   |
| `document_template_versions`   | Template library    | –   | `id, template_id, version_number, language, body_content, schema_json, question_flow_json, clause_library_json, statutory_references_json, effective_date, deprecated_at, created_by`                                                                | → template; referenced by `documents.template_version_id`                                          | Template detail; generation questions & preview         |
| `document_generation_sessions` | Generated documents | ✓   | `id, organization_id, template_version_id, employee_id?, case_id?, answers_json, language, jurisdiction, created_by`                                                                                                                                 | → template_version; becomes a `documents` row on save                                              | The guided generation wizard                            |
| `documents`                    | Generated documents | ✓   | `id, organization_id, employee_id?, case_id?, template_id, template_version_id, title, language, jurisdiction, status, risk_level, review_status, signature_status, current_version_id, created_by, updated_by, created_at, updated_at, archived_at` | → template_version (frozen); → employee/case; has many versions/recipients/signatures/audit_events | Repository row + detail header                          |
| `document_versions`            | Generated documents | ✓   | `id, document_id, version_number, content, answers_json, generated_fields_json, change_summary, created_by, created_at`                                                                                                                              | → documents                                                                                        | Versions tab                                            |
| `document_recipients`          | Signatures & audit  | ✓   | `id, document_id, recipient_type (employee\|manager\|hr\|external), name, email, signing_order, status, signed_at`                                                                                                                                   | → documents                                                                                        | Recipients & signatures tab                             |
| `document_signatures`          | Signatures & audit  | ✓   | `id, document_id, provider, external_envelope_id, status, sent_at, viewed_at, signed_at, declined_at, expires_at`                                                                                                                                    | → documents                                                                                        | Recipients & signatures tab                             |
| `document_exports`             | Signatures & audit  | ✓   | `id, document_id, format, exported_by, created_at`                                                                                                                                                                                                   | → documents                                                                                        | Export action + audit entries                           |
| `document_audit_events`        | Signatures & audit  | ✓   | `id, organization_id, document_id, actor_id, event_type, event_metadata, created_at`                                                                                                                                                                 | → documents; → profiles (actor)                                                                    | Audit trail tab — **append-only**                       |

**RLS principle** (from the prototype's own note): every table is org-scoped. Row Level
Security limits reads to the caller's `organization_members` row; role drives write
capability. Sketch:

```sql
-- example shape, not final SQL
create policy "org members can read their org's documents"
  on documents for select
  using (organization_id in (
    select organization_id from organization_members where profile_id = auth.uid()
  ));
```

### End-to-end flow

1. Template library → `document_templates`
2. Template detail → `document_template_versions`
3. Guided questions → `document_generation_sessions`
4. Live preview → `generation_sessions.answers_json`
5. Review / risk check → `documents.review_status`
6. Save to repository → `documents` + `document_versions`
7. Export / e-sign → `document_signatures`
8. Versions & audit trail → `document_audit_events`

### Status enums

- **`documents.status`:** `draft, in_review, needs_revision, approved, sent_for_signature,
partially_signed, signed, exported, archived, voided, deleted`
- **`review_status`:** `not_reviewed, hr_review_required, lawyer_review_recommended,
approved_for_use`
- **`signature_status`:** `not_sent, sent, viewed, pending, partially_signed, signed,
declined, expired, voided`
- **`risk_level`:** `low, medium, high`

### Roles & permissions (drives RLS + UI gating)

| Capability         | Owner/Admin | HR manager | Manager | Viewer | External signer |
| ------------------ | ----------- | ---------- | ------- | ------ | --------------- |
| View repository    | ✓           | ✓          | ✓       | ✓      | –               |
| View studio        | ✓           | ✓          | ✓       | ✓      | –               |
| Generate           | ✓           | ✓          | ✓       | –      | –               |
| Edit               | ✓           | ✓          | –       | –      | –               |
| Request review     | ✓           | ✓          | ✓       | –      | –               |
| Approve review     | ✓           | ✓          | –       | –      | –               |
| Send for signature | ✓           | ✓          | –       | –      | –               |
| Export             | ✓           | ✓          | ✓       | –      | –               |
| Archive            | ✓           | ✓          | –       | –      | –               |
| Restore            | ✓           | –          | –       | –      | –               |
| Void               | ✓           | –          | –       | –      | –               |
| Manage permissions | ✓           | –          | –       | –      | –               |
| View audit         | ✓           | ✓          | –       | –      | –               |

Role notes from the sample data: Manager access is meant to be scoped to _assigned_
employees/cases only (not implemented in the prototype — it shows all); External signer
should see only their own assigned signing package, nothing else in the workspace — model
this as a separate, narrowly-scoped read path, not the same query with a role check
bolted on.

### Audit event catalogue

`template_opened, generation_started, draft_saved, document_created, document_updated,
version_created, review_requested, review_approved, review_rejected, sent_for_signature,
signature_viewed, signature_completed, document_exported, document_archived,
document_restored, permission_changed, comment_added`

`document_audit_events` should be **append-only** (no update/delete) — enforce with a
Postgres rule/trigger or by simply never granting UPDATE/DELETE on that table, even to
service roles.

### Organization compliance profile (drives applicability)

- `employer_size_tiers`: micro (1–4) · small (5–49) · mid (50–249) · large (250+). Dutiva's
  launch focus is micro + small (under 50).
- `sectors` (9 sample values, each flagged `federally_regulated: boolean`): transportation
  & warehousing, retail & hospitality, construction, professional services, manufacturing,
  healthcare & social (all provincial); banking & finance, telecommunications,
  interprovincial transport (all federal).
- Size thresholds referenced by the applicability engine: 25+ employees (ON
  disconnecting-from-work + electronic-monitoring policies; QC Bill 96/OQLF registration),
  50+ employees (group/mass-termination enhanced notice + government notification).

### Template content shape

Each template version's content (`document_template_versions.schema_json` /
`question_flow_json` / `body_content`) is structured as:

- **`questions[]`**: `{ id, section_en/fr, label_en/fr, type (text|textarea|date|number|
select|radio), required, placeholder_en/fr, hint_en/fr?, options[]? }` — drives the wizard
  form and the Fields tab.
- **`preview[]`**: ordered content blocks — `{type: "title"|"meta"|"para"|"clause"|"sig"|
"ack"|"note", en, fr, when?}` — `{{snake_case}}` tokens inside `en`/`fr` text are merge
  fields resolved from `answers` (plus computed tokens: `org`, `today`, `jurisdiction`,
  `statute`). `when: {juris, min_headcount, union}` makes a block conditional.
- **`body_content` (full legal text):** a small number of templates additionally carry a
  full-length HTML body (`bodyHtml_en` in the prototype) with the same `{{token}}` merge
  convention, for a "real document" level of formatting (headings, addresses, signature
  tables) rather than the shorter structured preview. Decide in implementation whether
  every template should eventually have this richer format, and store it as its own
  versioned column rather than a parallel ad hoc field.

## Design Tokens & Components

Use the existing **Dutiva Canada Design System** — don't redefine tokens. This feature
renders on the **`.surface-app`** (light-first workspace) ramp, flipping to dark under
`[data-theme="dark"]`. Typography: `--font-display` (Montserrat) for headings/eyebrows/
route titles, `--font-sans` (Inter) for body/UI. Radii, shadows, and motion all come from
`tokens/elevation.css` / `tokens/animations.css`.

**Important gap:** the prototype consumes the design system's CSS _tokens_ (colors,
type, spacing) but hand-rolled its own HTML/CSS for pieces the system already ships as
real components — it does not actually mount `StatusChip`, `Toast`/`ToastStack`,
`Sidebar`, or `Topbar` from `components/app/`. In production, use the real components
instead of reimplementing them:

| Prototype's ad hoc CSS                                                                                           | Use instead                  |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `.chip.tone-{risk\|warn\|ok\|info\|gold\|neutral}` + `.cdot`                                                     | `StatusChip` / `StatusDot`   |
| Bottom-right toast stack                                                                                         | `Toast` / `ToastStack`       |
| Left nav rail                                                                                                    | `Sidebar`                    |
| Top header bar                                                                                                   | `Topbar`                     |
| Advisor-style embedded answer card _(not used here, but relevant if this feature ever surfaces Advisor content)_ | `ToneCard` / `CitationChips` |

CSS built specifically for this feature, with no existing design-system equivalent —
worth formalizing as shared components since they'll recur anywhere documents render:

- **`.jchip`** — small jurisdiction pill (ON/QC/FED), distinct from a status chip.
- **`.doc-body` / `.doc-full`** + **`.mf` / `.mf.filled`** — the rendered-document "paper"
  typography, including the merge-field highlight treatment (unfilled vs. filled). This is
  the most reusable/valuable piece to extract — every preview surface (detail, wizard,
  document view) uses it.
- **`.stepnum` / `.step-item` / `.step-lbl`** — wizard step indicator (numbered circles,
  active/done states, connecting line).
- **`.actbtn` + `.actbtn-{primary|ghost|danger}`** — document action buttons (Edit,
  Approve, Void, etc.).
- **`.seg-btn`** — segmented toggle (used for union on/off, radio-style question inputs).
- **`.skel`** — shimmer skeleton loading blocks.

## Content & Legal Content — read before scoping

Two categories of "content" in this feature need different owners:

1. **UI copy** (~230 keys × EN/FR, namespaced `app.*`, `nav.*`, `studio.*`, `detail.*`,
   `gen.*`, `repo.*`, `col.*`, `filter.*`, `docd.*`, `dm.*`, `toast.*`, `disc.*`,
   `common.*`, `profile.*`, `applic.*` in `dutiva-data.js` → `DUTIVA_DATA.i18n`). Port these
   key sets directly into a real i18n library (react-i18next / next-intl / lingui) as a
   starting translation file — the namespacing already matches a sane file-per-namespace
   split.
2. **Legal template content** (the 16 templates' clauses, statutory citations, risk
   ratings, and jurisdiction notes). **This is sample content and is not cleared for
   production use.** Flag this to product/legal now — it affects timeline, since template
   content should probably be reviewed/signed-off template-by-template rather than
   blocking the whole feature on all 16 at once.

## Recommended Implementation Architecture

To keep this maintainable and easy to extend past the initial 16 templates:

- **Feature folder:** `src/features/app/documents/` (matching the design system's existing
  `src/features/app/` convention), with `studio/`, `generation/`, `repository/`,
  `document-detail/` subfolders, a shared `components/` (status chip, doc-paper renderer,
  step indicator, action buttons), an `api/` folder of Supabase-backed query/mutation
  hooks, and `types/` generated via `supabase gen types typescript`.
- **Server state via TanStack Query** (or equivalent) for templates/documents/employees/
  cases/org profile; keep wizard-in-progress state local until saved.
- **Move the applicability + conditional-clause engine server-side** (a Postgres function
  or Edge Function), so the legal text a document actually contains is computed
  consistently and auditably rather than duplicated in client logic that could drift from
  the server's understanding. Store the _resolved_ clause set on the saved
  `document_versions.content`, not just the answers — so a later change to the engine's
  rules doesn't retroactively alter a document that was already finalized/signed.
- **E-signature adapter interface:** keep the UI's provider-agnostic framing
  (`document_signatures.provider`) real by defining one internal interface
  (`createEnvelope`, `getStatus`, webhook handler) with a concrete adapter per vendor
  behind it, rather than coupling the UI to one provider's SDK.
- **Template content as data, not code:** keep `questions`/`preview`/`body_content` as
  versioned JSON rows (as modeled), not hardcoded per-template React components — this is
  what lets non-engineers eventually maintain template content and is already how the
  prototype's data is shaped.
- **Testing priority:** given the compliance stakes, prioritize tests that snapshot the
  exact resolved clause text per (template × jurisdiction × headcount × union) combination
  over general UI tests — that matrix is where a silent regression would matter most.

## Known Gaps / Not Yet Designed

Product/engineering decisions the prototype does not resolve:

- **Auth & onboarding:** no login/signup/invite-teammate flows exist. Assumed to be
  Supabase Auth, but method (password/magic link/SSO) and the multi-org workspace-switcher
  UI are undesigned.
- **Manager/external scoping:** the permission matrix implies Manager sees only assigned
  employees/cases and External signer sees only their own signing package, but the
  prototype (no backend) shows everything to every role — the _query-level_ scoping needs
  real design, not just a UI role switch.
- **Real e-signature + export:** both are fully simulated (a status flip + a toast). Needs
  a real provider integration, webhook handling, and actual PDF/DOCX rendering + Storage.
- **Template authoring workflow:** no admin/CMS UI for creating or editing template
  versions — currently implies direct database access.
- **Notifications:** no email/in-app notification design for review requests, signature
  requests, or approvals.
- **Search at scale:** prototype filtering is an in-memory substring match; plan for
  Postgres full-text/trigram search once repositories grow past sample size.
- **Concurrent editing / autosave conflicts:** not addressed — single-editor assumption
  throughout.

## Assets

- `design/assets/dutiva-leaf.png`, `design/assets/icon-app.svg` — the two brand assets the
  prototype references directly. Sourced from the Dutiva Canada Design System's own
  `assets/` folder; use the design system's copies in the real app rather than these.
- All other visuals (chips, cards, icons) are lucide icons (inline SVG, matching the
  design system's icon convention) and CSS — nothing else to extract.
- The full design-system token/component set (colors, type, spacing, `StatusChip`,
  `Toast`, `Sidebar`, `Topbar`, etc.) is a separate, existing deliverable — don't duplicate
  it here; treat it as the source of truth for anything visual not called out above.

## Files in This Package

- `README.md` — this document.
- `design/HR Documents Library.dc.html` — the full interactive prototype, for reference
  only (see "About the Design Files" — not runnable outside the design tool, not
  production code).
- `design/dutiva-data.js` — the seed data + the authoritative data-model spec
  (`DUTIVA_DATA.dataModel`) this README's "Data Model" section was transcribed from. Also
  contains all 16 templates' full question/preview content and the complete EN/FR i18n
  dictionary — useful directly as seed rows and starting translation files.
- `design/assets/` — the two brand image assets referenced above.
- `screenshots/` — full-page reference captures of the six screens: `01-studio.png`,
  `02-template-detail.png`, `03-generate-wizard.png`, `04-repository.png`,
  `05-document-detail.png`, `06-data-model.png`.

Not included: `support.js` (the prototype tool's runtime — not app code, see above) and a
stray, unused scratch file (`_tmp_bodies_1.json`, superseded by the `BODIES` data already
inlined in `dutiva-data.js`) that was removed from the source project as dead weight.
