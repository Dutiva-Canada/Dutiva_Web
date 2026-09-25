import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, ExternalLink, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { listMyApplications, withdrawApplication } from '@/features/careers/data/applicationsApi'
import type { CandidateApplication } from '@/features/careers/data/applicationsApi'
import {
  listExternalApplications,
  skipExternalApplication,
  submitExternalApplication,
  type ExternalApplication,
} from '@/features/careers/data/agentApi'
import {
  applicationStatusLabel,
  applicationStatusTone,
  externalApplicationStatusLabel,
  externalApplicationStatusTone,
  TERMINAL_APPLICATION_STATUSES,
} from '@/features/careers/applicationStatus'
import { formatCareersDate } from '@/features/careers/dates'
import { useCareersPath } from '@/features/careers/useCareersPath'

type LoadState = 'loading' | 'ready' | 'failed'

/**
 * List of the candidate's submitted applications, newest first. Each row
 * links to the job posting, shows the status badge, and offers a withdraw
 * button for non-terminal statuses.
 */
export function ApplicationsPage() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const paths = useCareersPath()
  const [state, setState] = useState<LoadState>('loading')
  const [applications, setApplications] = useState<CandidateApplication[]>([])
  const [externalApps, setExternalApps] = useState<ExternalApplication[]>([])
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState('loading')
    try {
      const [apps, external] = await Promise.all([
        listMyApplications(),
        listExternalApplications().catch(() => []),
      ])
      setApplications(apps)
      setExternalApps(external)
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onWithdraw = async (app: CandidateApplication) => {
    if (withdrawingId) return
    if (!window.confirm(x(M.careers_applications_withdraw_confirm))) return
    setWithdrawingId(app.id)
    try {
      await withdrawApplication(app.id)
      showToast(M.careers_applications_withdraw_success, 'ok')
      void load()
    } catch {
      showToast(M.careers_error_generic, 'info')
    } finally {
      setWithdrawingId(null)
    }
  }

  const onApproveExternal = async (app: ExternalApplication) => {
    if (actingId) return
    setActingId(app.id)
    try {
      await submitExternalApplication(app.id)
      void load()
    } catch {
      showToast(M.careers_error_generic, 'info')
    } finally {
      setActingId(null)
    }
  }

  const onSkipExternal = async (app: ExternalApplication) => {
    if (actingId) return
    setActingId(app.id)
    try {
      await skipExternalApplication(app.id)
      void load()
    } catch {
      showToast(M.careers_error_generic, 'info')
    } finally {
      setActingId(null)
    }
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-[8px] text-[14px] text-text-muted">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        {x(M.careers_loading)}
      </div>
    )
  }

  if (state === 'failed') {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">
          {x(M.careers_error_generic)}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-[12px] cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
        >
          {x(M.careers_retry)}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <h1 className="m-0 flex items-center gap-[8px] text-[22px] font-bold text-text">
        <Briefcase size={22} strokeWidth={2} aria-hidden="true" />
        {x(M.careers_applications_title)}
      </h1>

      {applications.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[48px] text-center">
          <p className="m-0 text-[14px] text-text-muted">{x(M.careers_applications_empty)}</p>
          <Link
            to={paths.board}
            className="mt-[16px] inline-flex items-center gap-[7px] rounded-[10px] border-none bg-navy px-[18px] py-[10px] text-[14px] font-semibold text-white no-underline"
          >
            {x(M.careers_applications_empty_cta)}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {applications.map((app) => {
            const canWithdraw = !TERMINAL_APPLICATION_STATUSES.has(app.status)
            return (
              <div key={app.id} className="rounded-[12px] border border-border bg-surface p-[18px]">
                <div className="flex flex-wrap items-start justify-between gap-[12px]">
                  <div className="min-w-0 flex-1">
                    {app.jobPosting ? (
                      <Link
                        to={paths.jobDetail(app.jobPostingId)}
                        aria-label={x(M.careers_applications_view_job)}
                        className="text-[15px] font-semibold text-text hover:underline"
                      >
                        {app.jobPosting.title}
                      </Link>
                    ) : (
                      <span className="text-[15px] font-semibold text-text">
                        {x(M.careers_applications_posting_closed)}
                      </span>
                    )}
                    <div className="mt-[3px] text-[13px] text-text-muted">
                      {app.jobPosting?.department}
                      {app.jobPosting?.location ? ` · ${app.jobPosting.location}` : ''}
                    </div>
                    <div className="mt-[4px] text-[12.5px] text-text-faint">
                      {x(M.careers_applications_applied)} {formatCareersDate(app.appliedAt, lang)}
                    </div>
                  </div>
                  <div className="flex items-center gap-[10px]">
                    <span className={statusChipClass(applicationStatusTone(app.status))}>
                      {x(applicationStatusLabel(app.status))}
                    </span>
                    {canWithdraw && (
                      <button
                        type="button"
                        onClick={() => void onWithdraw(app)}
                        disabled={withdrawingId === app.id}
                        className="cursor-pointer rounded-[8px] border border-border bg-transparent px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 hover:bg-inset disabled:cursor-default disabled:opacity-60"
                      >
                        {withdrawingId === app.id
                          ? x(M.careers_loading)
                          : x(M.careers_applications_withdraw)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* External applications — the agent's application log (0179). */}
      {externalApps.length > 0 && (
        <div className="flex flex-col gap-[10px]">
          <div>
            <h2 className="m-0 text-[16px] font-semibold text-text">
              {x(M.careers_external_title)}
            </h2>
            <p className="mt-[3px] mb-0 text-[12.5px] text-text-muted">
              {x(M.careers_external_body)}
            </p>
          </div>
          {externalApps.map((app) => {
            const job = app.job
            const canAct = app.status === 'needs_review' || app.status === 'queued'
            const manualLink =
              app.status === 'manual_required' && job?.applyUrl ? job.applyUrl : null
            return (
              <div key={app.id} className="rounded-[12px] border border-border bg-surface p-[18px]">
                <div className="flex flex-wrap items-start justify-between gap-[12px]">
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-text">
                      {job?.title ?? x(M.careers_applications_posting_closed)}
                    </div>
                    <div className="mt-[3px] text-[13px] text-text-muted">
                      {job?.company}
                      {job?.location ? ` · ${job.location}` : ''}
                      {job ? ` · ${x(M.careers_external_via).replace('{source}', job.source)}` : ''}
                    </div>
                    <div className="mt-[4px] text-[12.5px] text-text-faint">
                      {app.matchScore !== null && (
                        <>
                          {x(M.careers_external_match)} {app.matchScore}/100 ·{' '}
                        </>
                      )}
                      {app.submittedAt
                        ? `${x(M.careers_external_submitted_on)} ${formatCareersDate(app.submittedAt, lang)}`
                        : `${x(M.careers_external_prepared_on)} ${formatCareersDate(app.createdAt, lang)}`}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <span className={statusChipClass(externalApplicationStatusTone(app.status))}>
                      {x(externalApplicationStatusLabel(app.status))}
                    </span>
                    {manualLink && (
                      <a
                        href={manualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-[5px] rounded-[8px] border border-border bg-transparent px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 no-underline hover:bg-inset"
                      >
                        <ExternalLink size={13} strokeWidth={2} aria-hidden="true" />
                        {x(M.careers_external_open)}
                      </a>
                    )}
                    {canAct && (
                      <>
                        <button
                          type="button"
                          onClick={() => void onApproveExternal(app)}
                          disabled={actingId === app.id}
                          className="cursor-pointer rounded-[8px] border-none bg-navy px-[12px] py-[6px] text-[12.5px] font-semibold text-white disabled:cursor-default disabled:opacity-60"
                        >
                          {actingId === app.id
                            ? x(M.careers_loading)
                            : x(M.careers_external_approve)}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onSkipExternal(app)}
                          disabled={actingId === app.id}
                          className="cursor-pointer rounded-[8px] border border-border bg-transparent px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 hover:bg-inset disabled:cursor-default disabled:opacity-60"
                        >
                          {x(M.careers_external_skip)}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
