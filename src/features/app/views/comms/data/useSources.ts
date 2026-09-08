import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsSource } from './types'
import { initialCommsState } from './fixtures'
import {
  addSource as addSourceApi,
  listSources as listSourcesApi,
  removeSource as removeSourceApi,
} from './sourcesApi'

export interface UseSourcesResult {
  sources: CommsSource[]
  loading: boolean
  canWrite: boolean
  addSource: (item: Omit<CommsSource, 'id'>) => Promise<CommsSource | null>
  removeSource: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useSources(): UseSourcesResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [sources, setSources] = useState<CommsSource[]>(initialCommsState.sources)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setSources(initialCommsState.sources)
      return
    }
    setLoading(true)
    try {
      const data = await listSourcesApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load sources', 'info')
        return []
      })
      setSources(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addSource = useCallback(
    async (item: Omit<CommsSource, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addSourceApi(organizationId!, item)
        setSources((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add source', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeSource = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeSourceApi(organizationId!, id)
        setSources((prev) => prev.filter((s) => s.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove source', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    sources,
    loading,
    canWrite: isProduction,
    addSource,
    removeSource,
    refresh: load,
  }
}
