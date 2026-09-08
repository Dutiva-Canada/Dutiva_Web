import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsMetric } from './types'
import { initialCommsState } from './fixtures'
import {
  addMetric as addMetricApi,
  listMetrics as listMetricsApi,
  removeMetric as removeMetricApi,
} from './metricsApi'

export interface UseMetricsResult {
  metrics: CommsMetric[]
  loading: boolean
  canWrite: boolean
  addMetric: (item: Omit<CommsMetric, 'id'>) => Promise<CommsMetric | null>
  removeMetric: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useMetrics(): UseMetricsResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [metrics, setMetrics] = useState<CommsMetric[]>(initialCommsState.metrics)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setMetrics(initialCommsState.metrics)
      return
    }
    setLoading(true)
    try {
      const data = await listMetricsApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load metrics', 'info')
        return []
      })
      setMetrics(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addMetric = useCallback(
    async (item: Omit<CommsMetric, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addMetricApi(organizationId!, item)
        setMetrics((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add metric', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeMetric = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeMetricApi(organizationId!, id)
        setMetrics((prev) => prev.filter((m) => m.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove metric', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    metrics,
    loading,
    canWrite: isProduction,
    addMetric,
    removeMetric,
    refresh: load,
  }
}
