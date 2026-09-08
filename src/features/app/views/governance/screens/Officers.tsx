import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { governanceMessages as M } from '@/i18n/messages/governance'
import { FormField, FormInput, FormSelect, FormCheckbox } from '@/components/FormField'
import { useGovernanceData } from '../GovernanceDataContext'
import type { GovernanceOfficer, GovernanceOfficerRole } from '../data/types'

const ROLES: GovernanceOfficerRole[] = ['director', 'officer_president', 'officer_secretary', 'officer_treasurer']

const ROLE_LABELS: Record<GovernanceOfficerRole, keyof typeof M> = {
  director: 'gov_officer_role_director',
  officer_president: 'gov_officer_role_president',
  officer_secretary: 'gov_officer_role_secretary',
  officer_treasurer: 'gov_officer_role_treasurer',
}

function generateId() {
  return `go-${Math.random().toString(36).slice(2, 9)}`
}

function emptyOfficer(): GovernanceOfficer {
  return {
    id: generateId(),
    organization_id: '',
    name: '',
    role: 'director',
    appointed_date: null,
    resigned_date: null,
    contact_email: null,
    is_active: true,
    viewer_visible: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function OfficerRow({
  officer,
  onEdit,
}: {
  readonly officer: GovernanceOfficer
  readonly onEdit: (officer: GovernanceOfficer) => void
}) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{officer.name}</div>
        <div className="text-[12px] text-text-muted">
          {x(M[ROLE_LABELS[officer.role]])}
          {officer.appointed_date ? ` · ${officer.appointed_date}` : null}
          {officer.contact_email ? ` · ${officer.contact_email}` : null}
          {!officer.is_active ? ' · inactive' : null}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        <span
          className={
            officer.is_active
              ? 'inline-flex items-center rounded-full border border-ok-border bg-ok-bg px-[10px] py-[3px] text-[11.5px] font-semibold text-ok-fg'
              : 'inline-flex items-center rounded-full border border-border bg-inset px-[10px] py-[3px] text-[11.5px] font-semibold text-text-muted'
          }
        >
          {officer.is_active ? x(M.gov_officer_active) : x(M.gov_officer_inactive)}
        </span>
        <button
          type="button"
          onClick={() => onEdit(officer)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.gov_edit)}
        </button>
      </div>
    </div>
  )
}

export function Officers() {
  const { x } = useI18n()
  const { officers, addOfficer, updateOfficer } = useGovernanceData()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<GovernanceOfficer | null>(null)

  const initial = editing ?? emptyOfficer()
  const [name, setName] = useState(initial.name)
  const [role, setRole] = useState<GovernanceOfficerRole>(initial.role)
  const [appointedDate, setAppointedDate] = useState(initial.appointed_date ?? '')
  const [resignedDate, setResignedDate] = useState(initial.resigned_date ?? '')
  const [contactEmail, setContactEmail] = useState(initial.contact_email ?? '')
  const [isActive, setIsActive] = useState(initial.is_active)
  const [viewerVisible, setViewerVisible] = useState(initial.viewer_visible)

  useEffect(() => {
    const base = editing ?? emptyOfficer()
    setName(base.name)
    setRole(base.role)
    setAppointedDate(base.appointed_date ?? '')
    setResignedDate(base.resigned_date ?? '')
    setContactEmail(base.contact_email ?? '')
    setIsActive(base.is_active)
    setViewerVisible(base.viewer_visible)
  }, [editing])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptyOfficer()
    setName(base.name)
    setRole(base.role)
    setAppointedDate(base.appointed_date ?? '')
    setResignedDate(base.resigned_date ?? '')
    setContactEmail(base.contact_email ?? '')
    setIsActive(base.is_active)
    setViewerVisible(base.viewer_visible)
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const officer: GovernanceOfficer = {
      ...(editing ?? emptyOfficer()),
      name,
      role,
      appointed_date: appointedDate || null,
      resigned_date: resignedDate || null,
      contact_email: contactEmail || null,
      is_active: isActive,
      viewer_visible: viewerVisible,
      updated_at: now,
    }
    if (editing) {
      await updateOfficer(officer)
    } else {
      await addOfficer({ ...officer, created_at: now })
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
          {x(show && !editing ? M.gov_cancel : M.gov_add_officer)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.gov_name)}>
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label={x(M.gov_role)}>
            <FormSelect value={role} onChange={(e) => setRole(e.target.value as GovernanceOfficerRole)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {x(M[ROLE_LABELS[r]])}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.gov_appointed_date)}>
            <FormInput type="date" value={appointedDate} onChange={(e) => setAppointedDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.gov_resigned_date)}>
            <FormInput type="date" value={resignedDate} onChange={(e) => setResignedDate(e.target.value)} />
          </FormField>
          <FormField label={x(M.gov_contact_email)}>
            <FormInput type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </FormField>
          <FormField label={x(M.gov_viewer_visible)}>
            <FormCheckbox label={x(M.gov_viewer_visible)} checked={viewerVisible} onChange={setViewerVisible} />
          </FormField>
          <div className="sm:col-span-2">
            <FormCheckbox label={x(M.gov_officer_active)} checked={isActive} onChange={setIsActive} />
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.gov_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(editing ? M.gov_save_changes : M.gov_save)}
            </button>
          </div>
        </div>
      ) : null}

      {officers.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.gov_empty_body)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {officers.map((officer) => (
            <OfficerRow key={officer.id} officer={officer} onEdit={(o) => { setEditing(o); setShow(true) }} />
          ))}
        </div>
      )}
    </div>
  )
}
