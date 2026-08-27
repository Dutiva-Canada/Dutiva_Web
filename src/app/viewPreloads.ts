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
  return import('@/features/app/views/advisor/AdvisorView').then((m) => ({ default: m.AdvisorView }))
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

export function preloadWellbeingView(): Promise<ViewDefaultExport> {
  return import('@/features/app/views/wellbeing/WellbeingView').then((m) => ({
    default: m.WellbeingView,
  }))
}

export function preloadPlanningView() {
  return Promise.all([
    import('@/features/app/views/planning/PlanningLayout'),
    import('@/features/app/views/tasks/TasksView'),
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

/** Keys match navConfig `NavItem.key` for sidebar prefetch. */
export const workspaceViewPreloads: Record<string, () => Promise<unknown>> = {
  home: preloadHomeView,
  advisor: preloadAdvisorView,
  workflows: preloadWorkflowsView,
  employees: preloadEmployeesView,
  cases: preloadCasesView,
  documents: preloadDocumentsView,
  knowledge: preloadKnowledgeView,
  compliance: preloadComplianceView,
  compensation: preloadCompensationView,
  communications: preloadCommunicationsView,
  wellbeing: preloadWellbeingView,
  planning: preloadPlanningView,
  analytics: preloadAnalyticsView,
  settings: preloadSettingsView,
}
