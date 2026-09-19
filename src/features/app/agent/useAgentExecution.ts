import { useMemo } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import type { AgentToolExecution } from './types'

/**
 * The interactive execution context — built from the same workspace state
 * every write surface reads. Mode + membership role + org id travel with
 * the proposal into the executor, so the role gate sees exactly what the
 * signed-in user could do.
 */
export function useAgentExecution(): AgentToolExecution {
  const { mode, memberRole, organizationId } = useWorkspaceMode()
  return useMemo(
    () => ({ mode, role: memberRole, organizationId }),
    [mode, memberRole, organizationId],
  )
}
