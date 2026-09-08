import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsSegment, CommsSegmentMembership } from './types'
import { initialCommsState } from './fixtures'
import {
  addContactToSegment as addContactToSegmentApi,
  createSegment as createSegmentApi,
  deleteSegment as deleteSegmentApi,
  listSegmentMemberships as listSegmentMembershipsApi,
  listSegments as listSegmentsApi,
  removeContactFromSegment as removeContactFromSegmentApi,
  updateSegment as updateSegmentApi,
} from './segmentsApi'

export interface UseSegmentsResult {
  segments: CommsSegment[]
  segmentMemberships: CommsSegmentMembership[]
  loading: boolean
  canWrite: boolean
  addSegment: (item: Omit<CommsSegment, 'id'>) => Promise<CommsSegment | null>
  updateSegment: (id: string, patch: Partial<CommsSegment>) => Promise<CommsSegment | null>
  removeSegment: (id: string) => Promise<void>
  addContact: (contactId: string, segmentId: string) => Promise<CommsSegmentMembership | null>
  removeContact: (membershipId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useSegments(): UseSegmentsResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [segments, setSegments] = useState<CommsSegment[]>(initialCommsState.segments)
  const [segmentMemberships, setSegmentMemberships] = useState<CommsSegmentMembership[]>(
    initialCommsState.segmentMemberships,
  )
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setSegments(initialCommsState.segments)
      setSegmentMemberships(initialCommsState.segmentMemberships)
      return
    }
    setLoading(true)
    try {
      const [s, m] = await Promise.all([
        listSegmentsApi(organizationId!).catch((err) => {
          showToast(err instanceof Error ? err.message : 'Failed to load segments', 'info')
          return []
        }),
        listSegmentMembershipsApi(organizationId!).catch((err) => {
          showToast(
            err instanceof Error ? err.message : 'Failed to load segment memberships',
            'info',
          )
          return []
        }),
      ])
      setSegments(s)
      setSegmentMemberships(m)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addSegment = useCallback(
    async (item: Omit<CommsSegment, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await createSegmentApi(organizationId!, item)
        setSegments((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add segment', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const updateSegment = useCallback(
    async (id: string, patch: Partial<CommsSegment>) => {
      if (!isProduction) return null
      try {
        const updated = await updateSegmentApi(organizationId!, id, patch)
        if (updated) {
          setSegments((prev) => prev.map((s) => (s.id === id ? updated : s)))
        }
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update segment', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeSegment = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await deleteSegmentApi(organizationId!, id)
        setSegments((prev) => prev.filter((s) => s.id !== id))
        setSegmentMemberships((prev) => prev.filter((m) => m.segmentId !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove segment', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  const addContact = useCallback(
    async (contactId: string, segmentId: string) => {
      if (!isProduction) return null
      try {
        const created = await addContactToSegmentApi(organizationId!, contactId, segmentId)
        setSegmentMemberships((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add contact to segment', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeContact = useCallback(
    async (membershipId: string) => {
      if (!isProduction) return
      try {
        await removeContactFromSegmentApi(organizationId!, membershipId)
        setSegmentMemberships((prev) => prev.filter((m) => m.id !== membershipId))
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to remove contact from segment',
          'info',
        )
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    segments,
    segmentMemberships,
    loading,
    canWrite: isProduction,
    addSegment,
    updateSegment,
    removeSegment,
    addContact,
    removeContact,
    refresh: load,
  }
}
