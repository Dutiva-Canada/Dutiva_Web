import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import { demoCandidates, demoFunnelMetrics, demoJobPostings } from '@/data'
import type { Candidate } from '@/data'
import { statusChipClass } from '@/components/chips'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'

/**
 * Hiring demo view — Northgate fixture data for the demo workspace.
 * Tabs: Candidates (searchable list), Funnel (analytics), Postings (job board).
 */
export function HiringDemoView() {
  const { x } = useI18n()
  const navigate = useWorkspaceNavigate()
  const [activeTab, setActiveTab] = useState<'candidates' | 'funnel' | 'postings'>('candidates')
  const [filter, setFilter] = useState('')

  // Filter candidates based on search
  const q = filter.toLowerCase()
  const filteredCandidates = demoCandidates.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      x(c.position).toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q),
  )

  const openCandidate = (candidateId: string) => navigate(`/app/hiring/candidates/${candidateId}`)

  const tabClass = (tab: typeof activeTab) =>
    `cursor-pointer rounded-[8px] border-none px-[14px] py-[7px] font-sans text-[12.5px] font-semibold ${
      activeTab === tab ? 'bg-surface text-text shadow-(--shadow-sm)' : 'bg-transparent text-text-muted'
    }`

  return (
    <div className="flex-1 overflow-y-auto px-[32px] pt-[28px] pb-[60px]">
      <div className="mx-auto max-w-[1000px]">
        {/* Header */}
        <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[16px]">
          <div>
            <h1 className="text-[20px] font-bold text-text">{x(M.hiring_module_title)}</h1>
            <p className="mt-[2px] text-[13px] text-text-muted">{x(M.hiring_module_description)}</p>
          </div>
          
          {/* Tab navigation */}
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

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <>
            <div className="mb-[18px] flex items-center justify-between gap-[12px]">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={x(M.hiring_candidates_filter_placeholder)}
                aria-label={x(M.hiring_candidates_filter_placeholder)}
                className="min-w-[280px] rounded-[9px] border border-border bg-surface px-[14px] py-[9px] font-sans text-[13.5px] text-text"
              />
              <div className="text-[13px] text-text-muted">
                {x(M.hiring_candidates_showing)} {filteredCandidates.length} {x(M.hiring_candidates_of)} {demoCandidates.length} {x(M.hiring_candidates_candidates)}
              </div>
            </div>

            {filteredCandidates.length > 0 ? (
              <div className="flex flex-col gap-[12px]">
                {/* Desktop table */}
                <div className="hidden overflow-x-auto rounded-[12px] border border-border bg-surface md:block">
                  <div className="grid min-w-[800px] grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_0.5fr] gap-[10px] bg-inset px-[16px] py-[11px] text-[11.5px] font-bold tracking-[0.03em] text-text-muted uppercase">
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
                      className="grid min-w-[800px] grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_0.5fr] items-center gap-[10px] border-t border-t-inset px-[16px] py-[12px]"
                    >
                      <div className="font-sans text-[13.5px] font-semibold text-text">{candidate.name}</div>
                      <div className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-text-2">{x(candidate.position)}</div>
                      <div className="text-[13px] text-text-2">{x(candidate.location)}</div>
                      <div>
                        <span className={statusChipClass(getStatusTone(candidate.status) as any)}>
                          {x(getStatusLabel(candidate.status))}
                        </span>
                      </div>
                      <div className="text-[13px] text-text-2">{candidate.appliedDate}</div>
                      <div className="text-[13px] text-text-2">{candidate.assignedTo || '-'}</div>
                      <button
                        type="button"
                        onClick={() => openCandidate(candidate.id)}
                        aria-label={x(M.hiring_open_candidate)}
                        className="flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-navy text-white"
                      >
                        →
                      </button>
                    </div>
                  ))}
                </div>

                {/* Mobile cards */}
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
                          <div className="mt-[2px] text-[12px] text-text-muted">{x(candidate.position)}</div>
                        </div>
                        <span className={statusChipClass(getStatusTone(candidate.status) as any)}>
                          {x(getStatusLabel(candidate.status))}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-[8px] text-[12px] text-text-muted">
                        <span>{x(candidate.location)}</span>
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
                <button
                  type="button"
                  onClick={() => setFilter('')}
                  className="cursor-pointer rounded-[8px] border border-(--accent-soft-border) bg-accent-soft px-[16px] py-[8px] font-sans text-[13px] font-semibold text-accent"
                >
                  Clear filter
                </button>
              </div>
            )}
          </>
        )}

        {/* Funnel Tab */}
        {activeTab === 'funnel' && <FunnelAnalytics metrics={demoFunnelMetrics} />}

        {/* Postings Tab */}
        {activeTab === 'postings' && <JobPostings postings={demoJobPostings} />}
      </div>
    </div>
  )
}

function FunnelAnalytics({ metrics }: { metrics: typeof demoFunnelMetrics }) {
  const { x } = useI18n()

  const stages = [
    { key: 'totalApplications', label: M.hiring_funnel_applications, count: metrics.totalApplications },
    { key: 'basicQualified', label: M.hiring_funnel_basic_qualified, count: metrics.basicQualified },
    { key: 'evidenceQualified', label: M.hiring_funnel_evidence_qualified, count: metrics.evidenceQualified },
    { key: 'workSamples', label: M.hiring_funnel_work_samples, count: metrics.workSamples },
    { key: 'interviews', label: M.hiring_funnel_interviews, count: metrics.interviews },
    { key: 'hires', label: M.hiring_funnel_hires, count: metrics.hires },
  ]

  const conversionRateByStage: Record<string, number | undefined> = {
    basicQualified: metrics.conversionRates.toBasicQualified,
    evidenceQualified: metrics.conversionRates.toEvidenceQualified,
    workSamples: metrics.conversionRates.toWorkSample,
    interviews: metrics.conversionRates.toInterview,
    hires: metrics.conversionRates.toHire,
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h2 className="mb-[16px] text-[16px] font-bold text-text">{x(M.hiring_funnel_title)}</h2>
        <p className="mb-[20px] text-[13px] text-text-muted">{x(M.hiring_funnel_description)}</p>

        {/* Funnel visualization */}
        <div className="space-y-[8px]">
          {stages.map((stage, index) => {
            const width = index === 0 ? 100 : Math.round((stage.count / metrics.totalApplications) * 100)
            const rate = conversionRateByStage[stage.key]
            return (
              <div key={stage.key} className="flex items-center gap-[12px]">
                <div className="w-[140px] shrink-0 text-[13px] text-text-2">{x(stage.label)}</div>
                <div className="flex-1">
                  <div className="mb-[4px] flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-text">{stage.count}</span>
                    {rate !== undefined && (
                      <span className="text-text-muted">
                        {Math.round(rate * 100)}% conversion
                      </span>
                    )}
                  </div>
                  <div className="h-[24px] overflow-hidden rounded-[6px] bg-inset">
                    <div
                      className="h-full rounded-[6px] bg-navy transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-[12px] md:grid-cols-2">
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[12px] text-text-muted">{x(M.hiring_funnel_time_to_hire)}</div>
          <div className="mt-[4px] text-[20px] font-bold text-text">{metrics.averageTimeToHire}</div>
        </div>
        <div className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="text-[12px] text-text-muted">{x(M.hiring_funnel_conversion)}</div>
          <div className="mt-[4px] text-[20px] font-bold text-text">
            {Math.round(metrics.conversionRates.toHire * 100)}%
          </div>
        </div>
      </div>
    </div>
  )
}

function JobPostings({ postings }: { postings: typeof demoJobPostings }) {
  const { x } = useI18n()
  const navigate = useWorkspaceNavigate()

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-text">{x(M.hiring_postings_title)}</h2>
        <button
          type="button"
          className="cursor-pointer rounded-[9px] border-none bg-navy px-[15px] py-[9px] font-sans text-[12.5px] font-bold text-white"
        >
          {x(M.hiring_postings_create)}
        </button>
      </div>

      {postings.length > 0 ? (
        postings.map((posting) => (
          <button
            key={posting.id}
            type="button"
            onClick={() => navigate(`/app/hiring/postings/${posting.id}`)}
            aria-label={x(M.hiring_open_posting)}
            className="w-full cursor-pointer rounded-[12px] border border-border bg-surface p-[16px] text-left font-sans hover:border-(--accent-soft-border)"
          >
            <div className="flex items-start justify-between gap-[12px]">
              <div className="flex-1">
                <div className="text-[14.5px] font-semibold text-text">{x(posting.title)}</div>
                <div className="mt-[8px] space-y-[4px] text-[13px] text-text-2">
                  <div>{x(posting.department)} · {x(posting.location)}</div>
                  <div>{x(posting.type)}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(M.hiring_posting_posted)} {posting.postedDate}
                    {posting.closingDate && ` · ${x(M.hiring_posting_closing)} ${posting.closingDate}`}
                  </div>
                </div>
              </div>
              <span className={statusChipClass(posting.status === 'active' ? 'success' : 'muted' as any)}>
                {x(getPostingStatusLabel(posting.status))}
              </span>
            </div>
          </button>
        ))
      ) : (
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
          <div className="text-[14.5px] font-semibold text-text">{x(M.hiring_postings_no_postings)}</div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function getStatusTone(status: Candidate['status']): 'success' | 'info' | 'warning' | 'risk' | 'muted' {
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
      return 'muted'
    case 'rejected':
      return 'risk'
    default:
      return 'muted'
  }
}

function getStatusLabel(status: Candidate['status']) {
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

function getPostingStatusLabel(status: string) {
  switch (status) {
    case 'active':
      return M.hiring_posting_active
    case 'closed':
      return M.hiring_posting_closed
    case 'draft':
      return M.hiring_posting_draft
    default:
      return M.hiring_posting_draft
  }
}
