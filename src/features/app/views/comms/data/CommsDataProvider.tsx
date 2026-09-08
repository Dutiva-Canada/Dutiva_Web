import { useCallback, useEffect, useMemo, useState } from 'react'
import { CommsDataContext } from './CommsDataContext'
import type { CommsDataContextValue } from './CommsDataContext'
import { initialCommsState } from './fixtures'
import { emptyCommsState, loadFullCommsState, noteToBi } from './commsStateLoader'
import { useAddCallback, useRemoveCallback, useUpdateCallback } from './commsCrudFactory'
import type { CommsWorkspaceState } from './types'

import {
  addInitiative as addInitiativeApi,
  removeInitiative as removeInitiativeApi,
  updateInitiative as updateInitiativeApi,
} from './initiativesApi'
import {
  addContentItem as addContentItemApi,
  removeContentItem as removeContentItemApi,
  transitionDeliveryStatus as transitionDeliveryStatusApi,
  updateContentItem as updateContentItemApi,
} from './contentItemsApi'
import {
  addContact as addContactApi,
  addOrganization as addOrganizationApi,
  removeContact as removeContactApi,
  removeOrganization as removeOrganizationApi,
  updateContact as updateContactApi,
  updateOrganization as updateOrganizationApi,
} from './stakeholdersApi'
import {
  addCoverageItem as addCoverageItemApi,
  removeCoverageItem as removeCoverageItemApi,
  updateCoverageItem as updateCoverageItemApi,
} from './coverageApi'
import {
  addSource as addSourceApi,
  removeSource as removeSourceApi,
  updateSource as updateSourceApi,
} from './sourcesApi'
import {
  addFeed as addFeedApi,
  removeFeed as removeFeedApi,
  syncAllFeeds as syncAllFeedsApi,
  syncFeed as syncFeedApi,
  updateFeed as updateFeedApi,
} from './feedsApi'
import type { FeedSyncResult } from './feedsApi'
import {
  addSubmission as addSubmissionApi,
  removeSubmission as removeSubmissionApi,
  updateSubmission as updateSubmissionApi,
} from './submissionsApi'
import {
  addApproval as addApprovalApi,
  removeApproval as removeApprovalApi,
} from './approvalsApi'
import {
  addBrandClaim as addBrandClaimApi,
  removeBrandClaim as removeBrandClaimApi,
  updateBrandClaim as updateBrandClaimApi,
} from './brandClaimsApi'
import {
  addInteraction as addInteractionApi,
  removeInteraction as removeInteractionApi,
  updateInteraction as updateInteractionApi,
} from './interactionsApi'
import {
  addIssue as addIssueApi,
  removeIssue as removeIssueApi,
  updateIssue as updateIssueApi,
} from './issuesApi'
import {
  addMetric as addMetricApi,
  removeMetric as removeMetricApi,
} from './metricsApi'
import {
  addObjective as addObjectiveApi,
  removeObjective as removeObjectiveApi,
  updateObjective as updateObjectiveApi,
} from './objectivesApi'
import {
  addPolicyFile as addPolicyFileApi,
  removePolicyFile as removePolicyFileApi,
} from './policyFilesApi'
import {
  addIntegration as addIntegrationApi,
  removeIntegration as removeIntegrationApi,
  updateIntegration as updateIntegrationApi,
} from './integrationsApi'
import { updateUsageControls as updateUsageControlsApi } from './usageControlsApi'
import type {
  CommsApproval,
  CommsExecutionAction,
  CommsInitiative,
  CommsMetric,
  CommsSubmission,
  CommsSubmissionStatus,
  CommsUsageControls,
} from './types'

function useCommsDataValue(orgId: string | undefined): CommsDataContextValue {
  const isLive = orgId != null && orgId !== ''
  const [state, setState] = useState<CommsWorkspaceState>(() =>
    isLive ? emptyCommsState : initialCommsState,
  )

  const refresh = useCallback(async () => {
    if (!isLive || !orgId) return
    try {
      setState(await loadFullCommsState(orgId))
    } catch {
      // keep current state on load failure
    }
  }, [isLive, orgId])

  useEffect(() => {
    if (!isLive || !orgId) {
      setState(initialCommsState)
      return
    }
    refresh()
  }, [isLive, orgId, refresh])

  // --- Simple CRUD via factory (no side effects) ---------------------------

  const addContact = useAddCallback(orgId, isLive, setState, 'contacts', addContactApi)
  const updateContact = useUpdateCallback(orgId, isLive, setState, 'contacts', updateContactApi)
  const removeContact = useRemoveCallback(orgId, isLive, setState, 'contacts', removeContactApi)

  const addOrganization = useAddCallback(orgId, isLive, setState, 'organizations', addOrganizationApi)
  const updateOrganization = useUpdateCallback(orgId, isLive, setState, 'organizations', updateOrganizationApi)
  const removeOrganization = useRemoveCallback(orgId, isLive, setState, 'organizations', removeOrganizationApi)

  const addInteraction = useAddCallback(orgId, isLive, setState, 'interactions', addInteractionApi)
  const updateInteraction = useUpdateCallback(orgId, isLive, setState, 'interactions', updateInteractionApi)
  const removeInteraction = useRemoveCallback(orgId, isLive, setState, 'interactions', removeInteractionApi)

  const addSource = useAddCallback(orgId, isLive, setState, 'sources', addSourceApi)
  const updateSource = useUpdateCallback(orgId, isLive, setState, 'sources', updateSourceApi)
  const removeSource = useRemoveCallback(orgId, isLive, setState, 'sources', removeSourceApi)

  const addFeed = useAddCallback(orgId, isLive, setState, 'feeds', addFeedApi)
  const updateFeed = useUpdateCallback(orgId, isLive, setState, 'feeds', updateFeedApi)
  const removeFeed = useRemoveCallback(orgId, isLive, setState, 'feeds', removeFeedApi)

  const addCoverageItem = useAddCallback(orgId, isLive, setState, 'coverageItems', addCoverageItemApi)
  const updateCoverageItem = useUpdateCallback(orgId, isLive, setState, 'coverageItems', updateCoverageItemApi)
  const removeCoverageItem = useRemoveCallback(orgId, isLive, setState, 'coverageItems', removeCoverageItemApi)

  const addSubmission = useAddCallback(orgId, isLive, setState, 'submissions', addSubmissionApi)
  const updateSubmission = useUpdateCallback(orgId, isLive, setState, 'submissions', updateSubmissionApi)
  const removeSubmission = useRemoveCallback(orgId, isLive, setState, 'submissions', removeSubmissionApi)

  const addBrandClaim = useAddCallback(orgId, isLive, setState, 'brandClaims', addBrandClaimApi)
  const updateBrandClaim = useUpdateCallback(orgId, isLive, setState, 'brandClaims', updateBrandClaimApi)
  const removeBrandClaim = useRemoveCallback(orgId, isLive, setState, 'brandClaims', removeBrandClaimApi)

  const addIssue = useAddCallback(orgId, isLive, setState, 'issues', addIssueApi)
  const updateIssue = useUpdateCallback(orgId, isLive, setState, 'issues', updateIssueApi)
  const removeIssue = useRemoveCallback(orgId, isLive, setState, 'issues', removeIssueApi)

  const addMetric = useAddCallback(orgId, isLive, setState, 'metrics', addMetricApi)
  const removeMetric = useRemoveCallback(orgId, isLive, setState, 'metrics', removeMetricApi)

  const addObjective = useAddCallback(orgId, isLive, setState, 'objectives', addObjectiveApi)
  const updateObjective = useUpdateCallback(orgId, isLive, setState, 'objectives', updateObjectiveApi)
  const removeObjective = useRemoveCallback(orgId, isLive, setState, 'objectives', removeObjectiveApi)

  const addPolicyFile = useAddCallback(orgId, isLive, setState, 'policyFiles', addPolicyFileApi)
  const removePolicyFile = useRemoveCallback(orgId, isLive, setState, 'policyFiles', removePolicyFileApi)

  const addIntegration = useAddCallback(orgId, isLive, setState, 'integrations', addIntegrationApi)
  const updateIntegration = useUpdateCallback(orgId, isLive, setState, 'integrations', updateIntegrationApi)
  const removeIntegration = useRemoveCallback(orgId, isLive, setState, 'integrations', removeIntegrationApi)

  // --- Custom CRUD (side effects or domain-specific logic) -----------------

  const addInitiative = useAddCallback(orgId, isLive, setState, 'initiatives', addInitiativeApi)
  const updateInitiative = useUpdateCallback(orgId, isLive, setState, 'initiatives', updateInitiativeApi)

  const removeInitiative = useCallback(
    async (id: string) => {
      if (!isLive || !orgId) return
      try {
        await removeInitiativeApi(orgId, id)
        setState((prev) => ({
          ...prev,
          initiatives: prev.initiatives.filter((i) => i.id !== id),
          contentItems: prev.contentItems.filter((c) => c.initiativeId !== id),
          objectives: prev.objectives.filter((o) => o.initiativeId !== id),
          metrics: prev.metrics.filter((m) => m.initiativeId !== id),
        }))
      } catch {
        // keep current state on failure
      }
    },
    [isLive, orgId],
  )

  const addContentItem = useAddCallback(orgId, isLive, setState, 'contentItems', addContentItemApi)
  const updateContentItem = useUpdateCallback(orgId, isLive, setState, 'contentItems', updateContentItemApi)

  const removeContentItem = useCallback(
    async (id: string) => {
      if (!isLive || !orgId) return
      try {
        await removeContentItemApi(orgId, id)
        setState((prev) => ({
          ...prev,
          contentItems: prev.contentItems.filter((c) => c.id !== id),
          approvals: prev.approvals.filter((a) => a.contentItemId !== id),
          executionEvents: prev.executionEvents.filter((e) => e.contentItemId !== id),
        }))
      } catch {
        // keep current state on failure
      }
    },
    [isLive, orgId],
  )

  const transitionDeliveryStatus = useCallback(
    async (contentItemId: string, action: CommsExecutionAction, _actor: string, note?: string) => {
      if (!isLive || !orgId) return null
      try {
        const updated = await transitionDeliveryStatusApi(orgId, contentItemId, action, noteToBi(note))
        if (updated) {
          setState((prev) => ({
            ...prev,
            contentItems: prev.contentItems.map((c) => (c.id === contentItemId ? updated : c)),
          }))
        }
        return updated
      } catch {
        return null
      }
    },
    [isLive, orgId],
  )

  const recordManualReceipt = useCallback(
    async (contentItemId: string, actor: string, note?: string) => {
      if (!isLive || !orgId) return null
      const item = state.contentItems.find((c) => c.id === contentItemId)
      if (!item || item.status !== 'approved') return null
      return transitionDeliveryStatus(contentItemId, 'mark_sent', actor, note)
    },
    [isLive, orgId, state.contentItems, transitionDeliveryStatus],
  )

  const toggleInitiativePause = useCallback(
    async (initiativeId: string, paused: boolean, _actor: string) => {
      if (!isLive || !orgId) return null
      const initiative = state.initiatives.find((i) => i.id === initiativeId)
      if (!initiative) return null
      const nextStatus: CommsInitiative['status'] = paused
        ? 'paused'
        : initiative.status === 'paused'
          ? 'active'
          : initiative.status
      try {
        const updated = await updateInitiativeApi(orgId, initiativeId, { status: nextStatus })
        if (updated) {
          setState((prev) => ({
            ...prev,
            initiatives: prev.initiatives.map((i) => (i.id === initiativeId ? updated : i)),
          }))
        }
        return updated
      } catch {
        return null
      }
    },
    [isLive, orgId, state.initiatives],
  )

  const syncFeed = useCallback(
    async (feedId: string): Promise<FeedSyncResult> => {
      if (!isLive || !orgId) return { added: 0, error: 'Not in production mode' }
      const result = await syncFeedApi(orgId, feedId)
      await refresh()
      return result
    },
    [isLive, orgId, refresh],
  )

  const syncAllFeeds = useCallback(
    async (): Promise<({ feedId: string } & FeedSyncResult)[]> => {
      if (!isLive || !orgId) return []
      const results = await syncAllFeedsApi(orgId)
      await refresh()
      return results
    },
    [isLive, orgId, refresh],
  )

  useEffect(() => {
    if (!isLive || !orgId) return undefined
    const run = async () => {
      await syncAllFeedsApi(orgId)
      await refresh()
    }
    run()
    const id = setInterval(run, 15 * 60 * 1000)
    return () => clearInterval(id)
  }, [isLive, orgId, refresh])

  const transitionSubmissionStatus = useCallback(
    async (id: string, nextStatus: CommsSubmissionStatus, actor = 'Workspace user') => {
      if (!isLive || !orgId) return null
      const submission = state.submissions.find((s) => s.id === id)
      if (!submission) return null
      const valid: Record<CommsSubmissionStatus, CommsSubmissionStatus[]> = {
        planned: ['submitted', 'withdrawn'],
        submitted: ['recorded', 'planned'],
        recorded: ['planned'],
        withdrawn: ['planned'],
      }
      if (!valid[submission.status].includes(nextStatus)) return null
      const patch: Partial<CommsSubmission> = { status: nextStatus }
      if (nextStatus === 'submitted' && !submission.submittedAt) {
        patch.submittedAt = new Date().toISOString().slice(0, 10)
      }
      if (nextStatus === 'recorded') {
        patch.owner = actor
      }
      return updateSubmission(id, patch)
    },
    [isLive, orgId, state.submissions, updateSubmission],
  )

  const addApproval = useCallback(
    async (item: Omit<CommsApproval, 'id'>) => {
      if (!isLive || !orgId) return null
      try {
        const created = await addApprovalApi(orgId, item)
        setState((prev) => ({
          ...prev,
          approvals: [created, ...prev.approvals],
          contentItems: prev.contentItems.map((c) =>
            c.id === item.contentItemId ? { ...c, status: item.decision } : c,
          ),
        }))
        return created
      } catch {
        return null
      }
    },
    [isLive, orgId],
  )

  const removeApproval = useRemoveCallback(orgId, isLive, setState, 'approvals', removeApprovalApi)

  const updateUsageControls = useCallback(
    async (controls: Partial<CommsUsageControls>) => {
      if (!isLive || !orgId) return null
      try {
        const merged: CommsUsageControls = { ...state.usageControls, ...controls }
        const updated = await updateUsageControlsApi(orgId, merged)
        setState((prev) => ({ ...prev, usageControls: updated }))
        return updated
      } catch {
        return null
      }
    },
    [isLive, orgId, state.usageControls],
  )

  const updateMetric = useCallback(
    async (id: string, patch: Partial<CommsMetric>) => {
      if (!isLive || !orgId) return null
      // metricsApi has no updateMetric; optimistic local update only
      setState((prev) => ({
        ...prev,
        metrics: prev.metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }))
      return state.metrics.find((m) => m.id === id) ?? null
    },
    [isLive, orgId, state.metrics],
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
      addContact,
      updateContact,
      removeContact,
      addOrganization,
      updateOrganization,
      removeOrganization,
      addInteraction,
      updateInteraction,
      removeInteraction,
      updateUsageControls,
      addPolicyFile,
      removePolicyFile,
      addIssue,
      updateIssue,
      removeIssue,
      addMetric,
      updateMetric,
      removeMetric,
      addIntegration,
      updateIntegration,
      removeIntegration,
      addObjective,
      updateObjective,
      removeObjective,
    }),
    [
      state, isLive,
      addInitiative, updateInitiative, removeInitiative,
      addContentItem, updateContentItem, removeContentItem,
      transitionDeliveryStatus, recordManualReceipt, toggleInitiativePause,
      addSource, updateSource, removeSource,
      addFeed, updateFeed, removeFeed, syncFeed, syncAllFeeds,
      addCoverageItem, updateCoverageItem, removeCoverageItem,
      addSubmission, updateSubmission, transitionSubmissionStatus, removeSubmission,
      addBrandClaim, updateBrandClaim, removeBrandClaim,
      addApproval, removeApproval,
      addContact, updateContact, removeContact,
      addOrganization, updateOrganization, removeOrganization,
      addInteraction, updateInteraction, removeInteraction,
      updateUsageControls, addPolicyFile, removePolicyFile,
      addIssue, updateIssue, removeIssue,
      addMetric, updateMetric, removeMetric,
      addIntegration, updateIntegration, removeIntegration,
      addObjective, updateObjective, removeObjective,
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
