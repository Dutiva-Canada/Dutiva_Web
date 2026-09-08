import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { useGovernanceData } from '../GovernanceDataContext'
import type { GovernanceShareholder } from '../data/types'

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
  const { shareholders } = useGovernanceData()

  if (shareholders.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.gov_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {shareholders.map((shareholder) => (
        <ShareholderRow key={shareholder.id} shareholder={shareholder} />
      ))}
    </div>
  )
}
