import { useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import { demoJobPostings } from '@/data'
import { statusChipClass } from '@/components/chips'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'

/**
 * Job posting detail demo view — Northgate fixture data for the demo workspace.
 */
export function JobPostingDetailDemoView() {
  const { x } = useI18n()
  const navigate = useWorkspaceNavigate()
  const { postingId } = useParams<{ postingId: string }>()

  const posting = demoJobPostings.find((p) => p.id === postingId)
  if (!posting) {
    return (
      <div className="flex-1 overflow-y-auto px-[32px] pt-[28px] pb-[60px]">
        <div className="mx-auto max-w-[800px] rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
          <div className="text-[14.5px] font-semibold text-text">{x(M.hiring_posting_not_found)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-[32px] pt-[28px] pb-[60px]">
      <div className="mx-auto max-w-[900px]">
        <button
          type="button"
          onClick={() => navigate('/app/hiring')}
          className="mb-[16px] flex cursor-pointer items-center gap-[6px] text-[13px] font-semibold text-text-muted hover:text-text"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {x(M.hiring_posting_back)}
        </button>

        <div className="mb-[18px] flex flex-wrap items-center gap-[12px]">
          <div className="flex-1">
            <h1 className="text-[20px] font-bold text-text">{x(posting.title)}</h1>
            <p className="mt-[2px] text-[13px] text-text-muted">
              {x(posting.department)} · {x(posting.location)} · {x(posting.type)}
            </p>
          </div>
          <span className={statusChipClass(getPostingStatusTone(posting.status))}>
            {x(getPostingStatusLabel(posting.status))}
          </span>
        </div>

        <div className="flex flex-col gap-[16px]">
          <section className="rounded-[12px] border border-border bg-surface p-[20px]">
            <h2 className="mb-[12px] text-[16px] font-bold text-text">{x(M.hiring_posting_description_label)}</h2>
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-text-2">{x(posting.description)}</p>
          </section>

          {posting.requirements.length > 0 && (
            <section className="rounded-[12px] border border-border bg-surface p-[20px]">
              <h2 className="mb-[12px] text-[16px] font-bold text-text">{x(M.hiring_posting_requirements_label)}</h2>
              <ul className="ml-[16px] list-disc space-y-[6px] text-[13px] text-text-2">
                {posting.requirements.map((req, idx) => (
                  <li key={idx}>{x(req)}</li>
                ))}
              </ul>
            </section>
          )}

          {posting.knockoutCriteria.length > 0 && (
            <section className="rounded-[12px] border border-border bg-surface p-[20px]">
              <h2 className="mb-[12px] text-[16px] font-bold text-text">{x(M.hiring_posting_knockout_label)}</h2>
              <ul className="ml-[16px] list-disc space-y-[6px] text-[13px] text-text-2">
                {posting.knockoutCriteria.map((criterion, idx) => (
                  <li key={idx}>{criterion}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-[12px] border border-border bg-surface p-[20px]">
            <h2 className="mb-[12px] text-[16px] font-bold text-text">{x(M.hiring_posting_work_sample_label)}</h2>
            <div className="rounded-[8px] border border-inset bg-inset p-[12px] text-[13px] text-text-2">
              {x(posting.workSampleScenario)}
            </div>
          </section>

          <div className="text-[12px] text-text-muted">
            {x(M.hiring_posting_posted)} {posting.postedDate}
            {posting.closingDate && ` · ${x(M.hiring_posting_closing)} ${posting.closingDate}`}
          </div>
        </div>
      </div>
    </div>
  )
}

function getPostingStatusTone(status: string): 'success' | 'neutral' | 'warning' {
  switch (status) {
    case 'active':
      return 'success'
    case 'closed':
      return 'neutral'
    default:
      return 'warning'
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
