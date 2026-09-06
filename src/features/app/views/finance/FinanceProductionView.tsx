import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { FinanceDataProvider } from './data/FinanceDataProvider'
import { FinanceLayout } from './FinanceLayout'

/**
 * Production-mode finance workspace. State is persisted to browser
 * localStorage in this first implementation; a Supabase-backed migration
 * will replace this once the data model and RLS policies are finalized.
 */
export function FinanceProductionView() {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.finance_title)} />
  }

  return (
    <FinanceDataProvider mode="production" orgId={organizationId}>
      <FinanceLayout mode="production" />
    </FinanceDataProvider>
  )
}
