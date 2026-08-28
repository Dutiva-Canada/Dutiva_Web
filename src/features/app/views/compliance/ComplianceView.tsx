import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ComplianceDemoView } from './ComplianceDemoView'
import { ComplianceProductionView } from './ComplianceProductionView'

/** Category bar/score colours (prototype `scoreColor` / `fillStyle`). */

export function ComplianceView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <ComplianceProductionView />
  return <ComplianceDemoView />
}
