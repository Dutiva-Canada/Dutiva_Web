import { hiringMessages as M } from '@/i18n/messages/hiring'
import type { Candidate } from '@/data'

/**
 * Shared presentation helpers for the hiring pipeline's candidate statuses
 * (the internal funnel: application → basic_qualified → … → hired). Used by
 * both the demo and production Hiring views so a status reads identically on
 * either side of workspace mode.
 */

export function candidateStatusTone(
  status: Candidate['status'],
): 'success' | 'info' | 'warning' | 'risk' | 'neutral' {
  switch (status) {
    case 'hired':
      return 'success'
    case 'interview':
    case 'work_sample':
    case 'evidence_qualified':
      return 'info'
    case 'basic_qualified':
      return 'warning'
    case 'application':
      return 'neutral'
    case 'rejected':
      return 'risk'
    default:
      return 'neutral'
  }
}

export function candidateStatusLabel(status: Candidate['status']) {
  switch (status) {
    case 'application':
      return M.hiring_status_application
    case 'basic_qualified':
      return M.hiring_status_basic_qualified
    case 'evidence_qualified':
      return M.hiring_status_evidence_qualified
    case 'work_sample':
      return M.hiring_status_work_sample
    case 'interview':
      return M.hiring_status_interview
    case 'hired':
      return M.hiring_status_hired
    case 'rejected':
      return M.hiring_status_rejected
    default:
      return M.hiring_status_application
  }
}
