import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { CommsDataProvider } from './data/CommsDataProvider'
import { CommsLayout } from './CommsLayout'

/**
 * Production-mode communications workspace. State is loaded from and
 * persisted to Supabase via the domain-specific `*Api.ts` files.
 */
export function CommsProductionView() {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.comms_title)} />
  }

  return (
    <CommsDataProvider mode="production" orgId={organizationId}>
      <CommsLayout mode="production" />
    </CommsDataProvider>
  )
}
