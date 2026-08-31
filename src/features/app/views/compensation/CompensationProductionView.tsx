import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Banknote, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { compensationMessages as M } from '@/i18n/messages/compensation'
import { money } from '@/lib/money'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ModuleEmptyBlock } from '@/features/app/workspaceMode/ModuleEmptyBlock'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { listEmployees } from '@/features/app/views/employees/productionApi'
import type { ProductionEmployee } from '@/features/app/views/employees/productionApi'
import {
  addCompensationRecord,
  deltaFromMidpoint,
  listCompensationRecords,
  removeCompensationRecord,
  updateCompensationRecord,
} from './productionApi'
import type { ProductionCompensationRecord } from './productionApi'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Compensation in production mode — real persistence on
 * public.hr_compensation_records (migration 0039).
 *
 * **The demo's "vs market" column is gone and does not come back.** Dutiva
 * has no salary-survey source, so a market figure here would be one the
 * product invented and an employer quoted in a pay conversation. The
 * comparison is against the employer's own band midpoint, shown only for
 * records that have one — `deltaFromMidpoint` returns null otherwise, and
 * null renders as "No midpoint set" rather than 0%.
 *
 * The restricted banner is kept because migration 0039 actually enforces it:
 * unlike the other HR tables, select is admin-only here. The demo's audit-log
 * claim is not kept, because no audit log covers this module yet.
 */

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const EMPTY_FORM = {
  employeeId: '',
  baseSalary: '',
  band: '',
  bandMidpoint: '',
  effectiveDate: '',
  note: '',
}

function recordToForm(record: ProductionCompensationRecord) {
  return {
    employeeId: record.employeeId,
    baseSalary: String(record.baseSalary),
    band: record.band ?? '',
    bandMidpoint: record.bandMidpoint !== null ? String(record.bandMidpoint) : '',
    effectiveDate: record.effectiveDate ?? '',
    note: record.note ?? '',
  }
}

export function CompensationProductionView() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const { organizationId } = useWorkspaceMode()

  const [rows, setRows] = useState<ProductionCompensationRecord[] | null>(null)
  const [people, setPeople] = useState<ProductionEmployee[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoadFailed(false)
    try {
      const [records, roster] = await Promise.all([
        listCompensationRecords(organizationId),
        listEmployees(organizationId),
      ])
      setRows(records)
      setPeople(roster)
    } catch {
      setRows([])
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.comp_prod_empty_title)} />
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    const salary = Number(form.baseSalary)
    if (!Number.isFinite(salary) || salary < 0 || saving) return
    if (!editingId && !form.employeeId) return
    setSaving(true)
    try {
      if (editingId) {
        const updated = await updateCompensationRecord(editingId, {
          baseSalary: salary,
          band: form.band,
          bandMidpoint: form.bandMidpoint,
          effectiveDate: form.effectiveDate,
          note: form.note,
        })
        setRows((prev) => (prev ?? []).map((r) => (r.id === editingId ? updated : r)))
        showToast(M.comp_prod_updated, 'ok')
      } else {
        const added = await addCompensationRecord(organizationId, { ...form, baseSalary: salary })
        setRows((prev) => [...(prev ?? []), added])
        showToast(M.comp_prod_added, 'ok')
      }
      closeForm()
    } catch {
      showToast(editingId ? M.comp_prod_update_failed : M.comp_prod_add_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (record: ProductionCompensationRecord) => {
    setPendingDeleteId(null)
    setEditingId(record.id)
    setForm(recordToForm(record))
    setFormOpen(true)
  }

  const onRemove = async (record: ProductionCompensationRecord) => {
    try {
      await removeCompensationRecord(record.id)
      setRows((prev) => (prev ?? []).filter((r) => r.id !== record.id))
      setPendingDeleteId(null)
      showToast(M.comp_prod_removed, 'ok')
    } catch {
      showToast(M.comp_prod_remove_failed, 'info')
    }
  }

  const list = rows ?? []
  const totalPayroll = list.reduce((sum, r) => sum + r.baseSalary, 0)
  const belowMidpoint = list.filter((r) => {
    const delta = deltaFromMidpoint(r)
    return delta !== null && delta < 0
  }).length
  const count = list.length
  const countLabel = `${count} ${x(count === 1 ? M.comp_prod_count_one : M.comp_prod_count_many)}`

  const recorded = new Set(list.map((r) => r.employeeId))
  const selectable = people.filter((p) => !recorded.has(p.id))
  const editingRecord = editingId ? list.find((r) => r.id === editingId) : undefined

  return (
    <AppPage width="default">
      <div className="mb-[18px] flex items-start gap-[8px] rounded-[10px] border border-gold-border bg-gold-bg px-[14px] py-[11px]">
        <Lock
          size={14}
          strokeWidth={1.8}
          className="mt-px shrink-0 text-gold-fg"
          aria-hidden="true"
        />
        <span className="text-[12.5px] leading-[1.55] font-semibold text-gold-fg">
          {x(M.comp_prod_banner)}
        </span>
      </div>

      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[16px]">
        <div className="text-[13px] text-text-muted">
          {rows === null ? x(M.comp_prod_loading) : countLabel}
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(EMPTY_FORM)
              setFormOpen(true)
            }}
            disabled={selectable.length === 0}
            className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            {x(M.comp_prod_add)}
          </button>
        )}
      </div>

      {loadFailed && (
        <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
          <span className="text-[13px] text-risk-fg">{x(M.comp_prod_error)}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
          >
            {x(M.comp_prod_retry)}
          </button>
        </div>
      )}

      {rows !== null && people.length === 0 && !loadFailed && (
        <div className="mb-[14px] rounded-[11px] border border-border bg-inset px-[16px] py-[12px] text-[13px] text-text-3">
          {x(M.comp_prod_no_employees)}
        </div>
      )}

      {count > 0 && (
        <div className="mb-[22px] flex flex-wrap gap-[14px]">
          <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
            <div className="font-display text-[26px] font-bold text-text">
              ${Math.round(totalPayroll / 1000)}K
            </div>
            <div className="mt-[2px] text-[12.5px] text-text-muted">
              {x(M.comp_prod_total_payroll)}
            </div>
          </div>
          <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
            <div className="font-display text-[26px] font-bold text-gold-dot">{belowMidpoint}</div>
            <div className="mt-[2px] text-[12.5px] text-text-muted">
              {x(M.comp_prod_below_midpoint)}
            </div>
          </div>
          <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
            <div className="font-display text-[26px] font-bold text-text">{count}</div>
            <div className="mt-[2px] text-[12.5px] text-text-muted">{x(M.comp_prod_records)}</div>
          </div>
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mb-[18px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]"
        >
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            {editingId && editingRecord ? (
              <div className="sm:col-span-2">
                <div className={labelClass}>{x(M.comp_prod_employee)}</div>
                <div className="text-[13.5px] font-semibold text-text">
                  {editingRecord.employeeName}
                </div>
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label htmlFor="comp-employee" className={labelClass}>
                  {x(M.comp_prod_employee)}
                </label>
                <select
                  id="comp-employee"
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {selectable.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="comp-salary" className={labelClass}>
                {x(M.comp_prod_base_salary)}
              </label>
              <input
                id="comp-salary"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.baseSalary}
                onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="comp-band" className={labelClass}>
                {x(M.comp_prod_band)}
              </label>
              <input
                id="comp-band"
                value={form.band}
                onChange={(e) => setForm((f) => ({ ...f, band: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="comp-midpoint" className={labelClass}>
                {x(M.comp_prod_band_midpoint)}
              </label>
              <input
                id="comp-midpoint"
                type="number"
                min="0"
                step="0.01"
                value={form.bandMidpoint}
                onChange={(e) => setForm((f) => ({ ...f, bandMidpoint: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="comp-effective" className={labelClass}>
                {x(M.comp_prod_effective_date)}
              </label>
              <input
                id="comp-effective"
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="comp-note" className={labelClass}>
                {x(M.comp_prod_note)}
              </label>
              <input
                id="comp-note"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
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
              {x(M.comp_prod_save)}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
            >
              {x(M.comp_prod_cancel)}
            </button>
          </div>
        </form>
      )}

      {rows !== null && count === 0 && !loadFailed && !formOpen && (
        <ModuleEmptyBlock
          icon={Banknote}
          title={x(M.comp_prod_empty_title)}
          body={x(M.comp_prod_empty_body)}
        />
      )}

      {count > 0 && (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          <div className="hidden border-b border-inset px-[18px] py-[10px] text-[11px] font-semibold uppercase tracking-[0.04em] text-text-faint sm:grid sm:grid-cols-[minmax(180px,1fr)_minmax(100px,auto)_minmax(100px,auto)_minmax(120px,auto)_auto] sm:gap-[12px]">
            <span>{x(M.comp_prod_employee)}</span>
            <span>{x(M.comp_prod_vs_midpoint)}</span>
            <span title={x(M.comp_prod_market_unavailable)}>{x(M.comp_prod_market_column)}</span>
            <span />
            <span />
          </div>
          {list.map((record) => {
            const delta = deltaFromMidpoint(record)
            return (
              <div
                key={record.id}
                className="border-t border-inset px-[18px] py-[13px] first:border-t-0 sm:grid sm:grid-cols-[minmax(180px,1fr)_minmax(100px,auto)_minmax(120px,auto)_minmax(120px,auto)_auto] sm:items-center sm:gap-[12px]"
              >
                <div className="min-w-0">
                  <Link
                    to={`/app/employees/${record.employeeId}`}
                    className="truncate text-[13.5px] font-semibold text-accent no-underline hover:underline"
                  >
                    {record.employeeName}
                  </Link>
                  <div className="mt-[2px] text-[12px] text-text-muted">
                    {record.band ? `${record.band} · ` : ''}
                    {x(money(record.baseSalary))}
                    {record.effectiveDate ? ` · ${record.effectiveDate}` : ''}
                  </div>
                </div>
                <div className="mt-[8px] sm:mt-0">
                  {delta === null ? (
                    <span className="text-[12px] text-text-faint">
                      {x(M.comp_prod_no_midpoint)}
                    </span>
                  ) : (
                    <span className={statusChipClass(delta < 0 ? 'warning' : 'success')}>
                      {delta >= 0 ? '+' : ''}
                      {delta}% {x(M.comp_prod_vs_midpoint)}
                    </span>
                  )}
                </div>
                <div
                  className="mt-[8px] text-[12px] text-text-faint sm:mt-0"
                  title={x(M.comp_prod_market_unavailable)}
                >
                  —
                </div>
                {pendingDeleteId === record.id ? (
                  <div className="col-span-full mt-[10px] flex flex-wrap items-center gap-[10px] rounded-[8px] bg-inset px-[12px] py-[10px] sm:col-span-4">
                    <span className="text-[12.5px] text-text-2">
                      {x(M.comp_prod_delete_confirm)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      className="cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[6px] font-sans text-[12px] font-semibold text-text"
                    >
                      {x(M.comp_prod_delete_cancel)}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRemove(record)}
                      className="cursor-pointer rounded-[8px] border-none bg-risk-dot px-[12px] py-[6px] font-sans text-[12px] font-semibold text-white"
                    >
                      {x(M.comp_prod_confirm_delete)}
                    </button>
                  </div>
                ) : (
                  <div className="mt-[8px] flex items-center justify-end gap-[4px] sm:col-span-2 sm:mt-0">
                    <button
                      type="button"
                      onClick={() => onEdit(record)}
                      aria-label={`${x(M.comp_prod_edit)} — ${record.employeeName}`}
                      className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-surface px-[10px] py-[6px] font-sans text-[12px] font-semibold text-text-2"
                    >
                      <Pencil size={13} strokeWidth={1.7} aria-hidden="true" />
                      {x(M.comp_prod_edit)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(record.id)}
                      aria-label={`${x(M.comp_prod_remove)} — ${record.employeeName}`}
                      className="cursor-pointer border-none bg-transparent p-[6px] text-text-muted hover:text-risk-fg"
                    >
                      <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-[14px] text-[11px] text-text-faint">{x(M.comp_prod_market_note)}</div>
    </AppPage>
  )
}
