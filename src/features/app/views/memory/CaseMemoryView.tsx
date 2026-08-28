import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { CaseMemoryDemoView } from './CaseMemoryDemoView'
import { CaseMemoryProductionView } from './CaseMemoryProductionView'

/**
 * Case memory (`Advisor Memory.dc.html` CASE surface): the "Picking up where
 * you left off" resume banner, the running case-memory summary with what
 * changed while away, the held facts, the session timeline with dashed gaps,
 * and the "What I know" rail with the memory ≠ this-turn's-analysis note.
 *
 * Production mode uses CaseMemoryProductionView (persisted narratives +
 * timeline from migration 0087, plus governed facts).
 */

export function CaseMemoryView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <CaseMemoryProductionView />
  return <CaseMemoryDemoView />
}
