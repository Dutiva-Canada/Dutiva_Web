import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { AppPage } from '@/features/app/shell/AppPage'
import {
  assignCandidate,
  getAuthenticityScores,
  getCandidate,
  getDefenseInterview,
  getEvidenceScreening,
  getWorkSample,
  updateCandidateStatus,
} from './productionApi'
import {
  EvidenceTab,
  InterviewTab,
  OverviewTab,
  ScoresTab,
  WorkSampleTab,
} from './CandidateDetailTabs'
import { getStatusLabel, getStatusTone } from './candidateDetailMeta'
import type {
  ProductionAuthenticityScores,
  ProductionCandidate,
  ProductionCandidateStatus,
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
  const { showToast } = useToasts()
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
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [assigneeValue, setAssigneeValue] = useState('')

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

  const onStatusChange = async (next: ProductionCandidateStatus) => {
    if (!candidate || statusUpdating || next === candidate.status) return
    setStatusUpdating(true)
    try {
      await updateCandidateStatus(candidate.id, next)
      setCandidate({ ...candidate, status: next })
      showToast(M.hiring_candidate_status_updated, 'ok')
    } catch {
      showToast(M.hiring_candidate_status_error, 'info')
    } finally {
      setStatusUpdating(false)
    }
  }

  const onAssign = async () => {
    if (!candidate) return
    const value = assigneeValue.trim()
    try {
      await assignCandidate(candidate.id, value)
      setCandidate({ ...candidate, assignedTo: value || undefined })
      setAssigneeValue('')
      showToast(M.hiring_candidate_assigned, 'ok')
    } catch {
      showToast(M.hiring_candidate_assign_error, 'info')
    }
  }

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.hiring_prod_empty_title)} />
  }

  const tabClass = (tab: Tab) =>
    `cursor-pointer rounded-[8px] border-none px-[14px] py-[7px] font-sans text-[12.5px] font-semibold ${
      activeTab === tab
        ? 'bg-surface text-text shadow-(--shadow-sm)'
        : 'bg-transparent text-text-muted'
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

      {state === 'loading' && (
        <div className="text-[13px] text-text-muted">{x(M.hiring_prod_loading)}</div>
      )}

      {state === 'failed' && (
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
          <div className="mb-[4px] text-[14.5px] font-semibold text-text">
            {x(M.hiring_prod_error)}
          </div>
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
          <div className="text-[14.5px] font-semibold text-text">
            {x(M.hiring_candidate_not_found)}
          </div>
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

          {activeTab === 'overview' && (
            <OverviewTab
              candidate={candidate}
              statusUpdating={statusUpdating}
              assigneeValue={assigneeValue}
              onStatusChange={onStatusChange}
              onAssigneeChange={setAssigneeValue}
              onAssign={onAssign}
            />
          )}
          {activeTab === 'evidence' && <EvidenceTab evidence={evidence} />}
          {activeTab === 'work_sample' && <WorkSampleTab workSample={workSample} />}
          {activeTab === 'interview' && <InterviewTab interview={interview} />}
          {activeTab === 'scores' && <ScoresTab scores={scores} />}
        </>
      )}
    </AppPage>
  )
}
