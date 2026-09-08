import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { useSecurityData } from '../SecurityDataContext'
import type { SecurityRisk, SecurityRiskStatus, SecurityRiskLikelihood, SecurityRiskImpact } from '../data/types'

const STATUSES: SecurityRiskStatus[] = ['open', 'mitigated', 'accepted', 'closed']
const LIKELIHOODS: NonNullable<SecurityRiskLikelihood>[] = ['high', 'medium', 'low']
const IMPACTS: NonNullable<SecurityRiskImpact>[] = ['high', 'medium', 'low']

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

function generateId() {
  return `sr-${Math.random().toString(36).slice(2, 9)}`
}

function emptyRisk(): SecurityRisk {
  return {
    id: generateId(),
    organization_id: '',
    title: '',
    likelihood: 'low',
    impact: 'low',
    owner: null,
    mitigation: null,
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function RiskRow({ risk, onEdit }: { readonly risk: SecurityRisk; readonly onEdit: (risk: SecurityRisk) => void }) {
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
      <div className="flex items-center gap-[10px]">
        <span className={statusChipClass(STATUS_TONE[risk.status])}>{x(M[STATUS_LABELS[risk.status]])}</span>
        <button
          type="button"
          onClick={() => onEdit(risk)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.sec_edit)}
        </button>
      </div>
    </div>
  )
}

export function Risks() {
  const { x } = useI18n()
  const { risks, addRisk, updateRisk } = useSecurityData()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<SecurityRisk | null>(null)

  const initial = editing ?? emptyRisk()
  const [title, setTitle] = useState(initial.title)
  const [status, setStatus] = useState<SecurityRiskStatus>(initial.status)
  const [likelihood, setLikelihood] = useState<NonNullable<SecurityRiskLikelihood>>(initial.likelihood ?? 'low')
  const [impact, setImpact] = useState<NonNullable<SecurityRiskImpact>>(initial.impact ?? 'low')
  const [owner, setOwner] = useState(initial.owner ?? '')
  const [mitigation, setMitigation] = useState(initial.mitigation ?? '')

  useEffect(() => {
    const base = editing ?? emptyRisk()
    setTitle(base.title)
    setStatus(base.status)
    setLikelihood(base.likelihood ?? 'low')
    setImpact(base.impact ?? 'low')
    setOwner(base.owner ?? '')
    setMitigation(base.mitigation ?? '')
  }, [editing])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptyRisk()
    setTitle(base.title)
    setStatus(base.status)
    setLikelihood(base.likelihood ?? 'low')
    setImpact(base.impact ?? 'low')
    setOwner(base.owner ?? '')
    setMitigation(base.mitigation ?? '')
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const risk: SecurityRisk = {
      ...(editing ?? emptyRisk()),
      title,
      status,
      likelihood,
      impact,
      owner: owner || null,
      mitigation: mitigation || null,
      updated_at: now,
    }
    if (editing) {
      await updateRisk(risk)
    } else {
      await addRisk({ ...risk, created_at: now })
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
          {x(show && !editing ? M.sec_cancel : M.sec_add_risk)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.sec_title_field)} className="sm:col-span-2">
            <FormInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label={x(M.sec_status)}>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as SecurityRiskStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.sec_owner)}>
            <FormInput value={owner} onChange={(e) => setOwner(e.target.value)} />
          </FormField>
          <FormField label={x(M.sec_likelihood)}>
            <FormSelect
              value={likelihood}
              onChange={(e) => setLikelihood(e.target.value as NonNullable<SecurityRiskLikelihood>)}
            >
              {LIKELIHOODS.map((l) => (
                <option key={l} value={l}>
                  {x(M[LIKELIHOOD_LABELS[l]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.sec_severity)}>
            <FormSelect value={impact} onChange={(e) => setImpact(e.target.value as NonNullable<SecurityRiskImpact>)}>
              {IMPACTS.map((i) => (
                <option key={i} value={i}>
                  {x(M[IMPACT_LABELS[i]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.sec_mitigation)} className="sm:col-span-2">
            <FormTextarea value={mitigation} onChange={(e) => setMitigation(e.target.value)} />
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

      {risks.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.sec_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {risks.map((risk) => (
            <RiskRow key={risk.id} risk={risk} onEdit={(r) => { setEditing(r); setShow(true) }} />
          ))}
        </div>
      )}
    </div>
  )
}
