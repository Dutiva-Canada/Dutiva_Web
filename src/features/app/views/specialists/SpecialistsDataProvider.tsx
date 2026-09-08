import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  listSpecialists,
  listSpecialistEngagements,
  createSpecialist,
  createSpecialistEngagement,
} from './data/productionApi'
import { specialistsSummary as fixtures } from './data/fixtures'
import { SpecialistsDataContext } from './SpecialistsDataContext'
import type { SpecialistsDataValue } from './SpecialistsDataContext'
import type { Specialist, SpecialistEngagement } from './data/types'

const EMPTY: Omit<SpecialistsDataValue, 'addSpecialist' | 'addEngagement'> = {
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
  const [value, setValue] = useState<Omit<SpecialistsDataValue, 'addSpecialist' | 'addEngagement'>>(() =>
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
        setValue({
          specialists,
          engagements,
          loading: false,
          error: null,
        })
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

  const addSpecialist = useCallback(
    async (specialist: Specialist) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, specialists: [specialist, ...prev.specialists] }))
        return
      }
      try {
        const created = await createSpecialist(organizationId, {
          name: specialist.name,
          specialty: specialist.specialty,
          company: specialist.company,
          email: specialist.email,
          phone: specialist.phone,
          crm_contact_id: specialist.crm_contact_id,
          finance_party_id: specialist.finance_party_id,
          workspace_access: specialist.workspace_access,
          workspace_role: specialist.workspace_role,
          granted_modules: specialist.granted_modules,
          access_expires_at: specialist.access_expires_at,
          notes: specialist.notes,
        })
        setValue((prev) => ({ ...prev, specialists: [created, ...prev.specialists] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save specialist.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addEngagement = useCallback(
    async (engagement: SpecialistEngagement) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, engagements: [engagement, ...prev.engagements] }))
        return
      }
      try {
        const created = await createSpecialistEngagement(organizationId, {
          specialist_id: engagement.specialist_id,
          engagement_date: engagement.engagement_date,
          engagement_type: engagement.engagement_type,
          summary: engagement.summary,
          follow_up_date: engagement.follow_up_date,
          created_by: null,
        })
        setValue((prev) => ({ ...prev, engagements: [created, ...prev.engagements] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save engagement.',
        }))
      }
    },
    [mode, organizationId],
  )

  const stable = useMemo(
    () => ({
      specialists: value.specialists,
      engagements: value.engagements,
      loading: value.loading,
      error: value.error,
      addSpecialist,
      addEngagement,
    }),
    [value, addSpecialist, addEngagement],
  )

  return <SpecialistsDataContext.Provider value={stable}>{children}</SpecialistsDataContext.Provider>
}
