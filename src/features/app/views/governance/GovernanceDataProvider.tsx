import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  listGovernanceRecords,
  listGovernanceDecisions,
  listGovernanceOfficers,
  listGovernanceShareholders,
  createGovernanceRecord,
  createGovernanceDecision,
  createGovernanceOfficer,
  createGovernanceShareholder,
  updateGovernanceRecord,
  updateGovernanceDecision,
  updateGovernanceOfficer,
  updateGovernanceShareholder,
  deleteGovernanceRecord,
  deleteGovernanceDecision,
  deleteGovernanceOfficer,
  deleteGovernanceShareholder,
} from './data/productionApi'
import { governanceSummary as fixtures } from './data/fixtures'
import { GovernanceDataContext } from './GovernanceDataContext'
import type { GovernanceDataValue } from './GovernanceDataContext'
import type {
  GovernanceRecord,
  GovernanceDecision,
  GovernanceOfficer,
  GovernanceShareholder,
} from './data/types'

const EMPTY: Pick<GovernanceDataValue, 'records' | 'decisions' | 'officers' | 'shareholders' | 'loading' | 'error'> = {
  records: [],
  decisions: [],
  officers: [],
  shareholders: [],
  loading: false,
  error: null,
}

export function GovernanceDataProvider({
  mode,
  children,
}: {
  readonly mode: 'demo' | 'production'
  readonly children: ReactNode
}) {
  const { organizationId } = useWorkspaceMode()
  const [value, setValue] = useState<
    Pick<GovernanceDataValue, 'records' | 'decisions' | 'officers' | 'shareholders' | 'loading' | 'error'>
  >(() =>
    mode === 'demo'
      ? {
          records: fixtures.records,
          decisions: fixtures.decisions,
          officers: fixtures.officers,
          shareholders: fixtures.shareholders,
          loading: false,
          error: null,
        }
      : { ...EMPTY, loading: true },
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
          ...EMPTY,
          error: err instanceof Error ? err.message : 'Could not load governance data.',
        })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [mode, organizationId])

  const addRecord = useCallback(
    async (record: GovernanceRecord) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, records: [record, ...prev.records] }))
        return
      }
      try {
        const created = await createGovernanceRecord(organizationId, {
          title: record.title,
          record_type: record.record_type,
          jurisdiction: record.jurisdiction,
          effective_date: record.effective_date,
          review_due_date: record.review_due_date,
          status: record.status,
          viewer_visible: record.viewer_visible,
          document_id: record.document_id,
          created_by: record.created_by,
        })
        setValue((prev) => ({ ...prev, records: [created, ...prev.records] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save record.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addDecision = useCallback(
    async (decision: GovernanceDecision) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, decisions: [decision, ...prev.decisions] }))
        return
      }
      try {
        const created = await createGovernanceDecision(organizationId, {
          title: decision.title,
          decision_date: decision.decision_date,
          decided_by: decision.decided_by,
          rationale: decision.rationale,
          status: decision.status,
          viewer_visible: decision.viewer_visible,
          related_record_id: decision.related_record_id,
          created_by: decision.created_by,
        })
        setValue((prev) => ({ ...prev, decisions: [created, ...prev.decisions] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save decision.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addOfficer = useCallback(
    async (officer: GovernanceOfficer) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, officers: [officer, ...prev.officers] }))
        return
      }
      try {
        const created = await createGovernanceOfficer(organizationId, {
          name: officer.name,
          role: officer.role,
          appointed_date: officer.appointed_date,
          resigned_date: officer.resigned_date,
          contact_email: officer.contact_email,
          is_active: officer.is_active,
          viewer_visible: officer.viewer_visible,
        })
        setValue((prev) => ({ ...prev, officers: [created, ...prev.officers] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save officer.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addShareholder = useCallback(
    async (shareholder: GovernanceShareholder) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, shareholders: [shareholder, ...prev.shareholders] }))
        return
      }
      try {
        const created = await createGovernanceShareholder(organizationId, {
          name: shareholder.name,
          share_class: shareholder.share_class,
          shares_issued: shareholder.shares_issued,
          issue_date: shareholder.issue_date,
          contact_email: shareholder.contact_email,
          viewer_visible: shareholder.viewer_visible,
        })
        setValue((prev) => ({ ...prev, shareholders: [created, ...prev.shareholders] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save shareholder.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateRecord = useCallback(
    async (record: GovernanceRecord) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          records: prev.records.map((r) => (r.id === record.id ? record : r)),
        }))
        return
      }
      try {
        const saved = await updateGovernanceRecord(record.id, {
          title: record.title,
          record_type: record.record_type,
          jurisdiction: record.jurisdiction,
          effective_date: record.effective_date,
          review_due_date: record.review_due_date,
          status: record.status,
          viewer_visible: record.viewer_visible,
          document_id: record.document_id,
          created_by: record.created_by,
        })
        setValue((prev) => ({
          ...prev,
          records: prev.records.map((r) => (r.id === saved.id ? saved : r)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update record.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateDecision = useCallback(
    async (decision: GovernanceDecision) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          decisions: prev.decisions.map((d) => (d.id === decision.id ? decision : d)),
        }))
        return
      }
      try {
        const saved = await updateGovernanceDecision(decision.id, {
          title: decision.title,
          decision_date: decision.decision_date,
          decided_by: decision.decided_by,
          rationale: decision.rationale,
          status: decision.status,
          viewer_visible: decision.viewer_visible,
          related_record_id: decision.related_record_id,
          created_by: decision.created_by,
        })
        setValue((prev) => ({
          ...prev,
          decisions: prev.decisions.map((d) => (d.id === saved.id ? saved : d)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update decision.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateOfficer = useCallback(
    async (officer: GovernanceOfficer) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          officers: prev.officers.map((o) => (o.id === officer.id ? officer : o)),
        }))
        return
      }
      try {
        const saved = await updateGovernanceOfficer(officer.id, {
          name: officer.name,
          role: officer.role,
          appointed_date: officer.appointed_date,
          resigned_date: officer.resigned_date,
          contact_email: officer.contact_email,
          is_active: officer.is_active,
          viewer_visible: officer.viewer_visible,
        })
        setValue((prev) => ({
          ...prev,
          officers: prev.officers.map((o) => (o.id === saved.id ? saved : o)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update officer.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateShareholder = useCallback(
    async (shareholder: GovernanceShareholder) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          shareholders: prev.shareholders.map((s) => (s.id === shareholder.id ? shareholder : s)),
        }))
        return
      }
      try {
        const saved = await updateGovernanceShareholder(shareholder.id, {
          name: shareholder.name,
          share_class: shareholder.share_class,
          shares_issued: shareholder.shares_issued,
          issue_date: shareholder.issue_date,
          contact_email: shareholder.contact_email,
          viewer_visible: shareholder.viewer_visible,
        })
        setValue((prev) => ({
          ...prev,
          shareholders: prev.shareholders.map((s) => (s.id === saved.id ? saved : s)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update shareholder.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeRecord = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, records: prev.records.filter((r) => r.id !== id) }))
        return
      }
      try {
        await deleteGovernanceRecord(id)
        setValue((prev) => ({ ...prev, records: prev.records.filter((r) => r.id !== id) }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove record.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeDecision = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, decisions: prev.decisions.filter((d) => d.id !== id) }))
        return
      }
      try {
        await deleteGovernanceDecision(id)
        setValue((prev) => ({ ...prev, decisions: prev.decisions.filter((d) => d.id !== id) }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove decision.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeOfficer = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, officers: prev.officers.filter((o) => o.id !== id) }))
        return
      }
      try {
        await deleteGovernanceOfficer(id)
        setValue((prev) => ({ ...prev, officers: prev.officers.filter((o) => o.id !== id) }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove officer.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeShareholder = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, shareholders: prev.shareholders.filter((s) => s.id !== id) }))
        return
      }
      try {
        await deleteGovernanceShareholder(id)
        setValue((prev) => ({ ...prev, shareholders: prev.shareholders.filter((s) => s.id !== id) }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove shareholder.',
        }))
      }
    },
    [mode, organizationId],
  )

  const stable = useMemo(
    () => ({
      records: value.records,
      decisions: value.decisions,
      officers: value.officers,
      shareholders: value.shareholders,
      loading: value.loading,
      error: value.error,
      addRecord,
      updateRecord,
      removeRecord,
      addDecision,
      updateDecision,
      removeDecision,
      addOfficer,
      updateOfficer,
      removeOfficer,
      addShareholder,
      updateShareholder,
      removeShareholder,
    }),
    [
      value,
      addRecord,
      updateRecord,
      removeRecord,
      addDecision,
      updateDecision,
      removeDecision,
      addOfficer,
      updateOfficer,
      removeOfficer,
      addShareholder,
      updateShareholder,
      removeShareholder,
    ],
  )

  return <GovernanceDataContext.Provider value={stable}>{children}</GovernanceDataContext.Provider>
}
