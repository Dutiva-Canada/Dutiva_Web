import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsInitiative } from './types'
import { initialCommsState } from './fixtures'
import {
  addInitiative as addInitiativeApi,
  listInitiatives as listInitiativesApi,
  removeInitiative as removeInitiativeApi,
  updateInitiative as updateInitiativeApi,
} from './initiativesApi'

export interface UseInitiativesResult {
  initiatives: CommsInitiative[]
  loading: boolean
  canWrite: boolean
  addInitiative: (item: Omit<CommsInitiative, 'id'>) => Promise<CommsInitiative | null>
  updateInitiative: (id: string, patch: Partial<CommsInitiative>) => Promise<CommsInitiative | null>
  removeInitiative: (id: string) => Promise<void>
  toggleInitiativePause: (id: string, paused: boolean) => Promise<CommsInitiative | null>
  refresh: () => Promise<void>
}

export function useInitiatives(): UseInitiativesResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [initiatives, setInitiatives] = useState<CommsInitiative[]>(initialCommsState.initiatives)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setInitiatives(initialCommsState.initiatives)
      return
    }
    setLoading(true)
    try {
      const data = await listInitiativesApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load initiatives', 'info')
        return []
      })
      setInitiatives(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addInitiative = useCallback(
    async (item: Omit<CommsInitiative, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addInitiativeApi(organizationId!, item)
        setInitiatives((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add initiative', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const updateInitiative = useCallback(
    async (id: string, patch: Partial<CommsInitiative>) => {
      if (!isProduction) return null
      try {
        const updated = await updateInitiativeApi(organizationId!, id, patch)
        if (updated) {
          setInitiatives((prev) => prev.map((i) => (i.id === id ? updated : i)))
        }
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update initiative', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeInitiative = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeInitiativeApi(organizationId!, id)
        setInitiatives((prev) => prev.filter((i) => i.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove initiative', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  const toggleInitiativePause = useCallback(
    async (id: string, paused: boolean) => {
      if (!isProduction) return null
      const current = initiatives.find((i) => i.id === id)
      if (!current) return null
      const nextStatus: CommsInitiative['status'] = paused
        ? 'paused'
        : current.status === 'paused'
          ? 'active'
          : current.status
      try {
        const updated = await updateInitiativeApi(organizationId!, id, { status: nextStatus })
        if (updated) {
          setInitiatives((prev) => prev.map((i) => (i.id === id ? updated : i)))
        }
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update initiative status', 'info')
        return null
      }
    },
    [isProduction, organizationId, initiatives, showToast],
  )

  return {
    initiatives,
    loading,
    canWrite: isProduction,
    addInitiative,
    updateInitiative,
    removeInitiative,
    toggleInitiativePause,
    refresh: load,
  }
}
