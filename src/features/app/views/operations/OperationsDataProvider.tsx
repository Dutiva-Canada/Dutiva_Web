import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  listOperationsProjects,
  listOperationsVendors,
  listOperationsQualityChecks,
  listOperationsTechnology,
  listOperationsLogistics,
} from './data/productionApi'
import { operationsSummary as fixtures } from './data/fixtures'
import { OperationsDataContext } from './OperationsDataContext'
import type { OperationsDataValue } from './OperationsDataContext'

const EMPTY: OperationsDataValue = {
  projects: [],
  vendors: [],
  qualityChecks: [],
  technology: [],
  logistics: [],
  loading: false,
  error: null,
}

export function OperationsDataProvider({
  mode,
  children,
}: {
  readonly mode: 'demo' | 'production'
  readonly children: ReactNode
}) {
  const { organizationId } = useWorkspaceMode()
  const [value, setValue] = useState<OperationsDataValue>(() =>
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
        const [projects, vendors, qualityChecks, technology, logistics] = await Promise.all([
          listOperationsProjects(orgId),
          listOperationsVendors(orgId),
          listOperationsQualityChecks(orgId),
          listOperationsTechnology(orgId),
          listOperationsLogistics(orgId),
        ])
        if (cancelled) return
        setValue({
          projects,
          vendors,
          qualityChecks,
          technology,
          logistics,
          loading: false,
          error: null,
        })
      } catch (err) {
        if (cancelled) return
        setValue({
          ...EMPTY,
          error: err instanceof Error ? err.message : 'Could not load operations data.',
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
      projects: value.projects,
      vendors: value.vendors,
      qualityChecks: value.qualityChecks,
      technology: value.technology,
      logistics: value.logistics,
      loading: value.loading,
      error: value.error,
    }),
    [value],
  )

  return <OperationsDataContext.Provider value={stable}>{children}</OperationsDataContext.Provider>
}
