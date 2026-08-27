/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it } from 'vitest'
import {
  META_DESCRIPTION_MAX,
  META_DESCRIPTION_MIN,
  formatMetaDescription,
} from './metaDescription'

describe('formatMetaDescription', () => {
  it('returns text already within the SERP band unchanged', () => {
    const text =
      'Self-service Help Centre for Dutiva — sign-in, HR documents, AI Advisor, billing, privacy, security, and how digital-first support works. Bilingual EN/FR.'
    expect(text.length).toBeGreaterThanOrEqual(META_DESCRIPTION_MIN)
    expect(text.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX)
    expect(formatMetaDescription(text, 'en')).toBe(text)
  })

  it('pads short legal blurbs to the minimum length', () => {
    const out = formatMetaDescription(
      'Terms of Service: The agreement governing your use of Dutiva',
      'en',
      ' Official Dutiva Canada Inc. policy document.',
    )
    expect(out.length).toBeGreaterThanOrEqual(META_DESCRIPTION_MIN)
    expect(out.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX)
    expect(out).toContain('Terms of Service')
  })

  it('truncates long summaries at a word boundary', () => {
    const long =
      'How statutory notice, pay in lieu, and severance fit together for Ontario employers — and why the Employment Standards Act is a floor rather than a ceiling, with extra words that push this over the limit.'
    expect(long.length).toBeGreaterThan(META_DESCRIPTION_MAX)
    const out = formatMetaDescription(long, 'en')
    expect(out.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX)
    expect(out.startsWith('How statutory notice')).toBe(true)
  })
})
