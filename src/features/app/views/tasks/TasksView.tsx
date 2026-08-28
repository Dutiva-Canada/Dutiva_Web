import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { TasksDemoView } from './TasksDemoView'
import { TasksProductionView } from './TasksProductionView'

/**
 * Tasks view — the Advisor-generated checklist (prototype `buildTasksView()`
 * + tasks markup, App v2.dc.html lines 1125–1152). Each row: done toggle,
 * clickable body that opens the linked Advisor conversation, and status +
 * priority chips. Toggling only flips local done state (prototype
 * `toggleTask()` — no toast).
 *
 * Production renders the real checklist (TasksProductionView, the backend's
 * public.compliance_tasks) instead of the Northgate fixtures below.
 */
export function TasksView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <TasksProductionView />
  return <TasksDemoView />
}
