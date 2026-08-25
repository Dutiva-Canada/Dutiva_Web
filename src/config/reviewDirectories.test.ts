import { describe, expect, it } from 'vitest'
import {
  REVIEW_BADGE_MIN_COUNT,
  REVIEW_DISPLAYED_COUNT,
  activeReviewDirectories,
  shouldShowReviewBadge,
} from './reviewDirectories'

describe('reviewDirectories', () => {
  it('starts with no public review links until profiles are configured', () => {
    expect(activeReviewDirectories()).toHaveLength(0)
    expect(shouldShowReviewBadge()).toBe(false)
    expect(REVIEW_DISPLAYED_COUNT).toBeLessThan(REVIEW_BADGE_MIN_COUNT)
  })
})
