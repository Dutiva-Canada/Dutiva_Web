import type { Bi } from '@/i18n/core'
import { hiringMessages as M } from '@/i18n/messages/hiring'

/* Status/quality/score tone + label lookups for the candidate-detail screen
   and its tabs — kept out of the component files so fast refresh stays clean
   (only-export-components). */

export function getStatusTone(status: string): 'success' | 'info' | 'warning' | 'risk' | 'neutral' {
  if (status === 'hired') return 'success'
  if (status === 'interview' || status === 'work_sample' || status === 'evidence_qualified')
    return 'info'
  if (status === 'basic_qualified') return 'warning'
  if (status === 'rejected') return 'risk'
  return 'neutral'
}

export function getStatusLabel(status: string) {
  return (
    (
      {
        application: M.hiring_status_application,
        basic_qualified: M.hiring_status_basic_qualified,
        evidence_qualified: M.hiring_status_evidence_qualified,
        work_sample: M.hiring_status_work_sample,
        interview: M.hiring_status_interview,
        hired: M.hiring_status_hired,
        rejected: M.hiring_status_rejected,
      } as Record<string, Bi>
    )[status] ?? M.hiring_status_application
  )
}

export function getAuthLabel(auth: string) {
  return auth === 'authorized'
    ? M.hiring_auth_authorized
    : auth === 'needs_sponsorship'
      ? M.hiring_auth_needs_sponsorship
      : M.hiring_auth_unknown
}

export function getEvidenceQualityTone(quality: string): 'success' | 'info' | 'warning' | 'risk' {
  return (
    ({ high: 'success', medium: 'info', low: 'warning', generic: 'risk' } as const)[
      quality as 'high'
    ] ?? 'info'
  )
}

export function getEvidenceQualityLabel(quality: string) {
  return (
    (
      {
        high: M.hiring_evidence_high_quality,
        medium: M.hiring_evidence_medium_quality,
        low: M.hiring_evidence_low_quality,
        generic: M.hiring_evidence_generic,
      } as Record<string, Bi>
    )[quality] ?? M.hiring_evidence_generic
  )
}

export function getSpecificityLabel(specificity: string) {
  return (
    (
      {
        specific: M.hiring_evidence_specificity_specific,
        moderate: M.hiring_evidence_specificity_moderate,
        generic: M.hiring_evidence_specificity_generic,
      } as Record<string, Bi>
    )[specificity] ?? M.hiring_evidence_specificity_generic
  )
}

export function getWorkSampleStatusTone(
  status: string,
): 'success' | 'info' | 'warning' | 'risk' | 'neutral' {
  return (
    (
      { completed: 'success', in_progress: 'info', pending: 'neutral', skipped: 'warning' } as const
    )[status as 'completed'] ?? 'neutral'
  )
}

export function getWorkSampleStatusLabel(status: string) {
  return (
    (
      {
        pending: M.hiring_work_sample_pending,
        in_progress: M.hiring_work_sample_in_progress,
        completed: M.hiring_work_sample_completed,
        skipped: M.hiring_work_sample_skipped,
      } as Record<string, Bi>
    )[status] ?? M.hiring_work_sample_pending
  )
}

export function getScoreTone(score: string): 'success' | 'info' | 'warning' | 'risk' {
  return (
    ({ high: 'success', medium: 'info', low: 'warning', insufficient: 'risk' } as const)[
      score as 'high'
    ] ?? 'info'
  )
}

export function getScoreLabel(score: string) {
  return (
    (
      {
        high: M.hiring_scores_high,
        medium: M.hiring_scores_medium,
        low: M.hiring_scores_low,
        insufficient: M.hiring_scores_insufficient,
      } as Record<string, Bi>
    )[score] ?? M.hiring_scores_insufficient
  )
}

export function getOverallScoreTone(overall: string): 'success' | 'info' | 'warning' | 'risk' {
  if (overall === 'high') return 'success'
  if (overall === 'medium') return 'info'
  if (overall === 'low') return 'warning'
  return 'risk'
}
