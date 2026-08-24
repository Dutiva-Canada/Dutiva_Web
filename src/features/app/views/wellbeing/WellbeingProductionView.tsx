import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { CheckCircle, HeartHandshake, Pencil, Plus, Shield, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { wellbeingMessages as M } from '@/i18n/messages/wellbeing'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ModuleEmptyBlock } from '@/features/app/workspaceMode/ModuleEmptyBlock'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import {
  PRODUCTION_INITIATIVE_KINDS,
  PRODUCTION_INITIATIVE_STATUSES,
  addInitiative,
  listInitiatives,
  overdueReviews,
  removeInitiative,
  setInitiativeStatus,
  updateInitiative,
} from './productionApi'
import type {
  ProductionInitiative,
  ProductionInitiativeKind,
  ProductionInitiativeStatus,
} from './productionApi'

/**
 * Wellbeing in production mode — real persistence on
 * public.hr_wellbeing_initiatives (migration 0041).
 *
 * **This is a register of what the employer offers, not a list of who is
 * struggling.** The demo view showed per-person "support signals" carrying a
 * source, a confidence level and a sensitivity rating; nothing here has an
 * employee reference, and the migration header explains at length why one
 * must never be added. Support for a named person belongs in a case, on the
 * accommodation path, where there is a request and the employee takes part.
 *
 * The one count surfaced is overdue reviews — the failure mode a wellbeing
 * register actually has, and the employer's own data rather than an
 * inference about anybody.
 */

const KIND_LABEL: Record<ProductionInitiativeKind, (typeof M)[keyof typeof M]> = {
  eap: M.wellbeing_prod_kind_eap,
  training: M.wellbeing_prod_kind_training,
  policy: M.wellbeing_prod_kind_policy,
  check_in: M.wellbeing_prod_kind_check_in,
  accommodation_support: M.wellbeing_prod_kind_accommodation_support,
  other: M.wellbeing_prod_kind_other,
}

const STATUS_LABEL: Record<ProductionInitiativeStatus, (typeof M)[keyof typeof M]> = {
  planned: M.wellbeing_prod_status_planned,
  active: M.wellbeing_prod_status_active,
  paused: M.wellbeing_prod_status_paused,
  retired: M.wellbeing_prod_status_retired,
}

const STATUS_TONE: Record<ProductionInitiativeStatus, 'neutral' | 'success' | 'warning'> = {
  planned: 'neutral',
  active: 'success',
  paused: 'warning',
  retired: 'neutral',
}

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const EMPTY_FORM = {
  name: '',
  kind: 'other' as ProductionInitiativeKind,
  status: 'active' as ProductionInitiativeStatus,
  owner: '',
  reviewDate: '',
  note: '',
}

/** Today as YYYY-MM-DD (local) — the cutoff an overdue review is measured against. */
const today = (): string => new Date().toISOString().slice(0, 10)

function initiativeToForm(row: ProductionInitiative) {
  return {
    name: row.name,
    kind: row.kind,
    status: row.status,
    owner: row.owner ?? '',
    reviewDate: row.reviewDate ?? '',
    note: row.note ?? '',
  }
}

export function WellbeingProductionView() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const { organizationId } = useWorkspaceMode()

  const [rows, setRows] = useState<ProductionInitiative[] | null>(null)
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
      setRows(await listInitiatives(organizationId))
    } catch {
      setRows([])
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.wellbeing_prod_empty_title)} />
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!form.name.trim() || saving) return
    setSaving(true)
    try {
      if (editingId) {
        const updated = await updateInitiative(editingId, { ...form, name: form.name.trim() })
        setRows((prev) =>
          (prev ?? [])
            .map((r) => (r.id === editingId ? updated : r))
            .sort((a, b) => a.name.localeCompare(b.name)),
        )
        showToast(M.wellbeing_prod_updated, 'ok')
      } else {
        const added = await addInitiative(organizationId, { ...form, name: form.name.trim() })
        setRows((prev) => [...(prev ?? []), added].sort((a, b) => a.name.localeCompare(b.name)))
        showToast(M.wellbeing_prod_added, 'ok')
      }
      closeForm()
    } catch {
      showToast(editingId ? M.wellbeing_prod_update_failed : M.wellbeing_prod_add_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (row: ProductionInitiative) => {
    setPendingDeleteId(null)
    setEditingId(row.id)
    setForm(initiativeToForm(row))
    setFormOpen(true)
  }

  const onStatusChange = async (row: ProductionInitiative, status: ProductionInitiativeStatus) => {
    try {
      await setInitiativeStatus(row.id, status)
      setRows((prev) => (prev ?? []).map((r) => (r.id === row.id ? { ...r, status } : r)))
      showToast(M.wellbeing_prod_status_updated, 'ok')
    } catch {
      showToast(M.wellbeing_prod_status_update_failed, 'info')
    }
  }

  const onMarkReviewed = async (row: ProductionInitiative) => {
    const reviewDate = today()
    try {
      const updated = await updateInitiative(row.id, {
        name: row.name,
        kind: row.kind,
        status: row.status,
        owner: row.owner ?? '',
        reviewDate,
        note: row.note ?? '',
      })
      setRows((prev) => (prev ?? []).map((r) => (r.id === row.id ? updated : r)))
      showToast(M.wellbeing_prod_updated, 'ok')
    } catch {
      showToast(M.wellbeing_prod_update_failed, 'info')
    }
  }

  const onRemove = async (row: ProductionInitiative) => {
    try {
      await removeInitiative(row.id)
      setRows((prev) => (prev ?? []).filter((r) => r.id !== row.id))
      setPendingDeleteId(null)
      showToast(M.wellbeing_prod_removed, 'ok')
    } catch {
      showToast(M.wellbeing_prod_remove_failed, 'info')
    }
  }

  const list = rows ?? []
  const now = today()
  const activeCount = list.filter((r) => r.status === 'active').length
  const overdue = overdueReviews(list, now)
  const overdueIds = new Set(overdue.map((r) => r.id))
  const count = list.length
  const countLabel = `${count} ${x(count === 1 ? M.wellbeing_prod_count_one : M.wellbeing_prod_count_many)}`

  return (
    <div className="flex-1 overflow-y-auto px-[32px] pt-[28px] pb-[60px]">
      <div className="mx-auto max-w-[820px]">
        <div className="mb-[18px] flex items-start gap-[8px] rounded-[10px] border border-gold-border bg-gold-bg px-[14px] py-[11px]">
          <Shield
            size={14}
            strokeWidth={1.8}
            className="mt-px shrink-0 text-gold-fg"
            aria-hidden="true"
          />
          <span className="text-[12.5px] leading-[1.55] font-semibold text-gold-fg">
            {x(M.wellbeing_prod_banner)}
          </span>
        </div>

        <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[16px]">
          <div className="text-[13px] text-text-muted">
            {rows === null ? x(M.wellbeing_prod_loading) : countLabel}
          </div>
          {!formOpen && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm(EMPTY_FORM)
                setFormOpen(true)
              }}
              className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
            >
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              {x(M.wellbeing_prod_add)}
            </button>
          )}
        </div>

        {loadFailed && (
          <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
            <span className="text-[13px] text-risk-fg">{x(M.wellbeing_prod_error)}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
            >
              {x(M.wellbeing_prod_retry)}
            </button>
          </div>
        )}

        {count > 0 && (
          <div className="mb-[22px] flex flex-wrap gap-[14px]">
            <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
              <div className="font-display text-[26px] font-bold text-text">{activeCount}</div>
              <div className="mt-[2px] text-[12.5px] text-text-muted">
                {x(M.wellbeing_prod_active_label)}
              </div>
            </div>
            <div className="min-w-[150px] flex-1 rounded-[12px] border border-border bg-surface p-[16px]">
              <div className="font-display text-[26px] font-bold text-gold-dot">
                {overdue.length}
              </div>
              <div className="mt-[2px] text-[12.5px] text-text-muted">
                {x(M.wellbeing_prod_overdue_label)}
              </div>
            </div>
          </div>
        )}

        {formOpen && (
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="mb-[18px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]"
          >
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="wb-name" className={labelClass}>
                  {x(M.wellbeing_prod_name)}
                </label>
                <input
                  id="wb-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="wb-kind" className={labelClass}>
                  {x(M.wellbeing_prod_kind)}
                </label>
                <select
                  id="wb-kind"
                  value={form.kind}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, kind: e.target.value as ProductionInitiativeKind }))
                  }
                  className={inputClass}
                >
                  {PRODUCTION_INITIATIVE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {x(KIND_LABEL[k])}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="wb-status" className={labelClass}>
                  {x(M.wellbeing_prod_status)}
                </label>
                <select
                  id="wb-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as ProductionInitiativeStatus }))
                  }
                  className={inputClass}
                >
                  {PRODUCTION_INITIATIVE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {x(STATUS_LABEL[s])}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="wb-owner" className={labelClass}>
                  {x(M.wellbeing_prod_owner)}
                </label>
                <input
                  id="wb-owner"
                  value={form.owner}
                  onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="wb-review" className={labelClass}>
                  {x(M.wellbeing_prod_review_date)}
                </label>
                <input
                  id="wb-review"
                  type="date"
                  value={form.reviewDate}
                  onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="wb-note" className={labelClass}>
                  {x(M.wellbeing_prod_note)}
                </label>
                <input
                  id="wb-note"
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
                {x(M.wellbeing_prod_save)}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
              >
                {x(M.wellbeing_prod_cancel)}
              </button>
            </div>
          </form>
        )}

        {rows !== null && count === 0 && !loadFailed && !formOpen && (
          <ModuleEmptyBlock
            icon={HeartHandshake}
            title={x(M.wellbeing_prod_empty_title)}
            body={x(M.wellbeing_prod_empty_body)}
          />
        )}

        {count > 0 && (
          <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
            {list.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-[12px] border-t border-inset px-[18px] py-[13px] first:border-t-0"
              >
                <div className="min-w-0 flex-1 basis-[220px]">
                  <div className="truncate text-[13.5px] font-semibold text-text">{row.name}</div>
                  <div className="mt-[2px] text-[12px] text-text-muted">
                    {x(KIND_LABEL[row.kind])}
                    {row.owner ? ` · ${row.owner}` : ''}
                    {row.reviewDate
                      ? ` · ${x(M.wellbeing_prod_review_prefix)}${row.reviewDate}`
                      : ''}
                  </div>
                </div>
                {overdueIds.has(row.id) && (
                  <span className={statusChipClass('risk')}>
                    {x(M.wellbeing_prod_overdue_chip)}
                  </span>
                )}
                <span className={statusChipClass(STATUS_TONE[row.status])}>
                  {x(STATUS_LABEL[row.status])}
                </span>
                <select
                  value={row.status}
                  onChange={(e) =>
                    void onStatusChange(row, e.target.value as ProductionInitiativeStatus)
                  }
                  aria-label={`${x(M.wellbeing_prod_status_aria)} — ${row.name}`}
                  className="cursor-pointer rounded-[8px] border border-border bg-surface px-[8px] py-[5px] font-sans text-[12px] text-text"
                >
                  {PRODUCTION_INITIATIVE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {x(STATUS_LABEL[s])}
                    </option>
                  ))}
                </select>
                {overdueIds.has(row.id) && (
                  <button
                    type="button"
                    onClick={() => void onMarkReviewed(row)}
                    className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border-none bg-accent-soft px-[10px] py-[6px] font-sans text-[12px] font-bold text-accent"
                  >
                    <CheckCircle size={13} strokeWidth={1.7} aria-hidden="true" />
                    {x(M.wellbeing_prod_mark_reviewed)}
                  </button>
                )}
                {pendingDeleteId === row.id ? (
                  <div className="flex w-full flex-wrap items-center gap-[10px] rounded-[8px] bg-inset px-[12px] py-[10px]">
                    <span className="text-[12.5px] text-text-2">
                      {x(M.wellbeing_prod_delete_confirm)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      className="cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[6px] font-sans text-[12px] font-semibold text-text"
                    >
                      {x(M.wellbeing_prod_delete_cancel)}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRemove(row)}
                      className="cursor-pointer rounded-[8px] border-none bg-risk-dot px-[12px] py-[6px] font-sans text-[12px] font-semibold text-white"
                    >
                      {x(M.wellbeing_prod_confirm_delete)}
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      aria-label={`${x(M.wellbeing_prod_edit)} — ${row.name}`}
                      className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-surface px-[10px] py-[6px] font-sans text-[12px] font-semibold text-text-2"
                    >
                      <Pencil size={13} strokeWidth={1.7} aria-hidden="true" />
                      {x(M.wellbeing_prod_edit)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(row.id)}
                      aria-label={`${x(M.wellbeing_prod_remove)} — ${row.name}`}
                      className="cursor-pointer border-none bg-transparent p-[6px] text-text-muted hover:text-risk-fg"
                    >
                      <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <section className="mt-[22px] rounded-[12px] border border-border bg-surface px-[18px] py-[16px]">
          <h2 className="m-0 text-[14px] font-semibold text-text">
            {x(M.wellbeing_prod_signals_title)}
          </h2>
          <p className="mb-0 mt-[8px] text-[13px] leading-[1.55] text-text-muted">
            {x(M.wellbeing_prod_signals_empty)}
          </p>
        </section>

        <div className="mt-[14px] flex items-start gap-[7px] text-[11px] leading-normal text-text-faint">
          <Shield size={12} strokeWidth={1.8} className="mt-px shrink-0" aria-hidden="true" />
          <span>{x(M.wellbeing_prod_accommodation_note)}</span>
        </div>
      </div>
    </div>
  )
}
