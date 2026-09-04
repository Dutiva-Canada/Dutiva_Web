import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { HiringDemoView } from './HiringDemoView'
import { HiringProductionView } from './HiringProductionView'

/**
 * Hiring module — evidence-based recruitment system.
 *
 * Main view with tabs for Candidates, Funnel analytics, and Job postings.
 * Dispatches to demo (Northgate fixtures) or production (Supabase) based on
 * workspace mode.
 */
export function HiringView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <HiringProductionView />
  return <HiringDemoView />
}
