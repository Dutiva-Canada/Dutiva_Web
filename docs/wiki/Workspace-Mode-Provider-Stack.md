# Workspace Mode & Provider Stack

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [CONVENTIONS.md](CONVENTIONS.md)
- [src/app/router.tsx](src/app/router.tsx)
- [src/features/app/AppProviders.tsx](src/features/app/AppProviders.tsx)
- [src/features/app/billing/PlanGate.tsx](src/features/app/billing/PlanGate.tsx)
- [src/features/app/docstudio/DocStudioOverlay.tsx](src/features/app/docstudio/DocStudioOverlay.tsx)
- [src/features/app/views/employees/EmployeesProductionView.tsx](src/features/app/views/employees/EmployeesProductionView.tsx)
- [src/features/app/views/home/HomeCompliancePanel.tsx](src/features/app/views/home/HomeCompliancePanel.tsx)
- [src/features/app/views/home/HomeProductionView.tsx](src/features/app/views/home/HomeProductionView.tsx)
- [src/features/app/views/home/HomeView.test.tsx](src/features/app/views/home/HomeView.test.tsx)
- [src/features/app/views/home/HomeView.tsx](src/features/app/views/home/HomeView.tsx)
- [src/features/app/views/home/HomeWorkflowsCard.tsx](src/features/app/views/home/HomeWorkflowsCard.tsx)
- [src/features/app/views/settings/SettingsView.test.tsx](src/features/app/views/settings/SettingsView.test.tsx)
- [src/features/app/views/templates/TemplatesView.test.tsx](src/features/app/views/templates/TemplatesView.test.tsx)
- [src/features/app/views/templates/TemplatesView.tsx](src/features/app/views/templates/TemplatesView.tsx)
- [src/features/app/workspaceMode/ProductionEmptyState.tsx](src/features/app/workspaceMode/ProductionEmptyState.tsx)
- [src/features/app/workspaceMode/WorkspaceModeProvider.test.tsx](src/features/app/workspaceMode/WorkspaceModeProvider.test.tsx)
- [src/features/app/workspaceMode/WorkspaceModeProvider.tsx](src/features/app/workspaceMode/WorkspaceModeProvider.tsx)
- [src/features/app/workspaceMode/api.test.ts](src/features/app/workspaceMode/api.test.ts)
- [src/features/app/workspaceMode/api.ts](src/features/app/workspaceMode/api.ts)
- [src/features/app/workspaceMode/workspaceModeContext.ts](src/features/app/workspaceMode/workspaceModeContext.ts)
- [src/i18n/messages/home.ts](src/i18n/messages/home.ts)
- [src/i18n/messages/settings.ts](src/i18n/messages/settings.ts)

</details>

The Dutiva workspace supports two runtime modes — **demo** and **production** — that determine whether every module renders fixture data (the "Northgate Logistics Inc." prototype experience) or real Supabase-backed records scoped to an organization. This page covers the mode resolution lifecycle, the `AppProviders` composition tree, the per-module `productionApi.ts` data boundary pattern, and the phased rollout strategy for ungating modules.

## Workspace Mode Overview

`WorkspaceMode` is a discriminated string literal: `'demo' | 'production'`. Demo mode is the default for every visitor — it shows the full product with bilingual fixture data. Production mode activates only for a signed-in user who can hold a production workspace — platform admin or active org member (`canUseProduction = isAdmin || membership !== null`) — and has explicitly stored that preference.

[src/features/app/workspaceMode/workspaceModeContext.ts:5-5]()

| Condition                                           | Resolved Mode |
| --------------------------------------------------- | ------------- |
| Supabase not configured (`supabase` is null)        | `demo`        |
| Signed out or auth loading                          | `demo`        |
| Signed in, `is_admin_user()` RPC returns false      | `demo`        |
| Signed in admin, no stored preference               | `demo`        |
| Signed in admin, stored preference = `'production'` | `production`  |

Sources: [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:138-141](), [src/features/app/workspaceMode/api.ts:33-41]()

## WorkspaceModeProvider Resolution Lifecycle

`WorkspaceModeProvider` sits inside `AuthProvider` and reads the auth session to resolve the mode. On mount (or when the session changes), it runs an async `load()` sequence:

1. **Invite claim** — `claimOrgInvitations()` (migration `0168`) converts pending `organization_invitations` addressed to the sign-in email into real memberships first, so an invited teammate's first sign-in already sees the org. [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:105]()
2. **Parallel fetch** — for every signed-in user, fetches four things concurrently via `Promise.all`: `checkIsAdmin()` (the `is_admin_user()` RPC), stored mode preference from `workspace_preferences`, profile from `profiles`, and organization membership from `organization_members`. [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:108-113]()
3. **Eligibility** — `canUseProduction = isAdmin || membership !== null`. Platform admins and active org members can hold a production workspace; everyone else stays in demo (a non-member can still create an org through the `/employer` onboarding door — `create_organization` is self-serve). [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:116-123]()
4. **Invite intent** — a freshly claimed invite plus a stored `'demo'` preference flips the preference to `'production'` so the teammate lands in the real org. [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:125-132]()
5. **Org provisioning** — if the stored mode is `'production'` but no organization membership exists, calls `bootstrapOrganization()` which invokes the `create_organization()` RPC. This SECURITY DEFINER function atomically creates the org and inserts the caller as its active owner; capacity/waitlist outcomes surface as `admissionStatus`. [src/features/app/workspaceMode/api.ts:106-121](), [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:141-157]()
6. **Org settings + onboarding hydration** — with an org resolved, fetches `fetchOrganizationSettings(orgId)`; in production mode it then awaits `hydrateEmptyWorkspaceOnboarding(userId, orgId)`, which OR-merges server-side onboarding marks (`workspace_preferences.onboarding`) into localStorage so the setup path and Keep-going card render post-merge state on first paint. [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:159-166](), [src/features/app/workspaceMode/emptyWorkspaceOnboarding.ts]()
7. **Identity assembly** — builds a `WorkspaceIdentity` from the org/profile (company name, contact name, province, city, email). In demo mode, this falls back to `DEMO_IDENTITY` (Northgate Logistics Inc.). [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:169]()

### Resolution Lifecycle Diagram

```mermaid
sequenceDiagram
    participant AP as "AuthProvider"
    participant WMP as "WorkspaceModeProvider"
    participant API as "api.ts"
    participant SB as "Supabase"

    AP->>WMP: "session (signed-in)"
    WMP->>API: "claimOrgInvitations()"
    API->>SB: "rpc('claim_org_invitations')"
    SB-->>API: "claimed count"

    par "Parallel fetches (every signed-in user)"
        WMP->>API: "checkIsAdmin()"
        API->>SB: "rpc('is_admin_user')"
        SB-->>API: "true/false"
    and
        WMP->>API: "fetchStoredMode(userId)"
        API->>SB: "from('workspace_preferences').select()"
        SB-->>API: "{mode: 'production'}"
    and
        WMP->>API: "fetchAdminProfile(userId)"
        API->>SB: "from('profiles').select()"
        SB-->>API: "profile row"
    and
        WMP->>API: "fetchOrganizationMembership(userId)"
        API->>SB: "from('organization_members').select()"
        SB-->>API: "membership row or null"
    end

    alt "canUseProduction = false"
        WMP->>WMP: "setAdmin(SIGNED_OUT_STATE) → mode='demo'"
    else "admin or active member"
        opt "claimed invite + stored 'demo'"
            WMP->>API: "saveStoredMode('production')"
        end
        opt "production + no org"
            WMP->>API: "bootstrapOrganization()"
            API->>SB: "rpc('create_organization')"
            SB-->>API: "{id: 'org-xxx'}"
        end
        opt "org resolved + production"
            WMP->>API: "fetchOrganizationSettings(orgId)"
            WMP->>API: "hydrateEmptyWorkspaceOnboarding(userId, orgId)"
        end
        WMP->>WMP: "setAdmin({isAdmin, storedMode, identity, organizationId})"
    end
```

Sources: [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:56-117](), [src/features/app/workspaceMode/api.ts:1-142]()

## Mode Toggle Persistence

The mode toggle is rendered in SettingsView only when `canUseProduction` — platform admins and active org members. Switching calls `setMode(next)` on the context, which:

1. Persists via `saveStoredMode()` — upserts the `workspace_preferences` table row keyed by `user_id`. (Since migration `0170`, RLS lets platform admins and active org members write their own row; before that the policy was admin-only.) [src/features/app/workspaceMode/api.ts:58-68](), [supabase/migrations/0170_workspace_prefs_members.sql]()
2. On first switch to production with no existing org, provisions via `bootstrapOrganization()`. [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:128-130]()
3. Updates local state so the UI re-renders immediately. [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:133-133]()

The `setMode` callback is a no-op for users who can't hold a production workspace — the toggle UI is never rendered for them. [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:121-121]()

Sources: [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:119-136](), [src/features/app/views/settings/SettingsView.test.tsx:110-177]()

## WorkspaceModeContext Shape

The context value exposes everything downstream consumers need:

| Field            | Type                      | Description                                            |
| ---------------- | ------------------------- | ------------------------------------------------------ |
| `mode`             | `'demo' \| 'production'`  | Resolved mode                                                       |
| `isAdmin`          | `boolean`                 | Real `is_admin_user()` RPC result                                   |
| `canUseProduction` | `boolean`                 | `isAdmin \|\| membership !== null` — who may hold a production org  |
| `identity`         | `WorkspaceIdentity`       | Northgate fixtures (demo) or real profile (production)              |
| `organizationId`   | `string \| null`          | The member's org ID; always `null` in demo                          |
| `memberRole`       | `OrgMemberRole \| null`   | From `organization_members.role`                                    |
| `isOrgAdmin`       | `boolean`                 | Client mirror of RLS's `is_org_admin`                               |
| `organization`     | `WorkspaceOrganization \| null` | Org settings row (industry, jurisdictions, feature flags)       |
| `admissionStatus`  | `AdmissionStatus`         | `idle` / `capacity` / `waitlist` / `error` from provisioning        |
| `setMode`          | `(mode) => Promise<void>` | Persists and switches mode                                          |

The `useWorkspaceMode()` hook provides access and throws if called outside the provider. [src/features/app/workspaceMode/workspaceModeContext.ts:52-56]()

Sources: [src/features/app/workspaceMode/workspaceModeContext.ts:1-57]()

## Organization Member Roles

The `roles.ts` module defines the role vocabulary that mirrors the database's `organization_members.role` column:

```
viewer (0) → member (1) → manager (2) → admin (3) → owner (4)
```

Key predicates:

- `isAdminRole(role)` — true for `admin` or `owner`, matching RLS's `is_org_admin`. [src/features/app/workspaceMode/roles.ts:30-32]()
- `roleAtLeast(role, min)` — rank comparison for future role-gated surfaces. [src/features/app/workspaceMode/roles.ts:24-27]()

Sources: [src/features/app/workspaceMode/roles.ts:1-33]()

## Defensive Degradation in api.ts

Every function in `api.ts` wraps its Supabase call in a `try/catch` and checks for `null` client. This ensures the workspace mode system **never throws and strands the app**:

- `checkIsAdmin()` → returns `false` on any failure [src/features/app/workspaceMode/api.ts:33-41]()
- `fetchStoredMode()` → returns `'demo'` on any failure [src/features/app/workspaceMode/api.ts:43-56]()
- `fetchAdminProfile()` → returns `null` on any failure [src/features/app/workspaceMode/api.ts:123-142]()
- `bootstrapOrganization()` → returns `null` on any failure [src/features/app/workspaceMode/api.ts:106-121]()

This contrasts with the per-module `productionApi.ts` files (covered below), which **throw** on failure — they only run for signed-in workspace members in production mode where errors must surface.

Sources: [src/features/app/workspaceMode/api.ts:24-30](), [src/features/app/workspaceMode/api.test.ts:15-24]()

## AppProviders Composition

`AppProviders` is the workspace-scoped provider tree wrapping all `/app` routes. The nesting order is significant — each provider depends on those above it.

[src/features/app/AppProviders.tsx:25-43]()

```mermaid
graph TD
    A["AuthProvider"] --> B["PlanProvider"]
    B --> C["WorkspaceModeProvider"]
    C --> D["ToastsProvider"]
    D --> E["RailProvider"]
    E --> F["SearchProvider"]
    F --> G["DocStudioProvider"]
    G --> H["WorkspaceContextProvider"]
    H --> I["children (AppShell + routes)"]
```

### Provider Dependency Rationale

| Provider                   | Why it must be at this position                                                                                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthProvider`             | Outermost — tracks Supabase session. Everything else reads auth state. [src/features/app/auth/AuthProvider.tsx:16-134]()                                                                                                     |
| `PlanProvider`             | Reads auth session to resolve user's billing plan from `profiles`. Must be inside `AuthProvider` but outside `WorkspaceModeProvider` (plan gates check mode themselves). [src/features/app/billing/PlanProvider.tsx:29-95]() |
| `WorkspaceModeProvider`    | Reads session from `useAuth()` to resolve demo/production. [src/features/app/workspaceMode/WorkspaceModeProvider.tsx:53-53]()                                                                                                |
| `ToastsProvider`           | Independent state (toast queue with 3600ms auto-dismiss), but must wrap `DocStudioProvider` which fires "draft ready" toasts. [src/features/app/toasts/ToastsProvider.tsx:9-45]()                                            |
| `RailProvider`             | Advisor contextual rail — manages slide-over state plus a streaming engine instance. [src/features/app/rail/RailProvider.tsx:29-98]()                                                                                        |
| `SearchProvider`           | Global search overlay state with ⌘K keyboard binding. [src/features/app/search/SearchProvider.tsx:5-25]()                                                                                                                    |
| `DocStudioProvider`        | Document Studio overlay state. Reads `AuthContext` and `WorkspaceModeContext` optionally for export protection identity. [src/features/app/docstudio/DocStudioProvider.tsx:141-149]()                                        |
| `WorkspaceContextProvider` | "Advisor is using …" pinned-entity banner state. Innermost. [src/features/app/workspaceContext/WorkspaceContextProvider.tsx:6-27]()                                                                                          |

Sources: [src/features/app/AppProviders.tsx:1-43]()

## Per-View Mode Dispatch (formerly `ModeGate`)

The route table no longer wraps views in a gate. The earlier `gated()` helper and `ModeGate` route wrapper have been removed from `appViews.tsx`; `ModeGate.tsx` remains in the tree but has no callers. Instead, every workspace module dispatches on `useWorkspaceMode().mode` internally and renders either its fixture view or a `*ProductionView`.

Where a production workspace has no data, views render shared empty-state primitives rather than fixtures:

- `ProductionEmptyState` — module-level empty card with the module's label (derived from the route via `moduleLabelFor()`), an explanation that the production workspace starts empty, and a link onward. [src/features/app/workspaceMode/ProductionEmptyState.tsx:13-47](), [src/features/app/shell/navLabels.ts:59-64]()
- `ModuleEmptyBlock` — in-view empty block used by production views that keep their chrome (e.g. Communications, Compensation, Wellbeing). [src/features/app/workspaceMode/ModuleEmptyBlock.tsx]()
- `HomeProductionEmptyState` — the dedicated first-run surface for an empty production Home (setup path, Advisor prompts, plan-to-Tasks). [src/features/app/views/home/HomeProductionEmptyState.tsx]()

Sources: [src/app/appViews.tsx:30-42](), [src/features/app/workspaceMode/ProductionEmptyState.tsx:1-47](), [src/features/app/workspaceMode/ModuleEmptyBlock.tsx]()

## Per-Module productionApi.ts Boundary Pattern

Each workspace module that has gained real persistence exposes a `productionApi.ts` file — a strict data boundary between the React view and Supabase. These files follow a consistent contract:

1. **Zod-validated rows** — every row from Supabase is parsed through a `z.object()` schema before being returned
2. **Org-scoped queries** — every read/write includes `.eq('organization_id', organizationId)` (RLS enforces this server-side too)
3. **Throws on failure** — unlike `api.ts` in the workspace mode module, these throw errors because they only run for signed-in workspace members in production mode, where failures must surface
4. **Snake-to-camel mapping** — a `toXxx()` function converts database column names to TypeScript interface fields

### productionApi.ts Inventory

| Module         | File                                    | DB Table(s)                                                        | Key Functions                                                                                                                                   |
| -------------- | --------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Employees      | `views/employees/productionApi.ts`      | `employees`, `hr_expiry_records`, `hr_leaves`, `hr_employee_notes` | `listEmployees`, `addEmployee`, `removeEmployee`, `getEmployee`, `updateEmployeeStatus`, `listExpiryRecords`, `listLeaves`, `listEmployeeNotes` |
| Cases          | `views/cases/productionApi.ts`          | `hr_cases`, `hr_case_notes`                                        | `listCases`, `addCase`, `updateCaseStatus`, `removeCase`, `getCase`, `listCaseNotes`, `countOpenCases`                                          |
| Tasks          | `views/tasks/productionApi.ts`          | `compliance_tasks`                                                 | `listTasks`, `addTask`, `setTaskDone`, `removeTask`, `countOpenTasks`, `addProbationReviewTask`                                                 |
| Compliance     | `views/compliance/productionApi.ts`     | `compliance_findings`, `hr_obligations`                            | `listFindings`, `addFinding`, `setFindingResolved`, `countOpenFindings`, `listObligations`, `addObligation`                                     |
| Policies       | `views/policies/productionApi.ts`       | `hr_policies`                                                      | `listPolicies`, `addPolicy`, `setPolicyStatus`, `removePolicy`                                                                                  |
| Communications | `views/communications/productionApi.ts` | —                                                                  | —                                                                                                                                               |
| Compensation   | `views/compensation/productionApi.ts`   | —                                                                  | —                                                                                                                                               |
| Wellbeing      | `views/wellbeing/productionApi.ts`      | —                                                                  | —                                                                                                                                               |
| Analytics      | `views/analytics/productionApi.ts`      | —                                                                  | —                                                                                                                                               |

Sources: [src/features/app/views/employees/productionApi.ts:1-14](), [src/features/app/views/cases/productionApi.ts:1-10](), [src/features/app/views/tasks/productionApi.ts:1-17](), [src/features/app/views/compliance/productionApi.ts:1-16](), [src/features/app/views/policies/productionApi.ts:1-11]()

### productionApi Data Flow

```mermaid
flowchart LR
    V["View Component\n(e.g. EmployeesProductionView)"] -- "calls" --> PA["productionApi.ts\n(listEmployees, addEmployee)"]
    PA -- "reads organizationId\nfrom useWorkspaceMode()" --> WM["WorkspaceModeContext"]
    PA -- "queries via" --> SB["supabase.from('employees')"]
    SB -- "enforces" --> RLS["RLS policy\n(organization_id scoping)"]
    PA -- "validates via" --> ZOD["zod rowSchema"]
    ZOD -- "maps via" --> MAP["toEmployee()"]
    MAP -- "returns" --> V
```

Each production view (e.g. `EmployeesProductionView`) reads `organizationId` from `useWorkspaceMode()` and passes it to its `productionApi` functions. If `organizationId` is null (org not yet provisioned), the view renders `ProductionEmptyState`. [src/features/app/views/employees/EmployeesProductionView.tsx:51-51](), [src/features/app/views/employees/EmployeesProductionView.tsx:76-78]()

Sources: [src/features/app/views/employees/EmployeesProductionView.tsx:48-105](), [src/features/app/views/employees/productionApi.ts:70-83]()

## Production Nav Badges

`useProductionNavBadges()` replaces fixture-derived sidebar badge counts with live server-side head counts in production mode. It runs three parallel count queries on every route change:

- `countOpenCases(orgId)` from `cases/productionApi.ts` → badge on "Cases" [src/features/app/views/cases/productionApi.ts:176-185]()
- `countOpenTasks(orgId)` from `tasks/productionApi.ts` → badge on "Workforce Planning" [src/features/app/views/tasks/productionApi.ts:171-180]()
- `countOpenFindings(orgId)` from `compliance/productionApi.ts` → badge on "Compliance" (warn tone) [src/features/app/views/compliance/productionApi.ts:123-132]()

In demo mode or on any failure, the hook returns `{}` — fixture badges render as-is, and a nav badge is never worth an error state. [src/features/app/workspaceMode/useProductionNavBadges.ts:18-55]()

Sources: [src/features/app/workspaceMode/useProductionNavBadges.ts:1-55](), [src/features/app/workspaceMode/useProductionNavBadges.test.tsx:28-133]()

## PlanGate Integration

`PlanGate` is a billing-tier gate for paid views. Crucially, **demo mode bypasses the gate entirely** — every visitor sees the full product in the demo experience. Plan gates only enforce in production mode. [src/features/app/billing/PlanGate.tsx:25-39]()

```mermaid
flowchart TD
    PG["PlanGate required='growth'"] --> L{"loading?"}
    L -- "yes" --> NULL["render null"]
    L -- "no" --> DM{"mode === 'demo'?"}
    DM -- "yes" --> PASS["render children"]
    DM -- "no" --> ADM{"isAdmin or hasPlanAccess?"}
    ADM -- "yes" --> PASS
    ADM -- "no" --> NUDGE["UpgradeNudge"]
```

`PAID_PLANS_DISABLED_DURING_BETA` is currently `false` — paid plans are open, so `PlanGate` actively enforces tiers in production while demo mode stays fully unlocked. [src/features/app/billing/PlanGate.tsx:18-23](), [src/config/plans.ts:103]()

Sources: [src/features/app/billing/PlanGate.tsx:1-62](), [src/features/app/billing/PlanProvider.tsx:1-95]()

## View Mode Dispatch Pattern

Views that have gained real persistence handle mode dispatch internally rather than using `ModeGate`. The pattern is consistent:

```typescript
// HomeView.tsx — typical mode dispatch
const { mode } = useWorkspaceMode()
if (mode === 'production') {
  return <HomeProductionView ... />
}
// ... render demo fixture view
```

[src/features/app/views/home/HomeView.tsx:33-46]()

This lets ungated modules render entirely different component trees in production vs demo — e.g. `HomeProductionView` shows a live command centre with real counts and due-soon items, while the demo `HomeView` shows the Northgate Logistics fixtures.

Sources: [src/features/app/views/home/HomeView.tsx:29-93]()

## Empty Production Workspace Onboarding

A fresh production workspace is intentionally empty — no seed records. Home detects the empty state (`useHomeProductionStats` — zero people, zero tasks) and renders `HomeProductionEmptyState` instead of the command centre. The surface exists so a brand-new workspace tells the user where to start rather than presenting blank modules.

The centerpiece is a five-step **setup path** computed by `computeSetupSteps(signals)` in `setupPath.ts` — ordered foundation-first: confirm the company profile, prepare first-hire documents, start the policy register, see a guided process, then add the first person when ready. Steps light up from live signals (org profile completeness, Studio/Workflow visits) rather than a static checklist. `HomeOrgProfileSetup` provides an inline mini-setup for company profile + jurisdiction without leaving Home.

Three marks persist progress: `studioVisited`, `workflowVisited`, `setupCardDismissed` — exposed via `markEmptyWorkspaceStudioVisited` / `markEmptyWorkspaceWorkflowVisited` / `dismissSetupCard` in `emptyWorkspaceOnboarding.ts`. The "Keep going" card (`HomeSetupCard`) keeps the remaining steps visible on Home even after the first real record exists, and remaining steps can be pushed into the real Tasks module.

Persistence is two-layer: localStorage is the synchronous first-paint read source; `workspace_preferences.onboarding` (migration `0169`) stores the same marks keyed by organization id server-side. Every mark writes through to the server fire-and-forget; `hydrateEmptyWorkspaceOnboarding()` (awaited during provider `load()` in production) OR-merges server marks down and pushes the union back up — devices converge in both directions, and dismissal marks are monotonic so there is no conflict surface. Migration `0170` widened the `workspace_preferences` RLS policy from platform-admins-only to admins **or** active `organization_members` writing their own row, so members' mode and onboarding prefs persist too.

On mobile the composer suppresses `autoFocus` below the 768px shell breakpoint (so the keyboard doesn't cover the setup path), and setup-card controls carry ≥44px touch targets.

Sources: [src/features/app/views/home/setupPath.ts:34-99](), [src/features/app/workspaceMode/emptyWorkspaceOnboarding.ts:21-97](), [src/features/app/workspaceMode/api.ts:82-109](), [src/features/app/views/home/HomeProductionEmptyState.tsx](), [src/features/app/views/home/HomeSetupCard.tsx](), [src/features/app/views/home/HomeOrgProfileSetup.tsx](), [src/features/app/views/home/useHomeProductionStats.ts](), [supabase/migrations/0169_workspace_onboarding_prefs.sql](), [supabase/migrations/0170_workspace_prefs_members.sql](), [docs/EMPTY_WORKSPACE_ONBOARDING.md]()

## How Modules Went Production

The route table in `appViews.tsx` documents how fixture-only surfaces gained real persistence — the pattern that replaced the old route-level gate:

> Fixture-backed surfaces decide their production/demo behaviour within the view or its mode-aware dependencies. Home and Advisor have production variants; Knowledge, Settings, Document Studio, repository/detail, Advisor Memory, and Signing have real production-backed behaviour. The legacy hr-library gallery redirects to Document Studio in production via `HrLibraryRoute`.

[src/app/appViews.tsx:30-42]()

**No module is gated today.** Every workspace route either renders real content in both modes (template catalogue, reference guides, workflows) or dispatches on mode internally to a production implementation — including the last holdouts: Documents repository/detail/signing and the Settings → Memory screens.

[src/app/appViews.tsx:71-237]()

The pattern for bringing a module to production remains:

1. **Database migration** — add the org-scoped table with RLS policies (e.g. `0006` for employees, `0007` for cases)
2. **Create `productionApi.ts`** — Zod-validated CRUD boundary file in the module's directory
3. **Create production view** — e.g. `EmployeesProductionView`, reading `organizationId` from `useWorkspaceMode()`
4. **Mode dispatch in parent view** — the main view checks `mode` and renders either the production or demo variant
5. **Empty-state primitives** — `ProductionEmptyState` / `ModuleEmptyBlock` where the org has no records yet
6. **Add nav badge count** — optionally add a `countOpenXxx()` function and wire it into `useProductionNavBadges`

Sources: [src/app/appViews.tsx:30-42](), [src/app/appViews.tsx:71-237](), [CONVENTIONS.md:17-38]()

## Test Infrastructure

The workspace mode system uses a consistent test pattern: `vi.doMock('@/lib/supabaseClient')` per scenario, followed by `vi.resetModules()` and fresh imports. This lets each test control the Supabase client shape (unconfigured, partial test double, full mock). Key test files:

- `WorkspaceModeProvider.test.tsx` — seven scenarios covering signed-out, non-admin, admin with/without stored preference, org provisioning, and org reuse. [src/features/app/workspaceMode/WorkspaceModeProvider.test.tsx:1-206]()
- `api.test.ts` — validates defensive degradation when Supabase is null, missing methods, and real RPC responses. [src/features/app/workspaceMode/api.test.ts:1-123]()
- `ModeGate.test.tsx` — verifies demo passthrough and production empty-state rendering with module-titled heading. [src/features/app/workspaceMode/ModeGate.test.tsx:1-71]()
- `useProductionNavBadges.test.tsx` — exercises live badge counts through the Sidebar component. [src/features/app/workspaceMode/useProductionNavBadges.test.tsx:1-133]()

Sources: [src/features/app/workspaceMode/WorkspaceModeProvider.test.tsx:1-206](), [src/features/app/workspaceMode/api.test.ts:1-123]()

---
