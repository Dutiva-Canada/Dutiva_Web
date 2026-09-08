import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { FormField, FormInput, FormCheckbox } from '@/components/FormField'
import { useGovernanceData } from '../GovernanceDataContext'
import type { GovernanceShareholder } from '../data/types'

function generateId() {
  return `gh-${Math.random().toString(36).slice(2, 9)}`
}

function ShareholderRow({ shareholder }: { readonly shareholder: GovernanceShareholder }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">
          {shareholder.name}
        </div>
        <div className="text-[12px] text-text-muted">
          {shareholder.share_class ? `${shareholder.share_class}` : null}
          {shareholder.shares_issued ? ` · ${shareholder.shares_issued} ${x(M.gov_shareholder_total_shares)}` : null}
          {shareholder.issue_date ? ` · ${shareholder.issue_date}` : null}
          {shareholder.contact_email ? ` · ${shareholder.contact_email}` : null}
        </div>
      </div>
    </div>
  )
}

export function Shareholders() {
  const { x } = useI18n()
  const { shareholders, addShareholder } = useGovernanceData()
  const [show, setShow] = useState(false)

  const [name, setName] = useState('')
  const [sharesIssued, setSharesIssued] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [viewerVisible, setViewerVisible] = useState(false)

  const reset = () => {
    setName('')
    setSharesIssued('')
    setContactEmail('')
    setViewerVisible(false)
  }

  const onSubmit = async () => {
    const newShareholder: GovernanceShareholder = {
      id: generateId(),
      organization_id: '',
      name,
      share_class: null,
      shares_issued: sharesIssued ? Number(sharesIssued) : null,
      issue_date: null,
      contact_email: contactEmail || null,
      viewer_visible: viewerVisible,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addShareholder(newShareholder)
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
          {x(show ? M.gov_cancel : M.gov_add_shareholder)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.gov_name)}>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label={x(M.gov_shares_issued)}>
            <FormInput type="number" value={sharesIssued} onChange={(e) => setSharesIssued(e.target.value)} />
          </FormField>
          <FormField label={x(M.gov_contact_email)}>
            <FormInput type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
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

      {shareholders.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.gov_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {shareholders.map((shareholder) => (
            <ShareholderRow key={shareholder.id} shareholder={shareholder} />
          ))}
        </div>
      )}
    </div>
  )
}
