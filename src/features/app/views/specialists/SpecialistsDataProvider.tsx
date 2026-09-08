import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  listSpecialists,
  listSpecialistEngagements,
  createSpecialist,
  createSpecialistEngagement,
  updateSpecialist,
  updateSpecialistEngagement,
  deleteSpecialist,
  deleteSpecialistEngagement,
} from './data/productionApi'
import { specialistsSummary as fixtures } from './data/fixtures'
import { SpecialistsDataContext } from './SpecialistsDataContext'
import type { SpecialistsDataValue } from './SpecialistsDataContext'
import type { Specialist, SpecialistEngagement } from './data/types'

const EMPTY: Pick<SpecialistsDataValue, 'specialists' | 'engagements' | 'loading' | 'error'> = {
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
  const [value, setValue] = useState<Pick<SpecialistsDataValue, 'specialists' | 'engagements' | 'loading' | 'error'>>(
    () => (mode === 'demo' ? { ...fixtures, loading: false, error: null } : EMPTY),
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

  const saveSpecialist = useCallback(
    async (specialist: Specialist) => {
      const exists = value.specialists.some((s) => s.id === specialist.id)
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          specialists: exists
            ? prev.specialists.map((s) => (s.id === specialist.id ? specialist : s))
            : [specialist, ...prev.specialists],
        }))
        return
      }
      try {
        const saved = await updateSpecialist(specialist.id, {
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
        setValue((prev) => ({
          ...prev,
          specialists: prev.specialists.map((s) => (s.id === saved.id ? saved : s)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update specialist.',
        }))
      }
    },
    [mode, organizationId, value.specialists],
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

  const saveEngagement = useCallback(
    async (engagement: SpecialistEngagement) => {
      const exists = value.engagements.some((e) => e.id === engagement.id)
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          engagements: exists
            ? prev.engagements.map((e) => (e.id === engagement.id ? engagement : e))
            : [engagement, ...prev.engagements],
        }))
        return
      }
      try {
        const saved = await updateSpecialistEngagement(engagement.id, {
          specialist_id: engagement.specialist_id,
          engagement_date: engagement.engagement_date,
          engagement_type: engagement.engagement_type,
          summary: engagement.summary,
          follow_up_date: engagement.follow_up_date,
          created_by: null,
        })
        setValue((prev) => ({
          ...prev,
          engagements: prev.engagements.map((e) => (e.id === saved.id ? saved : e)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update engagement.',
        }))
      }
    },
    [mode, organizationId, value.engagements],
  )

  const removeSpecialist = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          specialists: prev.specialists.filter((s) => s.id !== id),
          engagements: prev.engagements.filter((e) => e.specialist_id !== id),
        }))
        return
      }
      try {
        await deleteSpecialist(id)
        setValue((prev) => ({
          ...prev,
          specialists: prev.specialists.filter((s) => s.id !== id),
          engagements: prev.engagements.filter((e) => e.specialist_id !== id),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove specialist.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeEngagement = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          engagements: prev.engagements.filter((e) => e.id !== id),
        }))
        return
      }
      try {
        await deleteSpecialistEngagement(id)
        setValue((prev) => ({
          ...prev,
          engagements: prev.engagements.filter((e) => e.id !== id),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove engagement.',
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
      updateSpecialist: saveSpecialist,
      removeSpecialist,
      addEngagement,
      updateEngagement: saveEngagement,
      removeEngagement,
    }),
    [value, addSpecialist, saveSpecialist, removeSpecialist, addEngagement, saveEngagement, removeEngagement],
  )

  return <SpecialistsDataContext.Provider value={stable}>{children}</SpecialistsDataContext.Provider>
}
