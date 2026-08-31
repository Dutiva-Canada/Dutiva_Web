import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { EmployeesDemoView } from './EmployeesDemoView'
import { EmployeesProductionView } from './EmployeesProductionView'

/**
 * Employees roster — the prototype's `isEmployeesView` markup (App
 * v2.dc.html, 869–988) + `buildEmployeesView()` (3316–3327): a People/Org
 * chart segmented control, the name/role/jurisdiction filter, the roster table
 * (stacked cards on phones), per-row status chips and the gold "Ask Advisor"
 * spark that opens the contextual rail. Rows open the profile route.
 *
 * First module off the route-level ModeGate: production renders the real
 * roster (EmployeesProductionView, public.employees) instead of the
 * Northgate fixtures below.
 */
export function EmployeesView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <EmployeesProductionView />
  return <EmployeesDemoView />
}
