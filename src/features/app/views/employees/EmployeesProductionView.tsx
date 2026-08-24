import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Users } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { EMPLOYMENT_PROVINCES, addEmployee, listEmployees, removeEmployee } from './productionApi'
import type { ProductionEmployee, ProductionEmployeeStatus } from './productionApi'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Employees roster in production mode — the first module on real
 * persistence (public.employees, org-scoped RLS). Deliberately leaner than
 * the fixture roster: a list + add/remove. Org chart, filters, profiles and
 * Advisor hooks arrive as the real data model grows to support them.
 */

const STATUS_LABEL: Record<ProductionEmployeeStatus, (typeof M)[keyof typeof M]> = {
  active: M.employees_prod_status_active,
  on_leave: M.employees_prod_status_on_leave,
  terminated: M.employees_prod_status_terminated,
}

const STATUS_TONE: Record<ProductionEmployeeStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  on_leave: 'warning',
  terminated: 'neutral',
}

const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const EMPTY_FORM = { name: '', title: '', email: '', province: 'Ontario', startDate: '' }

export function EmployeesProductionView() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const { organizationId, isOrgAdmin } = useWorkspaceMode()

  const [rows, setRows] = useState<ProductionEmployee[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoadFailed(false)
    try {
      setRows(await listEmployees(organizationId))
    } catch {
      setRows([])
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  /* The org is provisioned when the admin first switches to production —
     null here means that bootstrap failed or is still resolving. */
  if (!organizationId) {
    return <ProductionEmptyState title={x(M.employees_prod_empty_title)} />
  }

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!form.name.trim() || saving) return
    setSaving(true)
    try {
      const added = await addEmployee(organizationId, { ...form, name: form.name.trim() })
      setRows((prev) => [...(prev ?? []), added].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(EMPTY_FORM)
      setFormOpen(false)
      showToast(M.employees_prod_added, 'ok')
    } catch {
      showToast(M.employees_prod_add_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onRemove = async (emp: ProductionEmployee) => {
    try {
      await removeEmployee(emp.id)
      setRows((prev) => (prev ?? []).filter((r) => r.id !== emp.id))
      showToast(M.employees_prod_removed, 'ok')
    } catch {
      showToast(M.employees_prod_remove_failed, 'info')
    }
  }

  const count = rows?.length ?? 0
  const countLabel = `${count} ${x(count === 1 ? M.employees_prod_count_one : M.employees_prod_count_many)}`

  return (
    <AppPage width="default">
        <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[16px]">
          <div className="text-[13px] text-text-muted">
            {rows === null ? x(M.employees_prod_loading) : countLabel}
          </div>
          {!formOpen && isOrgAdmin && (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              {x(M.employees_prod_add)}
            </button>
          )}
        </div>

        {loadFailed && (
          <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
            <span className="text-[13px] text-risk-fg">{x(M.employees_prod_error)}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
            >
              {x(M.employees_prod_retry)}
            </button>
          </div>
        )}

        {formOpen && (
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="mb-[18px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]"
          >
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <div>
                <label htmlFor="emp-name" className={labelClass}>
                  {x(M.employees_prod_name)}
                </label>
                <input
                  id="emp-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="emp-title" className={labelClass}>
                  {x(M.employees_prod_title)}
                </label>
                <input
                  id="emp-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="emp-email" className={labelClass}>
                  {x(M.employees_prod_email)}
                </label>
                <input
                  id="emp-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="emp-province" className={labelClass}>
                  {x(M.employees_prod_province)}
                </label>
                <select
                  id="emp-province"
                  value={form.province}
                  onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                  className={inputClass}
                >
                  {EMPLOYMENT_PROVINCES.map((prov) => (
                    <option key={prov.en} value={prov.en}>
                      {pick(prov, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="emp-start" className={labelClass}>
                  {x(M.employees_prod_start_date)}
                </label>
                <input
                  id="emp-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
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
                {x(M.employees_prod_save)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false)
                  setForm(EMPTY_FORM)
                }}
                className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
              >
                {x(M.employees_prod_cancel)}
              </button>
            </div>
          </form>
        )}

        {rows !== null && rows.length === 0 && !loadFailed && !formOpen && (
          <div className="rounded-[12px] border border-border bg-surface px-[24px] py-[40px] text-center">
            <div className="mx-auto mb-[14px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-inset">
              <Users size={20} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
            </div>
            <div className="mb-[6px] text-[15px] font-semibold text-text">
              {x(M.employees_prod_empty_title)}
            </div>
            <p className="m-0 text-[13px] text-text-muted">{x(M.employees_prod_empty_body)}</p>
          </div>
        )}

        {rows !== null && rows.length > 0 && (
          <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
            {rows.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center gap-[12px] border-t border-inset px-[18px] py-[13px] first:border-t-0"
              >
                <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">
                  {initialsOf(emp.name)}
                </div>
                <Link to={`/app/employees/${emp.id}`} className="min-w-0 flex-1 hover:opacity-80">
                  <div className="truncate text-[13.5px] font-semibold text-text">{emp.name}</div>
                  <div className="truncate text-[12px] text-text-muted">
                    {[emp.title, emp.province].filter(Boolean).join(' · ')}
                  </div>
                </Link>
                <span className={statusChipClass(STATUS_TONE[emp.status])}>
                  {x(STATUS_LABEL[emp.status])}
                </span>
                {isOrgAdmin && (
                  <button
                    type="button"
                    onClick={() => void onRemove(emp)}
                    aria-label={`${x(M.employees_prod_remove)} — ${emp.name}`}
                    className="cursor-pointer border-none bg-transparent p-[6px] text-text-muted hover:text-risk-fg"
                  >
                    <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
    </AppPage>
  )
}
