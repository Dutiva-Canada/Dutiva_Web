import { describe, expect, it } from 'vitest'
import { deadlineState } from './productionApi'

describe('deadlineState', () => {
  it('returns none when no due date', () => {
    expect(deadlineState(undefined)).toBe('none')
  })

  it('returns overdue for a past date', () => {
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    expect(deadlineState(past)).toBe('overdue')
  })

  it('returns due_soon for a date within 7 days', () => {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    expect(deadlineState(soon)).toBe('due_soon')
  })

  it('returns ok for a date beyond 7 days', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    expect(deadlineState(future)).toBe('ok')
  })
})
