import { useMemo } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useHomeProductionStats } from '@/features/app/views/home/useHomeProductionStats'

/**
 * True when production mode has an org and zero records — used to soften the
 * sidebar (collapse Programs, show Getting started) without inventing a
 * separate empty-state fetch.
 */
export function useProductionWorkspaceEmpty(): boolean {
  const { mode, organizationId } = useWorkspaceMode()
  const { data, totalRecords, loading } = useHomeProductionStats()

  return useMemo(() => {
    if (mode !== 'production' || !organizationId) return false
    if (loading || data === null) return false
    return totalRecords === 0
  }, [mode, organizationId, loading, data, totalRecords])
}
