import { describe, expect, it } from 'vitest'
import { secretEquals } from './secretEqual'

describe('secretEquals', () => {
  it('accepts an exact match only', () => {
    expect(secretEquals('trigger-secret-abc', 'trigger-secret-abc')).toBe(true)
    expect(secretEquals('trigger-secret-abd', 'trigger-secret-abc')).toBe(false)
  })

  it('rejects prefix shares and wrong lengths', () => {
    expect(secretEquals('trigger-secret', 'trigger-secret-abc')).toBe(false)
    expect(secretEquals('trigger-secret-abc-extra', 'trigger-secret-abc')).toBe(false)
  })

  it('never accepts an empty expected secret', () => {
    expect(secretEquals('', '')).toBe(false)
    expect(secretEquals('anything', '')).toBe(false)
  })

  it('handles unicode and case sensitivity', () => {
    expect(secretEquals('clé-secrète', 'clé-secrète')).toBe(true)
    expect(secretEquals('Secret', 'secret')).toBe(false)
  })
})
