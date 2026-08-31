import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import { casesMessages as M } from '@/i18n/messages/cases'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { useOpenCreateFormFromQuery } from '@/features/app/workspaceMode/useOpenCreateFormFromQuery'
import {
  EMPLOYMENT_JURISDICTIONS,
  listEmployees,
} from '@/features/app/views/employees/productionApi'
import type { ProductionEmployee } from '@/features/app/views/employees/productionApi'
import {
  PRODUCTION_CASE_STATUSES,
  PRODUCTION_CASE_TYPES,
  addCase,
  listCases,
  removeCase,
  updateCaseStatus,
} from './productionApi'
import type { ProductionCase, ProductionCaseStatus, ProductionCaseType } from './productionApi'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Case Files in production mode — real persistence on public.hr_cases
 * (migration 0007), linked to the real employee roster. Lean by design:
 * list + create + status + remove. The demo view's risk assessments, step
 * progress and Advisor integrations return as the real data model grows.
 */

const TYPE_LABEL: Record<ProductionCaseType, (typeof M)[keyof typeof M]> = {
  Termination: M.cases_prod_type_termination,
  Performance: M.cases_prod_type_performance,
  Accommodation: M.cases_prod_type_accommodation,
  Onboarding: M.cases_prod_type_onboarding,
}

const STATUS_LABEL: Record<ProductionCaseStatus, (typeof M)[keyof typeof M]> = {
  open: M.cases_prod_status_open,
  in_review: M.cases_prod_status_in_review,
  resolved: M.cases_prod_status_resolved,
}

const STATUS_TONE: Record<ProductionCaseStatus, 'info' | 'warning' | 'success'> = {
  open: 'info',
  in_review: 'warning',
  resolved: 'success',
}

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const EMPTY_FORM = {
  title: '',
  caseType: 'Performance' as ProductionCaseType,
  employeeId: '',
  jurisdiction: 'Ontario',
  dueDate: '',
}

export function CasesProductionView() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const { organizationId } = useWorkspaceMode()

  const [rows, setRows] = useState<ProductionCase[] | null>(null)
  const [employees, setEmployees] = useState<ProductionEmployee[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const { formOpen, setFormOpen } = useOpenCreateFormFromQuery(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoadFailed(false)
    try {
      const [caseRows, employeeRows] = await Promise.all([
        listCases(organizationId),
        listEmployees(organizationId),
      ])
      setRows(caseRows)
      setEmployees(employeeRows)
    } catch {
      setRows([])
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.cases_prod_empty_title)} />
  }

  const employeeName = (id: string | null): string | null =>
    id === null ? null : (employees.find((e) => e.id === id)?.name ?? null)

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!form.title.trim() || saving) return
    setSaving(true)
    try {
      const added = await addCase(organizationId, { ...form, title: form.title.trim() })
      setRows((prev) => [added, ...(prev ?? [])])
      setForm(EMPTY_FORM)
      setFormOpen(false)
      showToast(M.cases_prod_added, 'ok')
    } catch {
      showToast(M.cases_prod_add_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onStatusChange = async (caze: ProductionCase, status: ProductionCaseStatus) => {
    try {
      await updateCaseStatus(caze.id, status)
      setRows((prev) => (prev ?? []).map((r) => (r.id === caze.id ? { ...r, status } : r)))
      showToast(M.cases_prod_status_updated, 'ok')
    } catch {
      showToast(M.cases_prod_status_update_failed, 'info')
    }
  }

  const onRemove = async (caze: ProductionCase) => {
    try {
      await removeCase(caze.id)
      setRows((prev) => (prev ?? []).filter((r) => r.id !== caze.id))
      showToast(M.cases_prod_removed, 'ok')
    } catch {
      showToast(M.cases_prod_remove_failed, 'info')
    }
  }

  const count = rows?.length ?? 0
  const countLabel = `${count} ${x(count === 1 ? M.cases_prod_count_one : M.cases_prod_count_many)}`

  return (
    <AppPage width="comfort">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[16px]">
        <div className="text-[13px] text-text-muted">
          {rows === null ? x(M.cases_prod_loading) : countLabel}
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            {x(M.cases_prod_new)}
          </button>
        )}
      </div>

      {loadFailed && (
        <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
          <span className="text-[13px] text-risk-fg">{x(M.cases_prod_error)}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
          >
            {x(M.cases_prod_retry)}
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
              <label htmlFor="case-title" className={labelClass}>
                {x(M.cases_prod_title_label)}
              </label>
              <input
                id="case-title"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="case-type" className={labelClass}>
                {x(M.cases_prod_type)}
              </label>
              <select
                id="case-type"
                value={form.caseType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, caseType: e.target.value as ProductionCaseType }))
                }
                className={inputClass}
              >
                {PRODUCTION_CASE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {x(TYPE_LABEL[t])}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="case-employee" className={labelClass}>
                {x(M.cases_prod_employee)}
              </label>
              <select
                id="case-employee"
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                className={inputClass}
              >
                <option value="">{x(M.cases_prod_employee_none)}</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="case-jurisdiction" className={labelClass}>
                {x(M.cases_prod_jurisdiction)}
              </label>
              <select
                id="case-jurisdiction"
                value={form.jurisdiction}
                onChange={(e) => setForm((f) => ({ ...f, jurisdiction: e.target.value }))}
                className={inputClass}
              >
                {EMPLOYMENT_JURISDICTIONS.map((jur) => (
                  <option key={jur.en} value={jur.en}>
                    {pick(jur, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="case-due" className={labelClass}>
                {x(M.cases_prod_due)}
              </label>
              <input
                id="case-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
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
              {x(M.cases_prod_save)}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false)
                setForm(EMPTY_FORM)
              }}
              className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
            >
              {x(M.cases_prod_cancel)}
            </button>
          </div>
        </form>
      )}

      {rows !== null && rows.length === 0 && !loadFailed && !formOpen && (
        <div className="rounded-[12px] border border-border bg-surface px-[24px] py-[40px] text-center">
          <div className="mx-auto mb-[14px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-inset">
            <FolderOpen
              size={20}
              strokeWidth={1.7}
              className="text-text-muted"
              aria-hidden="true"
            />
          </div>
          <div className="mb-[6px] text-[15px] font-semibold text-text">
            {x(M.cases_prod_empty_title)}
          </div>
          <p className="m-0 mb-[16px] text-[13px] text-text-muted">{x(M.cases_prod_empty_body)}</p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            {x(M.cases_prod_new)}
          </button>
        </div>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {rows.map((caze) => (
            <div
              key={caze.id}
              className="flex flex-wrap items-center gap-[12px] border-t border-inset px-[18px] py-[13px] first:border-t-0"
            >
              <Link
                to={`/app/cases/${caze.id}`}
                className="min-w-0 flex-1 basis-[240px] hover:opacity-80"
              >
                <div className="truncate text-[13.5px] font-semibold text-text">{caze.title}</div>
                <div className="truncate text-[12px] text-text-muted">
                  {[
                    x(TYPE_LABEL[caze.caseType]),
                    employeeName(caze.employeeId),
                    caze.jurisdiction,
                    caze.dueDate,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </Link>
              <span className={statusChipClass(STATUS_TONE[caze.status])}>
                {x(STATUS_LABEL[caze.status])}
              </span>
              <select
                value={caze.status}
                onChange={(e) => void onStatusChange(caze, e.target.value as ProductionCaseStatus)}
                aria-label={`${x(M.cases_prod_status_aria)} — ${caze.title}`}
                className="cursor-pointer rounded-[8px] border border-border bg-surface px-[8px] py-[5px] font-sans text-[12px] text-text"
              >
                {PRODUCTION_CASE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {x(STATUS_LABEL[s])}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void onRemove(caze)}
                aria-label={`${x(M.cases_prod_remove)} — ${caze.title}`}
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
