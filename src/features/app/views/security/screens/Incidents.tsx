import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { statusChipClass } from '@/components/chips'
import { useSecurityData } from '../SecurityDataContext'
import type { SecurityIncident, SecurityIncidentStatus, SecuritySeverity } from '../data/types'

const SEVERITY_LABELS: Record<SecuritySeverity, keyof typeof M> = {
  critical: 'sec_severity_critical',
  high: 'sec_severity_high',
  medium: 'sec_severity_medium',
  low: 'sec_severity_low',
}

const SEVERITY_TONE: Record<SecuritySeverity, 'risk' | 'warning' | 'info' | 'neutral'> = {
  critical: 'risk',
  high: 'risk',
  medium: 'warning',
  low: 'neutral',
}

const STATUS_LABELS: Record<SecurityIncidentStatus, keyof typeof M> = {
  open: 'sec_incident_status_open',
  contained: 'sec_incident_status_contained',
  resolved: 'sec_incident_status_resolved',
  closed: 'sec_incident_status_closed',
}

const STATUS_TONE: Record<SecurityIncidentStatus, 'risk' | 'warning' | 'success' | 'neutral'> = {
  open: 'risk',
  contained: 'warning',
  resolved: 'success',
  closed: 'neutral',
}

function IncidentRow({ incident }: { readonly incident: SecurityIncident }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{incident.title}</div>
        <div className="text-[12px] text-text-muted">
          {incident.reported_at ? incident.reported_at.slice(0, 10) : null}
          {incident.assigned_to ? ` · assigned` : null}
          {incident.summary ? ` · ${incident.summary}` : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <span className={statusChipClass(SEVERITY_TONE[incident.severity])}>{x(M[SEVERITY_LABELS[incident.severity]])}</span>
        <span className={statusChipClass(STATUS_TONE[incident.status])}>{x(M[STATUS_LABELS[incident.status]])}</span>
      </div>
    </div>
  )
}

export function Incidents() {
  const { x } = useI18n()
  const { incidents } = useSecurityData()

  if (incidents.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.sec_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {incidents.map((incident) => (
        <IncidentRow key={incident.id} incident={incident} />
      ))}
    </div>
  )
}
