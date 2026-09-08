import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { Bi } from '@/i18n/core'
import type { CommsContentItem, CommsExecutionAction } from './types'
import { initialCommsState } from './fixtures'
import {
  addContentItem as addContentItemApi,
  listContentItems as listContentItemsApi,
  removeContentItem as removeContentItemApi,
  transitionDeliveryStatus as transitionDeliveryStatusApi,
  updateContentItem as updateContentItemApi,
} from './contentItemsApi'

export interface UseContentItemsResult {
  contentItems: CommsContentItem[]
  loading: boolean
  canWrite: boolean
  addContentItem: (item: Omit<CommsContentItem, 'id'>) => Promise<CommsContentItem | null>
  updateContentItem: (id: string, patch: Partial<CommsContentItem>) => Promise<CommsContentItem | null>
  removeContentItem: (id: string) => Promise<void>
  transitionDeliveryStatus: (id: string, action: CommsExecutionAction, note?: Bi) => Promise<CommsContentItem | null>
  refresh: () => Promise<void>
}

export function useContentItems(): UseContentItemsResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [contentItems, setContentItems] = useState<CommsContentItem[]>(initialCommsState.contentItems)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setContentItems(initialCommsState.contentItems)
      return
    }
    setLoading(true)
    try {
      const data = await listContentItemsApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load content items', 'info')
        return []
      })
      setContentItems(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addContentItem = useCallback(
    async (item: Omit<CommsContentItem, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addContentItemApi(organizationId!, item)
        setContentItems((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add content item', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const updateContentItem = useCallback(
    async (id: string, patch: Partial<CommsContentItem>) => {
      if (!isProduction) return null
      try {
        const updated = await updateContentItemApi(organizationId!, id, patch)
        if (updated) {
          setContentItems((prev) => prev.map((c) => (c.id === id ? updated : c)))
        }
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update content item', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeContentItem = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeContentItemApi(organizationId!, id)
        setContentItems((prev) => prev.filter((c) => c.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove content item', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  const transitionDeliveryStatus = useCallback(
    async (id: string, action: CommsExecutionAction, note?: Bi) => {
      if (!isProduction) return null
      try {
        const updated = await transitionDeliveryStatusApi(organizationId!, id, action, note)
        if (updated) {
          setContentItems((prev) => prev.map((c) => (c.id === id ? updated : c)))
        }
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to transition delivery status', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    contentItems,
    loading,
    canWrite: isProduction,
    addContentItem,
    updateContentItem,
    removeContentItem,
    transitionDeliveryStatus,
    refresh: load,
  }
}
