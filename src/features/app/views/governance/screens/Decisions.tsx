import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { statusChipClass } from '@/components/chips'
import { useGovernanceData } from '../GovernanceDataContext'
import type { GovernanceDecision, GovernanceDecisionStatus } from '../data/types'

const STATUS_LABELS: Record<GovernanceDecisionStatus, keyof typeof M> = {
  proposed: 'gov_decision_status_proposed',
  adopted: 'gov_decision_status_adopted',
  rescinded: 'gov_decision_status_rescinded',
}

const STATUS_TONE: Record<GovernanceDecisionStatus, 'success' | 'warning' | 'risk' | 'neutral'> = {
  proposed: 'warning',
  adopted: 'success',
  rescinded: 'neutral',
}

function DecisionRow({ decision }: { readonly decision: GovernanceDecision }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">
          {decision.title}
        </div>
        <div className="text-[12px] text-text-muted">
          {decision.decision_date ? `${decision.decision_date}` : null}
          {decision.decided_by ? ` · ${decision.decided_by}` : null}
          {decision.rationale ? ` · ${decision.rationale}` : null}
        </div>
      </div>
      <span className={statusChipClass(STATUS_TONE[decision.status])}>{x(M[STATUS_LABELS[decision.status]])}</span>
    </div>
  )
}

export function Decisions() {
  const { x } = useI18n()
  const { decisions } = useGovernanceData()

  if (decisions.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.gov_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {decisions.map((decision) => (
        <DecisionRow key={decision.id} decision={decision} />
      ))}
    </div>
  )
}
