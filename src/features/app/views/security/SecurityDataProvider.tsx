import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  listSecurityAssets,
  listSecurityAccessReviews,
  listSecurityIncidents,
  listSecurityRisks,
  listSecurityVendorReviews,
  createSecurityAsset,
  createSecurityAccessReview,
  createSecurityIncident,
  createSecurityRisk,
  createSecurityVendorReview,
  updateSecurityAsset,
  updateSecurityAccessReview,
  updateSecurityIncident,
  updateSecurityRisk,
  updateSecurityVendorReview,
  deleteSecurityAsset,
  deleteSecurityAccessReview,
  deleteSecurityIncident,
  deleteSecurityRisk,
  deleteSecurityVendorReview,
} from './data/productionApi'
import { securitySummary as fixtures } from './data/fixtures'
import { SecurityDataContext } from './SecurityDataContext'
import type { SecurityDataValue } from './SecurityDataContext'
import type {
  SecurityAsset,
  SecurityAccessReview,
  SecurityIncident,
  SecurityRisk,
  SecurityVendorReview,
} from './data/types'

const EMPTY: Pick<SecurityDataValue, 'assets' | 'accessReviews' | 'incidents' | 'risks' | 'vendorReviews' | 'loading' | 'error'> = {
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
  const [value, setValue] = useState<
    Pick<SecurityDataValue, 'assets' | 'accessReviews' | 'incidents' | 'risks' | 'vendorReviews' | 'loading' | 'error'>
  >(() =>
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

  const addAsset = useCallback(
    async (asset: SecurityAsset) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, assets: [asset, ...prev.assets] }))
        return
      }
      try {
        const created = await createSecurityAsset(organizationId, {
          name: asset.name,
          asset_type: asset.asset_type,
          owner_id: asset.owner_id,
          status: asset.status,
          criticality: asset.criticality,
          renewal_date: asset.renewal_date,
          notes: asset.notes,
        })
        setValue((prev) => ({ ...prev, assets: [created, ...prev.assets] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save asset.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addAccessReview = useCallback(
    async (review: SecurityAccessReview) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, accessReviews: [review, ...prev.accessReviews] }))
        return
      }
      try {
        const created = await createSecurityAccessReview(organizationId, {
          title: review.title,
          assigned_to: review.assigned_to,
          reviewer_id: review.reviewer_id,
          review_due_date: review.review_due_date,
          completed_date: review.completed_date,
          status: review.status,
          findings: review.findings,
          created_by: review.created_by,
        })
        setValue((prev) => ({ ...prev, accessReviews: [created, ...prev.accessReviews] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save access review.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addIncident = useCallback(
    async (incident: SecurityIncident) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, incidents: [incident, ...prev.incidents] }))
        return
      }
      try {
        const created = await createSecurityIncident(organizationId, {
          title: incident.title,
          severity: incident.severity,
          status: incident.status,
          reported_by: incident.reported_by,
          assigned_to: incident.assigned_to,
          reported_at: incident.reported_at,
          resolved_at: incident.resolved_at,
          summary: incident.summary,
          impact: incident.impact,
          remediation: incident.remediation,
          created_by: incident.created_by,
        })
        setValue((prev) => ({ ...prev, incidents: [created, ...prev.incidents] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save incident.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addRisk = useCallback(
    async (risk: SecurityRisk) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, risks: [risk, ...prev.risks] }))
        return
      }
      try {
        const created = await createSecurityRisk(organizationId, {
          title: risk.title,
          likelihood: risk.likelihood,
          impact: risk.impact,
          owner: risk.owner,
          mitigation: risk.mitigation,
          status: risk.status,
        })
        setValue((prev) => ({ ...prev, risks: [created, ...prev.risks] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save risk.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addVendorReview = useCallback(
    async (review: SecurityVendorReview) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, vendorReviews: [review, ...prev.vendorReviews] }))
        return
      }
      try {
        const created = await createSecurityVendorReview(organizationId, {
          vendor_name: review.vendor_name,
          vendor_type: review.vendor_type,
          privacy_agreement: review.privacy_agreement,
          security_review_date: review.security_review_date,
          next_review_date: review.next_review_date,
          notes: review.notes,
        })
        setValue((prev) => ({ ...prev, vendorReviews: [created, ...prev.vendorReviews] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save vendor review.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateAsset = useCallback(
    async (asset: SecurityAsset) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          assets: prev.assets.map((a) => (a.id === asset.id ? asset : a)),
        }))
        return
      }
      try {
        const saved = await updateSecurityAsset(asset.id, {
          name: asset.name,
          asset_type: asset.asset_type,
          owner_id: asset.owner_id,
          status: asset.status,
          criticality: asset.criticality,
          renewal_date: asset.renewal_date,
          notes: asset.notes,
        })
        setValue((prev) => ({
          ...prev,
          assets: prev.assets.map((a) => (a.id === saved.id ? saved : a)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update asset.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateAccessReview = useCallback(
    async (review: SecurityAccessReview) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          accessReviews: prev.accessReviews.map((r) => (r.id === review.id ? review : r)),
        }))
        return
      }
      try {
        const saved = await updateSecurityAccessReview(review.id, {
          title: review.title,
          assigned_to: review.assigned_to,
          reviewer_id: review.reviewer_id,
          review_due_date: review.review_due_date,
          completed_date: review.completed_date,
          status: review.status,
          findings: review.findings,
          created_by: review.created_by,
        })
        setValue((prev) => ({
          ...prev,
          accessReviews: prev.accessReviews.map((r) => (r.id === saved.id ? saved : r)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update access review.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateIncident = useCallback(
    async (incident: SecurityIncident) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          incidents: prev.incidents.map((i) => (i.id === incident.id ? incident : i)),
        }))
        return
      }
      try {
        const saved = await updateSecurityIncident(incident.id, {
          title: incident.title,
          severity: incident.severity,
          status: incident.status,
          reported_by: incident.reported_by,
          assigned_to: incident.assigned_to,
          reported_at: incident.reported_at,
          resolved_at: incident.resolved_at,
          summary: incident.summary,
          impact: incident.impact,
          remediation: incident.remediation,
          created_by: incident.created_by,
        })
        setValue((prev) => ({
          ...prev,
          incidents: prev.incidents.map((i) => (i.id === saved.id ? saved : i)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update incident.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateRisk = useCallback(
    async (risk: SecurityRisk) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          risks: prev.risks.map((r) => (r.id === risk.id ? risk : r)),
        }))
        return
      }
      try {
        const saved = await updateSecurityRisk(risk.id, {
          title: risk.title,
          likelihood: risk.likelihood,
          impact: risk.impact,
          owner: risk.owner,
          mitigation: risk.mitigation,
          status: risk.status,
        })
        setValue((prev) => ({
          ...prev,
          risks: prev.risks.map((r) => (r.id === saved.id ? saved : r)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update risk.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeAsset = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, assets: prev.assets.filter((a) => a.id !== id) }))
        return
      }
      try {
        await deleteSecurityAsset(id)
        setValue((prev) => ({ ...prev, assets: prev.assets.filter((a) => a.id !== id) }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove asset.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeAccessReview = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, accessReviews: prev.accessReviews.filter((r) => r.id !== id) }))
        return
      }
      try {
        await deleteSecurityAccessReview(id)
        setValue((prev) => ({ ...prev, accessReviews: prev.accessReviews.filter((r) => r.id !== id) }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove access review.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeIncident = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, incidents: prev.incidents.filter((i) => i.id !== id) }))
        return
      }
      try {
        await deleteSecurityIncident(id)
        setValue((prev) => ({ ...prev, incidents: prev.incidents.filter((i) => i.id !== id) }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove incident.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeRisk = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, risks: prev.risks.filter((r) => r.id !== id) }))
        return
      }
      try {
        await deleteSecurityRisk(id)
        setValue((prev) => ({ ...prev, risks: prev.risks.filter((r) => r.id !== id) }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove risk.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeVendorReview = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, vendorReviews: prev.vendorReviews.filter((r) => r.id !== id) }))
        return
      }
      try {
        await deleteSecurityVendorReview(id)
        setValue((prev) => ({ ...prev, vendorReviews: prev.vendorReviews.filter((r) => r.id !== id) }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove vendor review.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateVendorReview = useCallback(
    async (review: SecurityVendorReview) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          vendorReviews: prev.vendorReviews.map((r) => (r.id === review.id ? review : r)),
        }))
        return
      }
      try {
        const saved = await updateSecurityVendorReview(review.id, {
          vendor_name: review.vendor_name,
          vendor_type: review.vendor_type,
          privacy_agreement: review.privacy_agreement,
          security_review_date: review.security_review_date,
          next_review_date: review.next_review_date,
          notes: review.notes,
        })
        setValue((prev) => ({
          ...prev,
          vendorReviews: prev.vendorReviews.map((r) => (r.id === saved.id ? saved : r)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update vendor review.',
        }))
      }
    },
    [mode, organizationId],
  )

  const stable = useMemo(
    () => ({
      assets: value.assets,
      accessReviews: value.accessReviews,
      incidents: value.incidents,
      risks: value.risks,
      vendorReviews: value.vendorReviews,
      loading: value.loading,
      error: value.error,
      addAsset,
      updateAsset,
      removeAsset,
      addAccessReview,
      updateAccessReview,
      removeAccessReview,
      addIncident,
      updateIncident,
      removeIncident,
      addRisk,
      updateRisk,
      removeRisk,
      addVendorReview,
      updateVendorReview,
      removeVendorReview,
    }),
    [
      value,
      addAsset,
      updateAsset,
      removeAsset,
      addAccessReview,
      updateAccessReview,
      removeAccessReview,
      addIncident,
      updateIncident,
      removeIncident,
      addRisk,
      updateRisk,
      removeRisk,
      addVendorReview,
      updateVendorReview,
      removeVendorReview,
    ],
  )

  return <SecurityDataContext.Provider value={stable}>{children}</SecurityDataContext.Provider>
}
