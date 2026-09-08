import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  listOperationsProjects,
  listOperationsVendors,
  listOperationsQualityChecks,
  listOperationsTechnology,
  listOperationsLogistics,
  createOperationsProject,
  createOperationsVendor,
  createOperationsQualityCheck,
  createOperationsTechnology,
  createOperationsLogistics,
  updateOperationsProject,
  updateOperationsVendor,
  updateOperationsQualityCheck,
  updateOperationsTechnology,
  updateOperationsLogistics,
} from './data/productionApi'
import { operationsSummary as fixtures } from './data/fixtures'
import { OperationsDataContext } from './OperationsDataContext'
import type { OperationsDataValue } from './OperationsDataContext'
import type {
  OperationsProject,
  OperationsVendor,
  OperationsQualityCheck,
  OperationsTechnology,
  OperationsLogistics,
} from './data/types'

const EMPTY: Pick<OperationsDataValue, 'projects' | 'vendors' | 'qualityChecks' | 'technology' | 'logistics' | 'loading' | 'error'> = {
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
  const [value, setValue] = useState<Pick<OperationsDataValue, 'projects' | 'vendors' | 'qualityChecks' | 'technology' | 'logistics' | 'loading' | 'error'>>
  (
    () =>
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

  const addProject = useCallback(
    async (project: OperationsProject) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, projects: [project, ...prev.projects] }))
        return
      }
      try {
        const created = await createOperationsProject(organizationId, {
          title: project.title,
          owner_id: project.owner_id,
          status: project.status,
          start_date: project.start_date,
          target_date: project.target_date,
          description: project.description,
        })
        setValue((prev) => ({ ...prev, projects: [created, ...prev.projects] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save project.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateProject = useCallback(
    async (project: OperationsProject) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          projects: prev.projects.map((p) => (p.id === project.id ? project : p)),
        }))
        return
      }
      try {
        const saved = await updateOperationsProject(project.id, {
          title: project.title,
          owner_id: project.owner_id,
          status: project.status,
          start_date: project.start_date,
          target_date: project.target_date,
          description: project.description,
        })
        setValue((prev) => ({
          ...prev,
          projects: prev.projects.map((p) => (p.id === saved.id ? saved : p)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update project.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addVendor = useCallback(
    async (vendor: OperationsVendor) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, vendors: [vendor, ...prev.vendors] }))
        return
      }
      try {
        const created = await createOperationsVendor(organizationId, {
          finance_party_id: vendor.finance_party_id,
          name: vendor.name,
          vendor_type: vendor.vendor_type,
          status: vendor.status,
          contract_expiry: vendor.contract_expiry,
          notes: vendor.notes,
        })
        setValue((prev) => ({ ...prev, vendors: [created, ...prev.vendors] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save vendor.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateVendor = useCallback(
    async (vendor: OperationsVendor) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          vendors: prev.vendors.map((v) => (v.id === vendor.id ? vendor : v)),
        }))
        return
      }
      try {
        const saved = await updateOperationsVendor(vendor.id, {
          finance_party_id: vendor.finance_party_id,
          name: vendor.name,
          vendor_type: vendor.vendor_type,
          status: vendor.status,
          contract_expiry: vendor.contract_expiry,
          notes: vendor.notes,
        })
        setValue((prev) => ({
          ...prev,
          vendors: prev.vendors.map((v) => (v.id === saved.id ? saved : v)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update vendor.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addQualityCheck = useCallback(
    async (check: OperationsQualityCheck) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, qualityChecks: [check, ...prev.qualityChecks] }))
        return
      }
      try {
        const created = await createOperationsQualityCheck(organizationId, {
          title: check.title,
          assigned_to: check.assigned_to,
          reviewer_id: check.reviewer_id,
          checklist: (check.checklist as unknown as unknown[] | null) ?? [],
          due_date: check.due_date,
          completed_date: check.completed_date,
          status: check.status,
          non_conformance: check.non_conformance,
          created_by: check.created_by,
        })
        setValue((prev) => ({ ...prev, qualityChecks: [created, ...prev.qualityChecks] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save quality check.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateQualityCheck = useCallback(
    async (check: OperationsQualityCheck) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          qualityChecks: prev.qualityChecks.map((c) => (c.id === check.id ? check : c)),
        }))
        return
      }
      try {
        const saved = await updateOperationsQualityCheck(check.id, {
          title: check.title,
          assigned_to: check.assigned_to,
          reviewer_id: check.reviewer_id,
          checklist: (check.checklist as unknown as unknown[] | null) ?? [],
          due_date: check.due_date,
          completed_date: check.completed_date,
          status: check.status,
          non_conformance: check.non_conformance,
          created_by: check.created_by,
        })
        setValue((prev) => ({
          ...prev,
          qualityChecks: prev.qualityChecks.map((c) => (c.id === saved.id ? saved : c)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update quality check.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addTechnology = useCallback(
    async (technology: OperationsTechnology) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, technology: [technology, ...prev.technology] }))
        return
      }
      try {
        const created = await createOperationsTechnology(organizationId, {
          name: technology.name,
          system_type: technology.system_type,
          owner_id: technology.owner_id,
          status: technology.status,
          renewal_date: technology.renewal_date,
          integration_notes: technology.integration_notes,
        })
        setValue((prev) => ({ ...prev, technology: [created, ...prev.technology] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save technology.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateTechnology = useCallback(
    async (technology: OperationsTechnology) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          technology: prev.technology.map((t) => (t.id === technology.id ? technology : t)),
        }))
        return
      }
      try {
        const saved = await updateOperationsTechnology(technology.id, {
          name: technology.name,
          system_type: technology.system_type,
          owner_id: technology.owner_id,
          status: technology.status,
          renewal_date: technology.renewal_date,
          integration_notes: technology.integration_notes,
        })
        setValue((prev) => ({
          ...prev,
          technology: prev.technology.map((t) => (t.id === saved.id ? saved : t)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update technology.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addLogistics = useCallback(
    async (logistics: OperationsLogistics) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, logistics: [logistics, ...prev.logistics] }))
        return
      }
      try {
        const created = await createOperationsLogistics(organizationId, {
          title: logistics.title,
          owner_id: logistics.owner_id,
          assigned_to: logistics.assigned_to,
          status: logistics.status,
          expected_date: logistics.expected_date,
          delivered_date: logistics.delivered_date,
          notes: logistics.notes,
          created_by: logistics.created_by,
        })
        setValue((prev) => ({ ...prev, logistics: [created, ...prev.logistics] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save logistics.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateLogistics = useCallback(
    async (logistics: OperationsLogistics) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          logistics: prev.logistics.map((l) => (l.id === logistics.id ? logistics : l)),
        }))
        return
      }
      try {
        const saved = await updateOperationsLogistics(logistics.id, {
          title: logistics.title,
          owner_id: logistics.owner_id,
          assigned_to: logistics.assigned_to,
          status: logistics.status,
          expected_date: logistics.expected_date,
          delivered_date: logistics.delivered_date,
          notes: logistics.notes,
          created_by: logistics.created_by,
        })
        setValue((prev) => ({
          ...prev,
          logistics: prev.logistics.map((l) => (l.id === saved.id ? saved : l)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update logistics.',
        }))
      }
    },
    [mode, organizationId],
  )

  const stable = useMemo(
    () => ({
      projects: value.projects,
      vendors: value.vendors,
      qualityChecks: value.qualityChecks,
      technology: value.technology,
      logistics: value.logistics,
      loading: value.loading,
      error: value.error,
      addProject,
      updateProject,
      addVendor,
      updateVendor,
      addQualityCheck,
      updateQualityCheck,
      addTechnology,
      updateTechnology,
      addLogistics,
      updateLogistics,
    }),
    [
      value,
      addProject,
      updateProject,
      addVendor,
      updateVendor,
      addQualityCheck,
      updateQualityCheck,
      addTechnology,
      updateTechnology,
      addLogistics,
      updateLogistics,
    ],
  )

  return <OperationsDataContext.Provider value={stable}>{children}</OperationsDataContext.Provider>
}
