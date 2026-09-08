import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { useGovernanceData } from '../GovernanceDataContext'
import type { GovernanceOfficer, GovernanceOfficerRole } from '../data/types'

const ROLE_LABELS: Record<GovernanceOfficerRole, keyof typeof M> = {
  director: 'gov_officer_role_director',
  officer_president: 'gov_officer_role_president',
  officer_secretary: 'gov_officer_role_secretary',
  officer_treasurer: 'gov_officer_role_treasurer',
}

function OfficerRow({ officer }: { readonly officer: GovernanceOfficer }) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">
          {officer.name}
        </div>
        <div className="text-[12px] text-text-muted">
          {x(M[ROLE_LABELS[officer.role]])}
          {officer.appointed_date ? ` · ${officer.appointed_date}` : null}
          {officer.contact_email ? ` · ${officer.contact_email}` : null}
          {!officer.is_active ? ' · inactive' : null}
        </div>
      </div>
      <span
        className={
          officer.is_active
            ? 'inline-flex items-center rounded-full border border-ok-border bg-ok-bg px-[10px] py-[3px] text-[11.5px] font-semibold text-ok-fg'
            : 'inline-flex items-center rounded-full border border-border bg-inset px-[10px] py-[3px] text-[11.5px] font-semibold text-text-muted'
        }
      >
        {officer.is_active ? x(M.gov_officer_active) : x(M.gov_officer_inactive)}
      </span>
    </div>
  )
}

export function Officers() {
  const { x } = useI18n()
  const { officers } = useGovernanceData()

  if (officers.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.gov_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {officers.map((officer) => (
        <OfficerRow key={officer.id} officer={officer} />
      ))}
    </div>
  )
}
