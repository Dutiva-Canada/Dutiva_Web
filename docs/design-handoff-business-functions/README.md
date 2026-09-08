# Design handoff — Business Functions workspace expansion

## Overview

This handoff covers the expansion of the Dutiva workspace from an HR-compliance platform into a unified business-functions surface. The product keeps **HR as the deep, long-term centre of gravity** and adds lightweight, essential tools for the other functions a small-to-mid Canadian business actually needs.

Source of the model: the user's org-structure screenshots (CEO / President · Revenue · Operations · Finance & Administration · External specialists · the Governance / Management / Execution layers), plus the explicit request to add **cybersecurity**.

## About the design files

`prototypes/BusinessFunctionsWorkspace.dc.html` is a low-fidelity wireframe reference. It is **not production code** and should not be copied verbatim. It shows the intended layout, navigation structure, and module overviews so a developer can implement against the existing Dutiva design system (`src/styles/tokens.css`, `src/styles/surfaces.css`, `src/components/`).

The wireframe uses approximate colours and type. Final values come from the design-system tokens. No hex values in the wireframe are authoritative.

## Status

- **Phase:** planning handoff, pre-implementation.
- **Prototype fidelity:** low. Layout and information architecture only.
- **Handoff copy:** English-first in this document. All user-facing strings ship as bilingual `{ en, fr }` pairs in implementation, with `[FR self-authored]` where no design French exists.

## Goal

A signed-in employer (or an unsigned visitor on `/demo`) opens the workspace and sees a single, coherent business command centre instead of a list of product modules. The sidebar and home are organized around how a small corporation actually runs:

1. Executive — what the owner/CEO and senior leaders need to see.
2. Revenue — marketing, sales, customer relationships, and campaign results.
3. Operations — projects, vendors, quality, technology/systems, logistics.
4. People — employees, cases, hiring, wellbeing.
5. Finance — accounting, payroll, tax, plans, treasury.
6. Governance — corporate records, decisions, officers, shareholders.
7. Security — cyber and privacy posture.
8. External — lawyers, accountants, insurance brokers, IT/security specialists.

The same surface serves different roles. A manager sees team priorities and approvals; an employee sees their own profile, tasks, policies, and wellbeing; an owner sees the full executive cockpit.

## Scope

### In scope for this handoff

- Sidebar section restructure and new module routing.
- Executive cockpit (Home) redesign.
- Revenue overview surface (`/app/revenue`) — unifies CRM and Comms.
- Governance module (`/app/governance`) — corporate records, decisions, officers, shareholders.
- Security module (`/app/security`) — asset register, access reviews, incidents, risks, vendor/privacy controls.
- Operations module (`/app/operations`) — projects, vendors, quality, technology/systems, logistics.
- External specialists directory (`/app/specialists`) — reuses CRM/Finance party data with an engagement log.
- Bilingual strings and design-token compliance.

### Out of scope

- Full ERP, accounting, payroll, or board-portal replacement.
- Real-time security scanning, SIEM, or IT asset auto-discovery.
- Consumer product family (`docs/consumer/`).
- Mobile-native apps.
- Marketing site changes (dutiva.ca).

## Users and roles

The workspace is not only for owners and executives. The existing `organization_members` table supports five roles: `owner`, `admin`, `manager`, `member`, and `viewer`. This expansion extends the role enum to include `professional` and `consultant`, with `granted_modules` and `access_expires_at` columns for scoped, time-limited access.

The new roles are first-class members of the role model, not flags on top of `member`. This keeps RLS policies, navigation, and Home layout selection simple and explicit long term.

This creates room for **professional employees** — employees who do real work inside the platform, not just self-service — and **consultants / freelancers** — external professionals with scoped, time-limited access.

### Role model

| Role | Typical user | What they see and do |
|---|---|---|
| **Owner / Admin** | Founder, CEO, senior leader | Full workspace: executive cockpit, governance, security, finance, revenue, all operations and people modules. |
| **Manager** | Department lead, operations or people manager | Team view in People; tasks, projects, quality, and vendor records in Operations; read or limited write access to Finance and Security; access to Revenue (CRM/Comms) if in scope for their function. |
| **Professional employee** | In-house HR, finance, operations, security, or IT lead | Performs work in the app: processes cases, runs payroll checks, completes and reviews quality checks, manages projects, triages security incidents, owns vendor records. May see more than a self-service member but less than a manager in modules outside their function. |
| **Member** | Employee, individual contributor | Self-service: own employee profile, assigned tasks and calendar events, policies, wellbeing resources. Can complete operational work only when explicitly assigned (a quality check, a project task, a security training). No access to governance, finance, revenue, or sensitive HR records unless explicitly shared. |
| **Consultant / Freelancer** | External bookkeeper, HR consultant, IT/security contractor, legal counsel | Scoped, time-limited access to one or more modules (e.g., Finance, Security, People). Appears in `/app/specialists` and can be granted a workspace seat with an expiry date. No access to governance or executive features unless explicitly granted. |
| **Viewer** | Board observer, auditor, external advisor | Read-only access to selected governance records, policies, and analytics. No write access; no access to compensation, cases, or personal employee data unless granted. |

### What changes per role

- **Sidebar:** sections and items appear or hide based on role. A `member` sees People, Operations (their tasks/projects), Documents, Knowledge, and Wellbeing; not Revenue, Finance, Governance, or Security. A `professional employee` sees the modules they work in (e.g., Finance, Security, Operations, People). A `consultant` sees only the modules their contract scope allows.
- **Home cockpit:** adapts to role. Owner sees business KPIs; manager sees team priorities and pending approvals; professional employee sees their assigned work queue and module KPIs; member sees their tasks, policies to acknowledge, and wellbeing reminders.
- **Module permissions:** Operations quality checks can be assigned to members and professional employees; managers review. Security incidents can be assigned to professional employees for triage. Finance tasks can be owned by professional employees. Governance records are owner/admin and viewer.
- **Quick actions:** role-aware. A member has "Submit timesheet", "Request leave", "Acknowledge policy"; a manager has "Approve request", "Add task", "Start review"; a professional employee has "Complete review", "Update project", "Log incident"; an owner has "Add employee", "Log decision", "Add vendor".

### Employee self-service

Members need practical access to the same platform:

- View and update their own profile (contact info, emergency contact, tax forms).
- See assigned tasks and due dates from Planning and Operations.
- Acknowledge policies and documents routed to them.
- Access wellbeing resources and complete self-checks.
- Submit simple requests (time off, accommodation, IT/security concern).
- See pay information in Compensation if enabled.

This does not turn Dutiva into a full employee portal, but it makes the platform usable by the people whose data it already holds.

## Module map

| Org layer | Module | Route | Current state | New or changed |
|---|---|---|---|---|
| Executive | Home | `/app/home` | exists | redesign to cockpit |
| Revenue | Revenue | `/app/revenue` | new | overview pulling from CRM + Comms |
| Revenue | CRM | `/app/crm` | exists | keep, link from Revenue |
| Revenue | Comms | `/app/comms/*` | exists | keep, link from Revenue |
| Operations | Operations | `/app/operations/*` | new | projects, vendors, quality, tech, logistics |
| People | Employees | `/app/employees` | exists | unchanged |
| People | Cases | `/app/cases` | exists | unchanged |
| People | Hiring | `/app/hiring` | exists | unchanged |
| People | Wellbeing | `/app/wellbeing` | exists | unchanged |
| Finance | Finance | `/app/finance/*` | exists | unchanged; links to Operations vendors and Payroll |
| Finance | Compensation | `/app/compensation` | exists | unchanged |
| Governance | Governance | `/app/governance/*` | new | records, decisions, officers, shareholders |
| Security | Security | `/app/security/*` | new | asset register, access reviews, incidents, risks, vendors |
| External | Specialists | `/app/specialists/*` | new | directory and engagement log |

## Sidebar restructure

Current sections in `src/features/app/shell/navConfig.ts`: People / Operations / Comms / Finance / Growth.

New sections, top to bottom:

1. **Executive** — Home, Advisor.
2. **Revenue** — Revenue, CRM, Comms.
3. **Operations** — Operations, Planning, Workflows, Documents, Knowledge.
4. **People** — Employees, Cases, Hiring, Wellbeing.
5. **Finance** — Finance, Compensation.
6. **Governance** — Governance, Compliance, Policies.
7. **Security** — Security.
8. **External** — Specialists.
9. **Analytics** — Analytics (top-level, ungrouped).

The Analytics view remains the cross-module dashboard. Home becomes the executive cockpit.

## Home cockpit

The Home production view becomes a role-aware business cockpit. It adapts to the signed-in user's `organization_members` role.

### Owner / Admin

- **Good morning / status header** with workspace name and date.
- **Priority queue** — cross-module items requiring attention (compliance, open cases, overdue tasks, pending approvals, security reviews).
- **Quick actions** — create employee, create case, generate document, new task, new vendor, new security review, log decision.
- **Business health cards** — cash on hand (Finance), pipeline (CRM), open cases, compliance score, recent communications, security posture.
- **Key relationships** — top external specialists and customer contacts.
- **Major hiring / open roles** — from Hiring.
- **Legal/risk oversight** — recent compliance findings, upcoming deadlines, policy reviews.
- **Advisor composer** — ask a question, with chips for common CEO/owner tasks.

### Manager

- **Team priorities** — open cases, pending approvals, employee tasks, project items.
- **Quick actions** — approve request, add task, start quality review, add operations project.
- **Team health cards** — headcount, open cases for their team, overdue tasks, policy acknowledgments pending.
- **Operations** — projects and quality checks they own or review.
- **Wellbeing signals** — anonymised or role-appropriate team wellbeing initiatives.

### Professional employee

- **Work queue** — assigned reviews, cases, projects, quality checks, security incidents, finance tasks.
- **Quick actions** — complete review, update project, log incident, reconcile entries, process case.
- **Module KPIs** — counts and overdue items for the modules they own (e.g., open security risks, pending quality checks, unreconciled transactions).
- **Recent activity** — items they created or updated, with status.
- **Advisor composer** — ask questions related to their function.

### Member

- **My stuff** — assigned tasks, upcoming deadlines, policies to acknowledge, wellbeing resources.
- **Quick actions** — request time off, submit quality check, view my documents, get wellbeing guidance.
- **Profile card** — role, manager, start date, jurisdiction, emergency contact.
- **Recent activity** — documents signed, policies acknowledged, cases they are party to.
- **Advisor composer** — ask HR or operational questions relevant to their role.

## New module summaries

### Revenue (`/app/revenue`)

A unified overview, not a replacement for CRM or Comms.

- Top row: pipeline value, open deals, campaigns active, recent communications.
- Pipeline card: deals by stage from CRM.
- Campaigns card: active Comms initiatives and their status.
- Customer activity card: recent contacts, companies, and communications.
- Quick actions: add deal, add contact, add campaign, log communication.
- Links to `/app/crm` and `/app/comms/overview`.

### Governance (`/app/governance`)

Lightweight corporate governance register.

- **Overview** — upcoming decisions, recent records, officer/shareholder summary.
- **Records** — articles, by-laws, resolutions, minutes, corporate registers.
- **Decisions** — major-decision log with date, decision maker, rationale, status.
- **Officers** — directors, officers, roles, appointment dates.
- **Shareholders** — share structure, issued shares, cap table (simple).

### Security (`/app/security`)

Security and privacy cockpit for SMBs.

- **Overview** — security posture summary, open incidents, upcoming access reviews, asset count.
- **Assets** — hardware, software, cloud services, domains, data stores.
- **Access Reviews** — periodic user access reviews with status and findings.
- **Incidents** — security/privacy incident log with severity, status, and remediation.
- **Risks** — cyber-risk register with likelihood, impact, owner, mitigation.
- **Vendors / Privacy** — third-party service reviews, privacy agreements, subprocessor tracking.

### Operations (`/app/operations`)

Operational command register, not an ERP.

- **Overview** — active projects, vendor summary, quality checks due, tech/systems status.
- **Projects** — initiatives/initiatives with owner, status, timeline, linked tasks.
- **Vendors** — supplier and service-provider directory (links to Finance parties).
- **Quality** — checklist register, review dates, non-conformance log.
- **Technology / Systems** — systems inventory, ownership, renewal dates, integrations.
- **Logistics** — delivery/fulfilment notes, warehouse/logistics tracker (light).

### External (`/app/specialists`)

Directory of external advisors, specialists, consultants, and freelancers.

- **Directory** — lawyers, accountants, tax professionals, insurance brokers, IT/security specialists, HR consultants, bookkeepers.
- **Engagements** — log of calls, emails, contracts, and tasks by specialist.
- **Documents** — engagement letters, contracts, invoices linked to the specialist.
- **Workspace access** — grant a consultant or freelancer a scoped, time-limited seat. Their role is `consultant` and their granted modules are recorded on the specialist record.
- Quick add from CRM contacts or Finance parties.

## Design principles

- **Reuse, don't reinvent.** Every new module binds to the existing design-system tokens and shared components (`Card`, `StatusChip`, `DataTable`, `EmptyState`, `Disclaimer`).
- **Demo first, production second.** Each module ships with Northgate-style demo fixtures in a `*DemoView.tsx`, then a `*ProductionView.tsx` and `productionApi.ts`.
- **Bilingual from the first string.** Every UI label, empty state, and CTA ships as `Bi`.
- **Lightweight but coherent.** Each new module is a register + tracker, not a full vertical. It connects to the others (e.g., Operations vendors link to Finance parties; Security vendors link to Specialists).
- **Standing disclaimer everywhere.** Generated documents and substantive guidance carry the shared `Disclaimer` component.
- **Role-aware by default.** Every new module defines who can see, create, edit, and approve. Navigation, Home, and quick actions adapt to `organization_members.role`.
- **Employee self-service, not admin-only.** Members can complete their own tasks, acknowledge policies, access wellbeing resources, and submit requests without needing an admin to act for them.
- **No hardcoded colours or emojis.** Use tokens and `lucide-react`.

## Build plan

1. **Phase 0 — Frame:** sidebar restructure, Home cockpit, routes, i18n catalogues.
2. **Phase 1 — Governance:** build the Governance module.
3. **Phase 2 — Security:** build the Security module.
4. **Phase 3 — Operations:** build the Operations module.
5. **Phase 4 — Revenue and External:** build the Revenue overview and Specialists directory.
6. **Phase 5 — Cross-module links and analytics:** wire modules together and expand the Analytics dashboard.

## Prototypes

- `prototypes/BusinessFunctionsWorkspace.dc.html` — wireframes for the sidebar, role-aware Home cockpit, and module overviews. Use the role switcher in the topbar to preview owner, manager, professional, member, and consultant Home layouts.

## References

- `src/app/appViews.tsx` — route table.
- `src/features/app/shell/navConfig.ts` — sidebar model.
- `src/features/app/views/home/HomeView.tsx` — Home dispatch.
- `src/features/app/views/finance/data/types.ts` — `FinanceParty` model for vendor/supplier reuse.
- `docs/CONVENTIONS.md` — workspace conventions, file split, and architecture checks.
- `docs/CANONICAL_FACTS.md` — source of record for product facts.
- `docs/NATURAL_LANGUAGE_COPY.md` — writing rules for user-facing copy.
- `docs/MAINTAINABILITY.md` — `*DemoView` / `*ProductionView` split and the 800-line budget.

## Open questions tracked here

- Should the public `/demo` surface show all new modules immediately, or only after a module is production-ready?
- Should Security module user-facing copy carry a sector-specific cyber disclaimer in addition to the standing Dutiva disclaimer?
- Should Governance generate Document Studio templates for board resolutions and minutes?
