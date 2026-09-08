import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Brain, CheckCircle2, ClipboardX } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { memoryMessages as MEM } from '@/i18n/messages/memory'
import { statusChipClass } from '@/components/chips'
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
import { ProfileTabStrip, ProfileEmptyTab } from './EmployeeProfileProdTabs'
import type { ProfileTab } from './EmployeeProfileProdTabs'
import { EmployeeOverviewTab } from './EmployeeOverviewTab'
import { EmployeeDocumentsTab } from './EmployeeDocumentsTab'
import { EmployeeLeaveTab } from './EmployeeLeaveTab'
import { EmployeeCasesTab } from './EmployeeCasesTab'

/**
 * Employee profile in production mode — the real record for one
 * public.employees row. Presents a tab strip matching the demo profile
 * (Overview, Timeline, Documents, Leave, Compensation, Wellbeing,
 * Compliance, Cases) backed by production APIs where they exist and
 * bilingual empty states where they don't yet. The facts header with
 * status select, lifecycle dates, and manager assignment stays above
 * the tabs; tab content is rendered by extracted components.
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

const inputClass =
  'rounded-[10px] border border-border bg-surface px-[12px] py-[8px] font-sans text-[13px] text-text'
const smallButtonClass =
  'cursor-pointer rounded-[8px] border border-border bg-surface px-[10px] py-[6px] font-sans text-[12px] font-semibold text-text'

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
  const [roster, setRoster] = useState<ProductionEmployee[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'failed'>('loading')
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')

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

  const onAddRecord = async (kind: ExpiryRecordKind, name: string, expiryDate: string) => {
    if (!employee) return
    try {
      const added = await addExpiryRecord(organizationId, employee.id, { kind, name, expiryDate })
      setRecords((prev) =>
        [...prev, added].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
      )
      showToast(M.employees_prod_record_added, 'ok')
    } catch {
      showToast(M.employees_prod_record_add_failed, 'info')
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

  const onAddLeave = async (data: {
    leaveType: string
    isProtected: boolean
    startDate: string | null
    expectedReturnDate: string | null
  }) => {
    if (!employee) return
    try {
      const added = await addLeave(organizationId, employee.id, data)
      setLeaves((prev) => [added, ...prev])
      showToast(M.employees_prod_leave_added, 'ok')
    } catch {
      showToast(M.employees_prod_leave_add_failed, 'info')
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

  const onAddNote = async (body: string) => {
    if (!employee) return
    const added = await addEmployeeNote(organizationId, employee.id, body)
    setNotes((prev) => [...prev, added])
    showToast(M.employees_prod_note_added, 'ok')
  }

  const facts: { label: (typeof M)[keyof typeof M]; value: string | null }[] = employee
    ? [
        { label: M.employees_prod_detail_title, value: employee.title },
        { label: M.employees_prod_detail_department, value: employee.department },
        { label: M.employees_prod_detail_employment_type, value: employee.employmentType ? x(M[`employees_employment_type_${employee.employmentType}` as keyof typeof M]) : null },
        { label: M.employees_prod_detail_email, value: employee.email },
        { label: M.employees_prod_detail_phone, value: employee.phone },
        { label: M.employees_prod_detail_jurisdiction, value: employee.jurisdiction },
        { label: M.employees_prod_detail_start, value: employee.startDate },
      ]
    : []

  const reviewTaskExists = employee ? hasProbationReviewTask(tasks, employee.id) : false

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
              <Link
                to={`/app/settings/memory/people/${employee.id}`}
                className="inline-flex items-center gap-[6px] rounded-[8px] border border-border bg-surface px-[10px] py-[6px] font-sans text-[12px] font-bold text-text-2 no-underline"
              >
                <Brain size={14} strokeWidth={1.7} aria-hidden="true" />
                {x(MEM.memory_review_person_memory)}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 lg:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label.en} className="min-w-0">
                  <div className="text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase">
                    {x(f.label)}
                  </div>
                  <div
                    className={`mt-[2px] text-[13px] font-semibold text-text ${
                      f.label === M.employees_prod_detail_email ? 'break-all' : 'break-words'
                    }`}
                  >
                    {f.value ?? '—'}
                  </div>
                </div>
              ))}
              {employee && (
                <div className="min-w-0">
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

          {/* Tab strip */}
          <ProfileTabStrip active={activeTab} onSelect={setActiveTab} />

          {/* Tab content */}
          {activeTab === 'overview' && (
            <EmployeeOverviewTab
              employee={employee}
              organizationId={organizationId}
              roster={roster}
              isOrgAdmin={isOrgAdmin}
              notes={notes}
              onAddNote={onAddNote}
            />
          )}

          {activeTab === 'timeline' && (
            <ProfileEmptyTab
              title={M.employees_prod_tab_timeline_empty_title}
              body={M.employees_prod_tab_timeline_empty_body}
            />
          )}

          {activeTab === 'documents' && (
            <EmployeeDocumentsTab
              isOrgAdmin={isOrgAdmin}
              records={records}
              onAddRecord={onAddRecord}
              onRemoveRecord={onRemoveRecord}
            />
          )}

          {activeTab === 'leave' && (
            <EmployeeLeaveTab
              isOrgAdmin={isOrgAdmin}
              leaves={leaves}
              onAddLeave={onAddLeave}
              onEndLeave={onEndLeave}
            />
          )}

          {activeTab === 'compensation' && (
            <ProfileEmptyTab
              title={M.employees_prod_tab_compensation_empty_title}
              body={M.employees_prod_tab_compensation_empty_body}
            />
          )}

          {activeTab === 'wellbeing' && (
            <ProfileEmptyTab
              title={M.employees_prod_tab_wellbeing_empty_title}
              body={M.employees_prod_tab_wellbeing_empty_body}
            />
          )}

          {activeTab === 'compliance' && (
            <ProfileEmptyTab
              title={M.employees_prod_tab_compliance_empty_title}
              body={M.employees_prod_tab_compliance_empty_body}
            />
          )}

          {activeTab === 'cases' && <EmployeeCasesTab openCases={openCases} />}
        </>
      )}
    </AppPage>
  )
}
