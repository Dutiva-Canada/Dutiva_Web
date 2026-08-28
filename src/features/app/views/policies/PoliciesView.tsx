import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { PoliciesDemoView } from './PoliciesDemoView'
import { PoliciesProductionView } from './PoliciesProductionView'

/**
 * Policies view — port of the prototype's policies register markup +
 * `buildPoliciesView()`: status rows (Up to date / Needs review / Missing)
 * with "Review with Advisor" opening the rail; the rail card's primary action
 * drafts the policy in Document Studio ("Draft it now" when Missing).
 *
 * Production renders the real register (PoliciesProductionView,
 * public.hr_policies) instead of the Northgate fixtures below.
 */
export function PoliciesView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <PoliciesProductionView />
  return <PoliciesDemoView />
}
