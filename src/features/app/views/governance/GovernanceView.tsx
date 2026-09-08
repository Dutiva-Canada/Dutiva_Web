import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { GovernanceDemoView } from './GovernanceDemoView'
import { GovernanceProductionView } from './GovernanceProductionView'

/**
 * Governance — lightweight corporate register (articles, by-laws, minutes,
 * decisions, officers, shareholders). Dispatches between demo fixtures and
 * real org-scoped persistence.
 */
export function GovernanceView() {
  const { mode } = useWorkspaceMode()

  if (mode === 'production') {
    return <GovernanceProductionView />
  }

  return <GovernanceDemoView />
}
