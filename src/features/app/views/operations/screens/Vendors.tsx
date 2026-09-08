import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect } from '@/components/FormField'
import { useOperationsData } from '../OperationsDataContext'
import type { OperationsVendor, OperationsVendorStatus, OperationsVendorType } from '../data/types'

const TYPES: NonNullable<OperationsVendorType>[] = ['supplier', 'logistics', 'technology', 'professional_service']
const STATUSES: OperationsVendorStatus[] = ['active', 'inactive', 'under_review']

const TYPE_LABELS: Record<NonNullable<OperationsVendorType>, keyof typeof M> = {
  supplier: 'ops_vendor_type_supplier',
  logistics: 'ops_vendor_type_logistics',
  technology: 'ops_vendor_type_technology',
  professional_service: 'ops_vendor_type_professional_service',
}

const STATUS_LABELS: Record<OperationsVendorStatus, keyof typeof M> = {
  active: 'ops_status_active',
  inactive: 'ops_status_inactive',
  under_review: 'ops_status_under_review',
}

const STATUS_TONE: Record<OperationsVendorStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  under_review: 'warning',
}

function generateId() {
  return `ov-${Math.random().toString(36).slice(2, 9)}`
}

function VendorRow({ vendor }: { readonly vendor: OperationsVendor }) {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{vendor.name}</div>
        <div className="text-[12px] text-text-muted">
          {vendor.vendor_type ? x(M[TYPE_LABELS[vendor.vendor_type]]) : null}
          {vendor.contract_expiry ? ` · expires ${vendor.contract_expiry}` : null}
          {vendor.notes ? ` · ${vendor.notes}` : null}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        {vendor.finance_party_id ? (
          <Link
            to={`${root}/finance/entities`}
            className="text-[12px] text-accent hover:underline"
          >
            {x(M.ops_link_finance)}
          </Link>
        ) : null}
        <span className={statusChipClass(STATUS_TONE[vendor.status])}>{x(M[STATUS_LABELS[vendor.status]])}</span>
      </div>
    </div>
  )
}

export function Vendors() {
  const { x } = useI18n()
  const { vendors, addVendor } = useOperationsData()
  const [show, setShow] = useState(false)

  const [name, setName] = useState('')
  const [vendorType, setVendorType] = useState<NonNullable<OperationsVendorType>>('supplier')
  const [status, setStatus] = useState<OperationsVendorStatus>('active')
  const [contractExpiry, setContractExpiry] = useState('')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setName('')
    setVendorType('supplier')
    setStatus('active')
    setContractExpiry('')
    setNotes('')
  }

  const onSubmit = async () => {
    const newVendor: OperationsVendor = {
      id: generateId(),
      organization_id: '',
      finance_party_id: null,
      name,
      vendor_type: vendorType,
      status,
      contract_expiry: contractExpiry || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addVendor(newVendor)
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
          {x(show ? M.ops_cancel : M.ops_add_vendor)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.ops_name_field)} className="sm:col-span-2">
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label={x(M.ops_type)}>
            <FormSelect
              value={vendorType}
              onChange={(e) => setVendorType(e.target.value as NonNullable<OperationsVendorType>)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {x(M[TYPE_LABELS[t]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.ops_status)}>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as OperationsVendorStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.ops_contract_expiry)}>
            <FormInput type="date" value={contractExpiry} onChange={(e) => setContractExpiry(e.target.value)} />
          </FormField>
          <FormField label={x(M.ops_notes)}>
            <FormInput value={notes} onChange={(e) => setNotes(e.target.value)} />
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

      {vendors.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.ops_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {vendors.map((vendor) => (
            <VendorRow key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  )
}
