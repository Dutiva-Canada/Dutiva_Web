import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { WellbeingDemoView } from './WellbeingDemoView'
import { WellbeingProductionView } from './WellbeingProductionView'

/**
 * Wellbeing & support view — support signals with explicitly non-diagnostic
 * framing: the usage-limits banner, signal cards (source · confidence ·
 * sensitivity), recommended supportive actions, and the "Handle with care"
 * check-in rail. Port of the prototype's `isWellbeingView` markup +
 * `buildWellbeingView()` / `askAboutWellbeing()` (App v2.dc.html).
 *
 * Production renders a register of the support the employer offers
 * (WellbeingProductionView, public.hr_wellbeing_initiatives). **The signals
 * below do not cross over, and that is the design** — they are inferred
 * health information about named people, which is the one thing Ring 2 is
 * built not to record. See migration 0041's header.
 */
export function WellbeingView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <WellbeingProductionView />
  return <WellbeingDemoView />
}
