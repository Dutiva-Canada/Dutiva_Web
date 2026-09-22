import { describe, expect, it } from 'vitest'
import {
  EMPLOYER_APPLICATION_STATUSES,
  TERMINAL_APPLICATION_STATUSES,
  applicationStatusLabel,
  applicationStatusTone,
} from './applicationStatus'
import type { ApplicationStatus } from './data/applicationsApi'

const ALL_STATUSES: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'offered',
  'hired',
  'rejected',
  'withdrawn',
]

describe('applicationStatus', () => {
  it('maps every application status to a tone and a label', () => {
    for (const status of ALL_STATUSES) {
      expect(applicationStatusTone(status)).toBeTruthy()
      const label = applicationStatusLabel(status)
      expect(label.en).toBeTruthy()
      expect(label.fr).toBeTruthy()
    }
  })

  it('never lets an employer set the candidate-only withdrawn status', () => {
    expect(EMPLOYER_APPLICATION_STATUSES).not.toContain('withdrawn')
    expect(EMPLOYER_APPLICATION_STATUSES).toContain('submitted')
    expect(EMPLOYER_APPLICATION_STATUSES).toContain('hired')
  })

  it('treats hired, rejected and withdrawn as terminal for the candidate', () => {
    expect(TERMINAL_APPLICATION_STATUSES.has('hired')).toBe(true)
    expect(TERMINAL_APPLICATION_STATUSES.has('rejected')).toBe(true)
    expect(TERMINAL_APPLICATION_STATUSES.has('withdrawn')).toBe(true)
    expect(TERMINAL_APPLICATION_STATUSES.has('submitted')).toBe(false)
    expect(TERMINAL_APPLICATION_STATUSES.has('interview')).toBe(false)
  })
})
