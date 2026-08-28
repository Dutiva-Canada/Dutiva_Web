import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { MemoryManagerDemoView } from './MemoryManagerDemoView'
import { MemoryManagerProductionView } from './MemoryManagerProductionView'

/**
 * Memory manager (`Advisor Memory.dc.html` MANAGER surface): the inferred-
 * review banner, filter tabs with live counts, memory search, the governed
 * rows with scope tags, and the governance rail (retention, lawful basis,
 * audit log, export / forget-everything).
 *
 * Production mode uses MemoryManagerProductionView (hr_advisor_memory_facts).
 */

export function MemoryManagerView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <MemoryManagerProductionView />
  return <MemoryManagerDemoView />
}
