import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import { statusChipClass } from '@/components/chips'
import {
  applicationStatusLabel,
  applicationStatusTone,
  EMPLOYER_APPLICATION_STATUSES,
} from '@/features/careers/applicationStatus'
import type { ApplicationStatus } from '@/features/careers/data/applicationsApi'
import { formatCareersDate } from '@/features/careers/dates'
import type { PortalApplication } from './productionApi'

/**
 * Employer-side inbox for candidate-portal applications — one card per
 * application with an expandable cover letter / resume / AI-suggestions
 * detail, and a status control scoped to employer-settable statuses
 * ('withdrawn' is candidate-only, shown as a read-only chip).
 */
export function PortalInbox({
  applications,
  updatingId,
  onStatusChange,
}: {
  applications: PortalApplication[] | null
  updatingId: string | null
  onStatusChange: (app: PortalApplication, next: ApplicationStatus) => void
}) {
  const { x } = useI18n()
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null)

  if (!applications || applications.length === 0) {
    return (
      <div className="flex flex-col gap-[12px]">
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
          <div className="mb-[4px] text-[14.5px] font-semibold text-text">
            {x(M.hiring_inbox_empty)}
          </div>
          <div className="text-[13px] text-text-muted">{x(M.hiring_inbox_empty_body)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[12px]">
      {applications.map((app) => (
        <PortalApplicationCard
          key={app.id}
          app={app}
          expanded={expandedAppId === app.id}
          updating={updatingId === app.id}
          onToggle={() => setExpandedAppId((current) => (current === app.id ? null : app.id))}
          onStatusChange={(next) => onStatusChange(app, next)}
        />
      ))}
    </div>
  )
}

function PortalApplicationCard({
  app,
  expanded,
  updating,
  onToggle,
  onStatusChange,
}: {
  app: PortalApplication
  expanded: boolean
  updating: boolean
  onToggle: () => void
  onStatusChange: (next: ApplicationStatus) => void
}) {
  const { x, lang } = useI18n()
  const withdrawn = app.status === 'withdrawn'
  const suggestions = Array.isArray(app.aiSuggestions)
    ? app.aiSuggestions.filter((s): s is string => typeof s === 'string')
    : []

  return (
    <div className="rounded-[12px] border border-border bg-surface p-[16px]">
      <div className="flex flex-wrap items-start justify-between gap-[12px]">
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-text">{app.candidateName ?? '—'}</div>
          <div className="mt-[2px] truncate text-[12.5px] text-text-muted">
            {[app.candidateHeadline, app.candidateEmail].filter(Boolean).join(' · ')}
          </div>
          <div className="mt-[4px] flex flex-wrap items-center gap-[6px] text-[12px] text-text-faint">
            <span className="font-semibold text-text-2">{app.jobPostingTitle ?? '—'}</span>
            {app.candidateLocation && (
              <>
                <span aria-hidden="true">·</span>
                <span>{app.candidateLocation}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{formatCareersDate(app.appliedAt, lang)}</span>
          </div>
        </div>
        <div className="flex items-center gap-[8px]">
          {app.aiMatchScore != null && (
            <span className={statusChipClass('info')}>
              {x(M.hiring_inbox_match)} {app.aiMatchScore}
            </span>
          )}
          {withdrawn ? (
            <span className={statusChipClass(applicationStatusTone(app.status))}>
              {x(applicationStatusLabel(app.status))}
            </span>
          ) : (
            <select
              value={app.status}
              disabled={updating}
              aria-label={x(M.hiring_candidate_status)}
              onChange={(e) => onStatusChange(e.target.value as ApplicationStatus)}
              className="rounded-[8px] border border-border bg-surface px-[8px] py-[6px] font-sans text-[12.5px] text-text"
            >
              {EMPLOYER_APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {x(applicationStatusLabel(status))}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={x(M.hiring_inbox_view_details)}
            className="flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-[8px] border border-border bg-surface text-text-2 hover:text-text"
          >
            <ChevronDown
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className={expanded ? 'rotate-180' : undefined}
            />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-[14px] flex flex-col gap-[14px] border-t border-t-inset pt-[14px]">
          {app.coverLetter && (
            <div>
              <h3 className="m-0 mb-[6px] text-[12px] font-bold tracking-[0.03em] text-text-muted uppercase">
                {x(M.hiring_inbox_cover_letter)}
              </h3>
              <p className="m-0 max-h-[200px] overflow-y-auto text-[13px] whitespace-pre-wrap text-text-2">
                {app.coverLetter}
              </p>
            </div>
          )}
          <div>
            <h3 className="m-0 mb-[6px] text-[12px] font-bold tracking-[0.03em] text-text-muted uppercase">
              {x(M.hiring_inbox_resume)}
            </h3>
            <p className="m-0 max-h-[260px] overflow-y-auto text-[13px] whitespace-pre-wrap text-text-2">
              {app.submittedResume}
            </p>
          </div>
          {suggestions.length > 0 && (
            <div>
              <h3 className="m-0 mb-[6px] text-[12px] font-bold tracking-[0.03em] text-text-muted uppercase">
                {x(M.hiring_inbox_ai_suggestions)}
              </h3>
              <ul className="m-0 list-disc pl-[18px] text-[13px] text-text-2">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
