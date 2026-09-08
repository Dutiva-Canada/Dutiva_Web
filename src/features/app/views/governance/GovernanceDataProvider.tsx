import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  listGovernanceRecords,
  listGovernanceDecisions,
  listGovernanceOfficers,
  listGovernanceShareholders,
} from './data/productionApi'
import { governanceSummary as fixtures } from './data/fixtures'
import { GovernanceDataContext } from './GovernanceDataContext'
import type { GovernanceDataValue } from './GovernanceDataContext'

export function GovernanceDataProvider({
  mode,
  children,
}: {
  readonly mode: 'demo' | 'production'
  readonly children: ReactNode
}) {
  const { organizationId } = useWorkspaceMode()
  const [value, setValue] = useState<GovernanceDataValue>(() =>
    mode === 'demo'
      ? {
          records: fixtures.records,
          decisions: fixtures.decisions,
          officers: fixtures.officers,
          shareholders: fixtures.shareholders,
          loading: false,
          error: null,
        }
      : {
          records: [],
          decisions: [],
          officers: [],
          shareholders: [],
          loading: true,
          error: null,
        },
  )

  useEffect(() => {
    if (mode !== 'production') return
    if (!organizationId) {
      setValue({
        records: [],
        decisions: [],
        officers: [],
        shareholders: [],
        loading: false,
        error: null,
      })
      return
    }

    const orgId = organizationId
    let cancelled = false
    async function load() {
      try {
        const [records, decisions, officers, shareholders] = await Promise.all([
          listGovernanceRecords(orgId),
          listGovernanceDecisions(orgId),
          listGovernanceOfficers(orgId),
          listGovernanceShareholders(orgId),
        ])
        if (cancelled) return
        setValue({
          records,
          decisions,
          officers,
          shareholders,
          loading: false,
          error: null,
        })
      } catch (err) {
        if (cancelled) return
        setValue({
          records: [],
          decisions: [],
          officers: [],
          shareholders: [],
          loading: false,
          error: err instanceof Error ? err.message : 'Could not load governance data.',
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
      records: value.records,
      decisions: value.decisions,
      officers: value.officers,
      shareholders: value.shareholders,
      loading: value.loading,
      error: value.error,
    }),
    [value],
  )

  return <GovernanceDataContext.Provider value={stable}>{children}</GovernanceDataContext.Provider>
}
