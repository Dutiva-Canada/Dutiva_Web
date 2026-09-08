import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsApproval } from './types'
import { initialCommsState } from './fixtures'
import {
  addApproval as addApprovalApi,
  listApprovals as listApprovalsApi,
  removeApproval as removeApprovalApi,
} from './approvalsApi'

export interface UseApprovalsResult {
  approvals: CommsApproval[]
  loading: boolean
  canWrite: boolean
  addApproval: (item: Omit<CommsApproval, 'id'>) => Promise<CommsApproval | null>
  removeApproval: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useApprovals(): UseApprovalsResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [approvals, setApprovals] = useState<CommsApproval[]>(initialCommsState.approvals)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setApprovals(initialCommsState.approvals)
      return
    }
    setLoading(true)
    try {
      const data = await listApprovalsApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load approvals', 'info')
        return []
      })
      setApprovals(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addApproval = useCallback(
    async (item: Omit<CommsApproval, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addApprovalApi(organizationId!, item)
        setApprovals((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add approval', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeApproval = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeApprovalApi(organizationId!, id)
        setApprovals((prev) => prev.filter((a) => a.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove approval', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    approvals,
    loading,
    canWrite: isProduction,
    addApproval,
    removeApproval,
    refresh: load,
  }
}
