import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import {
  demoCandidates,
  demoEvidenceScreening,
  demoWorkSamples,
  demoInterviews,
  demoAuthenticityScores,
} from '@/data'
import {
  OverviewTab,
  EvidenceTab,
  WorkSampleTab,
  InterviewTab,
  ScoresTab,
} from './CandidateDetailDemoTabs'
import { getStatusTone, getStatusLabel } from './candidateDetailDemoMeta'
import { statusChipClass } from '@/components/chips'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'

/**
 * Candidate detail demo view — Northgate fixture data for the demo workspace.
 * Tabs: Overview, Evidence, Work Sample, Interview, Scores.
 */
export function CandidateDetailDemoView() {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  const { candidateId } = useParams<{ candidateId: string }>()
  const [activeTab, setActiveTab] = useState<
    'overview' | 'evidence' | 'work_sample' | 'interview' | 'scores'
  >('overview')

  const candidate = demoCandidates.find((c) => c.id === candidateId)
  if (!candidate) {
    return (
      <div className="flex-1 overflow-y-auto px-[14px] pt-[22px] pb-[80px] sm:px-[32px] sm:pt-[28px] sm:pb-[60px]">
        <div className="mx-auto max-w-[800px] rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
          <div className="text-[14.5px] font-semibold text-text">
            {x(M.hiring_candidate_not_found)}
          </div>
        </div>
      </div>
    )
  }

  const evidence = demoEvidenceScreening.find((e) => e.candidateId === candidateId)
  const workSample = demoWorkSamples.find((w) => w.candidateId === candidateId)
  const interview = demoInterviews.find((i) => i.candidateId === candidateId)
  const scores = demoAuthenticityScores.find((s) => s.candidateId === candidateId)

  const tabClass = (tab: typeof activeTab) =>
    `shrink-0 cursor-pointer rounded-[8px] border-none px-[14px] py-[7px] font-sans text-[12.5px] font-semibold whitespace-nowrap ${
      activeTab === tab
        ? 'bg-surface text-text shadow-(--shadow-sm)'
        : 'bg-transparent text-text-muted'
    }`

  return (
    <div className="flex-1 overflow-y-auto px-[14px] pt-[22px] pb-[80px] sm:px-[32px] sm:pt-[28px] sm:pb-[60px]">
      <div className="mx-auto max-w-[900px]">
        {/* Header */}
        <div className="mb-[18px] flex items-center gap-[12px]">
          <Link
            to={workspacePath(root, 'hiring')}
            className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] border-none bg-inset text-text hover:bg-surface"
          >
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[20px] font-bold text-text">{candidate.name}</h1>
            <p className="mt-[2px] text-[13px] text-text-muted">{x(candidate.position)}</p>
          </div>
          <span className={statusChipClass(getStatusTone(candidate.status))}>
            {x(getStatusLabel(candidate.status))}
          </span>
        </div>

        {/* Tab navigation */}
        <div
          role="tablist"
          aria-label={x(M.hiring_candidate_sections_nav)}
          className="mb-[20px] inline-flex max-w-full gap-[2px] overflow-x-auto rounded-[10px] border border-border bg-inset p-[3px]"
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

        {/* Tab content */}
        {activeTab === 'overview' && <OverviewTab candidate={candidate} />}
        {activeTab === 'evidence' && <EvidenceTab evidence={evidence} />}
        {activeTab === 'work_sample' && <WorkSampleTab workSample={workSample} />}
        {activeTab === 'interview' && <InterviewTab interview={interview} />}
        {activeTab === 'scores' && <ScoresTab scores={scores} />}
      </div>
    </div>
  )
}
