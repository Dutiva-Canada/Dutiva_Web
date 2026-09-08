import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsExecutionEvent } from './types'
import { initialCommsState } from './fixtures'
import {
  addExecutionEvent as addExecutionEventApi,
  listExecutionEvents as listExecutionEventsApi,
} from './executionEventsApi'

export interface UseExecutionEventsResult {
  executionEvents: CommsExecutionEvent[]
  loading: boolean
  canWrite: boolean
  addExecutionEvent: (item: Omit<CommsExecutionEvent, 'id'>) => Promise<CommsExecutionEvent | null>
  refresh: () => Promise<void>
}

export function useExecutionEvents(): UseExecutionEventsResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [executionEvents, setExecutionEvents] = useState<CommsExecutionEvent[]>(initialCommsState.executionEvents)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setExecutionEvents(initialCommsState.executionEvents)
      return
    }
    setLoading(true)
    try {
      const data = await listExecutionEventsApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load execution events', 'info')
        return []
      })
      setExecutionEvents(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addExecutionEvent = useCallback(
    async (item: Omit<CommsExecutionEvent, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addExecutionEventApi(organizationId!, item)
        setExecutionEvents((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add execution event', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    executionEvents,
    loading,
    canWrite: isProduction,
    addExecutionEvent,
    refresh: load,
  }
}
