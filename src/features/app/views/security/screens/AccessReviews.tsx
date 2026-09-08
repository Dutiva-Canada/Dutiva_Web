import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { useSecurityData } from '../SecurityDataContext'
import type { SecurityAccessReview, SecurityAccessReviewStatus } from '../data/types'

const STATUSES: SecurityAccessReviewStatus[] = ['pending', 'in_progress', 'completed', 'overdue']

const STATUS_LABELS: Record<SecurityAccessReviewStatus, keyof typeof M> = {
  pending: 'sec_review_status_pending',
  in_progress: 'sec_review_status_in_progress',
  completed: 'sec_review_status_completed',
  overdue: 'sec_review_status_overdue',
}

const STATUS_TONE: Record<SecurityAccessReviewStatus, 'warning' | 'info' | 'success' | 'risk'> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  overdue: 'risk',
}

function generateId() {
  return `sar-${Math.random().toString(36).slice(2, 9)}`
}

function emptyAccessReview(): SecurityAccessReview {
  return {
    id: generateId(),
    organization_id: '',
    title: '',
    assigned_to: null,
    reviewer_id: null,
    review_due_date: null,
    completed_date: null,
    status: 'pending',
    findings: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function AccessReviewRow({
  review,
  onEdit,
}: {
  readonly review: SecurityAccessReview
  readonly onEdit: (review: SecurityAccessReview) => void
}) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{review.title}</div>
        <div className="text-[12px] text-text-muted">
          {review.review_due_date ? `${review.review_due_date}` : null}
          {review.completed_date ? ` · completed ${review.completed_date}` : null}
          {review.findings ? ` · ${review.findings}` : null}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        <span className={statusChipClass(STATUS_TONE[review.status])}>{x(M[STATUS_LABELS[review.status]])}</span>
        <button
          type="button"
          onClick={() => onEdit(review)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.sec_edit)}
        </button>
      </div>
    </div>
  )
}

export function AccessReviews() {
  const { x } = useI18n()
  const { accessReviews, addAccessReview, updateAccessReview } = useSecurityData()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<SecurityAccessReview | null>(null)

  const initial = editing ?? emptyAccessReview()
  const [title, setTitle] = useState(initial.title)
  const [status, setStatus] = useState<SecurityAccessReviewStatus>(initial.status)
  const [reviewDueDate, setReviewDueDate] = useState(initial.review_due_date ?? '')
  const [completedDate, setCompletedDate] = useState(initial.completed_date ?? '')
  const [findings, setFindings] = useState(initial.findings ?? '')

  useEffect(() => {
    const base = editing ?? emptyAccessReview()
    setTitle(base.title)
    setStatus(base.status)
    setReviewDueDate(base.review_due_date ?? '')
    setCompletedDate(base.completed_date ?? '')
    setFindings(base.findings ?? '')
  }, [editing])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptyAccessReview()
    setTitle(base.title)
    setStatus(base.status)
    setReviewDueDate(base.review_due_date ?? '')
    setCompletedDate(base.completed_date ?? '')
    setFindings(base.findings ?? '')
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const review: SecurityAccessReview = {
      ...(editing ?? emptyAccessReview()),
      title,
      status,
      review_due_date: reviewDueDate || null,
      completed_date: completedDate || null,
      findings: findings || null,
      created_by: null,
      updated_at: now,
    }
    if (editing) {
      await updateAccessReview(review)
    } else {
      await addAccessReview({ ...review, created_at: now })
    }
    reset()
  }

  const openCreate = () => {
    setEditing(null)
    setShow(true)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => (show ? reset() : openCreate())}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show && !editing ? M.sec_cancel : M.sec_add_review)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.sec_title_field)} className="sm:col-span-2">
            <FormInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label={x(M.sec_status)}>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as SecurityAccessReviewStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.sec_review_due_date)}>
            <FormInput type="date" value={reviewDueDate} onChange={(e) => setReviewDueDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.sec_completed_date)}>
            <FormInput type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.sec_summary)} className="sm:col-span-2">
            <FormTextarea value={findings} onChange={(e) => setFindings(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.sec_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(editing ? M.sec_save_changes : M.sec_save)}
            </button>
          </div>
        </div>
      ) : null}

      {accessReviews.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.sec_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {accessReviews.map((review) => (
            <AccessReviewRow key={review.id} review={review} onEdit={(r) => { setEditing(r); setShow(true) }} />
          ))}
        </div>
      )}
    </div>
  )
}
