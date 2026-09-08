import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { specialistsMessages as M } from '@/i18n/messages/specialists'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { statusChipClass } from '@/components/chips'
import { useSpecialistsData } from '../SpecialistsDataContext'
import type { Specialist, SpecialistSpecialty, SpecialistWorkspaceRole } from '../data/types'

const SPECIALTY_LABELS: Record<SpecialistSpecialty, keyof typeof M> = {
  lawyer: 'spec_specialty_lawyer',
  accountant: 'spec_specialty_accountant',
  tax: 'spec_specialty_tax',
  insurance: 'spec_specialty_insurance',
  it_security: 'spec_specialty_it_security',
  hr_consultant: 'spec_specialty_hr_consultant',
  bookkeeper: 'spec_specialty_bookkeeper',
  other: 'spec_specialty_other',
}

const ROLE_LABELS: Record<SpecialistWorkspaceRole, keyof typeof M> = {
  consultant: 'spec_workspace_role_consultant',
  viewer: 'spec_workspace_role_viewer',
}

function SpecialistRow({ specialist }: { readonly specialist: Specialist }) {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{specialist.name}</div>
        <div className="text-[12px] text-text-muted">
          {x(M[SPECIALTY_LABELS[specialist.specialty]])}
          {specialist.company ? ` · ${specialist.company}` : null}
          {specialist.email ? ` · ${specialist.email}` : null}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        {specialist.crm_contact_id ? (
          <Link to={`${root}/crm`} className="text-[12px] text-accent hover:underline">
            {x(M.spec_link_crm)}
          </Link>
        ) : null}
        {specialist.finance_party_id ? (
          <Link to={`${root}/finance/entities`} className="text-[12px] text-accent hover:underline">
            {x(M.spec_link_finance)}
          </Link>
        ) : null}
        {specialist.workspace_access ? (
          <span className={statusChipClass('success')}>{x(M[ROLE_LABELS[specialist.workspace_role]])}</span>
        ) : null}
      </div>
    </div>
  )
}

export function Directory() {
  const { x } = useI18n()
  const { specialists } = useSpecialistsData()

  if (specialists.length === 0) {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
        <p className="m-0 text-[13.5px] text-text-muted">{x(M.spec_empty_body)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      {specialists.map((specialist) => (
        <SpecialistRow key={specialist.id} specialist={specialist} />
      ))}
    </div>
  )
}
