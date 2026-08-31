import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ClipboardX, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { casesMessages as CM } from '@/i18n/messages/cases'
import { sourceChipClass, statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { listCases } from '@/features/app/views/cases/productionApi'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'
import {
  addProbationReviewTask,
  hasProbationReviewTask,
  listTasks,
} from '@/features/app/views/tasks/productionApi'
import type { ProductionTask } from '@/features/app/views/tasks/productionApi'
import {
  addEmployeeNote,
  addExpiryRecord,
  addLeave,
  endLeave,
  getEmployee,
  listEmployeeExpiryRecords,
  listEmployeeLeaves,
  listEmployeeNotes,
  listEmployees,
  removeExpiryRecord,
  updateEmployeeDates,
  updateEmployeeManager,
  updateEmployeeStatus,
  productionLineManagerLabel,
} from './productionApi'
import type {
  ExpiryRecordKind,
  ProductionEmployee,
  ProductionEmployeeNote,
  ProductionEmployeeStatus,
  ProductionExpiryRecord,
  ProductionLeave,
} from './productionApi'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Employee profile in production mode — the real record for one
 * public.employees row: facts header with the status select, lifecycle
 * dates (probation end with its linked review task, termination date),
 * certifications & dated documents (hr_expiry_records), leave records
 * (hr_leaves — status only, never medical detail), this employee's open
 * cases, and the hr_employee_notes thread. The records entered here are
 * what the Analytics cards aggregate.
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

const EMPLOYEE_STATUSES: readonly ProductionEmployeeStatus[] = ['active', 'on_leave', 'terminated']

const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

const todayISO = (): string => new Date().toISOString().slice(0, 10)

function SectionHeading({ text }: { readonly text: string }) {
  return (
    <div className="mb-[10px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
      {text}
    </div>
  )
}

const inputClass =
  'rounded-[10px] border border-border bg-surface px-[12px] py-[8px] font-sans text-[13px] text-text'
const smallButtonClass =
  'cursor-pointer rounded-[8px] border border-border bg-surface px-[10px] py-[6px] font-sans text-[12px] font-semibold text-text'
const primaryButtonClass =
  'cursor-pointer rounded-[10px] border-none bg-navy px-[14px] py-[8px] font-sans text-[12.5px] font-semibold text-white disabled:opacity-60'

export function EmployeeProfileProductionView() {
  const { x } = useI18n()
  const { employeeId } = useParams()
  const { showToast } = useToasts()
  const { organizationId, isOrgAdmin } = useWorkspaceMode()

  const [employee, setEmployee] = useState<ProductionEmployee | null>(null)
  const [openCases, setOpenCases] = useState<ProductionCase[]>([])
  const [records, setRecords] = useState<ProductionExpiryRecord[]>([])
  const [leaves, setLeaves] = useState<ProductionLeave[]>([])
  const [tasks, setTasks] = useState<ProductionTask[]>([])
  const [notes, setNotes] = useState<ProductionEmployeeNote[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'failed'>('loading')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  /* Add-record form */
  const [recordKind, setRecordKind] = useState<ExpiryRecordKind>('certification')
  const [recordName, setRecordName] = useState('')
  const [recordExpiry, setRecordExpiry] = useState('')
  const [recordSaving, setRecordSaving] = useState(false)

  /* Add-leave form */
  const [leaveType, setLeaveType] = useState('')
  const [leaveProtected, setLeaveProtected] = useState(false)
  const [leaveStart, setLeaveStart] = useState('')
  const [leaveReturn, setLeaveReturn] = useState('')
  const [leaveSaving, setLeaveSaving] = useState(false)
  const [roster, setRoster] = useState<ProductionEmployee[]>([])

  const load = useCallback(async () => {
    if (!organizationId || !employeeId) return
    setState('loading')
    try {
      const [loaded, loadedNotes, allCases, loadedRecords, loadedLeaves, allTasks, loadedRoster] =
        await Promise.all([
          getEmployee(employeeId),
          listEmployeeNotes(employeeId),
          listCases(organizationId),
          listEmployeeExpiryRecords(employeeId),
          listEmployeeLeaves(employeeId),
          listTasks(organizationId),
          listEmployees(organizationId),
        ])
      if (!loaded) {
        setState('missing')
        return
      }
      setEmployee(loaded)
      setNotes(loadedNotes)
      setOpenCases(allCases.filter((c) => c.employeeId === employeeId && c.status !== 'resolved'))
      setRecords(loadedRecords)
      setLeaves(loadedLeaves)
      setTasks(allTasks)
      setRoster(loadedRoster)
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [organizationId, employeeId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.employees_prod_empty_title)} />
  }

  const onStatusChange = async (status: ProductionEmployeeStatus) => {
    if (!employee) return
    try {
      await updateEmployeeStatus(employee.id, status)
      setEmployee({ ...employee, status })
      showToast(M.employees_prod_status_updated, 'ok')
    } catch {
      showToast(M.employees_prod_status_update_failed, 'info')
    }
  }

  const onDateChange = async (field: 'probationEndDate' | 'terminationDate', value: string) => {
    if (!employee) return
    const dateOrNull = value || null
    try {
      await updateEmployeeDates(employee.id, { [field]: dateOrNull })
      setEmployee({ ...employee, [field]: dateOrNull })
      showToast(M.employees_prod_dates_saved, 'ok')
    } catch {
      showToast(M.employees_prod_dates_failed, 'info')
    }
  }

  const onManagerChange = async (value: string) => {
    if (!employee) return
    const managerId = value || null
    try {
      const updated = await updateEmployeeManager(employee.id, managerId)
      setEmployee(updated)
      showToast(M.employees_prod_manager_updated, 'ok')
    } catch {
      showToast(M.employees_prod_manager_update_failed, 'info')
    }
  }

  const managerOptions = employee
    ? roster.filter((row) => row.id !== employee.id).sort((a, b) => a.name.localeCompare(b.name))
    : []

  const onCreateReviewTask = async () => {
    if (!employee) return
    try {
      const created = await addProbationReviewTask(
        organizationId,
        employee.id,
        x(M.employees_prod_review_task_title).replace('{name}', employee.name),
        employee.probationEndDate,
      )
      setTasks((prev) => [created, ...prev])
      showToast(M.employees_prod_review_task_created, 'ok')
    } catch {
      showToast(M.employees_prod_review_task_failed, 'info')
    }
  }

  const onAddRecord = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!employee || !recordName.trim() || !recordExpiry || recordSaving) return
    setRecordSaving(true)
    try {
      const added = await addExpiryRecord(organizationId, employee.id, {
        kind: recordKind,
        name: recordName.trim(),
        expiryDate: recordExpiry,
      })
      setRecords((prev) =>
        [...prev, added].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
      )
      setRecordName('')
      setRecordExpiry('')
      showToast(M.employees_prod_record_added, 'ok')
    } catch {
      showToast(M.employees_prod_record_add_failed, 'info')
    } finally {
      setRecordSaving(false)
    }
  }

  const onRemoveRecord = async (id: string) => {
    try {
      await removeExpiryRecord(id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
      showToast(M.employees_prod_record_removed, 'ok')
    } catch {
      showToast(M.employees_prod_record_remove_failed, 'info')
    }
  }

  const onAddLeave = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!employee || !leaveType.trim() || leaveSaving) return
    setLeaveSaving(true)
    try {
      const added = await addLeave(organizationId, employee.id, {
        leaveType: leaveType.trim(),
        isProtected: leaveProtected,
        startDate: leaveStart || null,
        expectedReturnDate: leaveReturn || null,
      })
      setLeaves((prev) => [added, ...prev])
      setLeaveType('')
      setLeaveProtected(false)
      setLeaveStart('')
      setLeaveReturn('')
      showToast(M.employees_prod_leave_added, 'ok')
    } catch {
      showToast(M.employees_prod_leave_add_failed, 'info')
    } finally {
      setLeaveSaving(false)
    }
  }

  const onEndLeave = async (id: string) => {
    try {
      const endedOn = todayISO()
      await endLeave(id, endedOn)
      setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, endedOn } : l)))
      showToast(M.employees_prod_leave_ended, 'ok')
    } catch {
      showToast(M.employees_prod_leave_end_failed, 'info')
    }
  }

  const onAddNote = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!employee || !draft.trim() || saving) return
    setSaving(true)
    try {
      const added = await addEmployeeNote(organizationId, employee.id, draft.trim())
      setNotes((prev) => [...prev, added])
      setDraft('')
      showToast(M.employees_prod_note_added, 'ok')
    } catch {
      showToast(M.employees_prod_note_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const facts: { label: (typeof M)[keyof typeof M]; value: string | null }[] = employee
    ? [
        { label: M.employees_prod_detail_title, value: employee.title },
        { label: M.employees_prod_detail_email, value: employee.email },
        { label: M.employees_prod_detail_jurisdiction, value: employee.jurisdiction },
        { label: M.employees_prod_detail_start, value: employee.startDate },
      ]
    : []

  const reviewTaskExists = employee ? hasProbationReviewTask(tasks, employee.id) : false
  const currentLeaves = leaves.filter((l) => l.endedOn === null)
  const endedLeaves = leaves.filter((l) => l.endedOn !== null)

  return (
    <AppPage width="comfort">
      <Link
        to="/app/employees"
        className="mb-[16px] inline-flex items-center gap-[6px] text-[13px] font-semibold text-text-muted hover:text-text"
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        {x(M.employees_prod_back)}
      </Link>

      {state === 'loading' && (
        <div className="text-[13px] text-text-muted">{x(M.employees_prod_loading)}</div>
      )}

      {state === 'missing' && (
        <div className="rounded-[12px] border border-border bg-surface px-[24px] py-[36px] text-center">
          <div className="text-[14.5px] font-semibold text-text">
            {x(M.employees_prod_not_found)}
          </div>
        </div>
      )}

      {state === 'failed' && (
        <div className="flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
          <span className="text-[13px] text-risk-fg">{x(M.employees_prod_detail_error)}</span>
          <button type="button" onClick={() => void load()} className={smallButtonClass}>
            {x(M.employees_prod_retry)}
          </button>
        </div>
      )}

      {state === 'ready' && employee && (
        <>
          {/* Facts header */}
          <div className="mb-[18px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]">
            <div className="mb-[14px] flex flex-wrap items-center gap-[12px]">
              <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[14px] font-bold text-accent">
                {initialsOf(employee.name)}
              </div>
              <h1 className="m-0 min-w-0 flex-1 font-display text-[20px] font-semibold text-text">
                {employee.name}
              </h1>
              <span className={statusChipClass(STATUS_TONE[employee.status])}>
                {x(STATUS_LABEL[employee.status])}
              </span>
              {isOrgAdmin && (
                <select
                  value={employee.status}
                  onChange={(e) => void onStatusChange(e.target.value as ProductionEmployeeStatus)}
                  aria-label={`${x(M.employees_prod_status_aria)} — ${employee.name}`}
                  className="cursor-pointer rounded-[8px] border border-border bg-surface px-[8px] py-[5px] font-sans text-[12px] text-text"
                >
                  {EMPLOYEE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {x(STATUS_LABEL[s])}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label.en}>
                  <div className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                    {x(f.label)}
                  </div>
                  <div className="mt-[2px] text-[13px] font-semibold text-text">
                    {f.value ?? '—'}
                  </div>
                </div>
              ))}
              {employee && (
                <div>
                  <div className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                    {x(M.employees_manager_label)}
                  </div>
                  {isOrgAdmin && managerOptions.length > 0 ? (
                    <select
                      value={employee.managerId ?? ''}
                      onChange={(e) => void onManagerChange(e.target.value)}
                      aria-label={x(M.employees_prod_manager_aria)}
                      className="mt-[2px] w-full cursor-pointer rounded-[8px] border border-border bg-surface px-[8px] py-[5px] font-sans text-[13px] font-semibold text-text"
                    >
                      <option value="">{x(M.employees_prod_manager_unset)}</option>
                      {managerOptions.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-[2px] text-[13px] font-semibold text-text">
                      {productionLineManagerLabel(employee)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Key dates — probation end (+ its review task) and, once the
                  status says so, the termination date turnover needs. */}
            <div className="mt-[14px] border-t border-border-soft pt-[14px]">
              <div className="flex flex-wrap items-end gap-x-[18px] gap-y-[10px]">
                <label className="flex flex-col gap-[4px]">
                  <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                    {x(M.employees_prod_probation_end)}
                  </span>
                  {isOrgAdmin ? (
                    <input
                      type="date"
                      value={employee.probationEndDate ?? ''}
                      onChange={(e) => void onDateChange('probationEndDate', e.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <span className="text-[13px] font-semibold text-text">
                      {employee.probationEndDate ?? '—'}
                    </span>
                  )}
                </label>
                {(employee.status === 'terminated' || employee.terminationDate !== null) && (
                  <label className="flex flex-col gap-[4px]">
                    <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                      {x(M.employees_prod_termination_date)}
                    </span>
                    {isOrgAdmin ? (
                      <input
                        type="date"
                        value={employee.terminationDate ?? ''}
                        onChange={(e) => void onDateChange('terminationDate', e.target.value)}
                        className={inputClass}
                      />
                    ) : (
                      <span className="text-[13px] font-semibold text-text">
                        {employee.terminationDate ?? '—'}
                      </span>
                    )}
                  </label>
                )}
                {employee.probationEndDate !== null &&
                  (reviewTaskExists ? (
                    <span className="flex items-center gap-[5px] pb-[8px] text-[12px] font-semibold text-ok-fg">
                      <CheckCircle2 size={13} strokeWidth={1.9} aria-hidden="true" />
                      {x(M.employees_prod_review_task_exists)}
                    </span>
                  ) : (
                    <span className="flex flex-wrap items-center gap-[10px] pb-[2px]">
                      <span className="flex items-center gap-[5px] text-[12px] font-semibold text-warn-fg">
                        <ClipboardX size={13} strokeWidth={1.9} aria-hidden="true" />
                        {x(M.employees_prod_review_task_missing)}
                      </span>
                      {isOrgAdmin && (
                        <button
                          type="button"
                          onClick={() => void onCreateReviewTask()}
                          className={smallButtonClass}
                        >
                          {x(M.employees_prod_review_task_create)}
                        </button>
                      )}
                    </span>
                  ))}
              </div>
              <p className="mt-[6px] mb-0 text-[11.5px] text-text-faint">
                {x(M.employees_prod_probation_hint)}{' '}
                {(employee.status === 'terminated' || employee.terminationDate !== null) &&
                  x(M.employees_prod_termination_hint)}
              </p>
            </div>
          </div>

          {/* Certifications & dated documents */}
          <SectionHeading text={x(M.employees_prod_records_title)} />
          <div className="mb-[12px] overflow-hidden rounded-[12px] border border-border bg-surface">
            {records.length === 0 && (
              <div className="px-[18px] py-[14px] text-[13px] text-text-muted">
                {x(M.employees_prod_records_empty)}
              </div>
            )}
            {records.map((record) => {
              const expired = record.expiryDate < todayISO()
              return (
                <div
                  key={record.id}
                  className="flex items-center gap-[12px] border-t border-inset px-[18px] py-[11px] first:border-t-0"
                >
                  <span className={sourceChipClass('neutral')}>
                    {x(
                      record.kind === 'certification'
                        ? M.employees_prod_record_kind_certification
                        : M.employees_prod_record_kind_document,
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
                    {record.name}
                  </span>
                  <span
                    className={`shrink-0 text-[12.5px] font-semibold tabular-nums ${
                      expired ? 'text-risk-fg' : 'text-text-2'
                    }`}
                  >
                    {expired
                      ? x(M.employees_prod_record_expired)
                      : x(M.employees_prod_record_expires).replace('{date}', record.expiryDate)}
                  </span>
                  {isOrgAdmin && (
                    <button
                      type="button"
                      onClick={() => void onRemoveRecord(record.id)}
                      className={smallButtonClass}
                    >
                      {x(M.employees_prod_record_remove)}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {isOrgAdmin && (
            <form
              onSubmit={(e) => void onAddRecord(e)}
              className="mb-[18px] flex flex-wrap items-end gap-[8px]"
            >
              <label className="flex flex-col gap-[4px]">
                <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                  {x(M.employees_prod_record_kind)}
                </span>
                <select
                  value={recordKind}
                  onChange={(e) => setRecordKind(e.target.value as ExpiryRecordKind)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="certification">
                    {x(M.employees_prod_record_kind_certification)}
                  </option>
                  <option value="document">{x(M.employees_prod_record_kind_document)}</option>
                </select>
              </label>
              <label className="flex min-w-[180px] flex-1 flex-col gap-[4px]">
                <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                  {x(M.employees_prod_record_name)}
                </span>
                <input
                  value={recordName}
                  onChange={(e) => setRecordName(e.target.value)}
                  placeholder={x(M.employees_prod_record_name_placeholder)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-[4px]">
                <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                  {x(M.employees_prod_record_expiry)}
                </span>
                <input
                  type="date"
                  value={recordExpiry}
                  onChange={(e) => setRecordExpiry(e.target.value)}
                  className={inputClass}
                />
              </label>
              <button
                type="submit"
                disabled={recordSaving || !recordName.trim() || !recordExpiry}
                className={primaryButtonClass}
              >
                {x(M.employees_prod_record_add)}
              </button>
            </form>
          )}

          {/* Leave — status only */}
          <SectionHeading text={x(M.employees_prod_leave_title)} />
          <div className="mb-[12px] overflow-hidden rounded-[12px] border border-border bg-surface">
            {leaves.length === 0 && (
              <div className="px-[18px] py-[14px] text-[13px] text-text-muted">
                {x(M.employees_prod_leave_empty)}
              </div>
            )}
            {[...currentLeaves, ...endedLeaves].map((leave) => (
              <div
                key={leave.id}
                className="flex flex-wrap items-center gap-x-[12px] gap-y-[4px] border-t border-inset px-[18px] py-[11px] first:border-t-0"
              >
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
                  {leave.leaveType}
                </span>
                {leave.isProtected && (
                  <span className={`${sourceChipClass('info')} items-center`}>
                    <ShieldCheck
                      size={11}
                      strokeWidth={1.9}
                      className="mr-[4px]"
                      aria-hidden="true"
                    />
                    {x(M.employees_prod_leave_protected)}
                  </span>
                )}
                <span className="shrink-0 text-[12.5px] text-text-2">
                  {leave.endedOn !== null
                    ? x(M.employees_prod_leave_ended_on).replace('{date}', leave.endedOn)
                    : leave.expectedReturnDate !== null
                      ? x(M.employees_prod_leave_returns).replace(
                          '{date}',
                          leave.expectedReturnDate,
                        )
                      : x(M.employees_prod_leave_current)}
                </span>
                {isOrgAdmin && leave.endedOn === null && (
                  <button
                    type="button"
                    onClick={() => void onEndLeave(leave.id)}
                    className={smallButtonClass}
                  >
                    {x(M.employees_prod_leave_end)}
                  </button>
                )}
              </div>
            ))}
          </div>
          {isOrgAdmin && (
            <form
              onSubmit={(e) => void onAddLeave(e)}
              className="mb-[18px] flex flex-wrap items-end gap-[8px]"
            >
              <label className="flex min-w-[180px] flex-1 flex-col gap-[4px]">
                <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                  {x(M.employees_prod_leave_type)}
                </span>
                <input
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  placeholder={x(M.employees_prod_leave_type_placeholder)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-[4px]">
                <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                  {x(M.employees_prod_leave_start)}
                </span>
                <input
                  type="date"
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-[4px]">
                <span className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                  {x(M.employees_prod_leave_return)}
                </span>
                <input
                  type="date"
                  value={leaveReturn}
                  onChange={(e) => setLeaveReturn(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-[6px] pb-[9px] text-[12.5px] text-text-2">
                <input
                  type="checkbox"
                  checked={leaveProtected}
                  onChange={(e) => setLeaveProtected(e.target.checked)}
                />
                {x(M.employees_prod_leave_protected)}
              </label>
              <button
                type="submit"
                disabled={leaveSaving || !leaveType.trim()}
                className={primaryButtonClass}
              >
                {x(M.employees_prod_leave_add)}
              </button>
            </form>
          )}

          {/* Open cases for this employee */}
          <SectionHeading text={x(M.employees_prod_cases_title)} />
          <div className="mb-[18px] overflow-hidden rounded-[12px] border border-border bg-surface">
            {openCases.length === 0 && (
              <div className="px-[18px] py-[14px] text-[13px] text-text-muted">
                {x(M.employees_prod_cases_none)}
              </div>
            )}
            {openCases.map((caze) => (
              <Link
                key={caze.id}
                to={`/app/cases/${caze.id}`}
                className="flex items-center gap-[12px] border-t border-inset px-[18px] py-[12px] first:border-t-0 hover:bg-inset"
              >
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
                  {caze.title}
                </span>
                <span className={statusChipClass(caze.status === 'in_review' ? 'warning' : 'info')}>
                  {x(
                    caze.status === 'in_review'
                      ? CM.cases_prod_status_in_review
                      : CM.cases_prod_status_open,
                  )}
                </span>
              </Link>
            ))}
          </div>

          {/* Notes thread */}
          <SectionHeading text={x(M.employees_prod_notes_title)} />
          <div className="mb-[14px] overflow-hidden rounded-[12px] border border-border bg-surface">
            {notes.length === 0 && (
              <div className="px-[18px] py-[16px] text-[13px] text-text-muted">
                {x(M.employees_prod_notes_empty)}
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
          {isOrgAdmin && (
            <form onSubmit={(e) => void onAddNote(e)} className="flex gap-[8px]">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={x(M.employees_prod_note_placeholder)}
                aria-label={x(M.employees_prod_note_placeholder)}
                className="min-w-0 flex-1 rounded-[10px] border border-border bg-surface px-[14px] py-[10px] font-sans text-[13.5px] text-text"
              />
              <button
                type="submit"
                disabled={saving || !draft.trim()}
                className="cursor-pointer rounded-[10px] border-none bg-navy px-[16px] py-[10px] font-sans text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {x(M.employees_prod_note_add)}
              </button>
            </form>
          )}
        </>
      )}
    </AppPage>
  )
}
