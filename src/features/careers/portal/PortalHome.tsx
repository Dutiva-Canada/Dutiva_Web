import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, FileText, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { statusChipClass } from '@/components/chips'
import type { ChipTone } from '@/components/chips'
import { getMyCandidateProfile } from '@/features/careers/data/candidateApi'
import type { CandidateProfile } from '@/features/careers/data/candidateApi'
import { listMyApplications } from '@/features/careers/data/applicationsApi'
import type { CandidateApplication, ApplicationStatus } from '@/features/careers/data/applicationsApi'

type LoadState = 'loading' | 'ready' | 'failed'

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

/** Rough profile-completeness percentage based on filled fields. */
function profileCompleteness(profile: CandidateProfile): number {
  const fields: (string | null)[] = [
    profile.name,
    profile.email,
    profile.location,
    profile.headline,
    profile.summary,
    profile.resumeText,
    profile.currentRole,
    profile.yearsExperience != null ? String(profile.yearsExperience) : null,
  ]
  const filled = fields.filter((f) => f != null && f.trim().length > 0).length
  return Math.round((filled / fields.length) * 100)
}

/**
 * Landing page for the candidate portal. If the candidate has not yet
 * created a profile, shows a "complete your profile" call to action.
 * Otherwise shows a summary dashboard: profile completeness, recent
 * applications, and a browse-jobs link.
 */
export function PortalHome() {
  const { x } = useI18n()
  const [state, setState] = useState<LoadState>('loading')
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [applications, setApplications] = useState<CandidateApplication[]>([])

  const load = useCallback(async () => {
    setState('loading')
    try {
      const [p, a] = await Promise.all([getMyCandidateProfile(), listMyApplications()])
      setProfile(p)
      setApplications(a)
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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

  if (!profile) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[48px] text-center">
        <div className="mx-auto mb-[16px] flex h-[48px] w-[48px] items-center justify-center rounded-full bg-accent-soft text-accent">
          <FileText size={22} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <h1 className="m-0 text-[18px] font-semibold text-text">{x(M.careers_profile_not_created)}</h1>
        <Link
          to="/careers/portal/profile"
          className="mt-[18px] inline-flex items-center gap-[7px] rounded-[10px] border-none bg-navy px-[18px] py-[10px] text-[14px] font-semibold text-white no-underline"
        >
          {x(M.careers_portal_nav_profile)}
          <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
    )
  }

  const completeness = profileCompleteness(profile)
  const recent = applications.slice(0, 3)

  return (
    <div className="flex flex-col gap-[24px]">
      <div>
        <h1 className="m-0 text-[22px] font-bold text-text">{x(M.careers_portal_title)}</h1>
        <p className="mt-[4px] text-[14px] text-text-muted">{profile.headline || profile.name}</p>
      </div>

      {/* Profile completeness */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <div className="mb-[10px] flex items-center justify-between gap-[12px]">
          <h2 className="m-0 text-[15px] font-semibold text-text">{x(M.careers_profile_title)}</h2>
          <span className="text-[13px] font-semibold text-text-muted">{completeness}%</span>
        </div>
        <div className="h-[6px] w-full overflow-hidden rounded-[100px] bg-inset">
          <div
            className="h-full rounded-[100px] bg-navy transition-[width] duration-300"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <Link
          to="/careers/portal/profile"
          className="mt-[14px] inline-flex items-center gap-[6px] text-[13px] font-semibold text-accent hover:underline"
        >
          {x(M.careers_portal_nav_profile)}
          <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>

      {/* Recent applications */}
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <div className="mb-[14px] flex items-center justify-between gap-[12px]">
          <h2 className="m-0 flex items-center gap-[7px] text-[15px] font-semibold text-text">
            <Briefcase size={16} strokeWidth={2} aria-hidden="true" />
            {x(M.careers_applications_title)}
          </h2>
          <Link
            to="/careers/portal/applications"
            className="text-[13px] font-semibold text-accent hover:underline"
          >
            {x(M.careers_applications_title)}
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.careers_applications_empty)}</p>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {recent.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between gap-[12px] rounded-[10px] border border-inset bg-inset px-[14px] py-[11px]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-text">
                    {app.jobPosting?.title ?? app.jobPostingId}
                  </div>
                  <div className="truncate text-[12.5px] text-text-muted">
                    {app.jobPosting?.department}
                    {app.jobPosting?.location ? ` · ${app.jobPosting.location}` : ''}
                  </div>
                </div>
                <span className={statusChipClass(statusTone(app.status))}>
                  {x(statusLabel(app.status))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Browse jobs CTA */}
      <Link
        to="/careers"
        className="flex items-center justify-center gap-[8px] rounded-[11px] border-none bg-navy px-[20px] py-[14px] text-[15px] font-semibold text-white no-underline"
      >
        {x(M.careers_portal_nav_browse)}
        <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
  )
}
