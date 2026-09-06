import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { CommsDemoView } from './CommsDemoView'
import { CommsProductionView } from './CommsProductionView'

/**
 * Communications workspace dispatch shell. The existing `/app/communications`
 * module remains the HR internal-communications register; this route is a
 * distinct planning-and-coordination workspace for PR, marketing, public
 * affairs, social, advertising and IMC.
 */
export function CommsView() {
  const { mode } = useWorkspaceMode()
  if (mode === 'production') {
    return <CommsProductionView />
  }
  return <CommsDemoView />
}
