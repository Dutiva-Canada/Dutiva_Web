import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { operationsMessages as M } from '@/i18n/messages/operations'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { statusChipClass } from '@/components/chips'
import { useOperationsData } from '../OperationsDataContext'
import type { OperationsVendor, OperationsVendorStatus, OperationsVendorType } from '../data/types'

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
  const { vendors } = useOperationsData()

  if (vendors.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.ops_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {vendors.map((vendor) => (
        <VendorRow key={vendor.id} vendor={vendor} />
      ))}
    </div>
  )
}
