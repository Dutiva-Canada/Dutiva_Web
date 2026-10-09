import { hiringMessages as M } from '@/i18n/messages/hiring'

/**
 * Label/tone helpers for the demo candidate-detail tabs — the demo-status
 * vocabulary differs subtly from production (candidateDetailMeta.ts), so
 * these live beside the demo tabs they serve. Split from
 * CandidateDetailDemoTabs.tsx to keep that file component-only
 * (react/only-export-components).
 */

// Helper functions
export function getStatusTone(status: string): 'success' | 'info' | 'warning' | 'risk' {
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
      return 'info'
    case 'rejected':
      return 'risk'
    default:
      return 'info'
  }
}

export function getStatusLabel(status: string) {
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

export function getAuthLabel(auth: string) {
  switch (auth) {
    case 'authorized':
      return M.hiring_auth_authorized
    case 'needs_sponsorship':
      return M.hiring_auth_needs_sponsorship
    default:
      return M.hiring_auth_unknown
  }
}

export function getEvidenceQualityTone(quality: string): 'success' | 'info' | 'warning' | 'risk' {
  switch (quality) {
    case 'high':
      return 'success'
    case 'medium':
      return 'info'
    case 'low':
      return 'warning'
    case 'generic':
      return 'risk'
    default:
      return 'info'
  }
}

export function getEvidenceQualityLabel(quality: string) {
  switch (quality) {
    case 'high':
      return M.hiring_evidence_high_quality
    case 'medium':
      return M.hiring_evidence_medium_quality
    case 'low':
      return M.hiring_evidence_low_quality
    case 'generic':
      return M.hiring_evidence_generic
    default:
      return M.hiring_evidence_generic
  }
}

export function getSpecificityLabel(specificity: string) {
  switch (specificity) {
    case 'specific':
      return M.hiring_evidence_specificity_specific
    case 'moderate':
      return M.hiring_evidence_specificity_moderate
    case 'generic':
      return M.hiring_evidence_specificity_generic
    default:
      return M.hiring_evidence_specificity_generic
  }
}

export function getWorkSampleStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return M.hiring_work_sample_pending
    case 'in_progress':
      return M.hiring_work_sample_in_progress
    case 'completed':
      return M.hiring_work_sample_completed
    case 'skipped':
      return M.hiring_work_sample_skipped
    default:
      return M.hiring_work_sample_pending
  }
}

export function getScoreTone(score: string): 'success' | 'info' | 'warning' | 'risk' {
  switch (score) {
    case 'high':
      return 'success'
    case 'medium':
      return 'info'
    case 'low':
      return 'warning'
    case 'insufficient':
      return 'risk'
    default:
      return 'info'
  }
}

export function getScoreLabel(score: string) {
  switch (score) {
    case 'high':
      return M.hiring_scores_high
    case 'medium':
      return M.hiring_scores_medium
    case 'low':
      return M.hiring_scores_low
    case 'insufficient':
      return M.hiring_scores_insufficient
    default:
      return M.hiring_scores_insufficient
  }
}

export function getOverallScoreTone(overall: string): 'success' | 'info' | 'warning' | 'risk' {
  switch (overall) {
    case 'high':
      return 'success'
    case 'medium':
      return 'info'
    case 'low':
      return 'warning'
    default:
      return 'risk'
  }
}
