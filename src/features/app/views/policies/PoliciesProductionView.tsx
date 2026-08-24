import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { policiesMessages as M } from '@/i18n/messages/policies'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import {
  PRODUCTION_POLICY_STATUSES,
  addPolicy,
  listPolicies,
  removePolicy,
  setPolicyStatus,
} from './productionApi'
import type { ProductionPolicy, ProductionPolicyStatus } from './productionApi'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Policy register in production mode — real persistence on
 * public.hr_policies (migration 0008). Rows are written policies (up to
 * date / needs review) or known gaps (missing); setting a policy back to
 * "Up to date" stamps its last-reviewed date to today. The demo view's
 * Advisor review rail and Document Studio drafting return as those flows
 * gain real backends.
 */

const STATUS_LABEL: Record<ProductionPolicyStatus, (typeof M)[keyof typeof M]> = {
  up_to_date: M.policies_prod_status_up_to_date,
  needs_review: M.policies_prod_status_needs_review,
  missing: M.policies_prod_status_missing,
}

const STATUS_TONE: Record<ProductionPolicyStatus, 'success' | 'warning' | 'risk'> = {
  up_to_date: 'success',
  needs_review: 'warning',
  missing: 'risk',
}

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const EMPTY_FORM = {
  name: '',
  status: 'up_to_date' as ProductionPolicyStatus,
  lastReviewed: '',
}

/** Today as YYYY-MM-DD (local) — the "reviewed on" stamp for up_to_date transitions. */
const today = (): string => new Date().toISOString().slice(0, 10)

export function PoliciesProductionView() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const { organizationId } = useWorkspaceMode()

  const [rows, setRows] = useState<ProductionPolicy[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoadFailed(false)
    try {
      setRows(await listPolicies(organizationId))
    } catch {
      setRows([])
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.policies_prod_empty_title)} />
  }

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!form.name.trim() || saving) return
    setSaving(true)
    try {
      const added = await addPolicy(organizationId, { ...form, name: form.name.trim() })
      setRows((prev) => [...(prev ?? []), added].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(EMPTY_FORM)
      setFormOpen(false)
      showToast(M.policies_prod_added, 'ok')
    } catch {
      showToast(M.policies_prod_add_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onStatusChange = async (policy: ProductionPolicy, status: ProductionPolicyStatus) => {
    const reviewedOn = status === 'up_to_date' ? today() : undefined
    try {
      await setPolicyStatus(policy.id, status, reviewedOn)
      setRows((prev) =>
        (prev ?? []).map((r) =>
          r.id === policy.id ? { ...r, status, lastReviewed: reviewedOn ?? r.lastReviewed } : r,
        ),
      )
      showToast(M.policies_prod_status_updated, 'ok')
    } catch {
      showToast(M.policies_prod_status_update_failed, 'info')
    }
  }

  const onRemove = async (policy: ProductionPolicy) => {
    try {
      await removePolicy(policy.id)
      setRows((prev) => (prev ?? []).filter((r) => r.id !== policy.id))
      showToast(M.policies_prod_removed, 'ok')
    } catch {
      showToast(M.policies_prod_remove_failed, 'info')
    }
  }

  const count = rows?.length ?? 0
  const countLabel = `${count} ${x(count === 1 ? M.policies_prod_count_one : M.policies_prod_count_many)}`

  return (
    <AppPage width="comfort">
        <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[16px]">
          <div className="text-[13px] text-text-muted">
            {rows === null ? x(M.policies_prod_loading) : countLabel}
          </div>
          {!formOpen && (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              {x(M.policies_prod_add)}
            </button>
          )}
        </div>

        {loadFailed && (
          <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
            <span className="text-[13px] text-risk-fg">{x(M.policies_prod_error)}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
            >
              {x(M.policies_prod_retry)}
            </button>
          </div>
        )}

        {formOpen && (
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="mb-[18px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]"
          >
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="policy-name" className={labelClass}>
                  {x(M.policies_prod_name)}
                </label>
                <input
                  id="policy-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="policy-status" className={labelClass}>
                  {x(M.policies_prod_status)}
                </label>
                <select
                  id="policy-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as ProductionPolicyStatus }))
                  }
                  className={inputClass}
                >
                  {PRODUCTION_POLICY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {x(STATUS_LABEL[s])}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="policy-reviewed" className={labelClass}>
                  {x(M.policies_prod_last_reviewed)}
                </label>
                <input
                  id="policy-reviewed"
                  type="date"
                  value={form.lastReviewed}
                  onChange={(e) => setForm((f) => ({ ...f, lastReviewed: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-[16px] flex gap-[8px]">
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {x(M.policies_prod_save)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false)
                  setForm(EMPTY_FORM)
                }}
                className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
              >
                {x(M.policies_prod_cancel)}
              </button>
            </div>
          </form>
        )}

        {rows !== null && rows.length === 0 && !loadFailed && !formOpen && (
          <div className="rounded-[12px] border border-border bg-surface px-[24px] py-[40px] text-center">
            <div className="mx-auto mb-[14px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-inset">
              <BookOpen
                size={20}
                strokeWidth={1.7}
                className="text-text-muted"
                aria-hidden="true"
              />
            </div>
            <div className="mb-[6px] text-[15px] font-semibold text-text">
              {x(M.policies_prod_empty_title)}
            </div>
            <p className="m-0 text-[13px] text-text-muted">{x(M.policies_prod_empty_body)}</p>
          </div>
        )}

        {rows !== null && rows.length > 0 && (
          <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
            {rows.map((policy) => (
              <div
                key={policy.id}
                className="flex flex-wrap items-center gap-[12px] border-t border-inset px-[18px] py-[13px] first:border-t-0"
              >
                <div className="min-w-0 flex-1 basis-[220px]">
                  <div className="truncate text-[13.5px] font-semibold text-text">
                    {policy.name}
                  </div>
                  {policy.lastReviewed && (
                    <div className="mt-[2px] text-[12px] text-text-muted">
                      {x(M.policies_prod_reviewed_prefix)}
                      {policy.lastReviewed}
                    </div>
                  )}
                </div>
                <span className={statusChipClass(STATUS_TONE[policy.status])}>
                  {x(STATUS_LABEL[policy.status])}
                </span>
                <select
                  value={policy.status}
                  onChange={(e) =>
                    void onStatusChange(policy, e.target.value as ProductionPolicyStatus)
                  }
                  aria-label={`${x(M.policies_prod_status_aria)} — ${policy.name}`}
                  className="cursor-pointer rounded-[8px] border border-border bg-surface px-[8px] py-[5px] font-sans text-[12px] text-text"
                >
                  {PRODUCTION_POLICY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {x(STATUS_LABEL[s])}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void onRemove(policy)}
                  aria-label={`${x(M.policies_prod_remove)} — ${policy.name}`}
                  className="cursor-pointer border-none bg-transparent p-[6px] text-text-muted hover:text-risk-fg"
                >
                  <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
    </AppPage>
  )
}
