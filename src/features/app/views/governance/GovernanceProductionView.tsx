import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { GovernanceDataProvider } from './GovernanceDataProvider'
import { GovernanceLayout } from './GovernanceLayout'

/**
 * Production-mode governance workspace. Loads the real org-scoped register
 * through the GovernanceDataProvider.
 */
export function GovernanceProductionView() {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.gov_title)} />
  }

  return (
    <GovernanceDataProvider mode="production">
      <GovernanceLayout />
    </GovernanceDataProvider>
  )
}
