import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { SecurityDemoView } from './SecurityDemoView'
import { SecurityProductionView } from './SecurityProductionView'

/**
 * Security workspace dispatch shell. Tracks assets, access reviews, incidents,
 * risks, and vendor reviews — a governance cockpit, not a scanner.
 */
export function SecurityView() {
  const { mode } = useWorkspaceMode()

  if (mode === 'production') {
    return <SecurityProductionView />
  }

  return <SecurityDemoView />
}
