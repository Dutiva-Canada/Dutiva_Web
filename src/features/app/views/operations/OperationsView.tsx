import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { OperationsDemoView } from './OperationsDemoView'
import { OperationsProductionView } from './OperationsProductionView'

/**
 * Operations workspace dispatch shell. A command register, not an ERP.
 */
export function OperationsView() {
  const { mode } = useWorkspaceMode()

  if (mode === 'production') {
    return <OperationsProductionView />
  }

  return <OperationsDemoView />
}
