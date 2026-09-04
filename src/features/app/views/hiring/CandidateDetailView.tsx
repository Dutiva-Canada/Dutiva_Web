import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { CandidateDetailDemoView } from './CandidateDetailDemoView'
import { CandidateDetailProductionView } from './CandidateDetailProductionView'

/**
 * Candidate detail — dispatches to demo (Northgate fixtures) or production
 * (Supabase) based on workspace mode.
 *
 * Tabs: Overview / Evidence / Work Sample / Interview / Scores.
 */
export function CandidateDetailView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <CandidateDetailProductionView />
  return <CandidateDetailDemoView />
}
