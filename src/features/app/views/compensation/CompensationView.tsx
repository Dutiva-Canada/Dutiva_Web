import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { CompensationDemoView } from './CompensationDemoView'
import { CompensationProductionView } from './CompensationProductionView'

/**
 * Compensation view — restricted-module banner, payroll stat tiles, the
 * changes & approvals pipeline, the internal pay-band equity card, and the
 * per-employee compensation overview (table on desktop/tablet, row cards on
 * mobile). Port of the prototype's `isCompensationView` markup +
 * `buildCompensationView()` / `askAboutComp()` (App v2.dc.html).
 *
 * Production renders the real records (CompensationProductionView,
 * public.hr_compensation_records) instead of the Northgate fixtures below.
 * The fixture `market` figure has no production counterpart on purpose —
 * see the production view's header.
 */
export function CompensationView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <CompensationProductionView />
  return <CompensationDemoView />
}
