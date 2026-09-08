import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsCoverageItem } from './types'
import { initialCommsState } from './fixtures'
import {
  addCoverageItem as addCoverageItemApi,
  listCoverageItems as listCoverageItemsApi,
  removeCoverageItem as removeCoverageItemApi,
  updateCoverageItem as updateCoverageItemApi,
} from './coverageApi'

export interface UseCoverageResult {
  coverageItems: CommsCoverageItem[]
  loading: boolean
  canWrite: boolean
  addCoverageItem: (item: Omit<CommsCoverageItem, 'id'>) => Promise<CommsCoverageItem | null>
  updateCoverageItem: (id: string, patch: Partial<CommsCoverageItem>) => Promise<CommsCoverageItem | null>
  removeCoverageItem: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useCoverage(): UseCoverageResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [coverageItems, setCoverageItems] = useState<CommsCoverageItem[]>(initialCommsState.coverageItems)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setCoverageItems(initialCommsState.coverageItems)
      return
    }
    setLoading(true)
    try {
      const data = await listCoverageItemsApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load coverage items', 'info')
        return []
      })
      setCoverageItems(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addCoverageItem = useCallback(
    async (item: Omit<CommsCoverageItem, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addCoverageItemApi(organizationId!, item)
        setCoverageItems((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add coverage item', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const updateCoverageItem = useCallback(
    async (id: string, patch: Partial<CommsCoverageItem>) => {
      if (!isProduction) return null
      try {
        const updated = await updateCoverageItemApi(organizationId!, id, patch)
        if (updated) {
          setCoverageItems((prev) => prev.map((c) => (c.id === id ? updated : c)))
        }
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update coverage item', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeCoverageItem = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeCoverageItemApi(organizationId!, id)
        setCoverageItems((prev) => prev.filter((c) => c.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove coverage item', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    coverageItems,
    loading,
    canWrite: isProduction,
    addCoverageItem,
    updateCoverageItem,
    removeCoverageItem,
    refresh: load,
  }
}
