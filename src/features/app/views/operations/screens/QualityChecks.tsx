import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { useOperationsData } from '../OperationsDataContext'
import type { OperationsQualityCheck, OperationsQualityStatus } from '../data/types'

const STATUSES: OperationsQualityStatus[] = ['pending', 'passed', 'failed', 'overdue']

const STATUS_LABELS: Record<OperationsQualityStatus, keyof typeof M> = {
  pending: 'ops_quality_status_pending',
  passed: 'ops_quality_status_passed',
  failed: 'ops_quality_status_failed',
  overdue: 'ops_quality_status_overdue',
}

const STATUS_TONE: Record<OperationsQualityStatus, 'warning' | 'success' | 'risk' | 'risk'> = {
  pending: 'warning',
  passed: 'success',
  failed: 'risk',
  overdue: 'risk',
}

function generateId() {
  return `oq-${Math.random().toString(36).slice(2, 9)}`
}

function QualityRow({ check }: { readonly check: OperationsQualityCheck }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{check.title}</div>
        <div className="text-[12px] text-text-muted">
          {check.due_date ? `due ${check.due_date}` : null}
          {check.completed_date ? ` · completed ${check.completed_date}` : null}
          {check.non_conformance ? ` · ${check.non_conformance}` : null}
        </div>
      </div>
      <span className={statusChipClass(STATUS_TONE[check.status])}>{x(M[STATUS_LABELS[check.status]])}</span>
    </div>
  )
}

export function QualityChecks() {
  const { x } = useI18n()
  const { qualityChecks, addQualityCheck } = useOperationsData()
  const [show, setShow] = useState(false)

  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<OperationsQualityStatus>('pending')
  const [dueDate, setDueDate] = useState('')
  const [completedDate, setCompletedDate] = useState('')
  const [nonConformance, setNonConformance] = useState('')

  const reset = () => {
    setTitle('')
    setStatus('pending')
    setDueDate('')
    setCompletedDate('')
    setNonConformance('')
  }

  const onSubmit = async () => {
    const newCheck: OperationsQualityCheck = {
      id: generateId(),
      organization_id: '',
      title,
      assigned_to: null,
      reviewer_id: null,
      checklist: [],
      due_date: dueDate || null,
      completed_date: completedDate || null,
      status,
      non_conformance: nonConformance || null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addQualityCheck(newCheck)
    reset()
    setShow(false)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show ? M.ops_cancel : M.ops_add_quality_check)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.ops_title_field)} className="sm:col-span-2">
            <FormInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label={x(M.ops_status)}>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as OperationsQualityStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.ops_due_date)}>
            <FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.ops_completed_date)}>
            <FormInput type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.ops_non_conformance)} className="sm:col-span-2">
            <FormTextarea value={nonConformance} onChange={(e) => setNonConformance(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.ops_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(M.ops_save)}
            </button>
          </div>
        </div>
      ) : null}

      {qualityChecks.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.ops_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {qualityChecks.map((check) => (
            <QualityRow key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  )
}
