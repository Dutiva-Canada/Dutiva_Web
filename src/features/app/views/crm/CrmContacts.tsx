import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { crmMessages as M } from '@/i18n/messages/crm'
import type { UseCrmDataReturn } from './useCrmData'
import type { CrmContactStatus } from './types'
import { CRM_CONTACT_STATUSES, fromBi, toBi } from './crmUtils'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

export function CrmContacts({ crm }: { readonly crm: UseCrmDataReturn }) {
  const { x, lang } = useI18n()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<CrmContactStatus>(CRM_CONTACT_STATUSES[0])
  const [notes, setNotes] = useState('')

  const reset = () => {
    setName('')
    setEmail('')
    setPhone('')
    setCompanyId('')
    setRole('')
    setStatus(CRM_CONTACT_STATUSES[0])
    setNotes('')
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    crm.addContact({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      companyId: companyId || undefined,
      role: role.trim() || undefined,
      status,
      notes: toBi(notes, lang),
    })
    reset()
    setShowForm(false)
  }

  return (
    <div className="grid gap-[16px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-text">{x(M.crm_tab_contacts)}</h2>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
        >
          <Plus size={16} />
          {x(M.crm_add_contact)}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mb-[8px] rounded-[10px] border border-border bg-inset p-[14px]"
        >
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.crm_name)}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_email)}</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_phone)}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_company)}</label>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputClass}>
                <option value="">{x(M.crm_no_company)}</option>
                {crm.state.companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_role)}</label>
              <input value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_status)}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof CRM_CONTACT_STATUSES[number])} className={inputClass}>
                {CRM_CONTACT_STATUSES.map((s) => (
                  <option key={s} value={s}>{x(M[`crm_status_${s}` as keyof typeof M])}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.crm_notes)}</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="mt-[14px] flex gap-[8px]">
            <button type="submit" className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white">
              {x(M.crm_save)}
            </button>
            <button
              type="button"
              onClick={() => { reset(); setShowForm(false) }}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-semibold text-text"
            >
              {x(M.crm_cancel)}
            </button>
          </div>
        </form>
      )}

      <ul className="grid gap-[10px]">
        {crm.state.contacts.map((contact) => (
          <li
            key={contact.id}
            className="rounded-[10px] border border-border bg-surface p-[14px]"
          >
            <div className="flex flex-wrap items-start justify-between gap-[8px]">
              <div>
                <div className="text-[14px] font-semibold text-text">{contact.name}</div>
                <div className="text-[12px] text-text-2">
                  {contact.email} {contact.phone && `· ${contact.phone}`}
                </div>
                <div className="mt-[2px] text-[12px] text-text-3">
                  {contact.role} {contact.companyId && `· ${crm.companyName(contact.companyId)}`}
                </div>
              </div>
              <div className="flex items-center gap-[8px]">
                <span className="rounded-[6px] bg-inset px-[8px] py-[3px] text-[11px] font-semibold text-text-2">
                  {x(M[`crm_status_${contact.status}` as keyof typeof M])}
                </span>
                <button
                  type="button"
                  onClick={() => crm.removeContact(contact.id)}
                  className="rounded-[6px] p-[4px] text-text-3 hover:text-risk"
                  aria-label={x(M.crm_remove)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {contact.notes && (
              <p className="mt-[8px] text-[12px] text-text-2">{fromBi(contact.notes, lang)}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
