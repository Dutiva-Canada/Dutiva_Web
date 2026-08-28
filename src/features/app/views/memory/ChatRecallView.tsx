import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ChatRecallDemoView } from './ChatRecallDemoView'
import { ChatRecallProductionView } from './ChatRecallProductionView'

/**
 * Chat recall (`Advisor Memory.dc.html` CHAT surface): the "Resumed from…"
 * system pill, inline memory highlights (gold underline; the title carries
 * the provenance), the "Memory used in this answer" accordion with per-fact
 * Correct actions, and the "What I know" rail — recall is always sourced and
 * correctable. Sending here continues the conversation in the Advisor view.
 *
 * Production mode lists thread-scoped facts only (no RECALL_TURNS transcript).
 */

export function ChatRecallView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <ChatRecallProductionView />
  return <ChatRecallDemoView />
}
