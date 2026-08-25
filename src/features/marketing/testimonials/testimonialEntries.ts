import type { Bi } from '@/i18n/core'

/**
 * Beta tester testimonials — only entries with `published: true` render on the
 * homepage (between Why Dutiva and Coverage) and on `/pricing`. Do not fabricate
 * quotes: add real beta feedback here once collected, with the participant's
 * consent and an optional photo under `public/`.
 */
export interface Testimonial {
  id: string
  /** One-line outcome-focused quote. */
  quote: Bi
  /** First name only, e.g. "Sarah K." */
  firstName: string
  /** Role and location, e.g. "HR Manager, Toronto" */
  role: Bi
  /** Path under `public/` — null shows an initials placeholder. */
  photoSrc: string | null
  /** Gate visibility until copy and consent are confirmed. */
  published: boolean
}

/** Newest or strongest quotes first when populated. */
export const TESTIMONIALS: readonly Testimonial[] = []

export function publishedTestimonials(): Testimonial[] {
  return TESTIMONIALS.filter((entry) => entry.published)
}
