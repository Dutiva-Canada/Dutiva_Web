import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { statusChipClass } from '@/components/chips'
import { useSecurityData } from '../SecurityDataContext'
import type { SecurityVendorReview, SecurityVendorType } from '../data/types'

const VENDOR_TYPE_LABELS: Record<NonNullable<SecurityVendorType>, keyof typeof M> = {
  lawyer: 'sec_vendor_type_lawyer',
  accountant: 'sec_vendor_type_accountant',
  insurance: 'sec_vendor_type_insurance',
  it_security: 'sec_vendor_type_it_security',
  other: 'sec_vendor_type_other',
}

function VendorRow({ vendor }: { readonly vendor: SecurityVendorReview }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{vendor.vendor_name}</div>
        <div className="text-[12px] text-text-muted">
          {vendor.vendor_type ? x(M[VENDOR_TYPE_LABELS[vendor.vendor_type]]) : null}
          {vendor.privacy_agreement !== null
            ? ` · ${x(vendor.privacy_agreement ? M.sec_dpa_signed : M.sec_dpa_missing)}`
            : null}
          {vendor.next_review_date ? ` · ${vendor.next_review_date}` : null}
        </div>
      </div>
      {vendor.security_review_date ? (
        <span className={statusChipClass('success')}>{vendor.security_review_date}</span>
      ) : (
        <span className={statusChipClass('warning')}>{x(M.sec_review_pending)}</span>
      )}
    </div>
  )
}

export function Vendors() {
  const { x } = useI18n()
  const { vendorReviews } = useSecurityData()

  if (vendorReviews.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.sec_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {vendorReviews.map((vendor) => (
        <VendorRow key={vendor.id} vendor={vendor} />
      ))}
    </div>
  )
}
