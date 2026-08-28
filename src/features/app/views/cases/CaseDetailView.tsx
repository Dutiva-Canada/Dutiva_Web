import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { CaseDetailDemoView } from './CaseDetailDemoView'
import { CaseDetailProductionView } from './CaseDetailProductionView'

/**
 * Case detail — port of the prototype's case workspace (markup 1791–1971,
 * `buildCaseDetail`): header with status chip + Ask Advisor, five tabs
 * (Overview / Risk review / Legal review / Activity log / Notes), the
 * overview two-column grid (summary, Advisor recommendation, risk
 * assessment, workflow, timeline · people, approvals, linked tasks,
 * documents, compliance flags), the six-axis risk review, the legal-review
 * record, the composed activity feed, and the private notes composer.
 * The tab bodies live in `caseDetailTabs.tsx`; this file owns all state.
 */

export function CaseDetailView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <CaseDetailProductionView />
  return <CaseDetailDemoView />
}
