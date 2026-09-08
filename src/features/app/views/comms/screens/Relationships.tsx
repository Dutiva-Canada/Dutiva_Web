import { useState } from 'react'
import { FileUp, Plus, X } from 'lucide-react'
import type { Bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { BulkImportWizard } from '@/features/app/bulkImport/BulkImportWizard'
import { useStakeholders } from '../data/useStakeholders'
import type { CommsContact, CommsContactType, CommsOrganization } from '../data/types'
import { CONTACT_TYPE_LABEL } from '../commsLabels'
import { createContactBulkImportAdapter } from '../bulkImport/contactAdapter'
import { createOrganizationBulkImportAdapter } from '../bulkImport/organizationAdapter'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'
const checkboxClass =
  'h-[18px] w-[18px] rounded-[4px] border border-border bg-surface text-accent accent-accent'

const CONTACT_TYPES: CommsContactType[] = ['media', 'institutional', 'partner', 'creator', 'audience']

function biInput(value: string, lang: 'en' | 'fr'): Bi | undefined {
  const text = value.trim()
  if (!text) return undefined
  return lang === 'fr'
    ? { en: `[EN review] ${text}`, fr: text }
    : { en: text, fr: `[FR review] ${text}` }
}

function ContactForm({
  onCancel,
  organizations,
  onAdd,
}: {
  onCancel: () => void
  organizations: CommsOrganization[]
  onAdd: (item: Omit<CommsContact, 'id'>) => void
}) {
  const { x, lang } = useI18n()
  const [name, setName] = useState('')
  const [type, setType] = useState<CommsContactType>('media')
  const [organizationId, setOrganizationId] = useState('')
  const [role, setRole] = useState('')
  const [purpose, setPurpose] = useState('')
  const [channel, setChannel] = useState('')
  const [source, setSource] = useState('')
  const [active, setActive] = useState(true)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      type,
      organizationId: organizationId || undefined,
      role: biInput(role, lang),
      purpose: biInput(purpose, lang),
      channelPreference: biInput(channel, lang),
      source: biInput(source, lang),
      active,
    })
    onCancel()
  }

  return (
    <form onSubmit={onSubmit} className="mb-[16px] rounded-[10px] border border-border bg-inset p-[14px]">
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>{x(M.comms_contact_name)}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_contact_type)}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CommsContactType)}
            className={inputClass}
          >
            {CONTACT_TYPES.map((t) => (
              <option key={t} value={t}>{x(CONTACT_TYPE_LABEL[t])}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_contact_organization)}</label>
          <select
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className={inputClass}
          >
            <option value="">{x(M.comms_org_none)}</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_contact_role)}</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_contact_purpose)}</label>
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_contact_preference)}</label>
          <input value={channel} onChange={(e) => setChannel(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_contact_source)}</label>
          <input value={source} onChange={(e) => setSource(e.target.value)} className={inputClass} />
        </div>
        <div className="flex items-center gap-[8px]">
          <input
            id="contact-active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className={checkboxClass}
          />
          <label htmlFor="contact-active" className="text-[12px] font-semibold text-text-3">
            {x(M.comms_contact_active)}
          </label>
        </div>
      </div>
      <div className="mt-[14px] flex gap-[8px]">
        <button
          type="submit"
          className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
        >
          {x(M.comms_create)}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
        >
          {x(M.comms_cancel)}
        </button>
      </div>
    </form>
  )
}

function OrganizationForm({
  onCancel,
  onAdd,
}: {
  onCancel: () => void
  onAdd: (item: Omit<CommsOrganization, 'id'>) => void
}) {
  const { x, lang } = useI18n()
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [notes, setNotes] = useState('')

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      type: biInput(type, lang) ?? { en: 'Other', fr: 'Autre' },
      jurisdiction: biInput(jurisdiction, lang),
      notes: biInput(notes, lang),
    })
    onCancel()
  }

  return (
    <form onSubmit={onSubmit} className="mb-[16px] rounded-[10px] border border-border bg-inset p-[14px]">
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>{x(M.comms_org_name)}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_org_type)}</label>
          <input value={type} onChange={(e) => setType(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_org_jurisdiction)}</label>
          <input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>{x(M.comms_org_notes)}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>
      <div className="mt-[14px] flex gap-[8px]">
        <button
          type="submit"
          className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
        >
          {x(M.comms_create)}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
        >
          {x(M.comms_cancel)}
        </button>
      </div>
    </form>
  )
}

export function Relationships() {
  const { x, lang } = useI18n()
  const {
    contacts,
    organizations,
    canWrite,
    addContact,
    addOrganization,
    removeContact,
    removeOrganization,
  } = useStakeholders()
  const [addingContact, setAddingContact] = useState(false)
  const [addingOrg, setAddingOrg] = useState(false)
  const [bulkImport, setBulkImport] = useState<'contact' | 'organization' | null>(null)

  return (
    <div className="flex flex-col gap-[16px]">
      <h2 className="text-[18px] font-semibold text-text">{x(M.comms_relationships_title)}</h2>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between gap-[12px]">
          <h3 className="text-[15px] font-semibold text-text">{x(M.comms_contacts)}</h3>
          {canWrite && !addingContact && (
            <div className="flex items-center gap-[8px]">
              <button
                type="button"
                onClick={() => setAddingContact(true)}
                className="flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
              >
                <Plus size={14} aria-hidden="true" />
                {x(M.comms_add)}
              </button>
              <button
                type="button"
                onClick={() => setBulkImport('contact')}
                className="flex items-center gap-[6px] rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-text"
              >
                <FileUp size={14} aria-hidden="true" />
                {x(M.comms_import)}
              </button>
            </div>
          )}
        </div>

        {addingContact && (
          <ContactForm
            onCancel={() => setAddingContact(false)}
            organizations={organizations}
            onAdd={addContact}
          />
        )}

        {contacts.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_relationships_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {contacts.map((contact) => (
              <li key={contact.id} className="rounded-[8px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="flex items-center gap-[8px]">
                    <span className="text-[14px] font-semibold text-text">{contact.name}</span>
                    <span className="rounded-[100px] bg-accent-soft px-[8px] py-[2px] text-[11px] font-semibold text-accent">
                      {x(CONTACT_TYPE_LABEL[contact.type])}
                    </span>
                    {!contact.active && (
                      <span className="rounded-[100px] bg-surface px-[8px] py-[2px] text-[11px] font-semibold text-text-muted">
                        {x(M.comms_content_status_withdrawn)}
                      </span>
                    )}
                  </div>
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => removeContact(contact.id)}
                      aria-label={x(M.comms_remove)}
                      className="text-text-muted hover:text-risk-fg"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {contact.role && <div className="mt-[4px] text-[12px] text-text-muted">{x(contact.role)}</div>}
                {contact.organizationId && (
                  <div className="text-[12px] text-text-muted">
                    {organizations.find((o) => o.id === contact.organizationId)?.name}
                  </div>
                )}
                {contact.purpose && (
                  <div className="mt-[6px] text-[12px] text-text-2">
                    <span className="font-semibold">{x(M.comms_contact_purpose)}:</span> {x(contact.purpose)}
                  </div>
                )}
                {contact.channelPreference && (
                  <div className="text-[12px] text-text-2">
                    <span className="font-semibold">{x(M.comms_contact_preference)}:</span> {x(contact.channelPreference)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between gap-[12px]">
          <h3 className="text-[15px] font-semibold text-text">{x(M.comms_organizations)}</h3>
          {canWrite && !addingOrg && (
            <div className="flex items-center gap-[8px]">
              <button
                type="button"
                onClick={() => setAddingOrg(true)}
                className="flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
              >
                <Plus size={14} aria-hidden="true" />
                {x(M.comms_add)}
              </button>
              <button
                type="button"
                onClick={() => setBulkImport('organization')}
                className="flex items-center gap-[6px] rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-text"
              >
                <FileUp size={14} aria-hidden="true" />
                {x(M.comms_import)}
              </button>
            </div>
          )}
        </div>

        {addingOrg && <OrganizationForm onCancel={() => setAddingOrg(false)} onAdd={addOrganization} />}

        {organizations.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_relationships_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {organizations.map((org) => (
              <li key={org.id} className="rounded-[8px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="text-[14px] font-semibold text-text">{org.name}</div>
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => removeOrganization(org.id)}
                      aria-label={x(M.comms_remove)}
                      className="text-text-muted hover:text-risk-fg"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="text-[12px] text-text-muted">
                  {x(org.type)}
                  {org.jurisdiction ? ` · ${x(org.jurisdiction)}` : ''}
                </div>
                {org.notes && (
                  <div className="mt-[6px] text-[12px] text-text-2">{x(org.notes)}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {bulkImport === 'contact' && (
        <BulkImportWizard
          adapter={createContactBulkImportAdapter(addContact, organizations, lang)}
          onClose={() => setBulkImport(null)}
        />
      )}
      {bulkImport === 'organization' && (
        <BulkImportWizard
          adapter={createOrganizationBulkImportAdapter(addOrganization, lang)}
          onClose={() => setBulkImport(null)}
        />
      )}
    </div>
  )
}
