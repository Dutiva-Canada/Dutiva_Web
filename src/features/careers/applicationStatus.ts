import { careersMessages as M } from '@/i18n/messages/careers'
import type { ChipTone } from '@/components/chips'
import type { ApplicationStatus } from '@/features/careers/data/applicationsApi'

/**
 * Shared candidate-application status presentation — chip tone and the
 * localized label for each pipeline status. Used by the candidate portal
 * (PortalHome, ApplicationsPage) and by the employer's applications inbox in
 * Hiring, so both sides of the pipeline describe the same status the same way.
 */

/** Terminal statuses — the candidate can no longer withdraw. */
export const TERMINAL_APPLICATION_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
  'hired',
  'rejected',
  'withdrawn',
])

/** Statuses an employer can move an application to (never 'withdrawn'). */
export const EMPLOYER_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'offered',
  'hired',
  'rejected',
]

/** Status → chip tone for the application badges. */
export function applicationStatusTone(status: ApplicationStatus): ChipTone {
  switch (status) {
    case 'submitted':
    case 'under_review':
      return 'info'
    case 'shortlisted':
    case 'interview':
    case 'offered':
    case 'hired':
      return 'success'
    case 'rejected':
      return 'risk'
    case 'withdrawn':
      return 'neutral'
    default:
      return 'neutral'
  }
}

/** Status → localized label message. */
export function applicationStatusLabel(status: ApplicationStatus) {
  switch (status) {
    case 'submitted':
      return M.careers_applications_status_submitted
    case 'under_review':
      return M.careers_applications_status_under_review
    case 'shortlisted':
      return M.careers_applications_status_shortlisted
    case 'interview':
      return M.careers_applications_status_interview
    case 'offered':
      return M.careers_applications_status_offered
    case 'hired':
      return M.careers_applications_status_hired
    case 'rejected':
      return M.careers_applications_status_rejected
    case 'withdrawn':
      return M.careers_applications_status_withdrawn
    default:
      return M.careers_applications_status_submitted
  }
}
