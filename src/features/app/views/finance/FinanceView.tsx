import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { FinanceDemoView } from './FinanceDemoView'
import { FinanceProductionView } from './FinanceProductionView'

/**
 * Finance workspace dispatch shell. This route is a distinct
 * integration-led workspace for payroll, accounting, bookkeeping, budgets,
 * spend, savings, investments, financial planning, and tax planning. It
 * remains separate from the HR and communications workspaces.
 */
export function FinanceView() {
  const { mode } = useWorkspaceMode()
  if (mode === 'production') {
    return <FinanceProductionView />
  }
  return <FinanceDemoView />
}
