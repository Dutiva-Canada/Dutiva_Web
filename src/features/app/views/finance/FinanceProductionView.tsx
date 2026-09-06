import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { FinanceDataProvider } from './data/FinanceDataProvider'
import { FinanceLayout } from './FinanceLayout'

/**
 * Production-mode finance workspace. State is persisted to Supabase
 * (`finance_*` tables, org-scoped by RLS) when the Supabase client is
 * configured; otherwise it falls back to a localStorage stub for local
 * development without env vars. Sensitive payroll tables are admin-only
 * at the RLS level; the UI also gates visibility via `memberRole`.
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
