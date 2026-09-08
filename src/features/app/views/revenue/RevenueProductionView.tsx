import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useI18n } from '@/i18n/context'
import { revenueMessages as M } from '@/i18n/messages/revenue'
import { RevenueDataProvider } from './RevenueDataProvider'
import { RevenueLayout } from './RevenueLayout'

/**
 * Production-mode revenue workspace. Loads real org-scoped data through the
 * RevenueDataProvider.
 */
export function RevenueProductionView() {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.rev_title)} />
  }

  return (
    <RevenueDataProvider mode="production">
      <RevenueLayout />
    </RevenueDataProvider>
  )
}
