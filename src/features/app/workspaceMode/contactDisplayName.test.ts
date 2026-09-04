import { describe, expect, it } from 'vitest'
import {
  humanizeEmailLocalPart,
  looksLikeEmail,
  resolveContactDisplayName,
} from './contactDisplayName'

describe('contactDisplayName', () => {
  it('detects email-shaped strings', () => {
    expect(looksLikeEmail('martin.constantineau@dutiva.ca')).toBe(true)
    expect(looksLikeEmail('Martin Constantineau')).toBe(false)
  })

  it('title-cases email local parts', () => {
    expect(humanizeEmailLocalPart('martin.constantineau')).toBe('Martin Constantineau')
    expect(humanizeEmailLocalPart('martin_c')).toBe('Martin C')
  })

  it('prefers a real contact name over email', () => {
    expect(
      resolveContactDisplayName({
        contactName: 'Martin C.',
        email: 'martin.constantineau@dutiva.ca',
      }),
    ).toBe('Martin C.')
  })

  it('humanizes when primary_contact was seeded with the email', () => {
    expect(
      resolveContactDisplayName({
        contactName: 'martin.constantineau@dutiva.ca',
        email: 'martin.constantineau@dutiva.ca',
      }),
    ).toBe('Martin Constantineau')
  })

  it('prefers auth full_name when it is not an email', () => {
    expect(
      resolveContactDisplayName({
        contactName: 'martin.constantineau@dutiva.ca',
        email: 'martin.constantineau@dutiva.ca',
        authFullName: 'Martin',
      }),
    ).toBe('Martin')
  })
})
