import { useCallback, useEffect, useMemo, useState } from 'react'
import { CommsDataContext } from './CommsDataContext'
import type { CommsDataContextValue } from './CommsDataContext'
import { initialCommsState } from './fixtures'
import {
  addApproval as addApprovalApi,
  addBrandClaim as addBrandClaimApi,
  addContentItem as addContentItemApi,
  addCoverageItem as addCoverageItemApi,
  addFeed as addFeedApi,
  addInitiative as addInitiativeApi,
  addSource as addSourceApi,
  addSubmission as addSubmissionApi,
  loadFullState as loadFullStateApi,
  recordManualReceipt as recordManualReceiptApi,
  removeApproval as removeApprovalApi,
  removeBrandClaim as removeBrandClaimApi,
  removeContentItem as removeContentItemApi,
  removeCoverageItem as removeCoverageItemApi,
  removeFeed as removeFeedApi,
  removeInitiative as removeInitiativeApi,
  removeSource as removeSourceApi,
  removeSubmission as removeSubmissionApi,
  syncAllFeeds as syncAllFeedsApi,
  syncFeed as syncFeedApi,
  toggleInitiativePause as toggleInitiativePauseApi,
  transitionDeliveryStatus as transitionDeliveryStatusApi,
  transitionSubmissionStatus as transitionSubmissionStatusApi,
  updateBrandClaim as updateBrandClaimApi,
  updateContentItem as updateContentItemApi,
  updateCoverageItem as updateCoverageItemApi,
  updateFeed as updateFeedApi,
  updateInitiative as updateInitiativeApi,
  updateSource as updateSourceApi,
  updateSubmission as updateSubmissionApi,
} from './productionApi'
import type {
  CommsApproval,
  CommsBrandClaim,
  CommsContentItem,
  CommsCoverageItem,
  CommsExecutionAction,
  CommsFeed,
  CommsInitiative,
  CommsSource,
  CommsSubmission,
} from './types'

function useCommsDataValue(orgId: string | undefined): CommsDataContextValue {
  const isLive = orgId != null && orgId !== ''
  const [state, setState] = useState(() => (isLive ? loadFullStateApi(orgId) : initialCommsState))

  const addInitiative = useCallback(
    (item: Omit<CommsInitiative, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addInitiativeApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const updateInitiative = useCallback(
    (id: string, patch: Partial<CommsInitiative>) => {
      if (!isLive || !orgId) return null
      const updated = updateInitiativeApi(orgId, id, patch)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const removeInitiative = useCallback(
    (id: string) => {
      if (!isLive || !orgId) return
      removeInitiativeApi(orgId, id)
      setState(loadFullStateApi(orgId))
    },
    [isLive, orgId],
  )

  const addContentItem = useCallback(
    (item: Omit<CommsContentItem, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addContentItemApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const updateContentItem = useCallback(
    (id: string, patch: Partial<CommsContentItem>) => {
      if (!isLive || !orgId) return null
      const updated = updateContentItemApi(orgId, id, patch)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const removeContentItem = useCallback(
    (id: string) => {
      if (!isLive || !orgId) return
      removeContentItemApi(orgId, id)
      setState(loadFullStateApi(orgId))
    },
    [isLive, orgId],
  )

  const transitionDeliveryStatus = useCallback(
    (contentItemId: string, action: CommsExecutionAction, actor: string, note?: string) => {
      if (!isLive || !orgId) return null
      const updated = transitionDeliveryStatusApi(orgId, contentItemId, action, actor, note)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const recordManualReceipt = useCallback(
    (contentItemId: string, actor: string, note?: string) => {
      if (!isLive || !orgId) return null
      const updated = recordManualReceiptApi(orgId, contentItemId, actor, note)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const toggleInitiativePause = useCallback(
    (initiativeId: string, paused: boolean, actor: string) => {
      if (!isLive || !orgId) return null
      const updated = toggleInitiativePauseApi(orgId, initiativeId, paused, actor)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const addSource = useCallback(
    (item: Omit<CommsSource, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addSourceApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const updateSource = useCallback(
    (id: string, patch: Partial<CommsSource>) => {
      if (!isLive || !orgId) return null
      const updated = updateSourceApi(orgId, id, patch)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const removeSource = useCallback(
    (id: string) => {
      if (!isLive || !orgId) return
      removeSourceApi(orgId, id)
      setState(loadFullStateApi(orgId))
    },
    [isLive, orgId],
  )

  const addFeed = useCallback(
    (item: Omit<CommsFeed, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addFeedApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const updateFeed = useCallback(
    (id: string, patch: Partial<CommsFeed>) => {
      if (!isLive || !orgId) return null
      const updated = updateFeedApi(orgId, id, patch)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const removeFeed = useCallback(
    (id: string) => {
      if (!isLive || !orgId) return
      removeFeedApi(orgId, id)
      setState(loadFullStateApi(orgId))
    },
    [isLive, orgId],
  )

  const syncFeed = useCallback(
    async (feedId: string) => {
      if (!isLive || !orgId) return { added: 0, error: 'Not in production mode' }
      const result = await syncFeedApi(orgId, feedId)
      setState(loadFullStateApi(orgId))
      return result
    },
    [isLive, orgId],
  )

  const syncAllFeeds = useCallback(
    async () => {
      if (!isLive || !orgId) return []
      const results = await syncAllFeedsApi(orgId)
      setState(loadFullStateApi(orgId))
      return results
    },
    [isLive, orgId],
  )

  useEffect(() => {
    if (!isLive || !orgId) return undefined
    const run = async () => {
      await syncAllFeedsApi(orgId)
      setState(loadFullStateApi(orgId))
    }
    run()
    const id = setInterval(run, 15 * 60 * 1000)
    return () => clearInterval(id)
  }, [isLive, orgId])

  const addCoverageItem = useCallback(
    (item: Omit<CommsCoverageItem, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addCoverageItemApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const updateCoverageItem = useCallback(
    (id: string, patch: Partial<CommsCoverageItem>) => {
      if (!isLive || !orgId) return null
      const updated = updateCoverageItemApi(orgId, id, patch)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const removeCoverageItem = useCallback(
    (id: string) => {
      if (!isLive || !orgId) return
      removeCoverageItemApi(orgId, id)
      setState(loadFullStateApi(orgId))
    },
    [isLive, orgId],
  )

  const addSubmission = useCallback(
    (item: Omit<CommsSubmission, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addSubmissionApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const updateSubmission = useCallback(
    (id: string, patch: Partial<CommsSubmission>) => {
      if (!isLive || !orgId) return null
      const updated = updateSubmissionApi(orgId, id, patch)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const removeSubmission = useCallback(
    (id: string) => {
      if (!isLive || !orgId) return
      removeSubmissionApi(orgId, id)
      setState(loadFullStateApi(orgId))
    },
    [isLive, orgId],
  )

  const transitionSubmissionStatus = useCallback(
    (id: string, nextStatus: import('./types').CommsSubmissionStatus, actor = 'Workspace user') => {
      if (!isLive || !orgId) return null
      const updated = transitionSubmissionStatusApi(orgId, id, nextStatus, actor)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const addBrandClaim = useCallback(
    (item: Omit<CommsBrandClaim, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addBrandClaimApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const updateBrandClaim = useCallback(
    (id: string, patch: Partial<CommsBrandClaim>) => {
      if (!isLive || !orgId) return null
      const updated = updateBrandClaimApi(orgId, id, patch)
      if (updated) setState(loadFullStateApi(orgId))
      return updated
    },
    [isLive, orgId],
  )

  const removeBrandClaim = useCallback(
    (id: string) => {
      if (!isLive || !orgId) return
      removeBrandClaimApi(orgId, id)
      setState(loadFullStateApi(orgId))
    },
    [isLive, orgId],
  )

  const addApproval = useCallback(
    (item: Omit<CommsApproval, 'id'>) => {
      if (!isLive || !orgId) return null
      const created = addApprovalApi(orgId, item)
      setState(loadFullStateApi(orgId))
      return created
    },
    [isLive, orgId],
  )

  const removeApproval = useCallback(
    (id: string) => {
      if (!isLive || !orgId) return
      removeApprovalApi(orgId, id)
      setState(loadFullStateApi(orgId))
    },
    [isLive, orgId],
  )

  return useMemo(
    () => ({
      state,
      canWrite: isLive,
      addInitiative,
      updateInitiative,
      removeInitiative,
      addContentItem,
      updateContentItem,
      removeContentItem,
      transitionDeliveryStatus,
      recordManualReceipt,
      toggleInitiativePause,
      addSource,
      updateSource,
      removeSource,
      addFeed,
      updateFeed,
      removeFeed,
      syncFeed,
      syncAllFeeds,
      addCoverageItem,
      updateCoverageItem,
      removeCoverageItem,
      addSubmission,
      updateSubmission,
      transitionSubmissionStatus,
      removeSubmission,
      addBrandClaim,
      updateBrandClaim,
      removeBrandClaim,
      addApproval,
      removeApproval,
    }),
    [
      state,
      isLive,
      addInitiative,
      updateInitiative,
      removeInitiative,
      addContentItem,
      updateContentItem,
      removeContentItem,
      transitionDeliveryStatus,
      recordManualReceipt,
      toggleInitiativePause,
      addSource,
      updateSource,
      removeSource,
      addFeed,
      updateFeed,
      removeFeed,
      syncFeed,
      syncAllFeeds,
      addCoverageItem,
      updateCoverageItem,
      removeCoverageItem,
      addSubmission,
      updateSubmission,
      transitionSubmissionStatus,
      removeSubmission,
      addBrandClaim,
      updateBrandClaim,
      removeBrandClaim,
      addApproval,
      removeApproval,
    ],
  )
}

export function CommsDataProvider({
  children,
  mode,
  orgId,
}: {
  children: React.ReactNode
  mode: 'demo' | 'production'
  orgId?: string
}) {
  const value = useCommsDataValue(mode === 'production' ? orgId : undefined)
  return <CommsDataContext.Provider value={value}>{children}</CommsDataContext.Provider>
}
