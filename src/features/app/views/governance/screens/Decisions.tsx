import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormTextarea, FormCheckbox } from '@/components/FormField'
import { useGovernanceData } from '../GovernanceDataContext'
import type { GovernanceDecision, GovernanceDecisionStatus } from '../data/types'

const STATUSES: GovernanceDecisionStatus[] = ['proposed', 'adopted', 'rescinded']

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

function generateId() {
  return `gd-${Math.random().toString(36).slice(2, 9)}`
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
  const { decisions, addDecision } = useGovernanceData()
  const [show, setShow] = useState(false)

  const [title, setTitle] = useState('')
  const [decisionDate, setDecisionDate] = useState('')
  const [decidedBy, setDecidedBy] = useState('')
  const [rationale, setRationale] = useState('')
  const [status, setStatus] = useState<GovernanceDecisionStatus>('proposed')
  const [viewerVisible, setViewerVisible] = useState(false)

  const reset = () => {
    setTitle('')
    setDecisionDate('')
    setDecidedBy('')
    setRationale('')
    setStatus('proposed')
    setViewerVisible(false)
  }

  const onSubmit = async () => {
    const newDecision: GovernanceDecision = {
      id: generateId(),
      organization_id: '',
      title,
      decision_date: decisionDate || null,
      decided_by: decidedBy || null,
      rationale: rationale || null,
      status,
      viewer_visible: viewerVisible,
      related_record_id: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addDecision(newDecision)
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
          {x(show ? M.gov_cancel : M.gov_add_decision)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.gov_title_field)} className="sm:col-span-2">
            <FormInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label={x(M.gov_decision_date)}>
            <FormInput type="date" value={decisionDate} onChange={(e) => setDecisionDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.gov_status)}>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as GovernanceDecisionStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.gov_rationale)} className="sm:col-span-2">
            <FormTextarea value={rationale} onChange={(e) => setRationale(e.target.value)} />
          </FormField>
          <div className="sm:col-span-2">
            <FormCheckbox
              label={x(M.gov_viewer_visible)}
              checked={viewerVisible}
              onChange={(checked) => setViewerVisible(checked)}
            />
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.gov_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(M.gov_save)}
            </button>
          </div>
        </div>
      ) : null}

      {decisions.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.gov_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {decisions.map((decision) => (
            <DecisionRow key={decision.id} decision={decision} />
          ))}
        </div>
      )}
    </div>
  )
}
