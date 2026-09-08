import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsPolicyFile } from './types'
import { initialCommsState } from './fixtures'
import {
  addPolicyFile as addPolicyFileApi,
  listPolicyFiles as listPolicyFilesApi,
  removePolicyFile as removePolicyFileApi,
} from './policyFilesApi'

export interface UsePolicyFilesResult {
  policyFiles: CommsPolicyFile[]
  loading: boolean
  canWrite: boolean
  addPolicyFile: (item: Omit<CommsPolicyFile, 'id'>) => Promise<CommsPolicyFile | null>
  removePolicyFile: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function usePolicyFiles(): UsePolicyFilesResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [policyFiles, setPolicyFiles] = useState<CommsPolicyFile[]>(initialCommsState.policyFiles)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setPolicyFiles(initialCommsState.policyFiles)
      return
    }
    setLoading(true)
    try {
      const data = await listPolicyFilesApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load policy files', 'info')
        return []
      })
      setPolicyFiles(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addPolicyFile = useCallback(
    async (item: Omit<CommsPolicyFile, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addPolicyFileApi(organizationId!, item)
        setPolicyFiles((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add policy file', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removePolicyFile = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removePolicyFileApi(organizationId!, id)
        setPolicyFiles((prev) => prev.filter((f) => f.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove policy file', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    policyFiles,
    loading,
    canWrite: isProduction,
    addPolicyFile,
    removePolicyFile,
    refresh: load,
  }
}
