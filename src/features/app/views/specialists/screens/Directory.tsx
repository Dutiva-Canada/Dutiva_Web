import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { specialistsMessages as M } from '@/i18n/messages/specialists'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { statusChipClass } from '@/components/chips'
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormCheckbox,
} from '@/components/FormField'
import { useSpecialistsData } from '../SpecialistsDataContext'
import type { Specialist, SpecialistSpecialty, SpecialistWorkspaceRole } from '../data/types'
import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { pickL } from '@/i18n/core'
import {
  inviteOrgMember,
  updateMemberRole,
  updateMemberScope,
} from '@/features/app/workspaceMode/api'
import {
  MODULE_LABELS,
  SCOPABLE_MODULES,
} from '@/features/app/workspaceMode/workspaceModules'

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

/** date input value ('YYYY-MM-DD') → end-of-day UTC ISO; '' → null. */
function expiryFromInput(value: string): string | null {
  if (!value) return null
  const parsed = new Date(`${value}T23:59:59.999Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

/** ISO timestamp → date input value ('YYYY-MM-DD'); null → ''. */
function expiryToInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

function emptySpecialist(): Specialist {
  return {
    id: generateId(),
    organization_id: '',
    name: '',
    specialty: 'other',
    company: null,
    email: null,
    phone: null,
    crm_contact_id: null,
    finance_party_id: null,
    workspace_access: false,
    workspace_role: 'consultant',
    granted_modules: [],
    access_expires_at: null,
    organization_member_id: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function SpecialistRow({
  specialist,
  onEdit,
  onRemove,
}: {
  readonly specialist: Specialist
  readonly onEdit: (specialist: Specialist) => void
  readonly onRemove: (id: string) => void
}) {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">
          {specialist.name}
        </div>
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
          <span className={statusChipClass('success')}>
            {x(M[ROLE_LABELS[specialist.workspace_role]])}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(specialist)}
          className="relative rounded-[6px] p-[4px] text-text-muted after:absolute after:inset-[-10px] after:content-[''] hover:bg-inset hover:text-text"
          aria-label={x(M.spec_edit)}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(specialist.id)}
          className="relative rounded-[6px] p-[4px] text-text-muted after:absolute after:inset-[-10px] after:content-[''] hover:bg-inset hover:text-text"
          aria-label={x(M.spec_remove)}
        >
          {x(M.spec_remove)}
        </button>
      </div>
    </div>
  )
}

export function Directory() {
  const { x, lang } = useI18n()
  const { specialists, addSpecialist, updateSpecialist, removeSpecialist } = useSpecialistsData()
  const { organizationId, isOrgAdmin } = useWorkspaceMode()
  const { showToast } = useToasts()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<Specialist | null>(null)

  const initial = editing ?? emptySpecialist()
  const [name, setName] = useState(initial.name)
  const [specialty, setSpecialty] = useState<SpecialistSpecialty>(initial.specialty)
  const [company, setCompany] = useState(initial.company ?? '')
  const [email, setEmail] = useState(initial.email ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [workspaceAccess, setWorkspaceAccess] = useState(initial.workspace_access)
  const [workspaceRole, setWorkspaceRole] = useState<SpecialistWorkspaceRole>(
    initial.workspace_role,
  )
  const [grantedModules, setGrantedModules] = useState<string[]>(initial.granted_modules)
  const [accessExpiry, setAccessExpiry] = useState(expiryToInput(initial.access_expires_at))
  const [notes, setNotes] = useState(initial.notes ?? '')

  useEffect(() => {
    const base = editing ?? emptySpecialist()
    setName(base.name)
    setSpecialty(base.specialty)
    setCompany(base.company ?? '')
    setEmail(base.email ?? '')
    setPhone(base.phone ?? '')
    setWorkspaceAccess(base.workspace_access)
    setWorkspaceRole(base.workspace_role)
    setGrantedModules(base.granted_modules)
    setAccessExpiry(expiryToInput(base.access_expires_at))
    setNotes(base.notes ?? '')
  }, [editing])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptySpecialist()
    setName(base.name)
    setSpecialty(base.specialty)
    setCompany(base.company ?? '')
    setEmail(base.email ?? '')
    setPhone(base.phone ?? '')
    setWorkspaceAccess(base.workspace_access)
    setWorkspaceRole(base.workspace_role)
    setGrantedModules(base.granted_modules)
    setAccessExpiry(expiryToInput(base.access_expires_at))
    setNotes(base.notes ?? '')
  }

  /**
   * Workspace access is a real seat (migration 0244): an unlinked specialist
   * gets an org invitation carrying the consultant/viewer role and module
   * scope; a linked one gets the membership updated in place. Claiming the
   * invite back-links specialists.organization_member_id in the RPC.
   */
  const syncWorkspaceAccess = async (specialist: Specialist) => {
    if (!organizationId || !isOrgAdmin || !specialist.email) return
    const scope = {
      grantedModules: specialist.granted_modules,
      accessExpiresAt: specialist.access_expires_at,
    }
    if (specialist.organization_member_id) {
      const [roleOk, scopeOk] = await Promise.all([
        updateMemberRole(specialist.organization_member_id, specialist.workspace_role),
        updateMemberScope(specialist.organization_member_id, scope),
      ])
      if (!roleOk || !scopeOk) showToast(M.spec_invite_error, 'info')
      return
    }
    const result = await inviteOrgMember(
      organizationId,
      specialist.email,
      specialist.workspace_role,
      scope,
    )
    showToast('error' in result ? M.spec_invite_error : M.spec_invite_sent, 'error' in result ? 'info' : 'ok')
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const specialist: Specialist = {
      ...(editing ?? emptySpecialist()),
      name,
      specialty,
      company: company || null,
      email: email || null,
      phone: phone || null,
      workspace_access: workspaceAccess,
      workspace_role: workspaceAccess ? workspaceRole : 'consultant',
      granted_modules: workspaceAccess ? grantedModules : [],
      access_expires_at: workspaceAccess ? expiryFromInput(accessExpiry) : null,
      notes: notes || null,
      updated_at: now,
    }
    if (editing) {
      await updateSpecialist(specialist)
    } else {
      await addSpecialist({ ...specialist, created_at: now })
    }
    if (specialist.workspace_access) {
      await syncWorkspaceAccess(specialist)
    }
    reset()
  }

  const openCreate = () => {
    setEditing(null)
    setShow(true)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => (show ? reset() : openCreate())}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show && !editing ? M.spec_cancel : M.spec_add)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.spec_name)}>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label={x(M.spec_specialty)}>
            <FormSelect
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value as SpecialistSpecialty)}
            >
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
            <>
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
              <div className="sm:col-span-2">
                <span className="mb-[6px] block text-[12px] font-semibold text-text-muted">
                  {x(M.spec_granted_modules)}
                </span>
                <div className="grid grid-cols-2 gap-[6px] sm:grid-cols-3">
                  {SCOPABLE_MODULES.map((key) => (
                    <label key={key} className="flex items-center gap-[5px] text-[12px] text-text">
                      <input
                        type="checkbox"
                        checked={grantedModules.includes(key)}
                        onChange={() =>
                          setGrantedModules((prev) =>
                            prev.includes(key)
                              ? prev.filter((k) => k !== key)
                              : [...prev, key],
                          )
                        }
                      />
                      {pickL(MODULE_LABELS[key], lang)}
                    </label>
                  ))}
                </div>
              </div>
              <FormField label={x(M.spec_access_expires)}>
                <FormInput
                  type="date"
                  value={accessExpiry}
                  onChange={(e) => setAccessExpiry(e.target.value)}
                />
              </FormField>
            </>
          ) : null}
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.spec_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(editing ? M.spec_save_changes : M.spec_save)}
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
            <SpecialistRow
              key={specialist.id}
              specialist={specialist}
              onEdit={(s) => {
                setEditing(s)
                setShow(true)
              }}
              onRemove={removeSpecialist}
            />
          ))}
        </div>
      )}
    </div>
  )
}
