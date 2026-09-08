import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { AppPage } from '@/features/app/shell/AppPage'
import { JobPostingCard } from './JobPostingCard'
import { JobPostingForm } from './JobPostingForm'
import { useHiringTab } from './useHiringTab'
import {
  addCandidate,
  createJobPosting,
  deleteJobPosting,
  getFunnelMetrics,
  listCandidates,
  listJobPostings,
  updateCandidateStatus,
  updateJobPosting,
} from './productionApi'
import type {
  NewJobPosting,
  ProductionCandidate,
  ProductionCandidateStatus,
  ProductionFunnelMetrics,
  ProductionJobPosting,
} from './productionApi'

/**
 * Production mode view for the hiring module.
 * Tabs: Candidates (searchable list + add form), Funnel analytics, Job postings.
 */

type Tab = 'candidates' | 'funnel' | 'postings'

const STAGES: { key: keyof ProductionFunnelMetrics; label: keyof typeof M }[] = [
  { key: 'totalApplications', label: 'hiring_funnel_applications' },
  { key: 'basicQualified', label: 'hiring_funnel_basic_qualified' },
  { key: 'evidenceQualified', label: 'hiring_funnel_evidence_qualified' },
  { key: 'workSamples', label: 'hiring_funnel_work_samples' },
  { key: 'interviews', label: 'hiring_funnel_interviews' },
  { key: 'hires', label: 'hiring_funnel_hires' },
]

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'
const EMPTY_FORM = {
  name: '',
  email: '',
  location: '',
  position: '',
  currentRole: '',
  yearsExperience: '',
  workAuthorization: 'authorized' as 'authorized' | 'needs_sponsorship' | 'unknown',
  resume: '',
}

export function HiringProductionView() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const navigate = useWorkspaceNavigate()
  const { organizationId, isOrgAdmin } = useWorkspaceMode()

  const [activeTab, setActiveTab] = useHiringTab()
  const [filter, setFilter] = useState('')
  const [candidates, setCandidates] = useState<ProductionCandidate[] | null>(null)
  const [funnel, setFunnel] = useState<ProductionFunnelMetrics | null>(null)
  const [postings, setPostings] = useState<ProductionJobPosting[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [postingFormOpen, setPostingFormOpen] = useState(false)
  const [editingPosting, setEditingPosting] = useState<ProductionJobPosting | null>(null)
  const [postingSaving, setPostingSaving] = useState(false)
  const [deletingPostingId, setDeletingPostingId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoadFailed(false)
    try {
      const [c, f, p] = await Promise.all([
        listCandidates(organizationId),
        getFunnelMetrics(organizationId),
        listJobPostings(organizationId),
      ])
      setCandidates(c)
      setFunnel(f)
      setPostings(p)
    } catch {
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.hiring_prod_empty_title)} />
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || saving) return
    setSaving(true)
    try {
      await addCandidate(organizationId, {
        name: form.name.trim(),
        email: form.email.trim(),
        location: form.location.trim(),
        resume: form.resume.trim(),
        position: form.position.trim(),
        currentRole: form.currentRole.trim(),
        yearsExperience: Number(form.yearsExperience) || 0,
        workAuthorization: form.workAuthorization,
      })
      setForm(EMPTY_FORM)
      setFormOpen(false)
      showToast(M.hiring_add_candidate_success, 'ok')
      void load()
    } catch {
      showToast(M.hiring_add_candidate_error, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onPostingSubmit = async (values: NewJobPosting) => {
    if (!organizationId || postingSaving) return
    setPostingSaving(true)
    try {
      if (editingPosting) {
        await updateJobPosting(organizationId, editingPosting.id, values)
        showToast(M.hiring_posting_updated, 'ok')
      } else {
        await createJobPosting(organizationId, values)
        showToast(M.hiring_posting_created, 'ok')
      }
      setPostingFormOpen(false)
      setEditingPosting(null)
      void load()
    } catch {
      showToast(editingPosting ? M.hiring_posting_update_error : M.hiring_posting_create_error, 'info')
    } finally {
      setPostingSaving(false)
    }
  }

  const onEditPosting = (posting: ProductionJobPosting) => {
    setEditingPosting(posting)
    setPostingFormOpen(true)
  }

  const onDeletePosting = async (id: string) => {
    if (!organizationId || deletingPostingId) return
    setDeletingPostingId(id)
    try {
      await deleteJobPosting(organizationId, id)
      showToast(M.hiring_posting_deleted, 'ok')
      void load()
    } catch {
      showToast(M.hiring_posting_delete_error, 'info')
    } finally {
      setDeletingPostingId(null)
    }
  }

  const onAdvanceCandidate = async (candidate: ProductionCandidate) => {
    if (statusUpdatingId) return
    const next = nextStage(candidate.status)
    if (!next) return
    setStatusUpdatingId(candidate.id)
    try {
      await updateCandidateStatus(candidate.id, next)
      showToast(M.hiring_candidate_status_updated, 'ok')
      void load()
    } catch {
      showToast(M.hiring_candidate_status_error, 'info')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const onCandidateStatusChange = async (candidate: ProductionCandidate, next: ProductionCandidateStatus) => {
    if (statusUpdatingId || next === candidate.status) return
    setStatusUpdatingId(candidate.id)
    try {
      await updateCandidateStatus(candidate.id, next)
      showToast(M.hiring_candidate_status_updated, 'ok')
      void load()
    } catch {
      showToast(M.hiring_candidate_status_error, 'info')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const q = filter.toLowerCase()
  const filteredCandidates = (candidates ?? []).filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.position.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q),
  )

  const tabClass = (tab: Tab) =>
    `cursor-pointer rounded-[8px] border-none px-[14px] py-[7px] font-sans text-[12.5px] font-semibold ${
      activeTab === tab ? 'bg-surface text-text shadow-(--shadow-sm)' : 'bg-transparent text-text-muted'
    }`

  const openCandidate = (candidateId: string) => navigate(`/app/hiring/candidates/${candidateId}`)

  return (
    <AppPage width="wide">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[16px]">
        <div>
          <h1 className="text-[20px] font-bold text-text">{x(M.hiring_module_title)}</h1>
          <p className="mt-[2px] text-[13px] text-text-muted">{x(M.hiring_module_description)}</p>
        </div>

        <div
          role="tablist"
          aria-label="Hiring sections"
          className="inline-flex gap-[2px] rounded-[10px] border border-border bg-inset p-[3px]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'candidates'}
            onClick={() => setActiveTab('candidates')}
            className={tabClass('candidates')}
          >
            {x(M.hiring_candidates_title)}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'funnel'}
            onClick={() => setActiveTab('funnel')}
            className={tabClass('funnel')}
          >
            {x(M.hiring_funnel_title)}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'postings'}
            onClick={() => setActiveTab('postings')}
            className={tabClass('postings')}
          >
            {x(M.hiring_postings_title)}
          </button>
        </div>
      </div>

      {loadFailed && (
        <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
          <span className="text-[13px] text-risk-fg">{x(M.hiring_prod_error)}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
          >
            {x(M.hiring_prod_retry)}
          </button>
        </div>
      )}

      {activeTab === 'candidates' && (
        <>
          <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[12px]">
            <div className="flex items-center gap-[10px]">
              <div className="relative">
                <Search
                  size={16}
                  strokeWidth={1.7}
                  className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
                />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={x(M.hiring_candidates_filter_placeholder)}
                  aria-label={x(M.hiring_candidates_filter_placeholder)}
                  className="min-w-[280px] rounded-[9px] border border-border bg-surface py-[9px] pr-[14px] pl-[36px] font-sans text-[13.5px] text-text"
                />
              </div>
              <span className="text-[13px] text-text-muted">
                {x(M.hiring_candidates_showing)} {filteredCandidates.length} {x(M.hiring_candidates_of)}{' '}
                {(candidates ?? []).length} {x(M.hiring_candidates_candidates)}
              </span>
            </div>

            {isOrgAdmin && !formOpen && (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
              >
                <Plus size={14} strokeWidth={2} aria-hidden="true" />
                {x(M.hiring_add_candidate)}
              </button>
            )}
          </div>

          {formOpen && (
            <form
              onSubmit={(e) => void onSubmit(e)}
              className="mb-[18px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]"
            >
              <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="cand-name" className={labelClass}>
                    {x(M.hiring_add_candidate_name)}
                  </label>
                  <input
                    id="cand-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cand-email" className={labelClass}>
                    {x(M.hiring_add_candidate_email)}
                  </label>
                  <input
                    id="cand-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cand-location" className={labelClass}>
                    {x(M.hiring_add_candidate_location)}
                  </label>
                  <input
                    id="cand-location"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cand-position" className={labelClass}>
                    {x(M.hiring_add_candidate_position)}
                  </label>
                  <input
                    id="cand-position"
                    value={form.position}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cand-current-role" className={labelClass}>
                    {x(M.hiring_add_candidate_current_role)}
                  </label>
                  <input
                    id="cand-current-role"
                    value={form.currentRole}
                    onChange={(e) => setForm((f) => ({ ...f, currentRole: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cand-years" className={labelClass}>
                    {x(M.hiring_add_candidate_years_experience)}
                  </label>
                  <input
                    id="cand-years"
                    type="number"
                    min={0}
                    value={form.yearsExperience}
                    onChange={(e) => setForm((f) => ({ ...f, yearsExperience: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cand-auth" className={labelClass}>
                    {x(M.hiring_add_candidate_work_authorization)}
                  </label>
                  <select
                    id="cand-auth"
                    value={form.workAuthorization}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        workAuthorization: e.target.value as typeof form.workAuthorization,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="authorized">{x(M.hiring_auth_authorized)}</option>
                    <option value="needs_sponsorship">{x(M.hiring_auth_needs_sponsorship)}</option>
                    <option value="unknown">{x(M.hiring_auth_unknown)}</option>
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                  <label htmlFor="cand-resume" className={labelClass}>
                    {x(M.hiring_add_candidate_resume)}
                  </label>
                  <input
                    id="cand-resume"
                    value={form.resume}
                    onChange={(e) => setForm((f) => ({ ...f, resume: e.target.value }))}
                    placeholder={x(M.hiring_add_candidate_resume)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mt-[16px] flex gap-[8px]">
                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white disabled:opacity-60"
                >
                  {x(M.hiring_action_save)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false)
                    setForm(EMPTY_FORM)
                  }}
                  className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
                >
                  {x(M.hiring_action_cancel)}
                </button>
              </div>
            </form>
          )}

          {filteredCandidates.length > 0 ? (
            <div className="flex flex-col gap-[12px]">
              <div className="hidden overflow-x-auto rounded-[12px] border border-border bg-surface md:block">
                <div className="grid min-w-[900px] grid-cols-[2fr_1.5fr_1fr_1.5fr_1fr_1fr_1fr] gap-[10px] bg-inset px-[16px] py-[11px] text-[11.5px] font-bold tracking-[0.03em] text-text-muted uppercase">
                  <div>{x(M.hiring_th_name)}</div>
                  <div>{x(M.hiring_th_position)}</div>
                  <div>{x(M.hiring_th_location)}</div>
                  <div>{x(M.hiring_th_status)}</div>
                  <div>{x(M.hiring_th_applied)}</div>
                  <div>{x(M.hiring_th_assigned)}</div>
                  <div />
                </div>
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="grid min-w-[900px] grid-cols-[2fr_1.5fr_1fr_1.5fr_1fr_1fr_1fr] items-center gap-[10px] border-t border-t-inset px-[16px] py-[12px]"
                  >
                    <div className="font-sans text-[13.5px] font-semibold text-text">{candidate.name}</div>
                    <div className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-text-2">
                      {candidate.position}
                    </div>
                    <div className="text-[13px] text-text-2">{candidate.location}</div>
                    <div>
                      <select
                        value={candidate.status}
                        disabled={statusUpdatingId === candidate.id}
                        aria-label={x(M.hiring_candidate_status)}
                        onChange={(e) =>
                          void onCandidateStatusChange(
                            candidate,
                            e.target.value as ProductionCandidateStatus,
                          )
                        }
                        className="w-full rounded-[8px] border border-border bg-surface px-[8px] py-[6px] font-sans text-[12.5px] text-text"
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
                    <div className="text-[13px] text-text-2">{candidate.appliedDate}</div>
                    <div className="text-[13px] text-text-2">{candidate.assignedTo || '-'}</div>
                    <div className="flex items-center gap-[4px]">
                      {nextStage(candidate.status) && (
                        <button
                          type="button"
                          onClick={() => void onAdvanceCandidate(candidate)}
                          disabled={statusUpdatingId === candidate.id}
                          aria-label={x(M.hiring_candidate_advance)}
                          className="flex h-[28px] cursor-pointer items-center justify-center rounded-[8px] border border-border bg-surface px-[8px] font-sans text-[11px] font-semibold text-text-2 disabled:opacity-60"
                        >
                          {x(M.hiring_candidate_advance)}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openCandidate(candidate.id)}
                        aria-label={x(M.hiring_open_candidate)}
                        className="flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-navy text-white"
                      >
                        <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-[10px] md:hidden">
                {filteredCandidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => openCandidate(candidate.id)}
                    className="flex w-full cursor-pointer flex-col gap-[10px] rounded-[12px] border border-border bg-surface p-[14px] text-left font-sans hover:border-(--accent-soft-border)"
                  >
                    <div className="flex items-center justify-between gap-[10px]">
                      <div className="min-w-0 flex-1">
                        <div className="text-[14.5px] font-semibold text-text">{candidate.name}</div>
                        <div className="mt-[2px] text-[12px] text-text-muted">{candidate.position}</div>
                      </div>
                      <span className={statusChipClass(getStatusTone(candidate.status))}>
                        {x(getStatusLabel(candidate.status))}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-[8px] text-[12px] text-text-muted">
                      <span>{candidate.location}</span>
                      <span>·</span>
                      <span>{candidate.appliedDate}</span>
                      {candidate.assignedTo && (
                        <>
                          <span>·</span>
                          <span>{candidate.assignedTo}</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
              <div className="mb-[4px] text-[14.5px] font-semibold text-text">{x(M.hiring_no_candidates)}</div>
              <div className="mb-[14px] text-[13px] text-text-muted">{x(M.hiring_no_candidates_body)}</div>
            </div>
          )}
        </>
      )}

      {activeTab === 'funnel' && (funnel ? <FunnelAnalytics funnel={funnel} /> : null)}

      {activeTab === 'postings' && (
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-text">{x(M.hiring_postings_title)}</h2>
            {isOrgAdmin && !postingFormOpen && (
              <button
                type="button"
                onClick={() => {
                  setEditingPosting(null)
                  setPostingFormOpen(true)
                }}
                className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
              >
                <Plus size={14} strokeWidth={2} aria-hidden="true" />
                {x(M.hiring_posting_create)}
              </button>
            )}
          </div>

          {postingFormOpen && (
            <JobPostingForm
              initial={editingPosting ?? undefined}
              saving={postingSaving}
              onSubmit={onPostingSubmit}
              onCancel={() => {
                setPostingFormOpen(false)
                setEditingPosting(null)
              }}
            />
          )}

          {(postings ?? []).length > 0 ? (
            (postings ?? []).map((posting) => (
              <div key={posting.id} className="flex items-start gap-[8px]">
                <div className="flex-1">
                  <JobPostingCard
                    title={posting.title}
                    department={posting.department}
                    location={posting.location}
                    type={posting.type}
                    postedDate={posting.postedDate}
                    closingDate={posting.closingDate}
                    status={posting.status}
                    onClick={() => navigate(`/app/hiring/postings/${posting.id}`)}
                    ariaLabel={x(M.hiring_open_posting)}
                  />
                </div>
                {isOrgAdmin && (
                  <div className="flex shrink-0 gap-[4px]">
                    <button
                      type="button"
                      onClick={() => onEditPosting(posting)}
                      aria-label={x(M.hiring_posting_edit)}
                      className="flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-[8px] border border-border bg-surface text-text-2 hover:text-text"
                    >
                      <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(x(M.hiring_posting_delete_confirm))) {
                          void onDeletePosting(posting.id)
                        }
                      }}
                      disabled={deletingPostingId === posting.id}
                      aria-label={x(M.hiring_posting_delete)}
                      className="flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-[8px] border border-border bg-surface text-risk disabled:opacity-60"
                    >
                      <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
              <div className="text-[14.5px] font-semibold text-text">{x(M.hiring_postings_no_postings)}</div>
            </div>
          )}
        </div>
      )}
    </AppPage>
  )
}

function FunnelAnalytics({ funnel }: { funnel: ProductionFunnelMetrics }) {
  const { x } = useI18n()

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h2 className="mb-[16px] text-[16px] font-bold text-text">{x(M.hiring_funnel_title)}</h2>
        <p className="mb-[20px] text-[13px] text-text-muted">{x(M.hiring_funnel_description)}</p>

        <div className="space-y-[8px]">
          {STAGES.map((stage, index) => {
            const count = funnel[stage.key]
            const width = funnel.totalApplications > 0 ? Math.round((count / funnel.totalApplications) * 100) : 0
            return (
              <div key={stage.key} className="flex items-center gap-[12px]">
                <div className="w-[140px] shrink-0 text-[13px] text-text-2">{x(M[stage.label])}</div>
                <div className="flex-1">
                  <div className="mb-[4px] flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-text">{count}</span>
                    <span className="text-text-muted">{width}%</span>
                  </div>
                  <div className="h-[24px] overflow-hidden rounded-[6px] bg-inset">
                    <div
                      className="h-full rounded-[6px] bg-navy transition-all"
                      style={{ width: `${index === 0 ? 100 : width}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
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

const STAGE_FLOW: ProductionCandidateStatus[] = [
  'application',
  'basic_qualified',
  'evidence_qualified',
  'work_sample',
  'interview',
  'hired',
]

function nextStage(status: ProductionCandidateStatus): ProductionCandidateStatus | null {
  const idx = STAGE_FLOW.indexOf(status)
  if (idx < 0 || idx >= STAGE_FLOW.length - 1) return null
  return STAGE_FLOW[idx + 1] ?? null
}

