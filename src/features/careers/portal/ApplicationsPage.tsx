import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { statusChipClass } from '@/components/chips'
import type { ChipTone } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { listMyApplications, withdrawApplication } from '@/features/careers/data/applicationsApi'
import type { ApplicationStatus, CandidateApplication } from '@/features/careers/data/applicationsApi'

type LoadState = 'loading' | 'ready' | 'failed'

/** Terminal statuses — no withdraw button once the pipeline has moved past review. */
const TERMINAL_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
  'hired',
  'rejected',
  'withdrawn',
])

/** Status → chip tone for the application badges. */
function statusTone(status: ApplicationStatus): ChipTone {
  switch (status) {
    case 'submitted':
    case 'under_review':
      return 'info'
    case 'shortlisted':
    case 'interview':
    case 'offered':
    case 'hired':
      return 'success'
    case 'rejected':
      return 'risk'
    case 'withdrawn':
      return 'neutral'
    default:
      return 'neutral'
  }
}

/** Status → message key for the localized label. */
function statusLabel(status: ApplicationStatus) {
  switch (status) {
    case 'submitted':
      return M.careers_applications_status_submitted
    case 'under_review':
      return M.careers_applications_status_under_review
    case 'shortlisted':
      return M.careers_applications_status_shortlisted
    case 'interview':
      return M.careers_applications_status_interview
    case 'offered':
      return M.careers_applications_status_offered
    case 'hired':
      return M.careers_applications_status_hired
    case 'rejected':
      return M.careers_applications_status_rejected
    case 'withdrawn':
      return M.careers_applications_status_withdrawn
    default:
      return M.careers_applications_status_submitted
  }
}

/** Format an ISO date string as a localized date (YYYY-MM-DD → locale). */
function formatDate(iso: string, lang: string): string {
  try {
    return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

/**
 * List of the candidate's submitted applications, newest first. Each row
 * links to the job posting, shows the status badge, and offers a withdraw
 * button for non-terminal statuses.
 */
export function ApplicationsPage() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const [state, setState] = useState<LoadState>('loading')
  const [applications, setApplications] = useState<CandidateApplication[]>([])
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState('loading')
    try {
      const apps = await listMyApplications()
      setApplications(apps)
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
      showToast(M.careers_applications_status_withdrawn, 'ok')
      void load()
    } catch {
      showToast(M.careers_error_generic, 'info')
    } finally {
      setWithdrawingId(null)
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
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">{x(M.careers_error_generic)}</div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-[12px] cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
        >
          {x(M.careers_error_generic)}
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
            to="/careers"
            className="mt-[16px] inline-flex items-center gap-[7px] rounded-[10px] border-none bg-navy px-[18px] py-[10px] text-[14px] font-semibold text-white no-underline"
          >
            {x(M.careers_applications_empty_cta)}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {applications.map((app) => {
            const canWithdraw = !TERMINAL_STATUSES.has(app.status)
            return (
              <div
                key={app.id}
                className="rounded-[12px] border border-border bg-surface p-[18px]"
              >
                <div className="flex flex-wrap items-start justify-between gap-[12px]">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/careers/jobs/${app.jobPostingId}`}
                      className="text-[15px] font-semibold text-text hover:underline"
                    >
                      {app.jobPosting?.title ?? app.jobPostingId}
                    </Link>
                    <div className="mt-[3px] text-[13px] text-text-muted">
                      {app.jobPosting?.department}
                      {app.jobPosting?.location ? ` · ${app.jobPosting.location}` : ''}
                    </div>
                    <div className="mt-[4px] text-[12.5px] text-text-faint">
                      {x(M.careers_applications_applied)}{' '}
                      {formatDate(app.appliedAt, lang)}
                    </div>
                  </div>
                  <div className="flex items-center gap-[10px]">
                    <span className={statusChipClass(statusTone(app.status))}>
                      {x(statusLabel(app.status))}
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
    </div>
  )
}
