import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { EmployeeProfileDemoView } from './EmployeeProfileDemoView'
import { EmployeeProfileProductionView } from './EmployeeProfileProductionView'

/**
 * Employee profile hub — the prototype's `isProfileView` markup (App
 * v2.dc.html, 1436–1622) + `buildProfileView()` (4202–4267): identity
 * header, eight tabs (three restricted), the auto-composed timeline, the
 * document shelf, leave & accommodation records, compensation, wellbeing
 * support signals, related compliance flags and linked cases. The tab
 * panels live in `employeeProfileTabs.tsx`; this file owns state + effects.
 */

export function EmployeeProfileView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <EmployeeProfileProductionView />
  return <EmployeeProfileDemoView />
}
