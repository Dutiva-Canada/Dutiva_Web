import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { useSecurityData } from '../SecurityDataContext'
import type { SecurityIncident, SecurityIncidentStatus, SecuritySeverity } from '../data/types'

const SEVERITIES: SecuritySeverity[] = ['critical', 'high', 'medium', 'low']
const STATUSES: SecurityIncidentStatus[] = ['open', 'contained', 'resolved', 'closed']

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

function generateId() {
  return `si-${Math.random().toString(36).slice(2, 9)}`
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
  const { incidents, addIncident } = useSecurityData()
  const [show, setShow] = useState(false)

  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<SecuritySeverity>('low')
  const [status, setStatus] = useState<SecurityIncidentStatus>('open')
  const [reportedAt, setReportedAt] = useState('')
  const [resolvedAt, setResolvedAt] = useState('')
  const [summary, setSummary] = useState('')
  const [impact, setImpact] = useState('')
  const [remediation, setRemediation] = useState('')

  const reset = () => {
    setTitle('')
    setSeverity('low')
    setStatus('open')
    setReportedAt('')
    setResolvedAt('')
    setSummary('')
    setImpact('')
    setRemediation('')
  }

  const onSubmit = async () => {
    const newIncident: SecurityIncident = {
      id: generateId(),
      organization_id: '',
      title,
      severity,
      status,
      reported_by: null,
      assigned_to: null,
      reported_at: reportedAt ? `${reportedAt}T00:00:00Z` : new Date().toISOString(),
      resolved_at: resolvedAt ? `${resolvedAt}T00:00:00Z` : null,
      summary: summary || null,
      impact: impact || null,
      remediation: remediation || null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addIncident(newIncident)
    reset()
    setShow(false)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show ? M.sec_cancel : M.sec_add_incident)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.sec_title_field)} className="sm:col-span-2">
            <FormInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label={x(M.sec_severity)}>
            <FormSelect value={severity} onChange={(e) => setSeverity(e.target.value as SecuritySeverity)}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {x(M[SEVERITY_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.sec_status)}>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as SecurityIncidentStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.sec_reported_at)}>
            <FormInput type="date" value={reportedAt} onChange={(e) => setReportedAt(e.target.value)} />
          </FormField>
          <FormField label={x(M.sec_resolved_at)}>
            <FormInput type="date" value={resolvedAt} onChange={(e) => setResolvedAt(e.target.value)} />
          </FormField>
          <FormField label={x(M.sec_summary)} className="sm:col-span-2">
            <FormTextarea value={summary} onChange={(e) => setSummary(e.target.value)} />
          </FormField>
          <FormField label={x(M.sec_impact)} className="sm:col-span-2">
            <FormTextarea value={impact} onChange={(e) => setImpact(e.target.value)} />
          </FormField>
          <FormField label={x(M.sec_remediation)} className="sm:col-span-2">
            <FormTextarea value={remediation} onChange={(e) => setRemediation(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.sec_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(M.sec_save)}
            </button>
          </div>
        </div>
      ) : null}

      {incidents.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.sec_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {incidents.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  )
}
