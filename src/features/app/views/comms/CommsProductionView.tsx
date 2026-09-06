import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { CommsDataProvider } from './data/CommsDataProvider'
import { CommsLayout } from './CommsLayout'

/**
 * Production-mode communications workspace. State is persisted to browser
 * localStorage in this first implementation; a Supabase-backed migration will
 * replace this once the data model and RLS policies are finalized.
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
