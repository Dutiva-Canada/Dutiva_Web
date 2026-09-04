import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'

/**
 * Candidate detail production view — loads real candidate data from Supabase.
 * Placeholder until the hiring production API is wired to the UI.
 */
export function CandidateDetailProductionView() {
  const { x } = useI18n()
  const navigate = useNavigate()
  const { candidateId } = useParams<{ candidateId: string }>()

  return (
    <div className="flex-1 overflow-y-auto px-[32px] pt-[28px] pb-[60px]">
      <div className="mx-auto max-w-[800px]">
        <div className="mb-[18px] flex items-center gap-[12px]">
          <button
            type="button"
            onClick={() => navigate('/app/hiring')}
            className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-inset text-text hover:bg-surface"
          >
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <h1 className="text-[20px] font-bold text-text">{x(M.hiring_candidate_not_found)}</h1>
        </div>
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
          <div className="mb-[4px] text-[14.5px] font-semibold text-text">{x(M.hiring_prod_empty_title)}</div>
          <div className="mb-[14px] text-[13px] text-text-muted">{x(M.hiring_prod_empty_body)}</div>
          <div className="text-[12px] text-text-muted">candidateId: {candidateId}</div>
        </div>
      </div>
    </div>
  )
}
