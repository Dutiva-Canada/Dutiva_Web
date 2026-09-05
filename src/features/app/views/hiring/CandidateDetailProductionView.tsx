import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import { statusChipClass } from '@/components/chips'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { AppPage } from '@/features/app/shell/AppPage'
import {
  getAuthenticityScores,
  getCandidate,
  getDefenseInterview,
  getEvidenceScreening,
  getWorkSample,
} from './productionApi'
import type {
  ProductionAuthenticityScores,
  ProductionCandidate,
  ProductionDefenseInterview,
  ProductionEvidenceScreening,
  ProductionWorkSample,
} from './productionApi'

/**
 * Candidate detail production view — loads real candidate data from Supabase.
 * Tabs: Overview / Evidence screening / Work sample / Interview / Authenticity scores.
 */

type Tab = 'overview' | 'evidence' | 'work_sample' | 'interview' | 'scores'
type LoadState = 'loading' | 'ready' | 'failed'

export function CandidateDetailProductionView() {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()
  const { root } = useWorkspaceRoot()
  const { candidateId } = useParams<{ candidateId: string }>()

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [state, setState] = useState<LoadState>('loading')
  const [candidate, setCandidate] = useState<ProductionCandidate | null>(null)
  const [evidence, setEvidence] = useState<ProductionEvidenceScreening | null>(null)
  const [workSample, setWorkSample] = useState<ProductionWorkSample | null>(null)
  const [interview, setInterview] = useState<ProductionDefenseInterview | null>(null)
  const [scores, setScores] = useState<ProductionAuthenticityScores | null>(null)

  const load = useCallback(async () => {
    if (!candidateId) return
    setState('loading')
    try {
      const [c, e, w, i, s] = await Promise.all([
        getCandidate(candidateId),
        getEvidenceScreening(candidateId),
        getWorkSample(candidateId),
        getDefenseInterview(candidateId),
        getAuthenticityScores(candidateId),
      ])
      setCandidate(c)
      setEvidence(e)
      setWorkSample(w)
      setInterview(i)
      setScores(s)
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [candidateId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.hiring_prod_empty_title)} />
  }

  const tabClass = (tab: Tab) =>
    `cursor-pointer rounded-[8px] border-none px-[14px] py-[7px] font-sans text-[12.5px] font-semibold ${
      activeTab === tab ? 'bg-surface text-text shadow-(--shadow-sm)' : 'bg-transparent text-text-muted'
    }`

  return (
    <AppPage width="comfort">
      <Link
        to={workspacePath(root, 'hiring')}
        className="mb-[16px] inline-flex items-center gap-[6px] text-[13px] font-semibold text-text-muted hover:text-text"
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        {x(M.hiring_candidate_back)}
      </Link>

      {state === 'loading' && <div className="text-[13px] text-text-muted">{x(M.hiring_prod_loading)}</div>}

      {state === 'failed' && (
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
          <div className="mb-[4px] text-[14.5px] font-semibold text-text">{x(M.hiring_prod_error)}</div>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-[12px] cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
          >
            {x(M.hiring_prod_retry)}
          </button>
        </div>
      )}

      {state === 'ready' && !candidate && (
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
          <div className="text-[14.5px] font-semibold text-text">{x(M.hiring_candidate_not_found)}</div>
        </div>
      )}

      {state === 'ready' && candidate && (
        <>
          <div className="mb-[18px] flex flex-wrap items-center gap-[12px]">
            <div className="flex-1">
              <h1 className="text-[20px] font-bold text-text">{candidate.name}</h1>
              <p className="mt-[2px] text-[13px] text-text-muted">{candidate.position}</p>
            </div>
            <span className={statusChipClass(getStatusTone(candidate.status))}>
              {x(getStatusLabel(candidate.status))}
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Candidate sections"
            className="mb-[20px] inline-flex gap-[2px] rounded-[10px] border border-border bg-inset p-[3px]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              className={tabClass('overview')}
            >
              {x(M.hiring_tab_overview)}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'evidence'}
              onClick={() => setActiveTab('evidence')}
              className={tabClass('evidence')}
            >
              {x(M.hiring_tab_evidence)}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'work_sample'}
              onClick={() => setActiveTab('work_sample')}
              className={tabClass('work_sample')}
            >
              {x(M.hiring_tab_work_sample)}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'interview'}
              onClick={() => setActiveTab('interview')}
              className={tabClass('interview')}
            >
              {x(M.hiring_tab_interview)}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'scores'}
              onClick={() => setActiveTab('scores')}
              className={tabClass('scores')}
            >
              {x(M.hiring_tab_scores)}
            </button>
          </div>

          {activeTab === 'overview' && <OverviewTab candidate={candidate} />}
          {activeTab === 'evidence' && <EvidenceTab evidence={evidence} />}
          {activeTab === 'work_sample' && <WorkSampleTab workSample={workSample} />}
          {activeTab === 'interview' && <InterviewTab interview={interview} />}
          {activeTab === 'scores' && <ScoresTab scores={scores} />}
        </>
      )}
    </AppPage>
  )
}

function OverviewTab({ candidate }: { candidate: ProductionCandidate }) {
  const { x } = useI18n()

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h2 className="mb-[16px] text-[16px] font-bold text-text">{x(M.hiring_overview_application)}</h2>

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
            <DetailRow label={M.hiring_overview_compensation} value={candidate.compensationExpectations} />
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
        <h2 className="mb-[16px] text-[16px] font-bold text-text">{x(M.hiring_overview_knockout)}</h2>

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
            <div className="mb-[4px] text-[12px] font-semibold text-risk">{x(M.hiring_overview_missing)}</div>
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

function EvidenceTab({ evidence }: { evidence: ProductionEvidenceScreening | null }) {
  const { x } = useI18n()

  if (!evidence) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">{x(M.hiring_empty_evidence)}</div>
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
        <h3 className="mb-[12px] text-[14px] font-bold text-text">{x(M.hiring_evidence_relevant_experience)}</h3>
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
          <h3 className="mb-[8px] text-[14px] font-bold text-text">{x(M.hiring_evidence_missing)}</h3>
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

function WorkSampleTab({ workSample }: { workSample: ProductionWorkSample | null }) {
  const { x } = useI18n()

  if (!workSample) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">{x(M.hiring_empty_work_sample)}</div>
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
        <h3 className="mb-[8px] text-[14px] font-bold text-text">{x(M.hiring_work_sample_scenario)}</h3>
        <div className="rounded-[8px] border border-inset bg-inset p-[12px] text-[13px] text-text-2">
          {workSample.scenario}
        </div>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h3 className="mb-[8px] text-[14px] font-bold text-text">{x(M.hiring_work_sample_submission)}</h3>
        <div className="rounded-[8px] border border-inset bg-inset p-[12px] text-[13px] text-text-2">
          {workSample.submission}
        </div>
        <div className="mt-[8px] flex flex-wrap gap-[12px] text-[12px] text-text-muted">
          <span>
            {x(M.hiring_work_sample_ai_allowed)}: {workSample.aiAllowed ? 'Yes' : 'No'}
          </span>
          {workSample.aiDetected && (
            <span>
              {x(M.hiring_work_sample_ai_detected)}: Yes
            </span>
          )}
          {workSample.timeTaken && (
            <span>
              {x(M.hiring_work_sample_time)}: {workSample.timeTaken}
            </span>
          )}
        </div>
      </div>

      {workSample.evaluation && (
        <div className="rounded-[12px] border border-border bg-surface p-[20px]">
          <h3 className="mb-[12px] text-[14px] font-bold text-text">{x(M.hiring_work_sample_evaluation)}</h3>
          <DataBlock value={workSample.evaluation} />
        </div>
      )}
    </div>
  )
}

function InterviewTab({ interview }: { interview: ProductionDefenseInterview | null }) {
  const { x } = useI18n()

  if (!interview) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">{x(M.hiring_empty_interview)}</div>
        <div className="text-[13px] text-text-muted">{x(M.hiring_empty_interview_body)}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <div className="mb-[16px] flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-text">{x(M.hiring_interview_title)}</h2>
          <span className={statusChipClass(interview.status === 'completed' ? 'success' : 'neutral')}>
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
        <h3 className="mb-[12px] text-[14px] font-bold text-text">{x(M.hiring_interview_conversation)}</h3>
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
          <h3 className="mb-[12px] text-[14px] font-bold text-text">{x(M.hiring_interview_assessment)}</h3>
          <DataBlock value={interview.assessment} />
        </div>
      )}
    </div>
  )
}

function ScoresTab({ scores }: { scores: ProductionAuthenticityScores | null }) {
  const { x } = useI18n()

  if (!scores) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">{x(M.hiring_empty_scores)}</div>
        <div className="text-[13px] text-text-muted">{x(M.hiring_empty_scores_body)}</div>
      </div>
    )
  }

  const dimensions = [
    { key: 'qualification', label: M.hiring_scores_qualification, desc: M.hiring_scores_qualification_desc },
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
                <span className={statusChipClass(getScoreTone(score))}>{x(getScoreLabel(score))}</span>
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

function getStatusTone(status: string): 'success' | 'info' | 'warning' | 'risk' | 'neutral' {
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

function getStatusLabel(status: string) {
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

function getAuthLabel(auth: string) {
  switch (auth) {
    case 'authorized':
      return M.hiring_auth_authorized
    case 'needs_sponsorship':
      return M.hiring_auth_needs_sponsorship
    default:
      return M.hiring_auth_unknown
  }
}

function getEvidenceQualityTone(quality: string): 'success' | 'info' | 'warning' | 'risk' {
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

function getEvidenceQualityLabel(quality: string) {
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

function getSpecificityLabel(specificity: string) {
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

function getWorkSampleStatusTone(status: string): 'success' | 'info' | 'warning' | 'risk' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'info'
    case 'pending':
      return 'neutral'
    case 'skipped':
      return 'warning'
    default:
      return 'neutral'
  }
}

function getWorkSampleStatusLabel(status: string) {
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

function getScoreTone(score: string): 'success' | 'info' | 'warning' | 'risk' {
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

function getScoreLabel(score: string) {
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

function getOverallScoreTone(overall: string): 'success' | 'info' | 'warning' | 'risk' {
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
