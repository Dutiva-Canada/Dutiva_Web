import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import { statusChipClass } from '@/components/chips'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { AppPage } from '@/features/app/shell/AppPage'
import { getJobPosting } from './productionApi'
import type { ProductionJobPosting } from './productionApi'

/**
 * Job posting detail production view — loads real job posting data from Supabase.
 */

type LoadState = 'loading' | 'ready' | 'failed'

export function JobPostingDetailProductionView() {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()
  const { root } = useWorkspaceRoot()
  const { postingId } = useParams<{ postingId: string }>()

  const [state, setState] = useState<LoadState>('loading')
  const [posting, setPosting] = useState<ProductionJobPosting | null>(null)

  const load = useCallback(async () => {
    if (!postingId) return
    setState('loading')
    try {
      const p = await getJobPosting(postingId)
      setPosting(p)
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [postingId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.hiring_prod_empty_title)} />
  }

  return (
    <AppPage width="comfort">
      <Link
        to={workspacePath(root, 'hiring')}
        className="mb-[16px] inline-flex items-center gap-[6px] text-[13px] font-semibold text-text-muted hover:text-text"
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        {x(M.hiring_posting_back)}
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

      {state === 'ready' && !posting && (
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
          <div className="text-[14.5px] font-semibold text-text">{x(M.hiring_posting_not_found)}</div>
        </div>
      )}

      {state === 'ready' && posting && (
        <>
          <div className="mb-[18px] flex flex-wrap items-center gap-[12px]">
            <div className="flex-1">
              <h1 className="text-[20px] font-bold text-text">{posting.title}</h1>
              <p className="mt-[2px] text-[13px] text-text-muted">
                {posting.department} · {posting.location} · {posting.type}
              </p>
            </div>
            <span className={statusChipClass(getPostingStatusTone(posting.status))}>
              {x(getPostingStatusLabel(posting.status))}
            </span>
          </div>

          <div className="flex flex-col gap-[16px]">
            <section className="rounded-[12px] border border-border bg-surface p-[20px]">
              <h2 className="mb-[12px] text-[16px] font-bold text-text">{x(M.hiring_posting_description_label)}</h2>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-text-2">{posting.description}</p>
            </section>

            {posting.requirements.length > 0 && (
              <section className="rounded-[12px] border border-border bg-surface p-[20px]">
                <h2 className="mb-[12px] text-[16px] font-bold text-text">{x(M.hiring_posting_requirements_label)}</h2>
                <ul className="ml-[16px] list-disc space-y-[6px] text-[13px] text-text-2">
                  {posting.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
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
                {posting.workSampleScenario}
              </div>
            </section>

            <div className="text-[12px] text-text-muted">
              {x(M.hiring_posting_posted)} {posting.postedDate || '-'}
              {posting.closingDate && ` · ${x(M.hiring_posting_closing)} ${posting.closingDate}`}
            </div>
          </div>
        </>
      )}
    </AppPage>
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
