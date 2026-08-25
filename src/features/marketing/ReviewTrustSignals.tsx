import { Star } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import {
  REVIEW_DIRECTORIES,
  REVIEW_DISPLAYED_COUNT,
  shouldShowReviewBadge,
} from '@/config/reviewDirectories'
import { ReviewDirectoryLinks } from './ReviewDirectoryLinks'

/**
 * Third-party review trust row — rating badge (when count threshold met) plus
 * directory links. Renders nothing until at least one `reviewUrl` is configured
 * or a badge is eligible to display.
 */
export function ReviewTrustSignals({ compact }: { readonly compact?: boolean }) {
  const { x } = useI18n()
  const links = REVIEW_DIRECTORIES.filter((d) => d.reviewUrl)
  const showBadge = shouldShowReviewBadge()
  const badgeSource = REVIEW_DIRECTORIES.find((d) => d.ratingBadge)?.ratingBadge

  if (!showBadge && links.length === 0) return null

  return (
    <div
      className={
        compact
          ? 'flex flex-wrap items-center justify-center gap-x-3 gap-y-2'
          : 'flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-bg-elevated px-5 py-4'
      }
    >
      {showBadge && badgeSource && (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-text">
          <Star size={14} className="text-gold-strong" aria-hidden="true" />
          {x(badgeSource)}
          <span className="font-normal text-text-3">
            ({REVIEW_DISPLAYED_COUNT}+ {x({ en: 'reviews', fr: 'évaluations' })})
          </span>
        </span>
      )}
      {showBadge && links.length > 0 && <span className="text-border-strong">·</span>}
      <ReviewDirectoryLinks className="flex flex-wrap items-center gap-x-3 gap-y-1" />
    </div>
  )
}
