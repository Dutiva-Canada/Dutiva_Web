import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import type { Bi } from '@/i18n/core'
import { useSubmissions } from '../data/useSubmissions'
import { useInitiatives } from '../data/useInitiatives'
import type { CommsSubmissionStatus } from '../data/types'
import { getSubmissionDueStatus } from '../data/productionApi'
import { SUBMISSION_STATUS_LABEL } from '../commsLabels'

const STATUSES: CommsSubmissionStatus[] = ['planned', 'submitted', 'recorded', 'withdrawn']

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

function statusTone(status: CommsSubmissionStatus) {
  switch (status) {
    case 'submitted':
      return 'success'
    case 'planned':
      return 'warning'
    case 'recorded':
      return 'neutral'
    case 'withdrawn':
      return 'risk'
    default:
      return 'neutral'
  }
}

function dueTone(status: ReturnType<typeof getSubmissionDueStatus>) {
  switch (status) {
    case 'overdue':
      return 'text-risk-fg'
    case 'due-soon':
      return 'text-warning-fg'
    default:
      return 'text-text-muted'
  }
}

function nextActions(status: CommsSubmissionStatus): { label: Bi; next: CommsSubmissionStatus }[] {
  switch (status) {
    case 'planned':
      return [
        { label: M.comms_submission_mark_submitted, next: 'submitted' },
        { label: M.comms_submission_withdraw, next: 'withdrawn' },
      ]
    case 'submitted':
      return [
        { label: M.comms_submission_mark_recorded, next: 'recorded' },
        { label: M.comms_submission_reopen, next: 'planned' },
      ]
    case 'recorded':
      return [{ label: M.comms_submission_reopen, next: 'planned' }]
    case 'withdrawn':
      return [{ label: M.comms_submission_reopen, next: 'planned' }]
    default:
      return []
  }
}

export function SubmissionsSection() {
  const { x } = useI18n()
  const { submissions, canWrite, addSubmission, removeSubmission, transitionSubmissionStatus } = useSubmissions()
  const { initiatives } = useInitiatives()
  const [open, setOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<CommsSubmissionStatus | 'all'>('all')
  const [initiativeId, setInitiativeId] = useState('')
  const [authority, setAuthority] = useState('')
  const [method, setMethod] = useState('')
  const [deadline, setDeadline] = useState('')
  const [submittedAt, setSubmittedAt] = useState('')
  const [confirmationRef, setConfirmationRef] = useState('')
  const [status, setStatus] = useState<CommsSubmissionStatus>('planned')

  const reset = () => {
    setOpen(false)
    setInitiativeId(initiatives[0]?.id ?? '')
    setAuthority('')
    setMethod('')
    setDeadline('')
    setSubmittedAt('')
    setConfirmationRef('')
    setStatus('planned')
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await addSubmission({
      initiativeId,
      authority: { en: authority, fr: `[FR] ${authority}` },
      method: { en: method, fr: `[FR] ${method}` },
      deadline: deadline || undefined,
      submittedAt: submittedAt || undefined,
      confirmationRef: confirmationRef || undefined,
      status,
      owner: 'Workspace user',
    })
    reset()
  }

  const filtered = useMemo(() => {
    return statusFilter === 'all'
      ? submissions
      : submissions.filter((s) => s.status === statusFilter)
  }, [submissions, statusFilter])

  return (
    <section className="rounded-[12px] border border-border bg-surface p-[16px]">
      <div className="mb-[12px] flex flex-wrap items-center justify-between gap-[12px]">
        <h3 className="text-[15px] font-semibold text-text">{x(M.comms_intelligence_submissions)}</h3>
        {canWrite && !open && (
          <button
            type="button"
            onClick={() => {
              reset()
              setOpen(true)
            }}
            className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
          >
            <Plus size={14} aria-hidden="true" />
            {x(M.comms_intelligence_add_submission)}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mb-[12px] rounded-[10px] border border-border bg-inset p-[12px]">
          <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
            <div>
              <label className={labelClass}>{x(M.comms_initiatives_name)}</label>
              <select required value={initiativeId} onChange={(e) => setInitiativeId(e.target.value)} className={inputClass}>
                <option value="">{x(M.comms_none)}</option>
                {initiatives.map((i) => (
                  <option key={i.id} value={i.id}>{x(i.title)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_intelligence_submission_status)}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as CommsSubmissionStatus)} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{x(SUBMISSION_STATUS_LABEL[s])}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_intelligence_submission_authority)}</label>
              <input required value={authority} onChange={(e) => setAuthority(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_intelligence_submission_method)}</label>
              <input required value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_intelligence_submission_confirmation)}</label>
              <input value={confirmationRef} onChange={(e) => setConfirmationRef(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_intelligence_submission_deadline)}</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_interaction_status_responded)}</label>
              <input type="date" value={submittedAt} onChange={(e) => setSubmittedAt(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="mt-[12px] flex gap-[8px]">
            <button type="submit" className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white">
              {x(M.comms_create)}
            </button>
            <button type="button" onClick={reset} className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text">
              {x(M.comms_cancel)}
            </button>
          </div>
        </form>
      )}

      <div className="mb-[12px]">
        <label className={labelClass}>{x(M.comms_intelligence_filter_status)}</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CommsSubmissionStatus | 'all')}
          className={inputClass}
        >
          <option value="all">{x(M.comms_all)}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{x(SUBMISSION_STATUS_LABEL[s])}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[13px] text-text-muted">{x(M.comms_intelligence_submissions_empty)}</p>
      ) : (
        <ul className="m-0 flex flex-col gap-[10px] p-0">
          {filtered.map((submission) => {
            const initiative = initiatives.find((i) => i.id === submission.initiativeId)
            const due = getSubmissionDueStatus(submission.deadline)
            return (
              <li key={submission.id} className="rounded-[8px] bg-inset p-[12px]">
                <div className="flex flex-wrap items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[14px] font-semibold text-text">{x(submission.authority)}</div>
                    <div className="text-[12px] text-text-muted">
                      {initiative ? x(initiative.title) : x(M.comms_none)} · {x(submission.method)}
                    </div>
                  </div>
                  <span className={statusChipClass(statusTone(submission.status))}>
                    {x(SUBMISSION_STATUS_LABEL[submission.status])}
                  </span>
                </div>
                <div className="mt-[8px] flex flex-wrap gap-[12px] text-[12px] text-text-muted">
                  {submission.deadline && (
                    <span className={dueTone(due)}>
                      {x(M.comms_intelligence_submission_deadline)} {submission.deadline}
                      {due === 'overdue' && ` · ${x(M.comms_submission_overdue)}`}
                      {due === 'due-soon' && ` · ${x(M.comms_submission_due_soon)}`}
                    </span>
                  )}
                  {submission.submittedAt && (
                    <span>{x(M.comms_interaction_status_responded)} {submission.submittedAt}</span>
                  )}
                  {submission.confirmationRef && (
                    <span>{x(M.comms_intelligence_submission_confirmation)} {submission.confirmationRef}</span>
                  )}
                </div>
                {canWrite && (
                  <div className="mt-[10px] flex flex-wrap items-center gap-[8px]">
                    {nextActions(submission.status).map(({ label, next }) => (
                      <button
                        key={next}
                        type="button"
                        onClick={() => transitionSubmissionStatus(submission.id, next)}
                        className="rounded-[6px] border border-border bg-surface px-[10px] py-[5px] font-sans text-[12px] font-semibold text-text hover:bg-inset"
                      >
                        {x(label)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => removeSubmission(submission.id)}
                      className="text-[12px] font-semibold text-risk-fg"
                    >
                      {x(M.comms_remove)}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
