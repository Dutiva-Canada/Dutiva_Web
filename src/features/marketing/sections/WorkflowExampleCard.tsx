import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'

type RiskTone = 'high' | 'medium' | 'low'

const RISK_BADGE: Record<RiskTone, string> = {
  high: 'border-risk-border bg-risk-bg text-risk-fg',
  medium: 'border-warn-border bg-warn-bg text-warn-fg',
  low: 'border-ok-border bg-ok-bg text-ok-fg',
}

const PROGRESS_BAR: Record<RiskTone, string> = {
  high: 'bg-risk-fg',
  medium: 'bg-warn-fg',
  low: 'bg-ok-fg',
}

export interface WorkflowExampleCardProps {
  readonly nameKey: LandingMessageKey
  readonly riskKey: LandingMessageKey
  readonly riskTone: RiskTone
  readonly metaKey: LandingMessageKey
  readonly stepKey: LandingMessageKey
  readonly nextLabelKey: LandingMessageKey
  readonly nextKey: LandingMessageKey
  readonly progressPct: number
}

/** Static workflow progress card — illustrative sample, not a live case runner. */
export function WorkflowExampleCard({
  nameKey,
  riskKey,
  riskTone,
  metaKey,
  stepKey,
  nextLabelKey,
  nextKey,
  progressPct,
}: WorkflowExampleCardProps) {
  const { lt } = useLanding()
  return (
    <div className="rounded-2xl border border-border bg-bg-elevated px-[22px] py-5">
      <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
        <span className="font-semibold text-text">{lt(nameKey)}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[0.6875rem] font-bold tracking-wider uppercase ${RISK_BADGE[riskTone]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full bg-current`} />
          {lt(riskKey)}
        </span>
      </div>
      <div className="mb-3 text-[0.8125rem] text-text-2">{lt(metaKey)}</div>
      <div className="flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-soft">
          <div
            className={`h-full rounded-full ${PROGRESS_BAR[riskTone]}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs font-bold whitespace-nowrap text-text-3">{lt(stepKey)}</span>
      </div>
      <div className="mt-2.5 text-[0.8125rem] text-text-3">
        <span className="font-semibold text-text-2">{lt(nextLabelKey)}</span> {lt(nextKey)}
      </div>
    </div>
  )
}
