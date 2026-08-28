import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { PersonMemoryDemoView } from './PersonMemoryDemoView'
import { PersonMemoryProductionView } from './PersonMemoryProductionView'

/**
 * Person memory (`Advisor Memory.dc.html` PERSON surface): profile header
 * (initials tile, name, status chips, Ask Advisor / Open case), the "What
 * Advisor remembers" intro, memory grouped by category, and the governance
 * rail (confidence legend, who-can-see, retention, lawful basis).
 *
 * Production mode uses PersonMemoryProductionView (real employees + facts).
 */

export function PersonMemoryView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <PersonMemoryProductionView />
  return <PersonMemoryDemoView />
}
