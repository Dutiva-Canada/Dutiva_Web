import { useCallback, useEffect, useState } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { CommsBrandClaim } from './types'
import { initialCommsState } from './fixtures'
import {
  addBrandClaim as addBrandClaimApi,
  listBrandClaims as listBrandClaimsApi,
  removeBrandClaim as removeBrandClaimApi,
} from './brandClaimsApi'

export interface UseBrandClaimsResult {
  brandClaims: CommsBrandClaim[]
  loading: boolean
  canWrite: boolean
  addBrandClaim: (item: Omit<CommsBrandClaim, 'id'>) => Promise<CommsBrandClaim | null>
  removeBrandClaim: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useBrandClaims(): UseBrandClaimsResult {
  const { mode, organizationId } = useWorkspaceMode()
  const { showToast } = useToasts()
  const isProduction = mode === 'production' && organizationId != null

  const [brandClaims, setBrandClaims] = useState<CommsBrandClaim[]>(initialCommsState.brandClaims)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isProduction) {
      setBrandClaims(initialCommsState.brandClaims)
      return
    }
    setLoading(true)
    try {
      const data = await listBrandClaimsApi(organizationId!).catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load brand claims', 'info')
        return []
      })
      setBrandClaims(data)
    } finally {
      setLoading(false)
    }
  }, [isProduction, organizationId, showToast])

  useEffect(() => {
    load()
  }, [load])

  const addBrandClaim = useCallback(
    async (item: Omit<CommsBrandClaim, 'id'>) => {
      if (!isProduction) return null
      try {
        const created = await addBrandClaimApi(organizationId!, item)
        setBrandClaims((prev) => [created, ...prev])
        return created
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add brand claim', 'info')
        return null
      }
    },
    [isProduction, organizationId, showToast],
  )

  const removeBrandClaim = useCallback(
    async (id: string) => {
      if (!isProduction) return
      try {
        await removeBrandClaimApi(organizationId!, id)
        setBrandClaims((prev) => prev.filter((c) => c.id !== id))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to remove brand claim', 'info')
      }
    },
    [isProduction, organizationId, showToast],
  )

  return {
    brandClaims,
    loading,
    canWrite: isProduction,
    addBrandClaim,
    removeBrandClaim,
    refresh: load,
  }
}
