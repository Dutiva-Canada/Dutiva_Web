import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { specialistsMessages as M } from '@/i18n/messages/specialists'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormTextarea, FormCheckbox } from '@/components/FormField'
import { useSpecialistsData } from '../SpecialistsDataContext'
import type { Specialist, SpecialistSpecialty, SpecialistWorkspaceRole } from '../data/types'

const SPECIALTIES: SpecialistSpecialty[] = [
  'lawyer',
  'accountant',
  'tax',
  'insurance',
  'it_security',
  'hr_consultant',
  'bookkeeper',
  'other',
]

const ROLES: SpecialistWorkspaceRole[] = ['consultant', 'viewer']

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

function generateId() {
  return `sp-${Math.random().toString(36).slice(2, 9)}`
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
  const { specialists, addSpecialist } = useSpecialistsData()
  const [show, setShow] = useState(false)

  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState<SpecialistSpecialty>('other')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [workspaceAccess, setWorkspaceAccess] = useState(false)
  const [workspaceRole, setWorkspaceRole] = useState<SpecialistWorkspaceRole>('consultant')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setName('')
    setSpecialty('other')
    setCompany('')
    setEmail('')
    setPhone('')
    setWorkspaceAccess(false)
    setWorkspaceRole('consultant')
    setNotes('')
  }

  const onSubmit = async () => {
    const newSpecialist: Specialist = {
      id: generateId(),
      organization_id: '',
      name,
      specialty,
      company: company || null,
      email: email || null,
      phone: phone || null,
      crm_contact_id: null,
      finance_party_id: null,
      workspace_access: workspaceAccess,
      workspace_role: workspaceRole,
      granted_modules: [],
      access_expires_at: null,
      organization_member_id: null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addSpecialist(newSpecialist)
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
          {x(show ? M.spec_cancel : M.spec_add)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.spec_name)}>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label={x(M.spec_specialty)}>
            <FormSelect value={specialty} onChange={(e) => setSpecialty(e.target.value as SpecialistSpecialty)}>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {x(M[SPECIALTY_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.spec_company)}>
            <FormInput value={company} onChange={(e) => setCompany(e.target.value)} />
          </FormField>
          <FormField label={x(M.spec_email)}>
            <FormInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField label={x(M.spec_phone)}>
            <FormInput value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
          <FormField label={x(M.spec_notes)}>
            <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
          <div className="sm:col-span-2">
            <FormCheckbox
              label={x(M.spec_workspace_access)}
              checked={workspaceAccess}
              onChange={(checked) => setWorkspaceAccess(checked)}
            />
          </div>
          {workspaceAccess ? (
            <FormField label={x(M.spec_workspace_role_consultant)}>
              <FormSelect
                value={workspaceRole}
                onChange={(e) => setWorkspaceRole(e.target.value as SpecialistWorkspaceRole)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {x(M[ROLE_LABELS[r]])}
                  </option>
                ))}
              </FormSelect>
            </FormField>
          ) : null}
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => setShow(false)}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.spec_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(M.spec_save)}
            </button>
          </div>
        </div>
      ) : null}

      {specialists.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.spec_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {specialists.map((specialist) => (
            <SpecialistRow key={specialist.id} specialist={specialist} />
          ))}
        </div>
      )}
    </div>
  )
}
