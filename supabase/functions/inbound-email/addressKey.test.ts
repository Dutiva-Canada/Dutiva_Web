import { describe, expect, it } from 'vitest'
import { extractEmailKey } from './addressKey'

const KEY = 'a1b2c3d4e5f60718'

describe('extractEmailKey', () => {
  it('reads a bare address in `to`', () => {
    expect(extractEmailKey([`in-${KEY}@in.dutiva.ca`], null)).toBe(KEY)
  })

  it('reads a display-name address', () => {
    expect(extractEmailKey([`Dutiva Inbox <in-${KEY}@in.dutiva.ca>`], [])).toBe(KEY)
  })

  it('falls back to received_for when `to` lacks the key', () => {
    expect(extractEmailKey(['someone@elsewhere.com'], [`in-${KEY}@in.dutiva.ca`])).toBe(KEY)
  })

  it('accepts a string `to` (not just arrays)', () => {
    expect(extractEmailKey(`in-${KEY}@in.dutiva.ca`, undefined)).toBe(KEY)
  })

  it('uppercases keys normalize to lowercase', () => {
    expect(extractEmailKey([`IN-${KEY.toUpperCase()}@IN.DUTIVA.CA`], null)).toBe(KEY)
  })

  it('returns null when no minted address is present', () => {
    expect(extractEmailKey(['hello@dutiva.ca'], ['other@in.dutiva.ca'])).toBeNull()
    expect(extractEmailKey(null, null)).toBeNull()
    expect(extractEmailKey([], [])).toBeNull()
  })

  it('ignores too-short keys', () => {
    expect(extractEmailKey(['in-abc@in.dutiva.ca'], null)).toBeNull()
  })
})
