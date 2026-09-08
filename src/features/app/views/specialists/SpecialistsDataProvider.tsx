import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { listSpecialists, listSpecialistEngagements } from './data/productionApi'
import { specialistsSummary as fixtures } from './data/fixtures'
import { SpecialistsDataContext } from './SpecialistsDataContext'
import type { SpecialistsDataValue } from './SpecialistsDataContext'

const EMPTY: SpecialistsDataValue = {
  specialists: [],
  engagements: [],
  loading: false,
  error: null,
}

export function SpecialistsDataProvider({
  mode,
  children,
}: {
  readonly mode: 'demo' | 'production'
  readonly children: ReactNode
}) {
  const { organizationId } = useWorkspaceMode()
  const [value, setValue] = useState<SpecialistsDataValue>(() =>
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
        const [specialists, engagements] = await Promise.all([
          listSpecialists(orgId),
          listSpecialistEngagements(orgId),
        ])
        if (cancelled) return
        setValue({ specialists, engagements, loading: false, error: null })
      } catch (err) {
        if (cancelled) return
        setValue({
          ...EMPTY,
          error: err instanceof Error ? err.message : 'Could not load specialists data.',
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
      specialists: value.specialists,
      engagements: value.engagements,
      loading: value.loading,
      error: value.error,
    }),
    [value],
  )

  return <SpecialistsDataContext.Provider value={stable}>{children}</SpecialistsDataContext.Provider>
}
