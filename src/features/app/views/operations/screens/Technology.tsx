import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect } from '@/components/FormField'
import { useOperationsData } from '../OperationsDataContext'
import type { OperationsTechnology, OperationsTechnologyStatus, OperationsTechnologyType } from '../data/types'

const TYPES: NonNullable<OperationsTechnologyType>[] = ['internal', 'customer_facing', 'integration', 'infrastructure']
const STATUSES: OperationsTechnologyStatus[] = ['active', 'deprecated', 'planned']

const TYPE_LABELS: Record<NonNullable<OperationsTechnologyType>, keyof typeof M> = {
  internal: 'ops_tech_type_internal',
  customer_facing: 'ops_tech_type_customer_facing',
  integration: 'ops_tech_type_integration',
  infrastructure: 'ops_tech_type_infrastructure',
}

const STATUS_LABELS: Record<OperationsTechnologyStatus, keyof typeof M> = {
  active: 'ops_tech_status_active',
  deprecated: 'ops_tech_status_deprecated',
  planned: 'ops_tech_status_planned',
}

const STATUS_TONE: Record<OperationsTechnologyStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  deprecated: 'neutral',
  planned: 'warning',
}

function generateId() {
  return `ot-${Math.random().toString(36).slice(2, 9)}`
}

function TechnologyRow({ tech }: { readonly tech: OperationsTechnology }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{tech.name}</div>
        <div className="text-[12px] text-text-muted">
          {tech.system_type ? x(M[TYPE_LABELS[tech.system_type]]) : null}
          {tech.renewal_date ? ` · renewal ${tech.renewal_date}` : null}
          {tech.integration_notes ? ` · ${tech.integration_notes}` : null}
        </div>
      </div>
      <span className={statusChipClass(STATUS_TONE[tech.status])}>{x(M[STATUS_LABELS[tech.status]])}</span>
    </div>
  )
}

export function Technology() {
  const { x } = useI18n()
  const { technology, addTechnology } = useOperationsData()
  const [show, setShow] = useState(false)

  const [name, setName] = useState('')
  const [systemType, setSystemType] = useState<NonNullable<OperationsTechnologyType>>('internal')
  const [status, setStatus] = useState<OperationsTechnologyStatus>('active')
  const [renewalDate, setRenewalDate] = useState('')
  const [integrationNotes, setIntegrationNotes] = useState('')

  const reset = () => {
    setName('')
    setSystemType('internal')
    setStatus('active')
    setRenewalDate('')
    setIntegrationNotes('')
  }

  const onSubmit = async () => {
    const newTechnology: OperationsTechnology = {
      id: generateId(),
      organization_id: '',
      name,
      system_type: systemType,
      owner_id: null,
      status,
      renewal_date: renewalDate || null,
      integration_notes: integrationNotes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addTechnology(newTechnology)
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
          {x(show ? M.ops_cancel : M.ops_add_technology)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.ops_name_field)} className="sm:col-span-2">
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label={x(M.ops_type)}>
            <FormSelect
              value={systemType}
              onChange={(e) => setSystemType(e.target.value as NonNullable<OperationsTechnologyType>)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {x(M[TYPE_LABELS[t]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.ops_status)}>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as OperationsTechnologyStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.ops_renewal_date)}>
            <FormInput type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.ops_notes)}>
            <FormInput value={integrationNotes} onChange={(e) => setIntegrationNotes(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.ops_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(M.ops_save)}
            </button>
          </div>
        </div>
      ) : null}

      {technology.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.ops_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {technology.map((tech) => (
            <TechnologyRow key={tech.id} tech={tech} />
          ))}
        </div>
      )}
    </div>
  )
}
