import { CheckCircle, XCircle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import { statusChipClass } from '@/components/chips'
import {
  getAuthLabel,
  getEvidenceQualityLabel,
  getEvidenceQualityTone,
  getOverallScoreTone,
  getScoreLabel,
  getScoreTone,
  getSpecificityLabel,
  getWorkSampleStatusLabel,
} from './candidateDetailDemoMeta'
import type {
  Candidate,
  EvidenceScreening,
  WorkSampleAssessment,
  DefenseInterview,
  AuthenticityScores,
} from '@/data'

/**
 * Demo candidate-detail tab panels — split from CandidateDetailDemoView.tsx
 * to stay within the 800-line architecture budget. The view keeps the
 * header/tab bar; these render each tab's body.
 */

export function OverviewTab({ candidate }: { candidate: Candidate }) {
  const { x } = useI18n()

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Application details */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h2 className="mb-[16px] text-[16px] font-bold text-text">
          {x(M.hiring_overview_application)}
        </h2>

        <div className="grid gap-[12px] md:grid-cols-2">
          <DetailRow label={M.hiring_overview_email} value={candidate.email} />
          {candidate.phone && <DetailRow label={M.hiring_overview_phone} value={candidate.phone} />}
          <DetailRow label={M.hiring_overview_location} value={x(candidate.location)} />
          <DetailRow label={M.hiring_overview_position} value={x(candidate.position)} />
          <DetailRow label={M.hiring_overview_current_role} value={x(candidate.currentRole)} />
          <DetailRow
            label={M.hiring_overview_experience}
            value={`${candidate.yearsExperience} years`}
          />
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

      {/* Knockout criteria */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h2 className="mb-[16px] text-[16px] font-bold text-text">
          {x(M.hiring_overview_knockout)}
        </h2>

        <div className="mb-[12px] flex items-center gap-[8px]">
          {candidate.knockoutCriteria.meetsRequirements ? (
            <CheckCircle size={16} className="text-success" strokeWidth={2} />
          ) : (
            <XCircle size={16} className="text-risk" strokeWidth={2} />
          )}
          <span className="text-[13px] font-semibold text-text">
            {candidate.knockoutCriteria.meetsRequirements
              ? x(M.hiring_overview_meets_requirements)
              : x(M.hiring_overview_does_not_meet)}
          </span>
        </div>

        {candidate.knockoutCriteria.requiredQualifications.length > 0 && (
          <div className="mb-[8px]">
            <div className="mb-[4px] text-[12px] font-semibold text-text-muted">
              {x(M.hiring_overview_requirements)}
            </div>
            <ul className="ml-[16px] list-disc space-y-[4px] text-[13px] text-text-2">
              {candidate.knockoutCriteria.requiredQualifications.map((qual, idx) => (
                <li key={idx}>{qual}</li>
              ))}
            </ul>
          </div>
        )}

        {candidate.knockoutCriteria.missingRequirements.length > 0 && (
          <div>
            <div className="mb-[4px] text-[12px] font-semibold text-risk">
              {x(M.hiring_overview_missing)}
            </div>
            <ul className="ml-[16px] list-disc space-y-[4px] text-[13px] text-risk">
              {candidate.knockoutCriteria.missingRequirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export function EvidenceTab({ evidence }: { evidence?: EvidenceScreening }) {
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

      {/* Relevant experience */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h3 className="mb-[12px] text-[14px] font-bold text-text">
          {x(M.hiring_evidence_relevant_experience)}
        </h3>
        <div className="space-y-[12px]">
          {evidence.relevantExperience.map((claim, idx) => (
            <div key={idx} className="rounded-[8px] border border-inset bg-inset p-[12px]">
              <div className="mb-[4px] text-[13px] font-semibold text-text">{x(claim.claim)}</div>
              <div className="mb-[4px] text-[12px] text-text-2">{x(claim.evidence)}</div>
              <div className="flex gap-[8px] text-[11px] text-text-muted">
                <span>
                  {x(M.hiring_evidence_specificity)}: {x(getSpecificityLabel(claim.specificity))}
                </span>
                <span>Confidence: {claim.confidence}</span>
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

      {/* Skills */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h3 className="mb-[12px] text-[14px] font-bold text-text">{x(M.hiring_evidence_skills)}</h3>
        <div className="grid gap-[8px] md:grid-cols-2">
          {evidence.skills.map((skill, idx) => (
            <div key={idx} className="rounded-[8px] border border-inset bg-inset p-[10px]">
              <div className="mb-[4px] flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text">{x(skill.skill)}</span>
                <span className="text-[11px] text-text-muted">{skill.proficiency}</span>
              </div>
              <div className="text-[12px] text-text-2">{x(skill.evidence)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Missing info */}
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

export function WorkSampleTab({ workSample }: { workSample?: WorkSampleAssessment }) {
  const { x } = useI18n()

  if (!workSample) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">
          {x(M.hiring_empty_work_sample)}
        </div>
        <div className="text-[13px] text-text-muted">{x(M.hiring_empty_work_sample_body)}</div>
        <button
          type="button"
          className="mt-[16px] cursor-pointer rounded-[8px] border-none bg-navy px-[16px] py-[8px] font-sans text-[13px] font-semibold text-white"
        >
          {x(M.hiring_work_sample_assign)}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <div className="mb-[16px] flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-text">{x(M.hiring_work_sample_title)}</h2>
          <span
            className={statusChipClass(workSample.status === 'completed' ? 'success' : 'neutral')}
          >
            {x(getWorkSampleStatusLabel(workSample.status))}
          </span>
        </div>
        <p className="text-[13px] text-text-muted">{x(M.hiring_work_sample_description)}</p>
      </div>

      {/* Scenario */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h3 className="mb-[8px] text-[14px] font-bold text-text">
          {x(M.hiring_work_sample_scenario)}
        </h3>
        <div className="rounded-[8px] border border-inset bg-inset p-[12px] text-[13px] text-text-2">
          {x(workSample.scenario)}
        </div>
      </div>

      {/* Submission */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h3 className="mb-[8px] text-[14px] font-bold text-text">
          {x(M.hiring_work_sample_submission)}
        </h3>
        <div className="rounded-[8px] border border-inset bg-inset p-[12px] text-[13px] text-text-2">
          {x(workSample.submission)}
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

      {/* Evaluation */}
      {workSample.evaluation && (
        <div className="rounded-[12px] border border-border bg-surface p-[20px]">
          <h3 className="mb-[12px] text-[14px] font-bold text-text">
            {x(M.hiring_work_sample_evaluation)}
          </h3>
          <div className="space-y-[8px]">
            <div className="flex justify-between text-[13px]">
              <span className="text-text-muted">{x(M.hiring_work_sample_quality)}</span>
              <span className="font-semibold text-text">{workSample.evaluation.quality}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-text-muted">{x(M.hiring_work_sample_capability)}</span>
              <span className="font-semibold text-text">{workSample.evaluation.capability}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-text-muted">{x(M.hiring_work_sample_recommendation)}</span>
              <span
                className={`font-semibold ${workSample.evaluation.recommendation === 'advance' ? 'text-success' : 'text-risk'}`}
              >
                {workSample.evaluation.recommendation}
              </span>
            </div>
            <div className="mt-[12px] rounded-[8px] border border-inset bg-inset p-[12px]">
              <div className="mb-[4px] text-[12px] font-semibold text-text-muted">
                {x(M.hiring_work_sample_feedback)}
              </div>
              <div className="text-[13px] text-text-2">{x(workSample.evaluation.feedback)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function InterviewTab({ interview }: { interview?: DefenseInterview }) {
  const { x } = useI18n()

  if (!interview) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">
          {x(M.hiring_empty_interview)}
        </div>
        <div className="text-[13px] text-text-muted">{x(M.hiring_empty_interview_body)}</div>
        <button
          type="button"
          className="mt-[16px] cursor-pointer rounded-[8px] border-none bg-navy px-[16px] py-[8px] font-sans text-[13px] font-semibold text-white"
        >
          {x(M.hiring_interview_schedule)}
        </button>
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
        <div className="mt-[8px] text-[12px] text-text-muted">
          {x(M.hiring_interview_scheduled)}: {interview.scheduledDate}
        </div>
      </div>

      {/* Conversation */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h3 className="mb-[12px] text-[14px] font-bold text-text">
          {x(M.hiring_interview_conversation)}
        </h3>
        <div className="space-y-[12px]">
          {interview.conversation.map((exchange, idx) => (
            <div key={idx} className="rounded-[8px] border border-inset bg-inset p-[12px]">
              <div className="mb-[8px]">
                <div className="mb-[4px] text-[12px] font-semibold text-text-muted">
                  {x(M.hiring_interview_question)}
                </div>
                <div className="text-[13px] text-text">{x(exchange.question)}</div>
              </div>
              <div>
                <div className="mb-[4px] text-[12px] font-semibold text-text-muted">
                  {x(M.hiring_interview_response)}
                </div>
                <div className="text-[13px] text-text-2">{x(exchange.response)}</div>
              </div>
              <div className="mt-[8px] flex flex-wrap gap-[8px] text-[11px] text-text-muted">
                <span>
                  {x(M.hiring_interview_depth)}: {exchange.depth}
                </span>
                <span>
                  {x(M.hiring_interview_reasoning)}: {exchange.reasoning}
                </span>
                <span>Confidence: {exchange.confidence}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment */}
      {interview.assessment && (
        <div className="rounded-[12px] border border-border bg-surface p-[20px]">
          <h3 className="mb-[12px] text-[14px] font-bold text-text">
            {x(M.hiring_interview_assessment)}
          </h3>
          <div className="space-y-[8px]">
            <div className="flex justify-between text-[13px]">
              <span className="text-text-muted">{x(M.hiring_interview_reasoning_capability)}</span>
              <span className="font-semibold text-text">
                {interview.assessment.reasoningCapability}
              </span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-text-muted">{x(M.hiring_interview_defense_ability)}</span>
              <span className="font-semibold text-text">{interview.assessment.defenseAbility}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-text-muted">{x(M.hiring_interview_authenticity)}</span>
              <span className="font-semibold text-text">{interview.assessment.authenticity}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-text-muted">{x(M.hiring_interview_recommendation)}</span>
              <span
                className={`font-semibold ${interview.assessment.recommendation === 'hire' ? 'text-success' : 'text-risk'}`}
              >
                {interview.assessment.recommendation}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ScoresTab({ scores }: { scores?: AuthenticityScores }) {
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
      key: 'qualification' as const,
      label: M.hiring_scores_qualification,
      desc: M.hiring_scores_qualification_desc,
    },
    {
      key: 'evidence' as const,
      label: M.hiring_scores_evidence,
      desc: M.hiring_scores_evidence_desc,
    },
    {
      key: 'capability' as const,
      label: M.hiring_scores_capability,
      desc: M.hiring_scores_capability_desc,
    },
    {
      key: 'reasoning' as const,
      label: M.hiring_scores_reasoning,
      desc: M.hiring_scores_reasoning_desc,
    },
    {
      key: 'motivation' as const,
      label: M.hiring_scores_motivation,
      desc: M.hiring_scores_motivation_desc,
    },
  ]

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

      {/* Score cards */}
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
                  <div className="mb-[4px] text-[11px] font-semibold text-text-muted">
                    {x(M.hiring_scores_evidence_label)}
                  </div>
                  <div className="text-[12px] text-text-2">{x(explanation.evidence)}</div>
                  <div className="mt-[4px] text-[10px] text-text-muted">
                    {x(M.hiring_scores_confidence)}: {explanation.confidence}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: any; value: string }) {
  const { x } = useI18n()
  return (
    <div>
      <div className="text-[11px] font-semibold text-text-muted">{x(label)}</div>
      <div className="text-[13px] text-text">{value}</div>
    </div>
  )
}
