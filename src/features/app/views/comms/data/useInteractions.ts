import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsInteraction } from './types'
import { initialCommsState } from './fixtures'
import {
  addInteraction as addInteractionApi,
  listInteractions as listInteractionsApi,
  removeInteraction as removeInteractionApi,
  updateInteraction as updateInteractionApi,
} from './interactionsApi'

export interface UseInteractionsResult {
  interactions: CommsInteraction[]
  loading: boolean
  canWrite: boolean
  addInteraction: (item: Omit<CommsInteraction, 'id'>) => Promise<CommsInteraction | null>
  updateInteraction: (id: string, patch: Partial<CommsInteraction>) => Promise<CommsInteraction | null>
  removeInteraction: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useInteractions(): UseInteractionsResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [interactions, setInteractions] = useState<CommsInteraction[]>(initialCommsState.interactions)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setInteractions(initialCommsState.interactions)
      return
    }
    setLoading(true)
    try {
      const data = await listInteractionsApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load interactions', 'info')
        return []
      })
      setInteractions(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addInteraction = useCallback(
    async (item: Omit<CommsInteraction, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addInteractionApi(organizationId!, item)
        setInteractions((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add interaction', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const updateInteraction = useCallback(
    async (id: string, patch: Partial<CommsInteraction>) => {
      if (!isProduction) return null
      try {
        const updated = await updateInteractionApi(organizationId!, id, patch)
        if (updated) {
          setInteractions((prev) => prev.map((i) => (i.id === id ? updated : i)))
        }
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update interaction', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeInteraction = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeInteractionApi(organizationId!, id)
        setInteractions((prev) => prev.filter((i) => i.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove interaction', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    interactions,
    loading,
    canWrite: isProduction,
    addInteraction,
    updateInteraction,
    removeInteraction,
    refresh: load,
  }
}
