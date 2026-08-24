import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { casesMessages as M } from '@/i18n/messages/cases'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { listEmployees } from '@/features/app/views/employees/productionApi'
import {
  PRODUCTION_CASE_STATUSES,
  addCaseNote,
  getCase,
  listCaseNotes,
  updateCaseStatus,
} from './productionApi'
import type { ProductionCase, ProductionCaseNote, ProductionCaseStatus } from './productionApi'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Case detail in production mode — the real working record for one
 * hr_cases row: facts header (type, employee, province, due date), the
 * status select, and the hr_case_notes thread (migration 0009). The demo
 * detail's risk assessment, approvals and Advisor tabs return as those
 * flows gain real backends.
 */

const TYPE_LABEL = {
  Termination: M.cases_prod_type_termination,
  Performance: M.cases_prod_type_performance,
  Accommodation: M.cases_prod_type_accommodation,
  Onboarding: M.cases_prod_type_onboarding,
} as const

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

export function CaseDetailProductionView() {
  const { x } = useI18n()
  const { caseId } = useParams()
  const { showToast } = useToasts()
  const { organizationId } = useWorkspaceMode()

  const [caze, setCaze] = useState<ProductionCase | null>(null)
  const [notes, setNotes] = useState<ProductionCaseNote[]>([])
  const [employeeName, setEmployeeName] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'failed'>('loading')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId || !caseId) return
    setState('loading')
    try {
      const [loaded, loadedNotes] = await Promise.all([getCase(caseId), listCaseNotes(caseId)])
      if (!loaded) {
        setState('missing')
        return
      }
      setCaze(loaded)
      setNotes(loadedNotes)
      if (loaded.employeeId) {
        const employees = await listEmployees(organizationId)
        setEmployeeName(employees.find((e) => e.id === loaded.employeeId)?.name ?? null)
      } else {
        setEmployeeName(null)
      }
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [organizationId, caseId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.cases_prod_empty_title)} />
  }

  const onStatusChange = async (status: ProductionCaseStatus) => {
    if (!caze) return
    try {
      await updateCaseStatus(caze.id, status)
      setCaze({ ...caze, status })
      showToast(M.cases_prod_status_updated, 'ok')
    } catch {
      showToast(M.cases_prod_status_update_failed, 'info')
    }
  }

  const onAddNote = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!caze || !draft.trim() || saving) return
    setSaving(true)
    try {
      const added = await addCaseNote(organizationId, caze.id, draft.trim())
      setNotes((prev) => [...prev, added])
      setDraft('')
      showToast(M.cases_prod_note_added, 'ok')
    } catch {
      showToast(M.cases_prod_note_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const facts: { label: (typeof M)[keyof typeof M]; value: string | null }[] = caze
    ? [
        { label: M.cases_prod_detail_type, value: x(TYPE_LABEL[caze.caseType]) },
        { label: M.cases_prod_detail_employee, value: employeeName },
        { label: M.cases_prod_detail_province, value: caze.province },
        { label: M.cases_prod_detail_due, value: caze.dueDate },
      ]
    : []

  return (
    <AppPage width="comfort">
        <Link
          to="/app/cases"
          className="mb-[16px] inline-flex items-center gap-[6px] text-[13px] font-semibold text-text-muted hover:text-text"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {x(M.cases_prod_back)}
        </Link>

        {state === 'loading' && (
          <div className="text-[13px] text-text-muted">{x(M.cases_prod_loading)}</div>
        )}

        {state === 'missing' && (
          <div className="rounded-[12px] border border-border bg-surface px-[24px] py-[36px] text-center">
            <div className="text-[14.5px] font-semibold text-text">
              {x(M.cases_not_found_title)}
            </div>
            <p className="m-0 mt-[6px] text-[13px] text-text-muted">{x(M.cases_prod_not_found)}</p>
          </div>
        )}

        {state === 'failed' && (
          <div className="flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
            <span className="text-[13px] text-risk-fg">{x(M.cases_prod_detail_error)}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
            >
              {x(M.cases_prod_retry)}
            </button>
          </div>
        )}

        {state === 'ready' && caze && (
          <>
            {/* Facts header */}
            <div className="mb-[18px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]">
              <div className="mb-[12px] flex flex-wrap items-center gap-[12px]">
                <h1 className="m-0 min-w-0 flex-1 font-display text-[20px] font-semibold text-text">
                  {caze.title}
                </h1>
                <span className={statusChipClass(STATUS_TONE[caze.status])}>
                  {x(STATUS_LABEL[caze.status])}
                </span>
                <select
                  value={caze.status}
                  onChange={(e) => void onStatusChange(e.target.value as ProductionCaseStatus)}
                  aria-label={`${x(M.cases_prod_status_aria)} — ${caze.title}`}
                  className="cursor-pointer rounded-[8px] border border-border bg-surface px-[8px] py-[5px] font-sans text-[12px] text-text"
                >
                  {PRODUCTION_CASE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {x(STATUS_LABEL[s])}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-4">
                {facts
                  .filter((f) => f.value)
                  .map((f) => (
                    <div key={f.label.en}>
                      <div className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                        {x(f.label)}
                      </div>
                      <div className="mt-[2px] text-[13px] font-semibold text-text">{f.value}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Notes thread */}
            <div className="mb-[10px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
              {x(M.cases_prod_notes_title)}
            </div>
            <div className="mb-[14px] overflow-hidden rounded-[12px] border border-border bg-surface">
              {notes.length === 0 && (
                <div className="px-[18px] py-[16px] text-[13px] text-text-muted">
                  {x(M.cases_prod_notes_empty)}
                </div>
              )}
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border-t border-inset px-[18px] py-[12px] first:border-t-0"
                >
                  <div className="text-[13px] leading-[1.55] whitespace-pre-wrap text-text">
                    {note.body}
                  </div>
                  <div className="mt-[4px] text-[11.5px] text-text-faint">
                    {note.createdAt.slice(0, 10)}
                  </div>
                </div>
              ))}
            </div>

            {/* Add note */}
            <form onSubmit={(e) => void onAddNote(e)} className="flex gap-[8px]">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={x(M.cases_prod_note_placeholder)}
                aria-label={x(M.cases_prod_note_placeholder)}
                className="min-w-0 flex-1 rounded-[10px] border border-border bg-surface px-[14px] py-[10px] font-sans text-[13.5px] text-text"
              />
              <button
                type="submit"
                disabled={saving || !draft.trim()}
                className="cursor-pointer rounded-[10px] border-none bg-navy px-[16px] py-[10px] font-sans text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {x(M.cases_prod_note_add)}
              </button>
            </form>
          </>
        )}
    </AppPage>
  )
}
