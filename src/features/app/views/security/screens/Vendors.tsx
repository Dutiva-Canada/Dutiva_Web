import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { securityMessages as M } from '@/i18n/messages/security'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormCheckbox } from '@/components/FormField'
import { useSecurityData } from '../SecurityDataContext'
import type { SecurityVendorReview, SecurityVendorType } from '../data/types'

const TYPES: NonNullable<SecurityVendorType>[] = ['lawyer', 'accountant', 'insurance', 'it_security', 'other']

const VENDOR_TYPE_LABELS: Record<NonNullable<SecurityVendorType>, keyof typeof M> = {
  lawyer: 'sec_vendor_type_lawyer',
  accountant: 'sec_vendor_type_accountant',
  insurance: 'sec_vendor_type_insurance',
  it_security: 'sec_vendor_type_it_security',
  other: 'sec_vendor_type_other',
}

function generateId() {
  return `sv-${Math.random().toString(36).slice(2, 9)}`
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
  const { vendorReviews, addVendorReview } = useSecurityData()
  const [show, setShow] = useState(false)

  const [vendorName, setVendorName] = useState('')
  const [vendorType, setVendorType] = useState<NonNullable<SecurityVendorType>>('other')
  const [privacyAgreement, setPrivacyAgreement] = useState(false)
  const [securityReviewDate, setSecurityReviewDate] = useState('')
  const [nextReviewDate, setNextReviewDate] = useState('')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setVendorName('')
    setVendorType('other')
    setPrivacyAgreement(false)
    setSecurityReviewDate('')
    setNextReviewDate('')
    setNotes('')
  }

  const onSubmit = async () => {
    const newVendor: SecurityVendorReview = {
      id: generateId(),
      organization_id: '',
      vendor_name: vendorName,
      vendor_type: vendorType,
      privacy_agreement: privacyAgreement,
      security_review_date: securityReviewDate || null,
      next_review_date: nextReviewDate || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addVendorReview(newVendor)
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
          {x(show ? M.sec_cancel : M.sec_add_vendor)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.sec_vendor_name)} className="sm:col-span-2">
            <FormInput value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
          </FormField>
          <FormField label={x(M.sec_type)}>
            <FormSelect
              value={vendorType}
              onChange={(e) => setVendorType(e.target.value as NonNullable<SecurityVendorType>)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {x(M[VENDOR_TYPE_LABELS[t]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.sec_security_review_date)}>
            <FormInput
              type="date"
              value={securityReviewDate}
              onChange={(e) => setSecurityReviewDate(e.target.value)}
            />
          </FormField>
          <FormField label={x(M.sec_next_review_date)}>
            <FormInput type="date" value={nextReviewDate} onChange={(e) => setNextReviewDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.sec_notes)} className="sm:col-span-2">
            <FormInput value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
          <div className="sm:col-span-2">
            <FormCheckbox
              label={x(M.sec_privacy_agreement)}
              checked={privacyAgreement}
              onChange={(checked) => setPrivacyAgreement(checked)}
            />
          </div>
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

      {vendorReviews.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.sec_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {vendorReviews.map((vendor) => (
            <VendorRow key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  )
}
