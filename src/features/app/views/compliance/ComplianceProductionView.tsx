import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Plus, Shield, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { complianceMessages as M } from '@/i18n/messages/compliance'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import {
  PRODUCTION_FINDING_SEVERITIES,
  PRODUCTION_OBLIGATION_STATUSES,
  addFinding,
  addObligation,
  listFindings,
  listObligations,
  removeFinding,
  removeObligation,
  setFindingResolved,
  setObligationStatus,
} from './productionApi'
import type {
  ProductionFinding,
  ProductionFindingSeverity,
  ProductionObligation,
  ProductionObligationStatus,
} from './productionApi'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Compliance in production mode — two registers. Findings live on the
 * backend's own public.compliance_findings table (the AI assessment
 * pipeline writes to the same table): log / resolve / reopen / remove.
 * Obligations (hr_obligations, 0069) track recurring statutory duties with
 * an owner, a due date and an evidence note; status 'ok' is what the
 * score's obligations component counts, and "overdue" is derived from the
 * due date rather than stored. The demo view's posture scores and
 * watchlist return as real assessment data accumulates.
 */

const SEVERITY_LABEL: Record<ProductionFindingSeverity, (typeof M)[keyof typeof M]> = {
  info: M.compliance_prod_sev_info,
  low: M.compliance_prod_sev_low,
  medium: M.compliance_prod_sev_medium,
  high: M.compliance_prod_sev_high,
  critical: M.compliance_prod_sev_critical,
}

const SEVERITY_TONE: Record<ProductionFindingSeverity, 'info' | 'neutral' | 'warning' | 'risk'> = {
  info: 'info',
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'risk',
}

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const EMPTY_FORM = {
  title: '',
  severity: 'medium' as ProductionFindingSeverity,
  description: '',
  recommendation: '',
}

const OB_STATUS_LABEL: Record<ProductionObligationStatus, (typeof M)[keyof typeof M]> = {
  ok: M.compliance_prod_ob_status_ok,
  in_progress: M.compliance_prod_ob_status_progress,
  needs_evidence: M.compliance_prod_ob_status_needs,
}

const OB_STATUS_TONE: Record<ProductionObligationStatus, 'success' | 'info' | 'warning'> = {
  ok: 'success',
  in_progress: 'info',
  needs_evidence: 'warning',
}

const EMPTY_OB_FORM = {
  title: '',
  area: '',
  jurisdiction: '',
  dueOn: '',
  recurrence: '',
  ownerName: '',
  status: 'needs_evidence' as ProductionObligationStatus,
  evidence: '',
}

export function ComplianceProductionView() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const { organizationId } = useWorkspaceMode()

  const [rows, setRows] = useState<ProductionFinding[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [obRows, setObRows] = useState<ProductionObligation[] | null>(null)
  const [obLoadFailed, setObLoadFailed] = useState(false)
  const [obFormOpen, setObFormOpen] = useState(false)
  const [obForm, setObForm] = useState(EMPTY_OB_FORM)
  const [obSaving, setObSaving] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoadFailed(false)
    try {
      setRows(await listFindings(organizationId))
    } catch {
      setRows([])
      setLoadFailed(true)
    }
  }, [organizationId])

  const loadObligations = useCallback(async () => {
    if (!organizationId) return
    setObLoadFailed(false)
    try {
      setObRows(await listObligations(organizationId))
    } catch {
      setObRows([])
      setObLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
    void loadObligations()
  }, [load, loadObligations])

  const todayISO = new Date().toISOString().slice(0, 10)
  const dayFormat = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const formatDue = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00`))

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.compliance_prod_empty_title)} />
  }

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!form.title.trim() || saving) return
    setSaving(true)
    try {
      const added = await addFinding(organizationId, { ...form, title: form.title.trim() })
      setRows((prev) => [added, ...(prev ?? [])])
      setForm(EMPTY_FORM)
      setFormOpen(false)
      showToast(M.compliance_prod_added, 'ok')
    } catch {
      showToast(M.compliance_prod_add_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onToggleResolved = async (finding: ProductionFinding) => {
    const resolved = !finding.resolved
    try {
      await setFindingResolved(finding.id, resolved)
      setRows((prev) =>
        (prev ?? []).map((r) =>
          r.id === finding.id ? { ...r, resolved, status: resolved ? 'resolved' : 'open' } : r,
        ),
      )
    } catch {
      showToast(M.compliance_prod_status_failed, 'info')
    }
  }

  const onRemove = async (finding: ProductionFinding) => {
    try {
      await removeFinding(finding.id)
      setRows((prev) => (prev ?? []).filter((r) => r.id !== finding.id))
      showToast(M.compliance_prod_removed, 'ok')
    } catch {
      showToast(M.compliance_prod_remove_failed, 'info')
    }
  }

  const onObSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!obForm.title.trim() || obSaving) return
    setObSaving(true)
    try {
      const added = await addObligation(organizationId!, { ...obForm, title: obForm.title.trim() })
      setObRows((prev) => [...(prev ?? []), added])
      setObForm(EMPTY_OB_FORM)
      setObFormOpen(false)
      showToast(M.compliance_prod_ob_added, 'ok')
    } catch {
      showToast(M.compliance_prod_ob_add_failed, 'info')
    } finally {
      setObSaving(false)
    }
  }

  const onObStatus = async (
    obligation: ProductionObligation,
    status: ProductionObligationStatus,
  ) => {
    try {
      await setObligationStatus(obligation.id, status)
      setObRows((prev) => (prev ?? []).map((r) => (r.id === obligation.id ? { ...r, status } : r)))
    } catch {
      showToast(M.compliance_prod_ob_status_failed, 'info')
    }
  }

  const onObRemove = async (obligation: ProductionObligation) => {
    try {
      await removeObligation(obligation.id)
      setObRows((prev) => (prev ?? []).filter((r) => r.id !== obligation.id))
      showToast(M.compliance_prod_ob_removed, 'ok')
    } catch {
      showToast(M.compliance_prod_ob_remove_failed, 'info')
    }
  }

  const openCount = rows?.filter((r) => !r.resolved).length ?? 0
  const countLabel = `${openCount} ${x(openCount === 1 ? M.compliance_prod_count_open_one : M.compliance_prod_count_open)}`

  return (
    <AppPage width="comfort">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[16px]">
        <div className="text-[13px] text-text-muted">
          {rows === null ? x(M.compliance_prod_loading) : countLabel}
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            {x(M.compliance_prod_add)}
          </button>
        )}
      </div>

      {loadFailed && (
        <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
          <span className="text-[13px] text-risk-fg">{x(M.compliance_prod_error)}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
          >
            {x(M.compliance_prod_retry)}
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
              <label htmlFor="finding-title" className={labelClass}>
                {x(M.compliance_prod_title_label)}
              </label>
              <input
                id="finding-title"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="finding-severity" className={labelClass}>
                {x(M.compliance_prod_severity)}
              </label>
              <select
                id="finding-severity"
                value={form.severity}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    severity: e.target.value as ProductionFindingSeverity,
                  }))
                }
                className={inputClass}
              >
                {PRODUCTION_FINDING_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {x(SEVERITY_LABEL[s])}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="finding-description" className={labelClass}>
                {x(M.compliance_prod_description)}
              </label>
              <textarea
                id="finding-description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="finding-recommendation" className={labelClass}>
                {x(M.compliance_prod_recommendation)}
              </label>
              <textarea
                id="finding-recommendation"
                rows={2}
                value={form.recommendation}
                onChange={(e) => setForm((f) => ({ ...f, recommendation: e.target.value }))}
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
              {x(M.compliance_prod_save)}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false)
                setForm(EMPTY_FORM)
              }}
              className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
            >
              {x(M.compliance_prod_cancel)}
            </button>
          </div>
        </form>
      )}

      {rows !== null && rows.length === 0 && !loadFailed && !formOpen && (
        <div className="rounded-[12px] border border-border bg-surface px-[24px] py-[40px] text-center">
          <div className="mx-auto mb-[14px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-inset">
            <Shield size={20} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
          </div>
          <div className="mb-[6px] text-[15px] font-semibold text-text">
            {x(M.compliance_prod_empty_title)}
          </div>
          <p className="m-0 text-[13px] text-text-muted">{x(M.compliance_prod_empty_body)}</p>
        </div>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="flex flex-col gap-[10px]">
          {rows.map((finding) => (
            <div
              key={finding.id}
              className="rounded-[11px] border border-border bg-surface px-[16px] py-[13px]"
            >
              <div className="flex flex-wrap items-center gap-[10px]">
                <span className={statusChipClass(SEVERITY_TONE[finding.severity])}>
                  {x(SEVERITY_LABEL[finding.severity])}
                </span>
                <span
                  className={`min-w-0 flex-1 text-[13.5px] font-semibold ${
                    finding.resolved ? 'text-text-faint line-through' : 'text-text'
                  }`}
                >
                  {finding.title}
                </span>
                {finding.resolved && (
                  <span className={statusChipClass('success')}>
                    {x(M.compliance_prod_resolved_chip)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void onToggleResolved(finding)}
                  className="cursor-pointer rounded-[8px] border border-border bg-surface px-[10px] py-[5px] font-sans text-[12px] font-semibold text-text"
                >
                  {finding.resolved ? x(M.compliance_prod_reopen) : x(M.compliance_prod_resolve)}
                </button>
                <button
                  type="button"
                  onClick={() => void onRemove(finding)}
                  aria-label={`${x(M.compliance_prod_remove)} — ${finding.title}`}
                  className="cursor-pointer border-none bg-transparent p-[6px] text-text-muted hover:text-risk-fg"
                >
                  <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                </button>
              </div>
              {finding.description && (
                <p className="m-0 mt-[8px] text-[12.5px] leading-[1.55] text-text-muted">
                  {finding.description}
                </p>
              )}
              {finding.recommendation && (
                <div className="mt-[8px] rounded-[9px] bg-inset px-[12px] py-[9px]">
                  <div className="mb-[2px] text-[10.5px] font-bold tracking-[0.04em] text-text-muted uppercase">
                    {x(M.compliance_prod_rec_label)}
                  </div>
                  <div className="text-[12.5px] leading-[1.55] text-text-2">
                    {finding.recommendation}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Obligation register (0069, formula v3) ─────────────────────── */}
      <div className="mt-[30px] mb-[14px] flex flex-wrap items-center justify-between gap-[16px]">
        <h2 className="m-0 text-[15px] font-semibold text-text">
          {x(M.compliance_prod_ob_section)}
        </h2>
        {!obFormOpen && (
          <button
            type="button"
            onClick={() => setObFormOpen(true)}
            className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            {x(M.compliance_prod_ob_add)}
          </button>
        )}
      </div>

      {obLoadFailed && (
        <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
          <span className="text-[13px] text-risk-fg">{x(M.compliance_prod_error)}</span>
          <button
            type="button"
            onClick={() => void loadObligations()}
            className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
          >
            {x(M.compliance_prod_retry)}
          </button>
        </div>
      )}

      {obFormOpen && (
        <form
          onSubmit={(e) => void onObSubmit(e)}
          className="mb-[18px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]"
        >
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="ob-title" className={labelClass}>
                {x(M.compliance_prod_ob_title_label)}
              </label>
              <input
                id="ob-title"
                required
                value={obForm.title}
                onChange={(e) => setObForm((f) => ({ ...f, title: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ob-area" className={labelClass}>
                {x(M.compliance_prod_ob_area)}
              </label>
              <input
                id="ob-area"
                value={obForm.area}
                onChange={(e) => setObForm((f) => ({ ...f, area: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ob-jurisdiction" className={labelClass}>
                {x(M.compliance_prod_ob_jurisdiction)}
              </label>
              <input
                id="ob-jurisdiction"
                value={obForm.jurisdiction}
                onChange={(e) => setObForm((f) => ({ ...f, jurisdiction: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ob-due" className={labelClass}>
                {x(M.compliance_prod_ob_due)}
              </label>
              <input
                id="ob-due"
                type="date"
                value={obForm.dueOn}
                onChange={(e) => setObForm((f) => ({ ...f, dueOn: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ob-recurrence" className={labelClass}>
                {x(M.compliance_prod_ob_recurrence)}
              </label>
              <input
                id="ob-recurrence"
                value={obForm.recurrence}
                onChange={(e) => setObForm((f) => ({ ...f, recurrence: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ob-owner" className={labelClass}>
                {x(M.compliance_prod_ob_owner)}
              </label>
              <input
                id="ob-owner"
                value={obForm.ownerName}
                onChange={(e) => setObForm((f) => ({ ...f, ownerName: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ob-status" className={labelClass}>
                {x(M.compliance_prod_ob_status)}
              </label>
              <select
                id="ob-status"
                value={obForm.status}
                onChange={(e) =>
                  setObForm((f) => ({
                    ...f,
                    status: e.target.value as ProductionObligationStatus,
                  }))
                }
                className={inputClass}
              >
                {PRODUCTION_OBLIGATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {x(OB_STATUS_LABEL[s])}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ob-evidence" className={labelClass}>
                {x(M.compliance_prod_ob_evidence)}
              </label>
              <textarea
                id="ob-evidence"
                rows={2}
                value={obForm.evidence}
                onChange={(e) => setObForm((f) => ({ ...f, evidence: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-[16px] flex gap-[8px]">
            <button
              type="submit"
              disabled={obSaving}
              className="cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {x(M.compliance_prod_save)}
            </button>
            <button
              type="button"
              onClick={() => {
                setObFormOpen(false)
                setObForm(EMPTY_OB_FORM)
              }}
              className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
            >
              {x(M.compliance_prod_cancel)}
            </button>
          </div>
        </form>
      )}

      {obRows !== null && obRows.length === 0 && !obLoadFailed && !obFormOpen && (
        <p className="m-0 rounded-[12px] border border-border bg-surface px-[20px] py-[18px] text-[13px] text-text-muted">
          {x(M.compliance_prod_ob_empty)}
        </p>
      )}

      {obRows !== null && obRows.length > 0 && (
        <div className="flex flex-col gap-[10px]">
          {obRows.map((obligation) => {
            const overdue =
              obligation.status !== 'ok' && obligation.dueOn !== null && obligation.dueOn < todayISO
            return (
              <div
                key={obligation.id}
                className="rounded-[11px] border border-border bg-surface px-[16px] py-[13px]"
              >
                <div className="flex flex-wrap items-center gap-[10px]">
                  <span className={statusChipClass(OB_STATUS_TONE[obligation.status])}>
                    {x(OB_STATUS_LABEL[obligation.status])}
                  </span>
                  {overdue && (
                    <span className={statusChipClass('risk')}>
                      {x(M.compliance_prod_ob_overdue_chip)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-text">
                    {obligation.title}
                  </span>
                  <select
                    value={obligation.status}
                    onChange={(e) =>
                      void onObStatus(obligation, e.target.value as ProductionObligationStatus)
                    }
                    aria-label={`${x(M.compliance_prod_ob_status)} — ${obligation.title}`}
                    className="cursor-pointer rounded-[8px] border border-border bg-surface px-[8px] py-[5px] font-sans text-[12px] font-semibold text-text"
                  >
                    {PRODUCTION_OBLIGATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {x(OB_STATUS_LABEL[s])}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void onObRemove(obligation)}
                    aria-label={`${x(M.compliance_prod_ob_remove)} — ${obligation.title}`}
                    className="cursor-pointer border-none bg-transparent p-[6px] text-text-muted hover:text-risk-fg"
                  >
                    <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-[6px] flex flex-wrap gap-x-[14px] gap-y-[2px] text-[12px] text-text-muted">
                  {obligation.dueOn && (
                    <span className={overdue ? 'font-semibold text-risk-fg' : undefined}>
                      {x(M.compliance_prod_ob_due_label).replace(
                        '{date}',
                        formatDue(obligation.dueOn),
                      )}
                    </span>
                  )}
                  {obligation.area && <span>{obligation.area}</span>}
                  {obligation.jurisdiction && <span>{obligation.jurisdiction}</span>}
                  {obligation.recurrence && <span>{obligation.recurrence}</span>}
                  {obligation.ownerName && <span>{obligation.ownerName}</span>}
                </div>
                {obligation.evidence && (
                  <div className="mt-[8px] rounded-[9px] bg-inset px-[12px] py-[9px]">
                    <div className="mb-[2px] text-[10.5px] font-bold tracking-[0.04em] text-text-muted uppercase">
                      {x(M.compliance_prod_ob_evidence)}
                    </div>
                    <div className="text-[12.5px] leading-[1.55] text-text-2">
                      {obligation.evidence}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </AppPage>
  )
}
