import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSubmissionDueStatus } from './productionApi'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('comms production API shared utilities', () => {
  it('flags deadlines as overdue or due soon', () => {
    const today = new Date().toISOString().slice(0, 10)
    const overdue = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const dueSoon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    expect(getSubmissionDueStatus()).toBe('ok')
    expect(getSubmissionDueStatus(today)).toBe('due-soon')
    expect(getSubmissionDueStatus(overdue)).toBe('overdue')
    expect(getSubmissionDueStatus(dueSoon)).toBe('due-soon')
    expect(getSubmissionDueStatus('2030-01-01')).toBe('ok')
  })

  it('returns ok for invalid dates', () => {
    expect(getSubmissionDueStatus('not-a-date')).toBe('ok')
  })
})
