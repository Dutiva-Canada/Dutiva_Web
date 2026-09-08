import { useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { initialCommsState } from './fixtures'
import { emptyCommsState, loadFullCommsState } from './commsStateLoader'
import type { CommsWorkspaceState } from './types'

/**
 * Read-only hook that loads the full comms workspace state from Supabase.
 *
 * Used by cross-module screens (e.g. revenue) that need comms initiatives and
 * content items for entity linking but don't need the full CRUD surface of
 * `CommsDataProvider`. In demo mode it returns the fixtures.
 */
export function useCommsState(): CommsWorkspaceState {
  const { mode, organizationId } = useWorkspaceMode()
  const isProduction = mode === 'production' && organizationId != null

  const [state, setState] = useState<CommsWorkspaceState>(() =>
    isProduction ? emptyCommsState : initialCommsState,
  )

  useEffect(() => {
    if (!isProduction || !organizationId) {
      setState(initialCommsState)
      return
    }
    loadFullCommsState(organizationId)
      .then(setState)
      .catch(() => {
        // keep current state on load failure
      })
  }, [isProduction, organizationId])

  return state
}
