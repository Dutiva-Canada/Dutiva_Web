/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/* oxlint-disable react/only-export-components -- route table, not a component
   module: the lazy() wrappers here don't participate in fast refresh. */
import { lazy } from 'react'
import { redirect } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import {
  preloadAdvisorView,
  preloadAnalyticsView,
  preloadCasesView,
  preloadCommunicationsView,
  preloadCommsView,
  preloadComplianceView,
  preloadCompensationView,
  preloadDocumentsView,
  preloadFinanceView,
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
 * Fixture-backed surfaces decide their production/demo behaviour within the
 * view or its mode-aware dependencies. Home and Advisor have production
 * variants; Knowledge, Settings, Document Studio, repository/detail, Advisor
 * Memory, and Signing have real production-backed behaviour. The legacy
 * hr-library gallery redirects to Document Studio in production via
 * HrLibraryRoute.
 *
 * Communications, Compensation, and Wellbeing dispatch on workspace mode
 * themselves (migrations 0039–0041).
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
/* prettier-ignore */ const CommsView = lazy(preloadCommsView)
/* prettier-ignore */ const FinanceView = lazy(preloadFinanceView)
/* prettier-ignore */ const CrmView = lazy(() => import('@/features/app/views/crm/CrmView').then((m) => ({ default: m.CrmView })))
/* prettier-ignore */ const RevenueView = lazy(() => import('@/features/app/views/revenue/RevenueView').then((m) => ({ default: m.RevenueView })))
/* prettier-ignore */ const OperationsView = lazy(() => import('@/features/app/views/operations/OperationsView').then((m) => ({ default: m.OperationsView })))
/* prettier-ignore */ const GovernanceView = lazy(() => import('@/features/app/views/governance/GovernanceView').then((m) => ({ default: m.GovernanceView })))
/* prettier-ignore */ const SecurityView = lazy(() => import('@/features/app/views/security/SecurityView').then((m) => ({ default: m.SecurityView })))
/* prettier-ignore */ const SpecialistsView = lazy(() => import('@/features/app/views/specialists/SpecialistsView').then((m) => ({ default: m.SpecialistsView })))
/* prettier-ignore */ const CompensationView = lazy(preloadCompensationView)

/* Communications workspace screens */
/* prettier-ignore */ const CommsOverview = lazy(() => import('@/features/app/views/comms/screens/Overview').then((m) => ({ default: m.Overview })))
/* prettier-ignore */ const CommsInitiatives = lazy(() => import('@/features/app/views/comms/screens/Initiatives').then((m) => ({ default: m.Initiatives })))
/* prettier-ignore */ const CommsContentCalendar = lazy(() => import('@/features/app/views/comms/screens/ContentCalendar').then((m) => ({ default: m.ContentCalendar })))
/* prettier-ignore */ const CommsRelationships = lazy(() => import('@/features/app/views/comms/screens/Relationships').then((m) => ({ default: m.Relationships })))
/* prettier-ignore */ const CommsEngagement = lazy(() => import('@/features/app/views/comms/screens/Engagement').then((m) => ({ default: m.Engagement })))
/* prettier-ignore */ const CommsIntelligence = lazy(() => import('@/features/app/views/comms/screens/Intelligence').then((m) => ({ default: m.Intelligence })))
/* prettier-ignore */ const CommsResults = lazy(() => import('@/features/app/views/comms/screens/Results').then((m) => ({ default: m.Results })))
/* prettier-ignore */ const CommsSettings = lazy(() => import('@/features/app/views/comms/screens/Settings').then((m) => ({ default: m.Settings })))
/* Finance workspace screens */
/* prettier-ignore */ const FinanceOverview = lazy(() => import('@/features/app/views/finance/screens/Overview').then((m) => ({ default: m.Overview })))
/* prettier-ignore */ const FinanceEntities = lazy(() => import('@/features/app/views/finance/screens/Entities').then((m) => ({ default: m.Entities })))
/* prettier-ignore */ const FinanceTransactions = lazy(() => import('@/features/app/views/finance/screens/Transactions').then((m) => ({ default: m.Transactions })))
/* prettier-ignore */ const FinanceSales = lazy(() => import('@/features/app/views/finance/screens/Sales').then((m) => ({ default: m.Sales })))
/* prettier-ignore */ const FinancePurchases = lazy(() => import('@/features/app/views/finance/screens/Purchases').then((m) => ({ default: m.Purchases })))
/* prettier-ignore */ const FinancePayroll = lazy(() => import('@/features/app/views/finance/screens/Payroll').then((m) => ({ default: m.Payroll })))
/* prettier-ignore */ const FinanceAccounting = lazy(() => import('@/features/app/views/finance/screens/Accounting').then((m) => ({ default: m.Accounting })))
/* prettier-ignore */ const FinancePlans = lazy(() => import('@/features/app/views/finance/screens/Plans').then((m) => ({ default: m.Plans })))
/* prettier-ignore */ const FinanceTreasury = lazy(() => import('@/features/app/views/finance/screens/Treasury').then((m) => ({ default: m.Treasury })))
/* prettier-ignore */ const FinanceTax = lazy(() => import('@/features/app/views/finance/screens/Tax').then((m) => ({ default: m.Tax })))
/* prettier-ignore */ const FinanceEvidence = lazy(() => import('@/features/app/views/finance/screens/Evidence').then((m) => ({ default: m.Evidence })))
/* prettier-ignore */ const FinanceImportExport = lazy(() => import('@/features/app/views/finance/screens/ImportExport').then((m) => ({ default: m.ImportExport })))
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
/* Hiring module — evidence-based recruitment system */
/* prettier-ignore */ const HiringView = lazy(() => import('@/features/app/views/hiring/HiringView').then((m) => ({ default: m.HiringView })))
/* prettier-ignore */ const CandidateDetailView = lazy(() => import('@/features/app/views/hiring/CandidateDetailView').then((m) => ({ default: m.CandidateDetailView })))
/* prettier-ignore */ const JobPostingDetailView = lazy(() => import('@/features/app/views/hiring/JobPostingDetailView').then((m) => ({ default: m.JobPostingDetailView })))
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
    { path: 'templates', loader: () => redirect(r('documents/hr-library')) },
    { path: 'analytics', element: <AnalyticsView /> },
    { path: 'reports', loader: () => redirect(r('analytics')) },
    { path: 'knowledge', element: <KnowledgeView /> },
    { path: 'knowledge/:slug', element: <GuideView /> },
    { path: 'support', element: <SupportView /> },
    { path: 'support/requests', element: <SupportRequestsList /> },
    { path: 'support/requests/:ticketId', element: <SupportTicketDetail /> },
    { path: 'support/admin', element: <SupportAdminView /> },
    { path: 'support/admin/exports', element: <ExportAuditView /> },
    { path: 'support/admin/:ticketId', element: <SupportAdminTicket /> },
    { path: 'communications', element: <CommunicationsView /> },
    {
      path: 'comms',
      element: <CommsView />,
      children: [
        { index: true, loader: () => redirect(r('comms/overview')) },
        { path: 'overview', element: <CommsOverview /> },
        { path: 'initiatives', element: <CommsInitiatives /> },
        { path: 'content', element: <CommsContentCalendar /> },
        { path: 'relationships', element: <CommsRelationships /> },
        { path: 'engagement', element: <CommsEngagement /> },
        { path: 'intelligence', element: <CommsIntelligence /> },
        { path: 'results', element: <CommsResults /> },
        { path: 'settings', element: <CommsSettings /> },
      ],
    },
    {
      path: 'finance',
      element: <FinanceView />,
      children: [
        { index: true, loader: () => redirect(r('finance/overview')) },
        { path: 'overview', element: <FinanceOverview /> },
        { path: 'entities', element: <FinanceEntities /> },
        { path: 'transactions', element: <FinanceTransactions /> },
        { path: 'sales', element: <FinanceSales /> },
        { path: 'purchases', element: <FinancePurchases /> },
        { path: 'payroll', element: <FinancePayroll /> },
        { path: 'accounting', element: <FinanceAccounting /> },
        { path: 'plans', element: <FinancePlans /> },
        { path: 'treasury', element: <FinanceTreasury /> },
        { path: 'tax', element: <FinanceTax /> },
        { path: 'evidence', element: <FinanceEvidence /> },
        { path: 'import-export', element: <FinanceImportExport /> },
      ],
    },
    { path: 'compensation', element: <CompensationView /> },
    { path: 'crm', element: <CrmView /> },
    { path: 'revenue', element: <RevenueView /> },
    { path: 'operations', element: <OperationsView /> },
    { path: 'governance', element: <GovernanceView /> },
    { path: 'security', element: <SecurityView /> },
    { path: 'specialists', element: <SpecialistsView /> },
    { path: 'wellbeing', element: <WellbeingView /> },
    /* Hiring module — evidence-based recruitment system with demo/production support */
    { path: 'hiring', element: <HiringView /> },
    { path: 'hiring/candidates/:candidateId', element: <CandidateDetailView /> },
    { path: 'hiring/postings/:postingId', element: <JobPostingDetailView /> },
    { path: 'tasks', loader: () => redirect(r('planning/tasks')) },
    { path: 'calendar', loader: () => redirect(r('planning/calendar')) },
    { path: 'memory', loader: () => redirect(r('settings/memory')) },
    {
      path: 'planning',
      element: <PlanningLayout />,
      children: [
        { index: true, loader: () => redirect(r('planning/tasks')) },
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
