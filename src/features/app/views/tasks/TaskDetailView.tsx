import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { TaskDetailDemoView } from './TaskDetailDemoView'
import { TaskDetailProductionView } from './TaskDetailProductionView'

/**
 * Task detail — /app/planning/tasks/:taskId. Header (title, status, priority,
 * due/owner/jurisdiction, linked record), the Advisor-authored work plan
 * (fixture `detail` in demo; compliance_tasks.description in production,
 * draftable on demand), and user notes (per-device in demo; metadata.notes in
 * production).
 */
export function TaskDetailView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <TaskDetailProductionView />
  return <TaskDetailDemoView />
}
