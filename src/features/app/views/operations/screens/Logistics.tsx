import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { useOperationsData } from '../OperationsDataContext'
import type { OperationsLogistics, OperationsLogisticsStatus } from '../data/types'

const STATUSES: OperationsLogisticsStatus[] = ['in_transit', 'delivered', 'delayed', 'returned']

const STATUS_LABELS: Record<OperationsLogisticsStatus, keyof typeof M> = {
  in_transit: 'ops_logistics_status_in_transit',
  delivered: 'ops_logistics_status_delivered',
  delayed: 'ops_logistics_status_delayed',
  returned: 'ops_logistics_status_returned',
}

const STATUS_TONE: Record<OperationsLogisticsStatus, 'warning' | 'success' | 'risk' | 'neutral'> = {
  in_transit: 'warning',
  delivered: 'success',
  delayed: 'risk',
  returned: 'neutral',
}

function generateId() {
  return `ol-${Math.random().toString(36).slice(2, 9)}`
}

function LogisticsRow({ row }: { readonly row: OperationsLogistics }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{row.title}</div>
        <div className="text-[12px] text-text-muted">
          {row.expected_date ? `expected ${row.expected_date}` : null}
          {row.delivered_date ? ` · delivered ${row.delivered_date}` : null}
          {row.notes ? ` · ${row.notes}` : null}
        </div>
      </div>
      <span className={statusChipClass(STATUS_TONE[row.status])}>{x(M[STATUS_LABELS[row.status]])}</span>
    </div>
  )
}

export function Logistics() {
  const { x } = useI18n()
  const { logistics, addLogistics } = useOperationsData()
  const [show, setShow] = useState(false)

  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<OperationsLogisticsStatus>('in_transit')
  const [expectedDate, setExpectedDate] = useState('')
  const [deliveredDate, setDeliveredDate] = useState('')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setTitle('')
    setStatus('in_transit')
    setExpectedDate('')
    setDeliveredDate('')
    setNotes('')
  }

  const onSubmit = async () => {
    const newLogistics: OperationsLogistics = {
      id: generateId(),
      organization_id: '',
      title,
      owner_id: null,
      assigned_to: null,
      status,
      expected_date: expectedDate || null,
      delivered_date: deliveredDate || null,
      notes: notes || null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addLogistics(newLogistics)
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
          {x(show ? M.ops_cancel : M.ops_add_logistics)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.ops_title_field)} className="sm:col-span-2">
            <FormInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label={x(M.ops_status)}>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as OperationsLogisticsStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.ops_expected_date)}>
            <FormInput type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.ops_delivered_date)}>
            <FormInput type="date" value={deliveredDate} onChange={(e) => setDeliveredDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.ops_notes)} className="sm:col-span-2">
            <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
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

      {logistics.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.ops_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {logistics.map((row) => (
            <LogisticsRow key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  )
}
