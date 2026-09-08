import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { statusChipClass } from '@/components/chips'
import { useSecurityData } from '../SecurityDataContext'
import type { SecurityRisk, SecurityRiskStatus, SecurityRiskLikelihood, SecurityRiskImpact } from '../data/types'

const STATUS_LABELS: Record<SecurityRiskStatus, keyof typeof M> = {
  open: 'sec_risk_status_open',
  mitigated: 'sec_risk_status_mitigated',
  accepted: 'sec_risk_status_accepted',
  closed: 'sec_risk_status_closed',
}

const STATUS_TONE: Record<SecurityRiskStatus, 'risk' | 'success' | 'neutral' | 'neutral'> = {
  open: 'risk',
  mitigated: 'success',
  accepted: 'neutral',
  closed: 'neutral',
}

const LIKELIHOOD_LABELS: Record<NonNullable<SecurityRiskLikelihood>, keyof typeof M> = {
  high: 'sec_criticality_high',
  medium: 'sec_criticality_medium',
  low: 'sec_criticality_low',
}

const IMPACT_LABELS: Record<NonNullable<SecurityRiskImpact>, keyof typeof M> = {
  high: 'sec_criticality_high',
  medium: 'sec_criticality_medium',
  low: 'sec_criticality_low',
}

function RiskRow({ risk }: { readonly risk: SecurityRisk }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{risk.title}</div>
        <div className="text-[12px] text-text-muted">
          {risk.likelihood ? `L: ${x(M[LIKELIHOOD_LABELS[risk.likelihood]])}` : null}
          {risk.impact ? ` · I: ${x(M[IMPACT_LABELS[risk.impact]])}` : null}
          {risk.owner ? ` · owner ${risk.owner}` : null}
          {risk.mitigation ? ` · ${risk.mitigation}` : null}
        </div>
      </div>
      <span className={statusChipClass(STATUS_TONE[risk.status])}>{x(M[STATUS_LABELS[risk.status]])}</span>
    </div>
  )
}

export function Risks() {
  const { x } = useI18n()
  const { risks } = useSecurityData()

  if (risks.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.sec_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {risks.map((risk) => (
        <RiskRow key={risk.id} risk={risk} />
      ))}
    </div>
  )
}
