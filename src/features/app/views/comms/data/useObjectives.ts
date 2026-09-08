import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsObjective } from './types'
import { initialCommsState } from './fixtures'
import {
  addObjective as addObjectiveApi,
  listObjectives as listObjectivesApi,
  removeObjective as removeObjectiveApi,
  updateObjective as updateObjectiveApi,
} from './objectivesApi'

export interface UseObjectivesResult {
  objectives: CommsObjective[]
  loading: boolean
  canWrite: boolean
  addObjective: (item: Omit<CommsObjective, 'id'>) => Promise<CommsObjective | null>
  updateObjective: (id: string, patch: Partial<CommsObjective>) => Promise<CommsObjective | null>
  removeObjective: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useObjectives(): UseObjectivesResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [objectives, setObjectives] = useState<CommsObjective[]>(initialCommsState.objectives)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setObjectives(initialCommsState.objectives)
      return
    }
    setLoading(true)
    try {
      const data = await listObjectivesApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load objectives', 'info')
        return []
      })
      setObjectives(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addObjective = useCallback(
    async (item: Omit<CommsObjective, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addObjectiveApi(organizationId!, item)
        setObjectives((prev) => [...prev, created])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add objective', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const updateObjective = useCallback(
    async (id: string, patch: Partial<CommsObjective>) => {
      if (!isProduction) return null
      try {
        const updated = await updateObjectiveApi(organizationId!, id, patch)
        if (updated) {
          setObjectives((prev) => prev.map((o) => (o.id === id ? updated : o)))
        }
        return updated
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update objective', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeObjective = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeObjectiveApi(organizationId!, id)
        setObjectives((prev) => prev.filter((o) => o.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove objective', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    objectives,
    loading,
    canWrite: isProduction,
    addObjective,
    updateObjective,
    removeObjective,
    refresh: load,
  }
}
