/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/* oxlint-disable react/only-export-components -- route table, not a component
   module: the lazy() wrappers here don't participate in fast refresh. */
import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import {
  preloadAdvisorView,
  preloadAnalyticsView,
  preloadCasesView,
  preloadCommunicationsView,
  preloadComplianceView,
  preloadCompensationView,
  preloadDocumentsView,
  preloadEmployeesView,
  preloadHomeView,
  preloadKnowledgeView,
  preloadPlanningView,
  preloadSettingsView,
  preloadWellbeingView,
  preloadWorkflowsView,
} from './viewPreloads'

/**
 * Child routes rendered inside the AppShell outlet. Each view is lazy-loaded
 * so the marketing landing page (and any single view) doesn't pull the whole
 * workspace into the initial chunk.
 *
 * gated() wraps a fixture-driven view in ModeGate: demo renders it as-is,
 * production renders the shared empty state. Ungated on purpose: home and
 * advisor (own production variants), knowledge (generic HR-law reference +
 * the real guidance panel), settings (hosts the toggle), Document Studio
 * screens (real catalogue), the document repository + detail (real
 * persistence via hr_generated_documents — migration 0076), and Advisor
 * Memory (hr_advisor_memory_facts — migration 0086; views dispatch on mode).
 * Signing remains gated until it gains real persistence. The legacy hr-library
 * gallery redirects to Document Studio in production (see HrLibraryRoute).
 * communications, compensation and wellbeing came off this way
 * (migrations 0039–0041) and now dispatch on mode themselves.
 */
/* prettier-ignore */ const HomeView = lazy(preloadHomeView)
/* prettier-ignore */ const AdvisorView = lazy(preloadAdvisorView)
/* prettier-ignore */ const WorkflowsView = lazy(preloadWorkflowsView)
/* prettier-ignore */ const FlowRunner = lazy(() => import('@/features/app/flows/FlowRunner').then((m) => ({ default: m.FlowRunner })))
/* prettier-ignore */ const CasesView = lazy(preloadCasesView)
/* prettier-ignore */ const CaseDetailView = lazy(() => import('@/features/app/views/cases/CaseDetailView').then((m) => ({ default: m.CaseDetailView })))
/* prettier-ignore */ const EmployeesView = lazy(preloadEmployeesView)
/* prettier-ignore */ const EmployeeProfileView = lazy(() => import('@/features/app/views/employees/EmployeeProfileView').then((m) => ({ default: m.EmployeeProfileView })))
/* prettier-ignore */ const ComplianceView = lazy(preloadComplianceView)
/* prettier-ignore */ const PoliciesView = lazy(() => import('@/features/app/views/policies/PoliciesView').then((m) => ({ default: m.PoliciesView })))
/* prettier-ignore */ const HrLibraryRoute = lazy(() =>
  preloadDocumentsView().then((mods) => ({ default: mods[1].HrLibraryRoute })),
)
/* prettier-ignore */ const AnalyticsView = lazy(preloadAnalyticsView)
/* prettier-ignore */ const KnowledgeView = lazy(preloadKnowledgeView)
/* prettier-ignore */ const GuideView = lazy(() => import('@/features/app/reference/GuideView').then((m) => ({ default: m.GuideView })))
/* prettier-ignore */ const CommunicationsView = lazy(preloadCommunicationsView)
/* prettier-ignore */ const CompensationView = lazy(preloadCompensationView)
/* prettier-ignore */ const WellbeingView = lazy(preloadWellbeingView)
/* prettier-ignore */ const SupportView = lazy(() => import('@/features/app/views/support/SupportView').then((m) => ({ default: m.SupportView })))
/* prettier-ignore */ const SupportRequestsList = lazy(() => import('@/features/app/views/support/SupportRequestsList').then((m) => ({ default: m.SupportRequestsList })))
/* prettier-ignore */ const SupportTicketDetail = lazy(() => import('@/features/app/views/support/SupportTicketDetail').then((m) => ({ default: m.SupportTicketDetail })))
/* prettier-ignore */ const SupportAdminView = lazy(() => import('@/features/app/views/support/SupportAdminView').then((m) => ({ default: m.SupportAdminView })))
/* prettier-ignore */ const SupportAdminTicket = lazy(() => import('@/features/app/views/support/SupportAdminTicket').then((m) => ({ default: m.SupportAdminTicket })))
/* prettier-ignore */ const ExportAuditView = lazy(() => import('@/features/app/views/support/ExportAuditView').then((m) => ({ default: m.ExportAuditView })))
/* Planning section (Tasks + Calendar as sub-tabs) */
/* prettier-ignore */ const PlanningLayout = lazy(() =>
  preloadPlanningView().then((mods) => ({ default: mods[0].PlanningLayout })),
)
/* prettier-ignore */ const TasksView = lazy(() =>
  preloadPlanningView().then((mods) => ({ default: mods[1].TasksView })),
)
/* prettier-ignore */ const CalendarView = lazy(() => import('@/features/app/views/calendar/CalendarView').then((m) => ({ default: m.CalendarView })))
/* Settings section (General + Memory as sub-tabs) */
/* prettier-ignore */ const SettingsLayout = lazy(() =>
  preloadSettingsView().then((mods) => ({ default: mods[0].SettingsLayout })),
)
/* prettier-ignore */ const SettingsView = lazy(() =>
  preloadSettingsView().then((mods) => ({ default: mods[1].SettingsView })),
)
/* Advisor Memory (person / case / chat recall / manager) — nested under Settings */
/* prettier-ignore */ const MemoryLayout = lazy(() => import('@/features/app/views/memory/MemoryLayout').then((m) => ({ default: m.MemoryLayout })))
/* prettier-ignore */ const MemoryManagerView = lazy(() => import('@/features/app/views/memory/MemoryManagerView').then((m) => ({ default: m.MemoryManagerView })))
/* prettier-ignore */ const PersonMemoryView = lazy(() => import('@/features/app/views/memory/PersonMemoryView').then((m) => ({ default: m.PersonMemoryView })))
/* prettier-ignore */ const CaseMemoryView = lazy(() => import('@/features/app/views/memory/CaseMemoryView').then((m) => ({ default: m.CaseMemoryView })))
/* prettier-ignore */ const ChatRecallView = lazy(() => import('@/features/app/views/memory/ChatRecallView').then((m) => ({ default: m.ChatRecallView })))
/* HR Documents Library (Document Studio + Repository) */
/* prettier-ignore */ const DocumentsLayout = lazy(() =>
  preloadDocumentsView().then((mods) => ({ default: mods[0].DocumentsLayout })),
)
/* prettier-ignore */ const StudioScreen = lazy(() => import('@/features/app/documents/screens/StudioScreen').then((m) => ({ default: m.StudioScreen })))
/* prettier-ignore */ const TemplateDetailScreen = lazy(() => import('@/features/app/documents/screens/TemplateDetailScreen').then((m) => ({ default: m.TemplateDetailScreen })))
/* prettier-ignore */ const GenerateScreen = lazy(() => import('@/features/app/documents/screens/GenerateScreen').then((m) => ({ default: m.GenerateScreen })))
/* prettier-ignore */ const RepositoryScreen = lazy(() => import('@/features/app/documents/screens/RepositoryScreen').then((m) => ({ default: m.RepositoryScreen })))
/* prettier-ignore */ const DocumentDetailScreen = lazy(() => import('@/features/app/documents/screens/DocumentDetailScreen').then((m) => ({ default: m.DocumentDetailScreen })))
/* prettier-ignore */ const SigningScreen = lazy(() => import('@/features/app/documents/screens/SigningScreen').then((m) => ({ default: m.SigningScreen })))

function createAppViewRoutes(root: string): RouteObject[] {
  const r = (path: string) => `${root}/${path}`
  return [
    { path: 'home', element: <HomeView /> },
    { path: 'advisor', element: <AdvisorView /> },
    { path: 'workflows', element: <WorkflowsView /> },
    { path: 'workflows/:slug', element: <FlowRunner /> },
    { path: 'cases', element: <CasesView /> },
    { path: 'cases/:caseId', element: <CaseDetailView /> },
    { path: 'employees', element: <EmployeesView /> },
    { path: 'employees/:employeeId', element: <EmployeeProfileView /> },
    { path: 'compliance', element: <ComplianceView /> },
    { path: 'policies', element: <PoliciesView /> },
    { path: 'templates', element: <Navigate to={r('documents/hr-library')} replace /> },
    { path: 'analytics', element: <AnalyticsView /> },
    { path: 'reports', element: <Navigate to={r('analytics')} replace /> },
    { path: 'knowledge', element: <KnowledgeView /> },
    { path: 'knowledge/:slug', element: <GuideView /> },
    { path: 'support', element: <SupportView /> },
    { path: 'support/requests', element: <SupportRequestsList /> },
    { path: 'support/requests/:ticketId', element: <SupportTicketDetail /> },
    { path: 'support/admin', element: <SupportAdminView /> },
    { path: 'support/admin/exports', element: <ExportAuditView /> },
    { path: 'support/admin/:ticketId', element: <SupportAdminTicket /> },
    { path: 'communications', element: <CommunicationsView /> },
    { path: 'compensation', element: <CompensationView /> },
    { path: 'wellbeing', element: <WellbeingView /> },
    { path: 'tasks', element: <Navigate to={r('planning/tasks')} replace /> },
    { path: 'calendar', element: <Navigate to={r('planning/calendar')} replace /> },
    { path: 'memory', element: <Navigate to={r('settings/memory')} replace /> },
    {
      path: 'planning',
      element: <PlanningLayout />,
      children: [
        { index: true, element: <Navigate to={r('planning/tasks')} replace /> },
        { path: 'tasks', element: <TasksView /> },
        { path: 'calendar', element: <CalendarView /> },
      ],
    },
    {
      path: 'settings',
      element: <SettingsLayout />,
      children: [
        { index: true, element: <SettingsView /> },
        {
          path: 'memory',
          element: <MemoryLayout />,
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
        { index: true, element: <RepositoryScreen /> },
        { path: 'hr-library', element: <HrLibraryRoute /> },
        { path: 'studio', element: <StudioScreen /> },
        { path: 'templates/:tid', element: <TemplateDetailScreen /> },
        { path: 'generate/:templateId', element: <GenerateScreen /> },
        { path: 'sign/:envelopeId', element: <SigningScreen /> },
        { path: ':docId', element: <DocumentDetailScreen /> },
      ],
    },
  ]
}

export const appViewRoutes = createAppViewRoutes('/app')
export const demoViewRoutes = createAppViewRoutes('/demo')
export const frDemoViewRoutes = createAppViewRoutes('/fr/demo')
