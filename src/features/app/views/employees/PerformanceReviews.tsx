import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { employeesMessages as M } from '@/i18n/messages/employees'
import { useToasts } from '@/features/app/toasts/toastsContext'
import type { ProductionEmployee, ProductionPerformanceReview } from './productionApi'
import { addPerformanceReview, listEmployeePerformanceReviews, removePerformanceReview } from './productionApi'

const RATINGS: ProductionPerformanceReview['rating'][] = ['exceeds', 'meets', 'needs_improvement', 'unrated']

const RATING_LABELS: Record<ProductionPerformanceReview['rating'], keyof typeof M> = {
  exceeds: 'employees_rating_exceeds',
  meets: 'employees_rating_meets',
  'needs_improvement': 'employees_rating_needs_improvement',
  unrated: 'employees_rating_unrated',
}

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

export function PerformanceReviews({
  employee,
  organizationId,
  roster,
  isOrgAdmin,
}: {
  readonly employee: ProductionEmployee
  readonly organizationId: string
  readonly roster: ProductionEmployee[]
  readonly isOrgAdmin: boolean
}) {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const [reviews, setReviews] = useState<ProductionPerformanceReview[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [reviewDate, setReviewDate] = useState('')
  const [reviewerId, setReviewerId] = useState('')
  const [goals, setGoals] = useState('')
  const [rating, setRating] = useState<ProductionPerformanceReview['rating']>('unrated')
  const [notes, setNotes] = useState('')
  const [nextReviewDate, setNextReviewDate] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listEmployeePerformanceReviews(employee.id)
      .then((data) => {
        if (!cancelled) setReviews(data)
      })
      .catch(() => showToast(M.employees_prod_reviews_load_failed, 'info'))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [employee.id, showToast])

  const reset = () => {
    setReviewDate('')
    setReviewerId('')
    setGoals('')
    setRating('unrated')
    setNotes('')
    setNextReviewDate('')
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewDate.trim() || saving) return
    setSaving(true)
    try {
      const added = await addPerformanceReview(organizationId, employee.id, {
        reviewDate,
        reviewerId: reviewerId || undefined,
        goals: goals.trim(),
        rating,
        notes: notes.trim(),
        nextReviewDate: nextReviewDate || null,
      })
      setReviews((prev) => [added, ...prev].sort((a, b) => b.reviewDate.localeCompare(a.reviewDate)))
      reset()
      showToast(M.employees_prod_review_added, 'ok')
    } catch {
      showToast(M.employees_prod_review_add_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onRemove = async (id: string) => {
    try {
      await removePerformanceReview(id)
      setReviews((prev) => prev.filter((r) => r.id !== id))
      showToast(M.employees_prod_review_removed, 'ok')
    } catch {
      showToast(M.employees_prod_review_remove_failed, 'info')
    }
  }

  return (
    <div className="space-y-[14px]">
      <div className="mb-[12px] text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
        {x(M.employees_prod_reviews_title)}
      </div>

      {loading ? (
        <div className="text-[13px] text-text-muted">{x(M.employees_prod_loading)}</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[18px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.employees_prod_reviews_empty)}</p>
        </div>
      ) : (
        <div className="mb-[14px] overflow-hidden rounded-[12px] border border-border bg-surface">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-wrap items-start justify-between gap-[12px] border-t border-inset px-[18px] py-[13px] first:border-t-0"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-text">
                  {review.reviewDate}
                  {review.reviewerName ? ` · ${review.reviewerName}` : null}
                </div>
                <div className="mt-[2px] text-[12px] text-text-muted">
                  {x(M[RATING_LABELS[review.rating]])}
                  {review.nextReviewDate ? ` · ${x(M.employees_prod_review_next)} ${review.nextReviewDate}` : null}
                </div>
                {review.goals ? (
                  <div className="mt-[6px] text-[13px] leading-relaxed text-text-2">{review.goals}</div>
                ) : null}
                {review.notes ? (
                  <div className="mt-[4px] text-[13px] leading-relaxed text-text-3">{review.notes}</div>
                ) : null}
              </div>
              {isOrgAdmin && (
                <button
                  type="button"
                  onClick={() => void onRemove(review.id)}
                  className="shrink-0 border-none bg-transparent p-[6px] text-text-muted hover:text-risk-fg"
                  aria-label={x(M.employees_prod_review_remove)}
                >
                  <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOrgAdmin && (
        <form onSubmit={(e) => void onSubmit(e)} className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div>
              <label className={labelClass}>{x(M.employees_prod_review_date)}</label>
              <input
                type="date"
                required
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{x(M.employees_prod_reviewer)}</label>
              <select
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                className={inputClass}
              >
                <option value="">{x(M.employees_prod_reviewer_unset)}</option>
                {roster
                  .filter((r) => r.id !== employee.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.employees_prod_rating)}</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value as ProductionPerformanceReview['rating'])}
                className={inputClass}
              >
                {RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {x(M[RATING_LABELS[r]])}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.employees_prod_review_next)}</label>
              <input
                type="date"
                value={nextReviewDate}
                onChange={(e) => setNextReviewDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.employees_prod_goals)}</label>
              <input
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.employees_prod_notes)}</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-[14px] flex gap-[8px]">
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {x(M.employees_prod_review_save)}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
