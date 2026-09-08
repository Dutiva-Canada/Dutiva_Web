import { useEffect, useState } from 'react'
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

function emptyTechnology(): OperationsTechnology {
  return {
    id: generateId(),
    organization_id: '',
    name: '',
    system_type: 'internal',
    owner_id: null,
    status: 'active',
    renewal_date: null,
    integration_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function TechnologyRow({
  tech,
  onEdit,
  onRemove,
}: {
  readonly tech: OperationsTechnology
  readonly onEdit: (tech: OperationsTechnology) => void
  readonly onRemove: (id: string) => void
}) {
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
      <div className="flex items-center gap-[10px]">
        <span className={statusChipClass(STATUS_TONE[tech.status])}>{x(M[STATUS_LABELS[tech.status]])}</span>
        <button
          type="button"
          onClick={() => onEdit(tech)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.ops_edit)}
        </button>
        <button
          type="button"
          onClick={() => onRemove(tech.id)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.ops_remove)}
        </button>
      </div>
    </div>
  )
}

export function Technology() {
  const { x } = useI18n()
  const { technology, addTechnology, updateTechnology, removeTechnology } = useOperationsData()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<OperationsTechnology | null>(null)

  const initial = editing ?? emptyTechnology()
  const [name, setName] = useState(initial.name)
  const [systemType, setSystemType] = useState<NonNullable<OperationsTechnologyType>>(initial.system_type ?? 'internal')
  const [status, setStatus] = useState<OperationsTechnologyStatus>(initial.status)
  const [renewalDate, setRenewalDate] = useState(initial.renewal_date ?? '')
  const [integrationNotes, setIntegrationNotes] = useState(initial.integration_notes ?? '')

  useEffect(() => {
    const base = editing ?? emptyTechnology()
    setName(base.name)
    setSystemType(base.system_type ?? 'internal')
    setStatus(base.status)
    setRenewalDate(base.renewal_date ?? '')
    setIntegrationNotes(base.integration_notes ?? '')
  }, [editing])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptyTechnology()
    setName(base.name)
    setSystemType(base.system_type ?? 'internal')
    setStatus(base.status)
    setRenewalDate(base.renewal_date ?? '')
    setIntegrationNotes(base.integration_notes ?? '')
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const technology: OperationsTechnology = {
      ...(editing ?? emptyTechnology()),
      name,
      system_type: systemType,
      status,
      renewal_date: renewalDate || null,
      integration_notes: integrationNotes || null,
      updated_at: now,
    }
    if (editing) {
      await updateTechnology(technology)
    } else {
      await addTechnology({ ...technology, created_at: now })
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
          {x(show && !editing ? M.ops_cancel : M.ops_add_technology)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.ops_name_field)} className="sm:col-span-2">
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label={x(M.ops_type)}>
            <FormSelect value={systemType} onChange={(e) => setSystemType(e.target.value as NonNullable<OperationsTechnologyType>)}>
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
              onClick={reset}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.ops_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(editing ? M.ops_save_changes : M.ops_save)}
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
            <TechnologyRow
              key={tech.id}
              tech={tech}
              onEdit={(t) => { setEditing(t); setShow(true) }}
              onRemove={(id) => removeTechnology(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
