import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsIssue } from './types'
import { initialCommsState } from './fixtures'
import {
  addIssue as addIssueApi,
  listIssues as listIssuesApi,
  removeIssue as removeIssueApi,
} from './issuesApi'

export interface UseIssuesResult {
  issues: CommsIssue[]
  loading: boolean
  canWrite: boolean
  addIssue: (item: Omit<CommsIssue, 'id'>) => Promise<CommsIssue | null>
  removeIssue: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useIssues(): UseIssuesResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [issues, setIssues] = useState<CommsIssue[]>(initialCommsState.issues)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setIssues(initialCommsState.issues)
      return
    }
    setLoading(true)
    try {
      const data = await listIssuesApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load issues', 'info')
        return []
      })
      setIssues(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addIssue = useCallback(
    async (item: Omit<CommsIssue, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addIssueApi(organizationId!, item)
        setIssues((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add issue', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeIssue = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeIssueApi(organizationId!, id)
        setIssues((prev) => prev.filter((i) => i.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove issue', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    issues,
    loading,
    canWrite: isProduction,
    addIssue,
    removeIssue,
    refresh: load,
  }
}
