import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsIntegration } from './types'
import { initialCommsState } from './fixtures'
import {
  addIntegration as addIntegrationApi,
  listIntegrations as listIntegrationsApi,
  removeIntegration as removeIntegrationApi,
} from './integrationsApi'

export interface UseIntegrationsResult {
  integrations: CommsIntegration[]
  loading: boolean
  canWrite: boolean
  addIntegration: (item: Omit<CommsIntegration, 'id'>) => Promise<CommsIntegration | null>
  removeIntegration: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useIntegrations(): UseIntegrationsResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [integrations, setIntegrations] = useState<CommsIntegration[]>(initialCommsState.integrations)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setIntegrations(initialCommsState.integrations)
      return
    }
    setLoading(true)
    try {
      const data = await listIntegrationsApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load integrations', 'info')
        return []
      })
      setIntegrations(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addIntegration = useCallback(
    async (item: Omit<CommsIntegration, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addIntegrationApi(organizationId!, item)
        setIntegrations((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add integration', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeIntegration = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeIntegrationApi(organizationId!, id)
        setIntegrations((prev) => prev.filter((i) => i.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove integration', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    integrations,
    loading,
    canWrite: isProduction,
    addIntegration,
    removeIntegration,
    refresh: load,
  }
}
