import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { statusChipClass } from '@/components/chips'
import { useSecurityData } from '../SecurityDataContext'
import type { SecurityAccessReview, SecurityAccessReviewStatus } from '../data/types'

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

function AccessReviewRow({ review }: { readonly review: SecurityAccessReview }) {
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
      <span className={statusChipClass(STATUS_TONE[review.status])}>{x(M[STATUS_LABELS[review.status]])}</span>
    </div>
  )
}

export function AccessReviews() {
  const { x } = useI18n()
  const { accessReviews } = useSecurityData()

  if (accessReviews.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.sec_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {accessReviews.map((review) => (
        <AccessReviewRow key={review.id} review={review} />
      ))}
    </div>
  )
}
