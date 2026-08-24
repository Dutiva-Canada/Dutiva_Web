import { describe, expect, it } from 'vitest'
import {
  formatCad,
  ontarioEsaSeveranceAmount,
  ontarioEsaSeveranceWeeks,
} from './ontarioEsaSeverance'

describe('ontarioEsaSeveranceWeeks', () => {
  it('adds a partial final year as months/12', () => {
    expect(ontarioEsaSeveranceWeeks(5, 6)).toBe(5.5)
  })

  it('caps at 26 weeks', () => {
    expect(ontarioEsaSeveranceWeeks(30, 0)).toBe(26)
    expect(ontarioEsaSeveranceWeeks(26, 0)).toBe(26)
  })

  it('rejects months outside 0–11', () => {
    expect(ontarioEsaSeveranceWeeks(5, 12)).toBeNull()
    expect(ontarioEsaSeveranceWeeks(5, -1)).toBeNull()
  })
})

describe('ontarioEsaSeveranceAmount', () => {
  it('multiplies weekly wages by weeks', () => {
    expect(ontarioEsaSeveranceAmount(1000, 5.5)).toBe(5500)
  })

  it('formats CAD for both locales', () => {
    expect(formatCad(5500, 'en')).toMatch(/5[, ]?500/)
    expect(formatCad(5500, 'fr')).toMatch(/5/)
  })
})
