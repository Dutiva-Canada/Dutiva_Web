import { useEffect, useState } from 'react'
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

function emptyIncident(): SecurityIncident {
  return {
    id: generateId(),
    organization_id: '',
    title: '',
    severity: 'low',
    status: 'open',
    reported_by: null,
    assigned_to: null,
    reported_at: new Date().toISOString(),
    resolved_at: null,
    summary: null,
    impact: null,
    remediation: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function incidentDateToInput(date: string) {
  return date.slice(0, 10)
}

function inputToIncidentDate(date: string) {
  return `${date}T00:00:00Z`
}

function IncidentRow({
  incident,
  onEdit,
}: {
  readonly incident: SecurityIncident
  readonly onEdit: (incident: SecurityIncident) => void
}) {
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
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className={statusChipClass(SEVERITY_TONE[incident.severity])}>{x(M[SEVERITY_LABELS[incident.severity]])}</span>
        <span className={statusChipClass(STATUS_TONE[incident.status])}>{x(M[STATUS_LABELS[incident.status]])}</span>
        <button
          type="button"
          onClick={() => onEdit(incident)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.sec_edit)}
        </button>
      </div>
    </div>
  )
}

export function Incidents() {
  const { x } = useI18n()
  const { incidents, addIncident, updateIncident } = useSecurityData()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<SecurityIncident | null>(null)

  const initial = editing ?? emptyIncident()
  const [title, setTitle] = useState(initial.title)
  const [severity, setSeverity] = useState<SecuritySeverity>(initial.severity)
  const [status, setStatus] = useState<SecurityIncidentStatus>(initial.status)
  const [reportedAt, setReportedAt] = useState(incidentDateToInput(initial.reported_at))
  const [resolvedAt, setResolvedAt] = useState(initial.resolved_at ? incidentDateToInput(initial.resolved_at) : '')
  const [summary, setSummary] = useState(initial.summary ?? '')
  const [impact, setImpact] = useState(initial.impact ?? '')
  const [remediation, setRemediation] = useState(initial.remediation ?? '')

  useEffect(() => {
    const base = editing ?? emptyIncident()
    setTitle(base.title)
    setSeverity(base.severity)
    setStatus(base.status)
    setReportedAt(incidentDateToInput(base.reported_at))
    setResolvedAt(base.resolved_at ? incidentDateToInput(base.resolved_at) : '')
    setSummary(base.summary ?? '')
    setImpact(base.impact ?? '')
    setRemediation(base.remediation ?? '')
  }, [editing])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptyIncident()
    setTitle(base.title)
    setSeverity(base.severity)
    setStatus(base.status)
    setReportedAt(incidentDateToInput(base.reported_at))
    setResolvedAt(base.resolved_at ? incidentDateToInput(base.resolved_at) : '')
    setSummary(base.summary ?? '')
    setImpact(base.impact ?? '')
    setRemediation(base.remediation ?? '')
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const incident: SecurityIncident = {
      ...(editing ?? emptyIncident()),
      title,
      severity,
      status,
      reported_at: inputToIncidentDate(reportedAt || now),
      resolved_at: resolvedAt ? inputToIncidentDate(resolvedAt) : null,
      summary: summary || null,
      impact: impact || null,
      remediation: remediation || null,
      created_by: null,
      updated_at: now,
    }
    if (editing) {
      await updateIncident(incident)
    } else {
      await addIncident({ ...incident, created_at: now })
    }
    reset()
  }

  const openCreate = () => {
    setEditing(null)
    setShow(true)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => (show ? reset() : openCreate())}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show && !editing ? M.sec_cancel : M.sec_add_incident)}
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
              onClick={reset}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.sec_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(editing ? M.sec_save_changes : M.sec_save)}
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
            <IncidentRow key={incident.id} incident={incident} onEdit={(i) => { setEditing(i); setShow(true) }} />
          ))}
        </div>
      )}
    </div>
  )
}
