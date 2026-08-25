import { describe, expect, it } from 'vitest'
import { publishedTestimonials } from './testimonialEntries'

describe('testimonialEntries', () => {
  it('starts empty until real beta quotes are added', () => {
    expect(publishedTestimonials()).toEqual([])
  })
})
