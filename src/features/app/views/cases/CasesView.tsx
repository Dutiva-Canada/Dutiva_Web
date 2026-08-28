import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { CasesDemoView } from './CasesDemoView'
import { CasesProductionView } from './CasesProductionView'

/**
 * Case Files list — port of the prototype's cases list (markup 1767–1789,
 * `buildCasesView`). Open-count header + New case button, then one card per
 * case with type/province/owner/opened meta, status chip, summary and a
 * step-progress bar. Rows navigate to /app/cases/:caseId.
 *
 * Production renders the real case files (CasesProductionView,
 * public.hr_cases) instead of the Northgate fixtures below.
 */
export function CasesView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <CasesProductionView />
  return <CasesDemoView />
}
