import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { JobPostingDetailDemoView } from './JobPostingDetailDemoView'
import { JobPostingDetailProductionView } from './JobPostingDetailProductionView'

/**
 * Job posting detail — dispatches to demo (Northgate fixtures) or production
 * (Supabase) based on workspace mode.
 */
export function JobPostingDetailView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <JobPostingDetailProductionView />
  return <JobPostingDetailDemoView />
}
