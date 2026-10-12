import { describe, expect, it } from 'vitest'
import { findUngroundedCitations } from './citationCheck.ts'
import type { GuidanceChunk } from './chatTypes.ts'

const chunk = (over: Partial<GuidanceChunk>): GuidanceChunk => ({
  id: 'c1',
  title: 'Termination of employment',
  content: '',
  source_name: '',
  source_url: 'https://example.test',
  jurisdiction: 'ON',
  effective_note: null,
  ...over,
})

const esaChunk = chunk({
  title: 'Termination notice under the Employment Standards Act',
  source_name: "Ontario.ca — Your guide to the ESA",
  content:
    'Under the Employment Standards Act, 2000, an employer must give written notice ' +
    'under section 54 before terminating an employee with 3+ months of service.',
})

describe('findUngroundedCitations', () => {
  it('returns [] when no chunks were retrieved', () => {
    expect(findUngroundedCitations('The Employment Standards Act applies.', [])).toEqual([])
  })

  it('passes a statute name the corpus covers', () => {
    const out = findUngroundedCitations(
      'Under the Employment Standards Act, notice is owed after 3 months.',
      [esaChunk],
    )
    expect(out).toEqual([])
  })

  it('flags a statute name absent from the corpus', () => {
    const out = findUngroundedCitations(
      'The Employment Standards Act applies, but see also the Pay Equity Act for related duties.',
      [esaChunk],
    )
    expect(out).toEqual(['Pay Equity Act'])
  })

  it('flags a section citation the corpus never cites', () => {
    const out = findUngroundedCitations(
      'Section 54 covers notice. Section 240 covers overtime.',
      [esaChunk],
    )
    expect(out).toEqual(['s. 240'])
  })

  it('ignores non-statute capitalized phrases and short matches', () => {
    const out = findUngroundedCitations(
      'Contact your HR team. The Act applies broadly here.',
      [esaChunk],
    )
    expect(out).toEqual([])
  })
})
