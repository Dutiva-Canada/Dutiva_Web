import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  listSecurityAssets,
  listSecurityAccessReviews,
  listSecurityIncidents,
  listSecurityRisks,
  listSecurityVendorReviews,
} from './data/productionApi'
import { securitySummary as fixtures } from './data/fixtures'
import { SecurityDataContext } from './SecurityDataContext'
import type { SecurityDataValue } from './SecurityDataContext'

const EMPTY: SecurityDataValue = {
  assets: [],
  accessReviews: [],
  incidents: [],
  risks: [],
  vendorReviews: [],
  loading: false,
  error: null,
}

export function SecurityDataProvider({
  mode,
  children,
}: {
  readonly mode: 'demo' | 'production'
  readonly children: ReactNode
}) {
  const { organizationId } = useWorkspaceMode()
  const [value, setValue] = useState<SecurityDataValue>(() =>
    mode === 'demo' ? { ...fixtures, loading: false, error: null } : EMPTY,
  )

  useEffect(() => {
    if (mode !== 'production') return
    if (!organizationId) {
      setValue(EMPTY)
      return
    }

    const orgId = organizationId
    let cancelled = false
    async function load() {
      try {
        const [assets, accessReviews, incidents, risks, vendorReviews] = await Promise.all([
          listSecurityAssets(orgId),
          listSecurityAccessReviews(orgId),
          listSecurityIncidents(orgId),
          listSecurityRisks(orgId),
          listSecurityVendorReviews(orgId),
        ])
        if (cancelled) return
        setValue({
          assets,
          accessReviews,
          incidents,
          risks,
          vendorReviews,
          loading: false,
          error: null,
        })
      } catch (err) {
        if (cancelled) return
        setValue({
          ...EMPTY,
          error: err instanceof Error ? err.message : 'Could not load security data.',
        })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [mode, organizationId])

  const stable = useMemo(
    () => ({
      assets: value.assets,
      accessReviews: value.accessReviews,
      incidents: value.incidents,
      risks: value.risks,
      vendorReviews: value.vendorReviews,
      loading: value.loading,
      error: value.error,
    }),
    [value],
  )

  return <SecurityDataContext.Provider value={stable}>{children}</SecurityDataContext.Provider>
}
