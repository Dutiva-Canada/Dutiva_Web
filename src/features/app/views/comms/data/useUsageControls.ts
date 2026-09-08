import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsUsageControls } from './types'
import { initialCommsState } from './fixtures'
import {
  getUsageControls as getUsageControlsApi,
  updateUsageControls as updateUsageControlsApi,
} from './usageControlsApi'

export interface UseUsageControlsResult {
  usageControls: CommsUsageControls
  loading: boolean
  canWrite: boolean
  updateUsageControls: (item: CommsUsageControls) => Promise<CommsUsageControls | null>
  refresh: () => Promise<void>
}

export function useUsageControls(): UseUsageControlsResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [usageControls, setUsageControls] = useState<CommsUsageControls>(initialCommsState.usageControls)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setUsageControls(initialCommsState.usageControls)
      return
    }
    setLoading(true)
    try {
      const data = await getUsageControlsApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load usage controls', 'info')
        return null
      })
      setUsageControls(data ?? initialCommsState.usageControls)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const updateUsageControls = useCallback(
    async (item: CommsUsageControls) => {
      if (!isProduction) return null
      try {
        const updated = await updateUsageControlsApi(organizationId!, item)
        setUsageControls(updated)
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update usage controls', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    usageControls,
    loading,
    canWrite: isProduction,
    updateUsageControls,
    refresh: load,
  }
}
