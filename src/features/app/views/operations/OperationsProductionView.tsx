import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { OperationsDataProvider } from './OperationsDataProvider'
import { OperationsLayout } from './OperationsLayout'

export function OperationsProductionView() {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.ops_title)} />
  }

  return (
    <OperationsDataProvider mode="production">
      <OperationsLayout />
    </OperationsDataProvider>
  )
}
