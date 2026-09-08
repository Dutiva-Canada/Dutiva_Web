import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsFeed } from './types'
import { initialCommsState } from './fixtures'
import {
  addFeed as addFeedApi,
  listFeeds as listFeedsApi,
  removeFeed as removeFeedApi,
  syncAllFeeds as syncAllFeedsApi,
  syncFeed as syncFeedApi,
} from './feedsApi'
import type { FeedSyncResult } from './feedsApi'

export interface UseFeedsResult {
  feeds: CommsFeed[]
  loading: boolean
  canWrite: boolean
  addFeed: (item: Omit<CommsFeed, 'id'>) => Promise<CommsFeed | null>
  removeFeed: (id: string) => Promise<void>
  syncFeed: (feedId: string) => Promise<FeedSyncResult>
  syncAllFeeds: () => Promise<(FeedSyncResult & { feedId: string })[]>
  refresh: () => Promise<void>
}

export function useFeeds(): UseFeedsResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [feeds, setFeeds] = useState<CommsFeed[]>(initialCommsState.feeds)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setFeeds(initialCommsState.feeds)
      return
    }
    setLoading(true)
    try {
      const data = await listFeedsApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load feeds', 'info')
        return []
      })
      setFeeds(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addFeed = useCallback(
    async (item: Omit<CommsFeed, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addFeedApi(organizationId!, item)
        setFeeds((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add feed', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeFeed = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeFeedApi(organizationId!, id)
        setFeeds((prev) => prev.filter((f) => f.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove feed', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  const syncFeed = useCallback(
    async (feedId: string) => {
      if (!isProduction) return { added: 0, error: 'Not in production mode' }
      const result = await syncFeedApi(organizationId!, feedId)
      await load()
      return result
    },
    [isProduction, organizationId, load],
  )

  const syncAllFeeds = useCallback(async () => {
    if (!isProduction) return []
    const results = await syncAllFeedsApi(organizationId!)
    await load()
    return results
  }, [isProduction, organizationId, load])

  return {
    feeds,
    loading,
    canWrite: isProduction,
    addFeed,
    removeFeed,
    syncFeed,
    syncAllFeeds,
    refresh: load,
  }
}
