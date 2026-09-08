# Business Functions workspace — implementation spec

This document is the engineering spec for the expansion described in `README.md`. It is the source of truth for routes, data shape, behaviour, and copy until implementation begins. Where this document and the prototype disagree, this document wins.

## Routes

Add to `src/app/appViews.tsx` under `createAppViewRoutes`:

```ts
{ path: 'revenue', element: <RevenueView /> },
{
  path: 'governance',
  element: <GovernanceView />,
  children: [
    { index: true, loader: () => redirect(r('governance/overview')) },
    { path: 'overview', element: <GovernanceOverview /> },
    { path: 'records', element: <GovernanceRecords /> },
    { path: 'decisions', element: <GovernanceDecisions /> },
    { path: 'officers', element: <GovernanceOfficers /> },
    { path: 'shareholders', element: <GovernanceShareholders /> },
  ],
},
{
  path: 'security',
  element: <SecurityView />,
  children: [
    { index: true, loader: () => redirect(r('security/overview')) },
    { path: 'overview', element: <SecurityOverview /> },
    { path: 'assets', element: <SecurityAssets /> },
    { path: 'access', element: <SecurityAccessReviews /> },
    { path: 'incidents', element: <SecurityIncidents /> },
    { path: 'risks', element: <SecurityRisks /> },
    { path: 'vendors', element: <SecurityVendors /> },
  ],
},
{
  path: 'operations',
  element: <OperationsView />,
  children: [
    { index: true, loader: () => redirect(r('operations/overview')) },
    { path: 'overview', element: <OperationsOverview /> },
    { path: 'projects', element: <OperationsProjects /> },
    { path: 'vendors', element: <OperationsVendors /> },
    { path: 'quality', element: <OperationsQuality /> },
    { path: 'technology', element: <OperationsTechnology /> },
    { path: 'logistics', element: <OperationsLogistics /> },
  ],
},
{
  path: 'specialists',
  element: <SpecialistsView />,
  children: [
    { index: true, loader: () => redirect(r('specialists/directory')) },
    { path: 'directory', element: <SpecialistsDirectory /> },
    { path: 'engagements', element: <SpecialistsEngagements /> },
  ],
},
```

Remove or repurpose the legacy `/app/communications` route name if it conflicts with the new model. The existing `/app/comms` stays as the PR/marketing workspace.

## Sidebar nav changes

Update `src/features/app/shell/navConfig.ts`:

- Rename `people` section → keep, but reorder after Operations.
- Rename `operations` section → include Operations, Planning, Workflows, Documents, Knowledge.
- Add `revenue` section with Revenue, CRM, Comms.
- Add `governance` section with Governance, Compliance, Policies.
- Add `security` section with Security.
- Add `external` section with Specialists.
- Keep Finance and Analytics as currently defined.

Add new i18n message files:

- `src/i18n/messages/revenue.ts`
- `src/i18n/messages/governance.ts`
- `src/i18n/messages/security.ts`
- `src/i18n/messages/operations.ts`
- `src/i18n/messages/specialists.ts`
- Update `src/i18n/messages/shell.ts` with new section headings and nav labels.

## Module architecture pattern

Every new module follows the existing `*View.tsx` dispatch pattern:

```
src/features/app/views/<module>/
  <Module>View.tsx          # dispatch shell
  <Module>DemoView.tsx
  <Module>ProductionView.tsx
  <Module>Layout.tsx        # for multi-screen modules
  <Module>Messages.ts       # i18n if module-specific
  data/
    types.ts
    fixtures.ts
    productionApi.ts
  screens/
    Overview.tsx
    ...
```

## Role model and access control

Dutiva already uses `organization_members.role` with values `owner`, `admin`, `manager`, `member`, `viewer` (see `supabase/schema.sql` and `supabase/migrations/0118_add_hiring_module.sql`). The expansion extends this role enum to include `professional` and `consultant`.

**Why first-class roles instead of flags?** Long term, a single `role` column is easier to reason about in RLS policies, navigation gating, Home layout selection, and audit logs. Splitting permission into `role × work_type × granted_modules` would create a two-dimensional matrix that is harder to maintain and explain. `professional` and `consultant` are distinct personas and deserve distinct roles.

The two extra columns are still required:

- `granted_modules text[]` — for `consultant` scope (and for `viewer` if needed).
- `access_expires_at timestamptz` — for time-limited consultant or contractor access.

### Migration for `organization_members`

```sql
ALTER TABLE organization_members DROP CONSTRAINT organization_members_role_check;
ALTER TABLE organization_members ADD CONSTRAINT organization_members_role_check
  CHECK (role = ANY (ARRAY['owner', 'admin', 'manager', 'professional', 'member', 'consultant', 'viewer']));

ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS granted_modules text[] DEFAULT '{}';
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS access_expires_at timestamptz;

CREATE INDEX idx_organization_members_role ON organization_members(role);
CREATE INDEX idx_organization_members_expiry ON organization_members(access_expires_at)
  WHERE access_expires_at IS NOT NULL;
```

### Role permissions by module

| Module | Owner/Admin | Manager | Professional | Member | Consultant | Viewer |
|---|---|---|---|---|---|---|
| Home | Executive cockpit | Manager cockpit | Work queue | My stuff | Module cockpit for granted scope | Read-only summary, if granted |
| Revenue | Full CRM/Comms | Read/write CRM if assigned | Read/write if function is revenue/sales | No access | CRM/Comms if granted | No access |
| Operations | Full | Create/edit projects, quality, vendors, tech, logistics; approve member submissions | Manage projects, quality, tech, logistics; own vendor records | View assigned tasks/projects, complete assigned quality checks, submit concern | Granted modules (e.g., quality, logistics) | No access |
| People | Full | Full for their team | Process cases, manage hiring, run reviews | View own profile, tasks, policies, wellbeing | Granted modules (e.g., hiring support) | No access |
| Finance | Full | View or limited read | Reconcile, manage payables, own treasury tasks | View own compensation if enabled | Finance/accounting if granted | No access |
| Governance | Full | No access unless delegated | No access unless delegated | No access | No access | Read-only selected records |
| Security | Full | Create/edit incidents, risks, access reviews; assign to members | Triage incidents, own risks and assets, run access reviews | View own security training, report incident | Security if granted | No access |
| External | Full | View | View | View limited directory | View own record and engagements | View if granted |
| Analytics | Full | Team-scoped | Module-scoped | Self-scoped | Scope-limited | Read-only, if granted |

### Navigation gating

- `src/features/app/shell/navConfig.ts` accepts an optional `role` parameter or uses a `useOrgRole()` hook to filter `NavItem` entries.
- A `NavItem` can carry a `roles?: OrgRole[]` field. If omitted, all authenticated members see it.
- Public `/demo` continues to show the full nav so prospects see the product breadth.

### Home by role

- `HomeProductionView` reads `workspaceMode` and `useOrgRole()` to select a layout:
  - `owner` / `admin` → executive cockpit.
  - `manager` → team priorities + approvals.
  - `professional` → work queue + module KPIs.
  - `member` → my tasks + policies + wellbeing.
  - `consultant` → granted-module cockpit.
  - `viewer` → read-only dashboard, if any.
- Quick actions and KPI cards are role-aware.

### Row-level security (RLS)

Every new table follows the org-scoped `organization_id` pattern used by `hr_cases`, `employees`, and `finance_parties`:

```sql
CREATE POLICY org_isolation ON governance_records
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));
```

Additional role-specific policies where required:

- **Governance** — `viewer` and `consultant` can only `SELECT` rows where `viewer_visible = true`.
- **Security incidents** — `member` and `professional` can `INSERT` incident reports but cannot see other members' reports unless assigned.
- **Operations quality checks** — `member` and `professional` can `UPDATE` only rows where `assigned_to = auth.uid()`.
- **Consultant scope** — every query for a `consultant` is additionally filtered by `granted_modules` / `module_scopes` stored on the member or specialist record.
- **Compensation** — unchanged; `member` and `professional` see only own records unless they have payroll permissions.

### Frontend role gating

- Use the existing `useWorkspaceMode()` and a new `useOrgRole()` hook.
- Hide UI actions the user cannot perform; do not rely on API errors as the primary gate.
- Route-level guards redirect to `/app/home` if a `viewer` or `consultant` tries to reach a module outside their scope.
- Consultants and freelancers show in the `/app/specialists` directory and can be granted or revoked workspace access from there.

## Data model

### Governance tables

```sql
governance_records (
  id uuid primary key,
  organization_id uuid references organizations(id),
  title text not null,
  record_type text not null, -- 'articles', 'bylaw', 'resolution', 'minutes', 'register'
  jurisdiction text,
  effective_date date,
  review_due_date date,
  status text not null default 'active', -- 'active', 'superseded', 'pending_review'
  document_id uuid references documents(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

governance_decisions (
  id uuid primary key,
  organization_id uuid references organizations(id),
  title text not null,
  decision_date date,
  decided_by text,
  rationale text,
  status text not null default 'adopted', -- 'proposed', 'adopted', 'rescinded'
  related_record_id uuid references governance_records(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

governance_officers (
  id uuid primary key,
  organization_id uuid references organizations(id),
  name text not null,
  role text not null, -- 'director', 'officer_president', 'officer_secretary', 'officer_treasurer'
  appointed_date date,
  resigned_date date,
  contact_email text,
  is_active boolean default true
);

governance_shareholders (
  id uuid primary key,
  organization_id uuid references organizations(id),
  name text not null,
  share_class text,
  shares_issued integer,
  issue_date date,
  contact_email text
);
```

### Security tables

```sql
security_assets (
  id uuid primary key,
  organization_id uuid references organizations(id),
  name text not null,
  asset_type text not null, -- 'hardware', 'software', 'cloud_service', 'domain', 'data_store'
  owner_id uuid references profiles(id),
  status text not null default 'active', -- 'active', 'decommissioned', 'at_risk'
  criticality text, -- 'critical', 'high', 'medium', 'low'
  renewal_date date,
  notes text,
  created_at timestamptz default now()
);

security_access_reviews (
  id uuid primary key,
  organization_id uuid references organizations(id),
  title text not null,
  assigned_to uuid references profiles(id),
  reviewer_id uuid references profiles(id),
  review_due_date date,
  completed_date date,
  status text not null default 'pending', -- 'pending', 'in_progress', 'completed', 'overdue'
  findings text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

security_incidents (
  id uuid primary key,
  organization_id uuid references organizations(id),
  title text not null,
  severity text not null, -- 'critical', 'high', 'medium', 'low'
  status text not null default 'open', -- 'open', 'contained', 'resolved', 'closed'
  reported_by uuid references profiles(id),
  assigned_to uuid references profiles(id),
  reported_at timestamptz default now(),
  resolved_at timestamptz,
  summary text,
  impact text,
  remediation text,
  created_by uuid references profiles(id)
);

security_risks (
  id uuid primary key,
  organization_id uuid references organizations(id),
  title text not null,
  likelihood text, -- 'high', 'medium', 'low'
  impact text, -- 'high', 'medium', 'low'
  owner text,
  mitigation text,
  status text not null default 'open', -- 'open', 'mitigated', 'accepted', 'closed'
  created_at timestamptz default now()
);

security_vendor_reviews (
  id uuid primary key,
  organization_id uuid references organizations(id),
  vendor_name text not null,
  vendor_type text, -- 'lawyer', 'accountant', 'insurance', 'it_security', 'other'
  privacy_agreement boolean,
  security_review_date date,
  next_review_date date,
  notes text,
  created_at timestamptz default now()
);
```

### Operations tables

```sql
operations_projects (
  id uuid primary key,
  organization_id uuid references organizations(id),
  title text not null,
  owner_id uuid references profiles(id),
  status text not null default 'planning', -- 'planning', 'active', 'on_hold', 'completed', 'cancelled'
  start_date date,
  target_date date,
  description text,
  created_at timestamptz default now()
);

operations_vendors (
  id uuid primary key,
  organization_id uuid references organizations(id),
  finance_party_id uuid references finance_parties(id), -- link to FinanceParty
  name text not null,
  vendor_type text, -- 'supplier', 'logistics', 'technology', 'professional_service'
  status text not null default 'active',
  contract_expiry date,
  notes text
);

operations_quality_checks (
  id uuid primary key,
  organization_id uuid references organizations(id),
  title text not null,
  assigned_to uuid references profiles(id),
  reviewer_id uuid references profiles(id),
  checklist jsonb,
  due_date date,
  completed_date date,
  status text not null default 'pending', -- 'pending', 'passed', 'failed', 'overdue'
  non_conformance text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

operations_technology (
  id uuid primary key,
  organization_id uuid references organizations(id),
  name text not null,
  system_type text, -- 'internal', 'customer_facing', 'integration', 'infrastructure'
  owner_id uuid references profiles(id),
  status text not null default 'active',
  renewal_date date,
  integration_notes text
);

operations_logistics (
  id uuid primary key,
  organization_id uuid references organizations(id),
  title text not null,
  owner_id uuid references profiles(id),
  assigned_to uuid references profiles(id),
  status text not null default 'in_transit', -- 'in_transit', 'delivered', 'delayed', 'returned'
  expected_date date,
  delivered_date date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

### Specialists tables

```sql
specialists (
  id uuid primary key,
  organization_id uuid references organizations(id),
  name text not null,
  specialty text not null, -- 'lawyer', 'accountant', 'tax', 'insurance', 'it_security', 'hr_consultant', 'bookkeeper', 'other'
  company text,
  email text,
  phone text,
  crm_contact_id uuid, -- optional link to CRM
  finance_party_id uuid references finance_parties(id), -- optional link
  workspace_access boolean default false, -- whether the specialist has a workspace login
  workspace_role text default 'consultant', -- 'consultant' or 'viewer'
  granted_modules text[] default '{}', -- e.g. {'finance','accounting'} for a bookkeeper
  access_expires_at timestamptz,
  organization_member_id uuid references organization_members(id), -- link when a workspace seat is granted
  notes text,
  created_at timestamptz default now()
);

specialist_engagements (
  id uuid primary key,
  organization_id uuid references organizations(id),
  specialist_id uuid references specialists(id),
  engagement_date date,
  engagement_type text, -- 'call', 'email', 'meeting', 'contract', 'task'
  summary text,
  follow_up_date date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

## Module behaviour

### Governance

- The module is a **register and tracker**, not a board portal.
- Records can link to generated documents in the Document Library.
- Decisions have a `proposed → adopted → rescinded` lifecycle.
- Officers and Shareholders are simple lists with edit-in-place.
- Empty state: "Add your first corporate record — articles, by-laws, or minutes."

### Security

- The module is a **governance cockpit**, not a scanner.
- Assets are manually maintained or imported from Operations/Finance vendor lists.
- Access Reviews are recurring checklists; overdue reviews surface in Home.
- Incidents follow `open → contained → resolved → closed`.
- Risks use a simple likelihood × impact matrix.
- Vendor reviews link to Specialists and FinanceParty.
- Empty state: "Track your first asset or access review."

### Operations

- The module is an **operational command register**, not an ERP.
- Projects can create linked `compliance_tasks` rows.
- Vendors are a lightweight layer over `finance_parties` with an added `vendor_type`.
- Quality checks use a checklist JSONB with pass/fail items.
- Technology and Logistics are simple registers with due/renewal dates.
- Empty state: "Add your first project, vendor, or quality check."

### Specialists

- The directory can import from CRM contacts and Finance parties.
- Engagements are a lightweight activity log.
- Documents can be linked from the Document Library.
- Empty state: "Add your lawyer, accountant, or IT provider."

### Revenue

- The Revenue view is an **overview surface**, not a replacement for CRM/Comms.
- It calls `crm/productionApi.ts` and `comms/data/productionApi.ts` for live data.
- Cards: pipeline by stage, active campaigns, recent customer activity, upcoming communications.
- Quick actions route to the owning module.

## Copy and i18n

- All user-facing strings are bilingual `{ en, fr }` pairs, imported through `useI18n` and `x()`.
- New message catalogues live in `src/i18n/messages/` and are typed through `Bi`.
- Mark `[FR self-authored]` where no design French exists; do not machine-translate silently over an existing string.
- The standing Dutiva disclaimer appears on all generated documents and substantive guidance surfaces.
- No AI tells, no unprovable absolutes, no emojis. Use `lucide-react` for icons.

## Compliance and legal boundaries

- Governance records and generated documents must not be presented as legally reviewed unless `review_status` says so.
- Security module does **not** claim the product makes the organization secure; it tracks posture and points to specialists.
- Operations module does **not** replace accounting, procurement, or inventory systems.
- Revenue overview does **not** send communications or execute campaigns.

## Files to create or change

### New directories and files

```
docs/design-handoff-business-functions/
  README.md
  SPEC.md
  prototypes/BusinessFunctionsWorkspace.dc.html

src/features/app/views/revenue/
  RevenueView.tsx
  RevenueDemoView.tsx
  RevenueProductionView.tsx
  revenueMessages.ts
  data/types.ts
  data/fixtures.ts
  data/productionApi.ts
  screens/Overview.tsx

src/features/app/views/governance/
  GovernanceView.tsx
  GovernanceDemoView.tsx
  GovernanceProductionView.tsx
  governanceMessages.ts
  data/types.ts
  data/fixtures.ts
  data/productionApi.ts
  screens/Overview.tsx, Records.tsx, Decisions.tsx, Officers.tsx, Shareholders.tsx

src/features/app/views/security/
  SecurityView.tsx
  SecurityDemoView.tsx
  SecurityProductionView.tsx
  securityMessages.ts
  data/types.ts
  data/fixtures.ts
  data/productionApi.ts
  screens/Overview.tsx, Assets.tsx, AccessReviews.tsx, Incidents.tsx, Risks.tsx, Vendors.tsx

src/features/app/views/operations/
  OperationsView.tsx
  OperationsDemoView.tsx
  OperationsProductionView.tsx
  operationsMessages.ts
  data/types.ts
  data/fixtures.ts
  data/productionApi.ts
  screens/Overview.tsx, Projects.tsx, Vendors.tsx, Quality.tsx, Technology.tsx, Logistics.tsx

src/features/app/views/specialists/
  SpecialistsView.tsx
  SpecialistsDemoView.tsx
  SpecialistsProductionView.tsx
  specialistsMessages.ts
  data/types.ts
  data/fixtures.ts
  data/productionApi.ts
  screens/Directory.tsx, Engagements.tsx

src/i18n/messages/revenue.ts
governance.ts
security.ts
operations.ts
specialists.ts

supabase/migrations/0xxx_governance_security_operations_specialists.sql
```

### Existing files to update

- `src/app/appViews.tsx` — add routes.
- `src/features/app/shell/navConfig.ts` — restructure nav; add optional `roles` filter per nav item.
- `src/features/app/workspaceMode/useOrgRole.ts` — new hook wrapping the current member's role.
- `src/features/app/views/home/HomeProductionView.tsx` — redesign to role-aware cockpit.
- `src/features/app/views/home/homeRoleConfig.ts` — role-to-cockpit-layout mapping.
- `src/i18n/messages/shell.ts` — new nav section headings.
- `src/i18n/messages/index.ts` or `shared.ts` — register new catalogues.
- `src/features/app/search/SearchOverlay.tsx` — add new modules to search results.
- `src/features/app/views/analytics/AnalyticsProductionView.tsx` — add cross-module cards.
- `docs/CONVENTIONS.md` — update route table.

## Acceptance criteria

- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run test` passes for new `*.test.ts(x)` files.
- `npm run check:architecture` passes; no `*View.tsx` embeds demo UI inline; no `src/data` imports in production view shells.
- All new user-facing strings are bilingual.
- All new modules render correctly in demo and production modes.
- New modules follow the `*DemoView` / `*ProductionView` pattern.
- The sidebar restructure does not break public demo navigation.
- Role-aware navigation, Home, and quick actions work for owner, admin, manager, professional, member, consultant, and viewer.
- Consultants and freelancers can be granted and revoked scoped workspace access from `/app/specialists`.
- `viewer` and `consultant` roles cannot reach edit routes or API writes outside their scope.
