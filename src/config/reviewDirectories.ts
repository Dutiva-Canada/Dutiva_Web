import { bi } from '@/i18n/core'
import type { Bi } from '@/i18n/core'

/**
 * Third-party review directory configuration — URLs stay null until profiles
 * are claimed on each platform (see docs/SEO_AUTHORITY_PLAYBOOK.md). The UI
 * renders links and badges only when the data here is real; never fabricate
 * review counts or star ratings.
 *
 * Set `reviewUrl` when a profile is live. Set `displayedReviewCount` only from
 * the platform's public count once reviews exist. `ratingBadge` copy appears on
 * the homepage trust strip and pricing page once count >= {@link REVIEW_BADGE_MIN_COUNT}.
 */
export interface ReviewDirectory {
  id: 'trustpilot' | 'g2' | 'capterra' | 'productHunt'
  label: Bi
  /** Public profile or review submission URL — null hides the link. */
  reviewUrl: string | null
  /** Optional short badge line, e.g. "4.8 on G2" — only when count threshold met. */
  ratingBadge: Bi | null
}

/** Minimum verified third-party reviews before a rating badge is shown. */
export const REVIEW_BADGE_MIN_COUNT = 5

/**
 * Aggregate count across primary directories for badge gating. Update manually
 * when platform counts change — there is no live API fetch on the marketing site.
 */
export const REVIEW_DISPLAYED_COUNT = 0

export const REVIEW_DIRECTORIES: readonly ReviewDirectory[] = [
  {
    id: 'trustpilot',
    label: bi('Review us on Trustpilot', 'Évaluez-nous sur Trustpilot'),
    reviewUrl: 'https://www.trustpilot.com/review/dutiva.ca',
    ratingBadge: null,
  },
  {
    id: 'g2',
    label: bi('Review us on G2', 'Évaluez-nous sur G2'),
    reviewUrl: null,
    ratingBadge: null,
  },
  {
    id: 'capterra',
    label: bi('Review us on Capterra', 'Évaluez-nous sur Capterra'),
    reviewUrl: null,
    ratingBadge: null,
  },
  {
    id: 'productHunt',
    label: bi('Follow on Product Hunt', 'Suivre sur Product Hunt'),
    reviewUrl: null,
    ratingBadge: null,
  },
]

export function activeReviewDirectories(): ReviewDirectory[] {
  return REVIEW_DIRECTORIES.filter((d) => d.reviewUrl)
}

export function shouldShowReviewBadge(): boolean {
  return REVIEW_DISPLAYED_COUNT >= REVIEW_BADGE_MIN_COUNT
}
