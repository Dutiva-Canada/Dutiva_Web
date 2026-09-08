import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsSubmission, CommsSubmissionStatus } from './types'
import { initialCommsState } from './fixtures'
import {
  addSubmission as addSubmissionApi,
  listSubmissions as listSubmissionsApi,
  removeSubmission as removeSubmissionApi,
  updateSubmission as updateSubmissionApi,
} from './submissionsApi'

export interface UseSubmissionsResult {
  submissions: CommsSubmission[]
  loading: boolean
  canWrite: boolean
  addSubmission: (item: Omit<CommsSubmission, 'id'>) => Promise<CommsSubmission | null>
  transitionSubmissionStatus: (id: string, nextStatus: CommsSubmissionStatus) => Promise<CommsSubmission | null>
  removeSubmission: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useSubmissions(): UseSubmissionsResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [submissions, setSubmissions] = useState<CommsSubmission[]>(initialCommsState.submissions)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setSubmissions(initialCommsState.submissions)
      return
    }
    setLoading(true)
    try {
      const data = await listSubmissionsApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load submissions', 'info')
        return []
      })
      setSubmissions(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addSubmission = useCallback(
    async (item: Omit<CommsSubmission, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addSubmissionApi(organizationId!, item)
        setSubmissions((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add submission', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const transitionSubmissionStatus = useCallback(
    async (id: string, nextStatus: CommsSubmissionStatus) => {
      if (!isProduction) return null
      try {
        const updated = await updateSubmissionApi(organizationId!, id, { status: nextStatus })
        if (updated) {
          setSubmissions((prev) => prev.map((s) => (s.id === id ? updated : s)))
        }
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to transition submission', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeSubmission = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeSubmissionApi(organizationId!, id)
        setSubmissions((prev) => prev.filter((s) => s.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove submission', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    submissions,
    loading,
    canWrite: isProduction,
    addSubmission,
    transitionSubmissionStatus,
    removeSubmission,
    refresh: load,
  }
}
