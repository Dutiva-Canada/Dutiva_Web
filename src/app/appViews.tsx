/* oxlint-disable react/only-export-components -- route table, not a component
   module: the lazy() wrappers here don't participate in fast refresh. */
import { lazy } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { ModeGate } from '@/features/app/workspaceMode/ModeGate'

/**
 * Child routes rendered inside the AppShell outlet. Each view is lazy-loaded
 * so the marketing landing page (and any single view) doesn't pull the whole
 * workspace into the initial chunk.
 *
 * gated() wraps a fixture-driven view in ModeGate: demo renders it as-is,
 * production renders the shared empty state. Ungated on purpose: home and
 * advisor (own production variants), knowledge (generic HR-law reference +
 * the real guidance panel), settings (hosts the toggle), and the Document
 * Studio screens (the template catalog is real product content — only the
 * fixture repository is gated). Remove a view's gate when it gains real
 * persistence — communications, compensation and wellbeing came off this way
 * (migrations 0039–0041) and now dispatch on mode themselves.
 */
function gated(view: ReactNode) {
  return <ModeGate>{view}</ModeGate>
}
/* prettier-ignore */ const HomeView = lazy(() => import('@/features/app/views/home/HomeView').then((m) => ({ default: m.HomeView })))
/* prettier-ignore */ const AdvisorView = lazy(() => import('@/features/app/views/advisor/AdvisorView').then((m) => ({ default: m.AdvisorView })))
/* prettier-ignore */ const WorkflowsView = lazy(() => import('@/features/app/views/workflows/WorkflowsView').then((m) => ({ default: m.WorkflowsView })))
/* prettier-ignore */ const FlowRunner = lazy(() => import('@/features/app/flows/FlowRunner').then((m) => ({ default: m.FlowRunner })))
/* prettier-ignore */ const CasesView = lazy(() => import('@/features/app/views/cases/CasesView').then((m) => ({ default: m.CasesView })))
/* prettier-ignore */ const CaseDetailView = lazy(() => import('@/features/app/views/cases/CaseDetailView').then((m) => ({ default: m.CaseDetailView })))
/* prettier-ignore */ const EmployeesView = lazy(() => import('@/features/app/views/employees/EmployeesView').then((m) => ({ default: m.EmployeesView })))
/* prettier-ignore */ const EmployeeProfileView = lazy(() => import('@/features/app/views/employees/EmployeeProfileView').then((m) => ({ default: m.EmployeeProfileView })))
/* prettier-ignore */ const ComplianceView = lazy(() => import('@/features/app/views/compliance/ComplianceView').then((m) => ({ default: m.ComplianceView })))
/* prettier-ignore */ const PoliciesView = lazy(() => import('@/features/app/views/policies/PoliciesView').then((m) => ({ default: m.PoliciesView })))
/* prettier-ignore */ const TemplatesView = lazy(() => import('@/features/app/views/templates/TemplatesView').then((m) => ({ default: m.TemplatesView })))
/* prettier-ignore */ const AnalyticsView = lazy(() => import('@/features/app/views/analytics/AnalyticsView').then((m) => ({ default: m.AnalyticsView })))
/* prettier-ignore */ const KnowledgeView = lazy(() => import('@/features/app/views/knowledge/KnowledgeView').then((m) => ({ default: m.KnowledgeView })))
/* prettier-ignore */ const GuideView = lazy(() => import('@/features/app/reference/GuideView').then((m) => ({ default: m.GuideView })))
/* prettier-ignore */ const CommunicationsView = lazy(() => import('@/features/app/views/communications/CommunicationsView').then((m) => ({ default: m.CommunicationsView })))
/* prettier-ignore */ const CompensationView = lazy(() => import('@/features/app/views/compensation/CompensationView').then((m) => ({ default: m.CompensationView })))
/* prettier-ignore */ const WellbeingView = lazy(() => import('@/features/app/views/wellbeing/WellbeingView').then((m) => ({ default: m.WellbeingView })))
/* prettier-ignore */ const SupportView = lazy(() => import('@/features/app/views/support/SupportView').then((m) => ({ default: m.SupportView })))
/* prettier-ignore */ const SupportRequestsList = lazy(() => import('@/features/app/views/support/SupportRequestsList').then((m) => ({ default: m.SupportRequestsList })))
/* prettier-ignore */ const SupportTicketDetail = lazy(() => import('@/features/app/views/support/SupportTicketDetail').then((m) => ({ default: m.SupportTicketDetail })))
/* prettier-ignore */ const SupportAdminView = lazy(() => import('@/features/app/views/support/SupportAdminView').then((m) => ({ default: m.SupportAdminView })))
/* prettier-ignore */ const SupportAdminTicket = lazy(() => import('@/features/app/views/support/SupportAdminTicket').then((m) => ({ default: m.SupportAdminTicket })))
/* prettier-ignore */ const ExportAuditView = lazy(() => import('@/features/app/views/support/ExportAuditView').then((m) => ({ default: m.ExportAuditView })))
/* Planning section (Tasks + Calendar as sub-tabs) */
/* prettier-ignore */ const PlanningLayout = lazy(() => import('@/features/app/views/planning/PlanningLayout').then((m) => ({ default: m.PlanningLayout })))
/* prettier-ignore */ const TasksView = lazy(() => import('@/features/app/views/tasks/TasksView').then((m) => ({ default: m.TasksView })))
/* prettier-ignore */ const CalendarView = lazy(() => import('@/features/app/views/calendar/CalendarView').then((m) => ({ default: m.CalendarView })))
/* Settings section (General + Memory as sub-tabs) */
/* prettier-ignore */ const SettingsLayout = lazy(() => import('@/features/app/views/settings/SettingsLayout').then((m) => ({ default: m.SettingsLayout })))
/* prettier-ignore */ const SettingsView = lazy(() => import('@/features/app/views/settings/SettingsView').then((m) => ({ default: m.SettingsView })))
/* Advisor Memory (person / case / chat recall / manager) — nested under Settings */
/* prettier-ignore */ const MemoryLayout = lazy(() => import('@/features/app/views/memory/MemoryLayout').then((m) => ({ default: m.MemoryLayout })))
/* prettier-ignore */ const MemoryManagerView = lazy(() => import('@/features/app/views/memory/MemoryManagerView').then((m) => ({ default: m.MemoryManagerView })))
/* prettier-ignore */ const PersonMemoryView = lazy(() => import('@/features/app/views/memory/PersonMemoryView').then((m) => ({ default: m.PersonMemoryView })))
/* prettier-ignore */ const CaseMemoryView = lazy(() => import('@/features/app/views/memory/CaseMemoryView').then((m) => ({ default: m.CaseMemoryView })))
/* prettier-ignore */ const ChatRecallView = lazy(() => import('@/features/app/views/memory/ChatRecallView').then((m) => ({ default: m.ChatRecallView })))
/* HR Documents Library (Document Studio + Repository) */
/* prettier-ignore */ const DocumentsLayout = lazy(() => import('@/features/app/documents/DocumentsLayout').then((m) => ({ default: m.DocumentsLayout })))
/* prettier-ignore */ const StudioScreen = lazy(() => import('@/features/app/documents/screens/StudioScreen').then((m) => ({ default: m.StudioScreen })))
/* prettier-ignore */ const TemplateDetailScreen = lazy(() => import('@/features/app/documents/screens/TemplateDetailScreen').then((m) => ({ default: m.TemplateDetailScreen })))
/* prettier-ignore */ const GenerateScreen = lazy(() => import('@/features/app/documents/screens/GenerateScreen').then((m) => ({ default: m.GenerateScreen })))
/* prettier-ignore */ const RepositoryScreen = lazy(() => import('@/features/app/documents/screens/RepositoryScreen').then((m) => ({ default: m.RepositoryScreen })))
/* prettier-ignore */ const DocumentDetailScreen = lazy(() => import('@/features/app/documents/screens/DocumentDetailScreen').then((m) => ({ default: m.DocumentDetailScreen })))
/* prettier-ignore */ const SigningScreen = lazy(() => import('@/features/app/documents/screens/SigningScreen').then((m) => ({ default: m.SigningScreen })))

export const appViewRoutes: RouteObject[] = [
  { path: 'home', element: <HomeView /> },
  { path: 'advisor', element: <AdvisorView /> },
  /* Workflows handles both modes itself: the guided-flow list is real
     content and shows in production, while the prototype's in-flight rows,
     termination map and Advisor catalogue are demo-only. */
  { path: 'workflows', element: <WorkflowsView /> },
  { path: 'workflows/:slug', element: <FlowRunner /> },
  /* Cases list + detail handle both modes themselves (real persistence
     in production, including the hr_case_notes thread on the detail). */
  { path: 'cases', element: <CasesView /> },
  { path: 'cases/:caseId', element: <CaseDetailView /> },
  /* Employees list + profile handle both modes themselves (real
     persistence in production, including the hr_employee_notes thread). */
  { path: 'employees', element: <EmployeesView /> },
  { path: 'employees/:employeeId', element: <EmployeeProfileView /> },
  /* Compliance handles both modes itself (real persistence in production). */
  { path: 'compliance', element: <ComplianceView /> },
  /* Policies handles both modes itself (real persistence in production). */
  { path: 'policies', element: <PoliciesView /> },
  /* /app/templates is now the Templates tab inside HR Studio (DocumentsLayout) */
  { path: 'templates', element: <Navigate to="/app/documents/hr-library" replace /> },
  /* Analytics handles both modes itself (live aggregation in production).
     The destination has one name everywhere now; /app/reports redirects. */
  { path: 'analytics', element: <AnalyticsView /> },
  { path: 'reports', element: <Navigate to="/app/analytics" replace /> },
  { path: 'knowledge', element: <KnowledgeView /> },
  /* Reference guides are real content — ungated, like the Knowledge index. */
  { path: 'knowledge/:slug', element: <GuideView /> },
  /* Support hub — real feature (request form → create-support-ticket), ungated. */
  { path: 'support', element: <SupportView /> },
  { path: 'support/requests', element: <SupportRequestsList /> },
  { path: 'support/requests/:ticketId', element: <SupportTicketDetail /> },
  /* Founder/operator dashboard — admin-gated in the views + the edge function. */
  { path: 'support/admin', element: <SupportAdminView /> },
  /* Export audit trail — admin-gated in the view + the edge function.
     Ranked above support/admin/:ticketId by React Router's static-segment
     precedence, so the static path keeps its dedicated view. */
  { path: 'support/admin/exports', element: <ExportAuditView /> },
  { path: 'support/admin/:ticketId', element: <SupportAdminTicket /> },
  /* Communications, Compensation and Wellbeing each handle both modes
     themselves (real persistence in production — migrations 0040, 0039,
     0041). Their production views are deliberately narrower than the demo:
     no Advisor review chips, no market salary benchmark, and no per-person
     wellbeing signals, because the product performs none of those. */
  { path: 'communications', element: <CommunicationsView /> },
  { path: 'compensation', element: <CompensationView /> },
  { path: 'wellbeing', element: <WellbeingView /> },
  /* /app/tasks and /app/calendar redirect to their Planning sub-routes */
  { path: 'tasks', element: <Navigate to="/app/planning/tasks" replace /> },
  { path: 'calendar', element: <Navigate to="/app/planning/calendar" replace /> },
  /* /app/memory redirects to its new home under Settings */
  { path: 'memory', element: <Navigate to="/app/settings/memory" replace /> },
  /* Planning — Tasks and Calendar as sub-tabs */
  {
    path: 'planning',
    element: <PlanningLayout />,
    children: [
      { index: true, element: <Navigate to="/app/planning/tasks" replace /> },
      { path: 'tasks', element: <TasksView /> },
      { path: 'calendar', element: <CalendarView /> },
    ],
  },
  /* Settings — General settings and Memory as sub-tabs */
  {
    path: 'settings',
    element: <SettingsLayout />,
    children: [
      { index: true, element: <SettingsView /> },
      {
        path: 'memory',
        element: gated(<MemoryLayout />),
        children: [
          { index: true, element: <MemoryManagerView /> },
          { path: 'people/:personId', element: <PersonMemoryView /> },
          { path: 'cases/:caseId', element: <CaseMemoryView /> },
          { path: 'conversations/:threadId', element: <ChatRecallView /> },
        ],
      },
    ],
  },
  {
    path: 'documents',
    element: <DocumentsLayout />,
    children: [
      { index: true, element: gated(<RepositoryScreen />) },
      /* Templates tab — the legacy template gallery, nested under HR Studio */
      { path: 'hr-library', element: gated(<TemplatesView />) },
      { path: 'studio', element: <StudioScreen /> },
      { path: 'templates/:tid', element: <TemplateDetailScreen /> },
      { path: 'generate/:templateId', element: <GenerateScreen /> },
      { path: 'sign/:envelopeId', element: gated(<SigningScreen />) },
      { path: ':docId', element: gated(<DocumentDetailScreen />) },
    ],
  },
]
