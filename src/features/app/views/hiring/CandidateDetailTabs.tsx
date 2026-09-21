import { CheckCircle, XCircle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import { statusChipClass } from '@/components/chips'
import type {
  ProductionAuthenticityScores,
  ProductionCandidate,
  ProductionCandidateStatus,
  ProductionDefenseInterview,
  ProductionEvidenceScreening,
  ProductionWorkSample,
} from './productionApi'
import {
  getAuthLabel,
  getEvidenceQualityLabel,
  getEvidenceQualityTone,
  getOverallScoreTone,
  getScoreLabel,
  getScoreTone,
  getSpecificityLabel,
  getStatusLabel,
  getStatusTone,
  getWorkSampleStatusLabel,
  getWorkSampleStatusTone,
} from './candidateDetailMeta'

/* Tab panels and label helpers for CandidateDetailProductionView —
   extracted to keep the screen file under the size budget. */

interface OverviewTabProps {
  candidate: ProductionCandidate
  statusUpdating: boolean
  assigneeValue: string
  onStatusChange: (next: ProductionCandidateStatus) => void
  onAssigneeChange: (value: string) => void
  onAssign: () => void
}

export function OverviewTab({
  candidate,
  statusUpdating,
  assigneeValue,
  onStatusChange,
  onAssigneeChange,
  onAssign,
}: OverviewTabProps) {
  const { x } = useI18n()

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <div className="mb-[16px] flex items-center justify-between gap-[12px]">
          <h2 className="text-[16px] font-bold text-text">{x(M.hiring_candidate_status)}</h2>
          <span className={statusChipClass(getStatusTone(candidate.status))}>
            {x(getStatusLabel(candidate.status))}
          </span>
        </div>
        <div className="grid gap-[12px] md:grid-cols-2">
          <div>
            <label
              htmlFor="cand-status-select"
              className="mb-[4px] block text-[12px] font-semibold text-text-3"
            >
              {x(M.hiring_candidate_status)}
            </label>
            <select
              id="cand-status-select"
              value={candidate.status}
              disabled={statusUpdating}
              onChange={(e) => onStatusChange(e.target.value as ProductionCandidateStatus)}
              className="w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text"
            >
              <option value="application">{x(M.hiring_status_application)}</option>
              <option value="basic_qualified">{x(M.hiring_status_basic_qualified)}</option>
              <option value="evidence_qualified">{x(M.hiring_status_evidence_qualified)}</option>
              <option value="work_sample">{x(M.hiring_status_work_sample)}</option>
              <option value="interview">{x(M.hiring_status_interview)}</option>
              <option value="hired">{x(M.hiring_status_hired)}</option>
              <option value="rejected">{x(M.hiring_status_rejected)}</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="cand-assign-input"
              className="mb-[4px] block text-[12px] font-semibold text-text-3"
            >
              {x(M.hiring_candidate_assign)}
            </label>
            <div className="flex gap-[8px]">
              <input
                id="cand-assign-input"
                value={assigneeValue}
                onChange={(e) => onAssigneeChange(e.target.value)}
                placeholder={candidate.assignedTo ?? x(M.hiring_candidate_unassign)}
                className="w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text"
              />
              <button
                type="button"
                onClick={onAssign}
                className="shrink-0 cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[9px] font-sans text-[13px] font-semibold text-white"
              >
                {x(M.hiring_action_save)}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h2 className="mb-[16px] text-[16px] font-bold text-text">
          {x(M.hiring_overview_application)}
        </h2>

        <div className="grid gap-[12px] md:grid-cols-2">
          <DetailRow label={M.hiring_overview_email} value={candidate.email} />
          {candidate.phone && <DetailRow label={M.hiring_overview_phone} value={candidate.phone} />}
          <DetailRow label={M.hiring_overview_location} value={candidate.location} />
          <DetailRow label={M.hiring_overview_position} value={candidate.position} />
          <DetailRow label={M.hiring_overview_current_role} value={candidate.currentRole} />
          <DetailRow label={M.hiring_overview_experience} value={`${candidate.yearsExperience}`} />
          <DetailRow
            label={M.hiring_overview_authorization}
            value={x(getAuthLabel(candidate.workAuthorization))}
          />
          {candidate.compensationExpectations && (
            <DetailRow
              label={M.hiring_overview_compensation}
              value={candidate.compensationExpectations}
            />
          )}
        </div>

        {candidate.linkedIn && (
          <div className="mt-[12px]">
            <a
              href={`https://${candidate.linkedIn}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-accent hover:underline"
            >
              {candidate.linkedIn}
            </a>
          </div>
        )}
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h2 className="mb-[16px] text-[16px] font-bold text-text">
          {x(M.hiring_overview_knockout)}
        </h2>

        <div className="mb-[12px] flex items-center gap-[8px]">
          {candidate.knockoutCriteria.meets_requirements ? (
            <CheckCircle size={16} className="text-success" strokeWidth={2} />
          ) : (
            <XCircle size={16} className="text-risk" strokeWidth={2} />
          )}
          <span className="text-[13px] font-semibold text-text">
            {candidate.knockoutCriteria.meets_requirements
              ? x(M.hiring_overview_meets_requirements)
              : x(M.hiring_overview_does_not_meet)}
          </span>
        </div>

        {candidate.knockoutCriteria.required_qualifications.length > 0 && (
          <div className="mb-[8px]">
            <div className="mb-[4px] text-[12px] font-semibold text-text-muted">
              {x(M.hiring_overview_requirements)}
            </div>
            <ul className="ml-[16px] list-disc space-y-[4px] text-[13px] text-text-2">
              {candidate.knockoutCriteria.required_qualifications.map((qual, idx) => (
                <li key={idx}>{qual}</li>
              ))}
            </ul>
          </div>
        )}

        {candidate.knockoutCriteria.missing_requirements.length > 0 && (
          <div>
            <div className="mb-[4px] text-[12px] font-semibold text-risk">
              {x(M.hiring_overview_missing)}
            </div>
            <ul className="ml-[16px] list-disc space-y-[4px] text-[13px] text-risk">
              {candidate.knockoutCriteria.missing_requirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export function EvidenceTab({ evidence }: { evidence: ProductionEvidenceScreening | null }) {
  const { x } = useI18n()

  if (!evidence) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">
          {x(M.hiring_empty_evidence)}
        </div>
        <div className="text-[13px] text-text-muted">{x(M.hiring_empty_evidence_body)}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <div className="mb-[16px] flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-text">{x(M.hiring_evidence_title)}</h2>
          <div className="flex gap-[8px]">
            <span className={statusChipClass(getEvidenceQualityTone(evidence.evidenceQuality))}>
              {x(getEvidenceQualityLabel(evidence.evidenceQuality))}
            </span>
            <span className="text-[12px] text-text-muted">
              {x(M.hiring_evidence_confidence)}: {evidence.confidence}
            </span>
          </div>
        </div>
        <p className="text-[13px] text-text-muted">{x(M.hiring_evidence_description)}</p>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h3 className="mb-[12px] text-[14px] font-bold text-text">
          {x(M.hiring_evidence_relevant_experience)}
        </h3>
        <div className="space-y-[12px]">
          {evidence.relevantExperience.map((claim, idx) => (
            <div key={idx} className="rounded-[8px] border border-inset bg-inset p-[12px]">
              <div className="mb-[4px] text-[13px] font-semibold text-text">{claim.claim}</div>
              <div className="mb-[4px] text-[12px] text-text-2">{claim.evidence}</div>
              <div className="flex flex-wrap gap-[8px] text-[11px] text-text-muted">
                <span>
                  {x(M.hiring_evidence_specificity)}: {x(getSpecificityLabel(claim.specificity))}
                </span>
                <span>
                  {x(M.hiring_evidence_confidence)}: {claim.confidence}
                </span>
              </div>
              {claim.missingInfo && (
                <div className="mt-[4px] text-[11px] text-risk">
                  {x(M.hiring_evidence_missing)}: {claim.missingInfo}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h3 className="mb-[12px] text-[14px] font-bold text-text">{x(M.hiring_evidence_skills)}</h3>
        <div className="grid gap-[8px] md:grid-cols-2">
          {evidence.skills.map((skill, idx) => (
            <div key={idx} className="rounded-[8px] border border-inset bg-inset p-[10px]">
              <div className="mb-[4px] flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text">{skill.skill}</span>
                <span className="text-[11px] text-text-muted">{skill.proficiency}</span>
              </div>
              <div className="text-[12px] text-text-2">{skill.evidence}</div>
            </div>
          ))}
        </div>
      </div>

      {evidence.missingInfo.length > 0 && (
        <div className="rounded-[12px] border border-border bg-surface p-[20px]">
          <h3 className="mb-[8px] text-[14px] font-bold text-text">
            {x(M.hiring_evidence_missing)}
          </h3>
          <ul className="ml-[16px] list-disc space-y-[4px] text-[13px] text-text-2">
            {evidence.missingInfo.map((info, idx) => (
              <li key={idx}>{info}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function WorkSampleTab({ workSample }: { workSample: ProductionWorkSample | null }) {
  const { x } = useI18n()

  if (!workSample) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">
          {x(M.hiring_empty_work_sample)}
        </div>
        <div className="text-[13px] text-text-muted">{x(M.hiring_empty_work_sample_body)}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <div className="mb-[16px] flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-text">{x(M.hiring_work_sample_title)}</h2>
          <span className={statusChipClass(getWorkSampleStatusTone(workSample.status))}>
            {x(getWorkSampleStatusLabel(workSample.status))}
          </span>
        </div>
        <p className="text-[13px] text-text-muted">{x(M.hiring_work_sample_description)}</p>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h3 className="mb-[8px] text-[14px] font-bold text-text">
          {x(M.hiring_work_sample_scenario)}
        </h3>
        <div className="rounded-[8px] border border-inset bg-inset p-[12px] text-[13px] text-text-2">
          {workSample.scenario}
        </div>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h3 className="mb-[8px] text-[14px] font-bold text-text">
          {x(M.hiring_work_sample_submission)}
        </h3>
        <div className="rounded-[8px] border border-inset bg-inset p-[12px] text-[13px] text-text-2">
          {workSample.submission}
        </div>
        <div className="mt-[8px] flex flex-wrap gap-[12px] text-[12px] text-text-muted">
          <span>
            {x(M.hiring_work_sample_ai_allowed)}: {workSample.aiAllowed ? 'Yes' : 'No'}
          </span>
          {workSample.aiDetected && <span>{x(M.hiring_work_sample_ai_detected)}: Yes</span>}
          {workSample.timeTaken && (
            <span>
              {x(M.hiring_work_sample_time)}: {workSample.timeTaken}
            </span>
          )}
        </div>
      </div>

      {workSample.evaluation && (
        <div className="rounded-[12px] border border-border bg-surface p-[20px]">
          <h3 className="mb-[12px] text-[14px] font-bold text-text">
            {x(M.hiring_work_sample_evaluation)}
          </h3>
          <DataBlock value={workSample.evaluation} />
        </div>
      )}
    </div>
  )
}

export function InterviewTab({ interview }: { interview: ProductionDefenseInterview | null }) {
  const { x } = useI18n()

  if (!interview) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">
          {x(M.hiring_empty_interview)}
        </div>
        <div className="text-[13px] text-text-muted">{x(M.hiring_empty_interview_body)}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <div className="mb-[16px] flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-text">{x(M.hiring_interview_title)}</h2>
          <span
            className={statusChipClass(interview.status === 'completed' ? 'success' : 'neutral')}
          >
            {interview.status}
          </span>
        </div>
        <p className="text-[13px] text-text-muted">{x(M.hiring_interview_description)}</p>
        <div className="mt-[8px] space-y-[4px] text-[12px] text-text-muted">
          <div>
            {x(M.hiring_interview_scheduled)}: {interview.scheduledDate}
          </div>
          <div>
            {x(M.hiring_interview_format)}: {interview.format}
          </div>
          <div>
            {x(M.hiring_interview_interviewers)}: {interview.interviewers.join(', ') || '-'}
          </div>
        </div>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h3 className="mb-[12px] text-[14px] font-bold text-text">
          {x(M.hiring_interview_conversation)}
        </h3>
        <div className="space-y-[12px]">
          {interview.conversation.map((exchange, idx) => (
            <div key={idx} className="rounded-[8px] border border-inset bg-inset p-[12px]">
              <DataBlock value={exchange} />
            </div>
          ))}
        </div>
      </div>

      {interview.assessment && (
        <div className="rounded-[12px] border border-border bg-surface p-[20px]">
          <h3 className="mb-[12px] text-[14px] font-bold text-text">
            {x(M.hiring_interview_assessment)}
          </h3>
          <DataBlock value={interview.assessment} />
        </div>
      )}
    </div>
  )
}

export function ScoresTab({ scores }: { scores: ProductionAuthenticityScores | null }) {
  const { x } = useI18n()

  if (!scores) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">
          {x(M.hiring_empty_scores)}
        </div>
        <div className="text-[13px] text-text-muted">{x(M.hiring_empty_scores_body)}</div>
      </div>
    )
  }

  const dimensions = [
    {
      key: 'qualification',
      label: M.hiring_scores_qualification,
      desc: M.hiring_scores_qualification_desc,
    },
    { key: 'evidence', label: M.hiring_scores_evidence, desc: M.hiring_scores_evidence_desc },
    { key: 'capability', label: M.hiring_scores_capability, desc: M.hiring_scores_capability_desc },
    { key: 'reasoning', label: M.hiring_scores_reasoning, desc: M.hiring_scores_reasoning_desc },
    { key: 'motivation', label: M.hiring_scores_motivation, desc: M.hiring_scores_motivation_desc },
  ] as const

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <div className="mb-[16px] flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-text">{x(M.hiring_scores_title)}</h2>
          <span className={statusChipClass(getOverallScoreTone(scores.overall))}>
            {x(M.hiring_scores_overall)}: {x(getScoreLabel(scores.overall))}
          </span>
        </div>
        <p className="text-[13px] text-text-muted">{x(M.hiring_scores_description)}</p>
      </div>

      <div className="grid gap-[12px] md:grid-cols-2">
        {dimensions.map((dim) => {
          const score = scores[dim.key]
          const explanation = scores.explanations.find((e) => e.dimension === dim.key)
          return (
            <div key={dim.key} className="rounded-[12px] border border-border bg-surface p-[16px]">
              <div className="mb-[8px]">
                <div className="text-[14px] font-bold text-text">{x(dim.label)}</div>
                <div className="text-[11px] text-text-muted">{x(dim.desc)}</div>
              </div>
              <div className="mb-[8px]">
                <span className={statusChipClass(getScoreTone(score))}>
                  {x(getScoreLabel(score))}
                </span>
              </div>
              {explanation && (
                <div className="rounded-[8px] border border-inset bg-inset p-[10px]">
                  <DataBlock value={explanation} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: Bi; value: string }) {
  const { x } = useI18n()
  return (
    <div>
      <div className="text-[11px] font-semibold text-text-muted">{x(label)}</div>
      <div className="text-[13px] text-text">{value}</div>
    </div>
  )
}

function DataBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-text-muted">—</span>
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-[13px] text-text-2">{String(value)}</span>
  }
  if (Array.isArray(value)) {
    return (
      <div className="space-y-[10px]">
        {value.map((item, idx) => (
          <div key={idx} className="rounded-[8px] border border-inset bg-inset p-[10px]">
            <DataBlock value={item} />
          </div>
        ))}
      </div>
    )
  }
  if (typeof value === 'object') {
    return (
      <div className="space-y-[6px]">
        {Object.entries(value as Record<string, unknown>)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => (
            <div key={k} className="grid grid-cols-1 gap-[2px] sm:grid-cols-[160px_1fr]">
              <span className="text-[12px] font-semibold text-text-muted">{k}</span>
              <div className="text-text-2">
                <DataBlock value={v} />
              </div>
            </div>
          ))}
      </div>
    )
  }
  return <span className="text-text-muted">—</span>
}
