import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { SecurityDataProvider } from './SecurityDataProvider'
import { SecurityLayout } from './SecurityLayout'

/**
 * Production-mode security workspace. Loads real org-scoped data through the
 * SecurityDataProvider.
 */
export function SecurityProductionView() {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.sec_title)} />
  }

  return (
    <SecurityDataProvider mode="production">
      <SecurityLayout />
    </SecurityDataProvider>
  )
}
