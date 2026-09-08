import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { RevenueDemoView } from './RevenueDemoView'
import { RevenueProductionView } from './RevenueProductionView'

/**
 * Revenue workspace dispatch shell. Tracks recurring and one-time revenue
 * streams plus customer invoices — a lightweight billing cockpit, not an
 * accounting ledger.
 */
export function RevenueView() {
  const { mode } = useWorkspaceMode()

  if (mode === 'production') {
    return <RevenueProductionView />
  }

  return <RevenueDemoView />
}
