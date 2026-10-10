/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Prefetch registries — the import() thunks for every warmable chunk, keyed
 * for nav intent lookup. Kept in a dedicated module because `viewPreloads.ts`
 * is reachable from the eager entry graph (routes.tsx → appViews.tsx →
 * viewPreloads.ts): putting the maps there would price every specifier string
 * into the marketing page budget. Only `viewPrefetch.ts` (lazy) and AppShell
 * import this file.
 *
 * Adding a lazy view? Add its specifier here (same string as the lazy() call —
 * identical specifiers share the chunk) and spread `viewIntentProps(key)` on
 * the link that reaches it.
 */

import {
  preloadAdvisorView,
  preloadAnalyticsView,
  preloadCasesView,
  preloadCommunicationsView,
  preloadCommsView,
  preloadComplianceView,
  preloadCompensationView,
  preloadCrmView,
  preloadDocumentsView,
  preloadEmployeesView,
  preloadFinanceView,
  preloadGovernanceView,
  preloadHiringView,
  preloadHomeView,
  preloadKnowledgeView,
  preloadOperationsView,
  preloadPlanningView,
  preloadPoliciesView,
  preloadRevenueView,
  preloadSecurityView,
  preloadSettingsView,
  preloadSpecialistsView,
  preloadSupportView,
  preloadWellbeingView,
  preloadWorkflowsView,
} from './viewPreloads'

/**
 * Sub-screen and detail chunks — one lazy() chunk per entry, mirroring the
 * specifiers in appViews.tsx (import() over the same specifier shares the
 * chunk). Keys are `module.tab` / `view.detail` dotted namespaces so a single
 * flat registry covers them.
 */
export const screenViewPreloads: Record<string, () => Promise<unknown>> = {
  /* Communications workspace */
  'comms.overview': () => import('@/features/app/views/comms/screens/Overview'),
  'comms.initiatives': () => import('@/features/app/views/comms/screens/Initiatives'),
  'comms.content': () => import('@/features/app/views/comms/screens/ContentCalendar'),
  'comms.relationships': () => import('@/features/app/views/comms/screens/Relationships'),
  'comms.segments': () => import('@/features/app/views/comms/screens/Segments'),
  'comms.engagement': () => import('@/features/app/views/comms/screens/Engagement'),
  'comms.intelligence': () => import('@/features/app/views/comms/screens/Intelligence'),
  'comms.results': () => import('@/features/app/views/comms/screens/Results'),
  'comms.analytics': () => import('@/features/app/views/comms/screens/CommsAnalytics'),
  'comms.settings': () => import('@/features/app/views/comms/screens/Settings'),
  /* Finance workspace */
  'finance.overview': () => import('@/features/app/views/finance/screens/Overview'),
  'finance.entities': () => import('@/features/app/views/finance/screens/Entities'),
  'finance.transactions': () => import('@/features/app/views/finance/screens/Transactions'),
  'finance.sales': () => import('@/features/app/views/finance/screens/Sales'),
  'finance.purchases': () => import('@/features/app/views/finance/screens/Purchases'),
  'finance.payroll': () => import('@/features/app/views/finance/screens/Payroll'),
  'finance.accounting': () => import('@/features/app/views/finance/screens/Accounting'),
  'finance.plans': () => import('@/features/app/views/finance/screens/Plans'),
  'finance.treasury': () => import('@/features/app/views/finance/screens/Treasury'),
  'finance.portfolio': () => import('@/features/app/views/finance/screens/Portfolio'),
  'finance.deals': () => import('@/features/app/views/finance/screens/Deals'),
  'finance.governance': () => import('@/features/app/views/finance/screens/Governance'),
  'finance.tax': () => import('@/features/app/views/finance/screens/Tax'),
  'finance.evidence': () => import('@/features/app/views/finance/screens/Evidence'),
  'finance.import-export': () => import('@/features/app/views/finance/screens/ImportExport'),
  /* Revenue */
  'revenue.overview': () => import('@/features/app/views/revenue/screens/Overview'),
  'revenue.streams': () => import('@/features/app/views/revenue/screens/Streams'),
  'revenue.invoices': () => import('@/features/app/views/revenue/screens/Invoices'),
  /* Governance */
  'governance.overview': () => import('@/features/app/views/governance/screens/Overview'),
  'governance.records': () => import('@/features/app/views/governance/screens/Records'),
  'governance.decisions': () => import('@/features/app/views/governance/screens/Decisions'),
  'governance.officers': () => import('@/features/app/views/governance/screens/Officers'),
  'governance.shareholders': () =>
    import('@/features/app/views/governance/screens/Shareholders'),
  /* Security */
  'security.overview': () => import('@/features/app/views/security/screens/Overview'),
  'security.assets': () => import('@/features/app/views/security/screens/Assets'),
  'security.access': () => import('@/features/app/views/security/screens/AccessReviews'),
  'security.incidents': () => import('@/features/app/views/security/screens/Incidents'),
  'security.risks': () => import('@/features/app/views/security/screens/Risks'),
  'security.vendors': () => import('@/features/app/views/security/screens/Vendors'),
  /* Operations */
  'operations.overview': () => import('@/features/app/views/operations/screens/Overview'),
  'operations.projects': () => import('@/features/app/views/operations/screens/Projects'),
  'operations.vendors': () => import('@/features/app/views/operations/screens/Vendors'),
  'operations.quality': () =>
    import('@/features/app/views/operations/screens/QualityChecks'),
  'operations.technology': () => import('@/features/app/views/operations/screens/Technology'),
  'operations.logistics': () => import('@/features/app/views/operations/screens/Logistics'),
  /* Specialists */
  'specialists.overview': () => import('@/features/app/views/specialists/screens/Overview'),
  'specialists.directory': () => import('@/features/app/views/specialists/screens/Directory'),
  'specialists.engagements': () =>
    import('@/features/app/views/specialists/screens/Engagements'),
  /* Planning + Settings sub-tabs */
  'planning.calendar': () => import('@/features/app/views/calendar/CalendarView'),
  /* The manager's only job is routing to one of the three detail views —
     warming them together keeps every drill-in instant. */
  'settings.memory': () =>
    Promise.all([
      import('@/features/app/views/memory/MemoryManagerView'),
      import('@/features/app/views/memory/PersonMemoryView'),
      import('@/features/app/views/memory/CaseMemoryView'),
      import('@/features/app/views/memory/ChatRecallView'),
    ] as const),
  'memory.person': () => import('@/features/app/views/memory/PersonMemoryView'),
  'memory.case': () => import('@/features/app/views/memory/CaseMemoryView'),
  'memory.chat': () => import('@/features/app/views/memory/ChatRecallView'),
  /* Documents screens (layout arrives with the `documents` key) */
  'documents.studio': () => import('@/features/app/documents/screens/StudioScreen'),
  'documents.template': () => import('@/features/app/documents/screens/TemplateDetailScreen'),
  'documents.generate': () => import('@/features/app/documents/screens/GenerateScreen'),
  'documents.repository': () => import('@/features/app/documents/screens/RepositoryScreen'),
  'documents.detail': () => import('@/features/app/documents/screens/DocumentDetailScreen'),
  'documents.signing': () => import('@/features/app/documents/screens/SigningScreen'),
  /* Support screens */
  'support.requests': () => import('@/features/app/views/support/SupportRequestsList'),
  'support.ticket': () => import('@/features/app/views/support/SupportTicketDetail'),
  'support.admin': () => import('@/features/app/views/support/SupportAdminView'),
  'support.admin-ticket': () => import('@/features/app/views/support/SupportAdminTicket'),
  'support.exports': () => import('@/features/app/views/support/ExportAuditView'),
  'support.directory': () => import('@/features/app/views/support/CustomerDirectoryView'),
  /* List → detail drill-ins */
  'cases.detail': () => import('@/features/app/views/cases/CaseDetailView'),
  'employees.profile': () => import('@/features/app/views/employees/EmployeeProfileView'),
  'knowledge.guide': () => import('@/features/app/reference/GuideView'),
  'workflows.runner': () => import('@/features/app/flows/FlowRunner'),
  'hiring.candidate': () => import('@/features/app/views/hiring/CandidateDetailView'),
  'hiring.job': () => import('@/features/app/views/hiring/JobPostingDetailView'),
}

/* Look up a screen-level preload — throws on a typo'd key instead of
   silently warming nothing. */
function screen(key: string): () => Promise<unknown> {
  const load = screenViewPreloads[key]
  if (!load) throw new Error(`unknown screen preload key: ${key}`)
  return load
}

/* Keys match navConfig `NavItem.key` for sidebar prefetch. Drill-in views
   ride along: hovering Cases warms the detail chunk too, since the list's
   only job is to get you to one. */
export const workspaceViewPreloads: Record<string, () => Promise<unknown>> = {
  home: preloadHomeView,
  advisor: preloadAdvisorView,
  workflows: () =>
    Promise.all([preloadWorkflowsView(), screen('workflows.runner')()] as const),
  employees: () =>
    Promise.all([preloadEmployeesView(), screen('employees.profile')()] as const),
  cases: () =>
    Promise.all([preloadCasesView(), screen('cases.detail')()] as const),
  documents: preloadDocumentsView,
  knowledge: () =>
    Promise.all([preloadKnowledgeView(), screen('knowledge.guide')()] as const),
  compliance: preloadComplianceView,
  compensation: preloadCompensationView,
  communications: preloadCommunicationsView,
  comms: preloadCommsView,
  finance: preloadFinanceView,
  wellbeing: preloadWellbeingView,
  planning: preloadPlanningView,
  analytics: preloadAnalyticsView,
  settings: preloadSettingsView,
  revenue: preloadRevenueView,
  crm: preloadCrmView,
  operations: preloadOperationsView,
  governance: preloadGovernanceView,
  security: preloadSecurityView,
  specialists: preloadSpecialistsView,
  hiring: () =>
    Promise.all([
      preloadHiringView(),
      screen('hiring.candidate')(),
      screen('hiring.job')(),
    ] as const),
  policies: preloadPoliciesView,
  support: preloadSupportView,
}

/** Standalone portal pages — keys are `portal.page` (path segment). */
export const portalViewPreloads: Record<string, () => Promise<unknown>> = {
  'invest.home': () => import('@/features/invest/portal/InvestHomePage'),
  'invest.chat': () => import('@/features/invest/portal/InvestChatPage'),
  'invest.portfolio': () => import('@/features/invest/portal/InvestPortfolioPage'),
  'invest.orders': () => import('@/features/invest/portal/InvestOrdersPage'),
  'invest.signals': () => import('@/features/invest/portal/InvestSignalsPage'),
  'invest.strategies': () => import('@/features/invest/portal/InvestStrategiesPage'),
  'invest.notifications': () => import('@/features/invest/portal/InvestNotificationsPage'),
  'invest.settings': () => import('@/features/invest/portal/InvestSettingsPage'),
  'invest.legal': () => import('@/features/invest/portal/InvestLegalPage'),
  'health.home': () => import('@/features/health/portal/HealthHomePage'),
  'health.chat': () => import('@/features/health/portal/HealthChatPage'),
  'health.check-in': () => import('@/features/health/portal/HealthCheckInPage'),
  'health.habits': () => import('@/features/health/portal/HealthHabitsPage'),
  'health.journal': () => import('@/features/health/portal/HealthJournalPage'),
  'health.tools': () => import('@/features/health/portal/HealthToolsPage'),
  'health.insights': () => import('@/features/health/portal/HealthInsightsPage'),
  'health.review': () => import('@/features/health/portal/HealthReviewPage'),
  'health.resources': () => import('@/features/health/portal/HealthResourcesPage'),
  'health.legal': () => import('@/features/health/portal/HealthLegalPage'),
  'pr.home': () => import('@/features/pr/portal/PrHomePage'),
  'pr.chat': () => import('@/features/pr/portal/PrChatPage'),
  'pr.campaigns': () => import('@/features/pr/portal/PrCampaignsPage'),
  'pr.content': () => import('@/features/pr/portal/PrContentPage'),
  'pr.media': () => import('@/features/pr/portal/PrMediaPage'),
  'pr.seo': () => import('@/features/pr/portal/PrSeoPage'),
  'pr.answers': () => import('@/features/pr/portal/PrAnswersPage'),
  'pr.mentions': () => import('@/features/pr/portal/PrMentionsPage'),
  'pr.report': () => import('@/features/pr/portal/PrReportPage'),
  'pr.review': () => import('@/features/pr/portal/PrReviewPage'),
  'pr.legal': () => import('@/features/pr/portal/PrLegalPage'),
  'careers.board': () =>
    Promise.all([
      import('./careersSurface'),
      import('@/features/careers/JobBoardPage'),
    ] as const),
  'careers.home': () => import('@/features/careers/portal/PortalHome'),
  'careers.apply': () => import('@/features/careers/portal/ApplyToJobPage'),
  'careers.profile': () => import('@/features/careers/portal/CandidateProfilePage'),
  'careers.applications': () => import('@/features/careers/portal/ApplicationsPage'),
  'careers.ai-tools': () => import('@/features/careers/portal/PortalAiToolsPage'),
  'careers.chat': () => import('@/features/careers/portal/PortalChatPage'),
  'careers.settings': () => import('@/features/careers/portal/PortalSettingsPage'),
  'careers.job': () => import('@/features/careers/JobDetailPage'),
}

/**
 * Public-surface targets — `mkt.<page>` keys for marketing nav/footer links
 * whose lazy page would otherwise cold-load. `mkt.app` warms the whole
 * workspace surface chunk (the Sign-in CTA's destination).
 */
export const marketingViewPreloads: Record<string, () => Promise<unknown>> = {
  'mkt.app': () => import('./appSurface'),
  'mkt.pricing': () => import('@/features/marketing/pages/PricingShell'),
  'mkt.guides': () => import('@/features/marketing/pages/GuidesIndexPage'),
  'mkt.blog': () => import('@/features/marketing/pages/BlogIndexPage'),
  'mkt.faq': () => import('@/features/marketing/pages/FaqPage'),
  'mkt.templates': () => import('@/features/marketing/pages/TemplatesPage'),
  'mkt.contact': () => import('@/features/marketing/pages/ContactPage'),
  'mkt.about': () => import('@/features/marketing/pages/AboutPage'),
  'mkt.help': () => import('@/features/marketing/pages/HelpCenterPage'),
  'mkt.careers': () =>
    Promise.all([
      import('./careersSurface'),
      import('@/features/careers/JobBoardPage'),
    ] as const),
}
