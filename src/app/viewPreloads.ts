/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Shared dynamic import() fns for workspace views — used by appViews.tsx lazy()
 * routes and by shell nav prefetch on hover/focus intent.
 */

import type { ComponentType } from 'react'

type ViewDefaultExport = { default: ComponentType<object> }

export function preloadHomeView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/home/HomeView').then((m) => ({ default: m.HomeView }))
}

export function preloadAdvisorView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/advisor/AdvisorView').then((m) => ({
    default: m.AdvisorView,
  }))
}

export function preloadWorkflowsView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/workflows/WorkflowsView').then((m) => ({
    default: m.WorkflowsView,
  }))
}

export function preloadEmployeesView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/employees/EmployeesView').then((m) => ({
    default: m.EmployeesView,
  }))
}

export function preloadCasesView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/cases/CasesView').then((m) => ({ default: m.CasesView }))
}

export function preloadDocumentsView() {
  return Promise.all([
    import('@/features/app/documents/DocumentsLayout'),
    import('@/features/app/documents/HrLibraryRoute'),
  ] as const)
}

export function preloadKnowledgeView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/knowledge/KnowledgeView').then((m) => ({
    default: m.KnowledgeView,
  }))
}

export function preloadComplianceView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/compliance/ComplianceView').then((m) => ({
    default: m.ComplianceView,
  }))
}

export function preloadCompensationView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/compensation/CompensationView').then((m) => ({
    default: m.CompensationView,
  }))
}

export function preloadCommunicationsView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/communications/CommunicationsView').then((m) => ({
    default: m.CommunicationsView,
  }))
}

export function preloadCommsView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/comms/CommsView').then((m) => ({ default: m.CommsView }))
}

export function preloadFinanceView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/finance/FinanceView').then((m) => ({
    default: m.FinanceView,
  }))
}

export function preloadWellbeingView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/wellbeing/WellbeingView').then((m) => ({
    default: m.WellbeingView,
  }))
}

export function preloadPlanningView() {
  return Promise.all([
    import('@/features/app/views/planning/PlanningLayout'),
    import('@/features/app/views/tasks/TasksView'),
    import('@/features/app/views/tasks/TaskDetailView'),
  ] as const)
}

export function preloadAnalyticsView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/analytics/AnalyticsView').then((m) => ({
    default: m.AnalyticsView,
  }))
}

export function preloadSettingsView() {
  return Promise.all([
    import('@/features/app/views/settings/SettingsLayout'),
    import('@/features/app/views/settings/SettingsView'),
  ] as const)
}

export function preloadRevenueView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/revenue/RevenueView').then((m) => ({
    default: m.RevenueView,
  }))
}

export function preloadCrmView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/crm/CrmView').then((m) => ({ default: m.CrmView }))
}

export function preloadOperationsView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/operations/OperationsView').then((m) => ({
    default: m.OperationsView,
  }))
}

export function preloadGovernanceView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/governance/GovernanceView').then((m) => ({
    default: m.GovernanceView,
  }))
}

export function preloadSecurityView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/security/SecurityView').then((m) => ({
    default: m.SecurityView,
  }))
}

export function preloadSpecialistsView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/specialists/SpecialistsView').then((m) => ({
    default: m.SpecialistsView,
  }))
}

export function preloadHiringView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/hiring/HiringView').then((m) => ({ default: m.HiringView }))
}

export function preloadPoliciesView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/policies/PoliciesView').then((m) => ({
    default: m.PoliciesView,
  }))
}

export function preloadSupportView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/support/SupportView').then((m) => ({
    default: m.SupportView,
  }))
}

export function preloadChatWidgetsView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/chatwidgets/ChatWidgetsView').then((m) => ({
    default: m.ChatWidgetsView,
  }))
}

/* The nav prefetch registries live in ./viewPrefetchRegistry — this module is
   reachable from the eager entry graph via appViews.tsx, so only the per-view
   thunk functions (which lazy() needs) belong here. */
