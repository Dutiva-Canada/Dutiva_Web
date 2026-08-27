import { describe, expect, it } from 'vitest'
import {
  REVIEW_BADGE_MIN_COUNT,
  REVIEW_DISPLAYED_COUNT,
  REVIEW_DIRECTORIES,
  activeReviewDirectories,
  shouldShowReviewBadge,
} from './reviewDirectories'

describe('reviewDirectories', () => {
  it('exposes the live Trustpilot profile and keeps rating badges off until real reviews exist', () => {
    const active = activeReviewDirectories()
    expect(active).toHaveLength(1)
    expect(active[0]?.id).toBe('trustpilot')
    expect(active[0]?.reviewUrl).toBe('https://www.trustpilot.com/review/dutiva.ca')
    expect(REVIEW_DIRECTORIES.every((d) => d.ratingBadge === null)).toBe(true)
    expect(shouldShowReviewBadge()).toBe(false)
    expect(REVIEW_DISPLAYED_COUNT).toBeLessThan(REVIEW_BADGE_MIN_COUNT)
  })
})
