import { useEffect, useMemo, useState } from 'react'
import { Bookmark, Plus, Search, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { crmMessages as M } from '@/i18n/messages/crm'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import type { UseCrmDataReturn } from './useCrmData'
import type { CrmContactStatus } from './types'
import { CRM_CONTACT_STATUSES, fromBi, toBi } from './crmUtils'
import {
  NO_COMPANY,
  applyContactFilter,
  contactViewsScope,
  createViewId,
  emptyContactFilter,
  isContactFilterActive,
  loadContactViews,
  persistContactViews,
} from './directoryFilters'
import type { CrmContactFilter, CrmSavedView } from './directoryFilters'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

export function CrmContacts({ crm }: { readonly crm: UseCrmDataReturn }) {
  const { x, lang } = useI18n()
  const { mode, organizationId } = useWorkspaceMode()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<CrmContactStatus>(CRM_CONTACT_STATUSES[0])
  const [notes, setNotes] = useState('')

  const scope = contactViewsScope(mode, organizationId)
  const [filter, setFilter] = useState<CrmContactFilter>(emptyContactFilter)
  const [views, setViews] = useState<CrmSavedView[]>(() => loadContactViews(scope))
  const [activeViewId, setActiveViewId] = useState('')
  const [namingView, setNamingView] = useState(false)
  const [viewName, setViewName] = useState('')

  /* The workspace can be switched between demo and a production org while this
     tab stays mounted — reload that scope's saved views when it happens. */
  useEffect(() => {
    setViews(loadContactViews(scope))
    setActiveViewId('')
    setFilter(emptyContactFilter())
  }, [scope])

  const filtered = useMemo(
    () => applyContactFilter(crm.state.contacts, filter, crm.companyName),
    [crm.state.contacts, crm.companyName, filter],
  )
  const filterActive = isContactFilterActive(filter)

  const toggleStatus = (s: CrmContactStatus) =>
    setFilter((f) => ({
      ...f,
      statuses: f.statuses.includes(s) ? f.statuses.filter((v) => v !== s) : [...f.statuses, s],
    }))

  const applyView = (id: string) => {
    setActiveViewId(id)
    const view = views.find((v) => v.id === id)
    setFilter(view ? { ...view.filter, statuses: [...view.filter.statuses] } : emptyContactFilter())
  }

  const saveView = () => {
    const trimmed = viewName.trim()
    if (!trimmed) return
    const next = [...views, { id: createViewId(), name: trimmed, filter }]
    setViews(next)
    persistContactViews(scope, next)
    setNamingView(false)
    setViewName('')
    setActiveViewId(next[next.length - 1]!.id)
  }

  const deleteView = () => {
    if (!activeViewId) return
    const next = views.filter((v) => v.id !== activeViewId)
    setViews(next)
    persistContactViews(scope, next)
    setActiveViewId('')
  }

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

  const resultsLabel = x(M.crm_filter_results)
    .replace('{shown}', String(filtered.length))
    .replace('{total}', String(crm.state.contacts.length))

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

      {/* Directory filters + saved views */}
      <div className="grid gap-[10px] rounded-[10px] border border-border bg-surface p-[12px]">
        <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={14}
              className="absolute top-1/2 left-[10px] -translate-y-1/2 text-text-3"
              aria-hidden="true"
            />
            <input
              value={filter.query}
              onChange={(e) => {
                setActiveViewId('')
                setFilter((f) => ({ ...f, query: e.target.value }))
              }}
              placeholder={x(M.crm_search_contacts)}
              aria-label={x(M.crm_search_contacts)}
              className={`${inputClass} pl-[30px]`}
            />
          </div>
          <select
            value={filter.companyId ?? ''}
            onChange={(e) => {
              setActiveViewId('')
              setFilter((f) => ({ ...f, companyId: e.target.value || undefined }))
            }}
            aria-label={x(M.crm_company)}
            className={inputClass}
          >
            <option value="">{x(M.crm_filter_all_companies)}</option>
            <option value={NO_COMPANY}>{x(M.crm_filter_unassigned)}</option>
            {crm.state.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-[6px]">
          {CRM_CONTACT_STATUSES.map((s) => {
            const on = filter.statuses.includes(s)
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setActiveViewId('')
                  toggleStatus(s)
                }}
                className={`rounded-[100px] px-[11px] py-[4px] text-[12px] font-semibold transition-colors ${
                  on
                    ? 'bg-navy text-white'
                    : 'border border-border bg-surface text-text-2 hover:bg-inset'
                }`}
              >
                {x(M[`crm_status_${s}` as keyof typeof M])}
              </button>
            )
          })}
          {filterActive && (
            <>
              <span className="ml-[4px] text-[11.5px] text-text-3">{resultsLabel}</span>
              <button
                type="button"
                onClick={() => {
                  setActiveViewId('')
                  setFilter(emptyContactFilter())
                }}
                className="text-[12px] font-semibold text-accent hover:underline"
              >
                {x(M.crm_filter_clear)}
              </button>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-[8px] border-t border-inset pt-[10px]">
          <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold text-text-3">
            <Bookmark size={12} aria-hidden="true" />
            {x(M.crm_views_label)}
          </span>
          <select
            value={activeViewId}
            onChange={(e) => applyView(e.target.value)}
            aria-label={x(M.crm_views_label)}
            className="rounded-[8px] border border-border bg-surface px-[10px] py-[6px] text-[12.5px] font-semibold text-text"
          >
            <option value="">{x(M.crm_view_all)}</option>
            {views.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          {namingView ? (
            <>
              <input
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder={x(M.crm_view_name_ph)}
                aria-label={x(M.crm_view_name_ph)}
                className="w-[160px] rounded-[8px] border border-border bg-surface px-[10px] py-[6px] text-[12.5px] text-text"
              />
              <button
                type="button"
                onClick={saveView}
                className="rounded-[8px] border-none bg-navy px-[10px] py-[6px] text-[12px] font-semibold text-white"
              >
                {x(M.crm_view_save)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNamingView(false)
                  setViewName('')
                }}
                className="text-[12px] font-semibold text-text-3 hover:text-text"
              >
                {x(M.crm_cancel)}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setNamingView(true)}
              disabled={!filterActive}
              className="rounded-[8px] border border-border bg-surface px-[10px] py-[6px] text-[12px] font-semibold text-text-2 hover:bg-inset disabled:cursor-default disabled:opacity-50"
            >
              {x(M.crm_view_save)}
            </button>
          )}
          {activeViewId && (
            <button
              type="button"
              onClick={deleteView}
              className="text-[12px] font-semibold text-text-3 hover:text-risk"
            >
              {x(M.crm_view_delete)}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mb-[8px] rounded-[10px] border border-border bg-inset p-[14px]"
        >
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.crm_name)}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_email)}</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_phone)}</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_company)}</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className={inputClass}
              >
                <option value="">{x(M.crm_no_company)}</option>
                {crm.state.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_role)}</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_status)}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof CRM_CONTACT_STATUSES)[number])}
                className={inputClass}
              >
                {CRM_CONTACT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {x(M[`crm_status_${s}` as keyof typeof M])}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.crm_notes)}</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-[14px] flex gap-[8px]">
            <button
              type="submit"
              className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
            >
              {x(M.crm_save)}
            </button>
            <button
              type="button"
              onClick={() => {
                reset()
                setShowForm(false)
              }}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-semibold text-text"
            >
              {x(M.crm_cancel)}
            </button>
          </div>
        </form>
      )}

      <ul className="grid gap-[10px]">
        {filtered.map((contact) => (
          <li key={contact.id} className="rounded-[10px] border border-border bg-surface p-[14px]">
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
      {filterActive && filtered.length === 0 && (
        <p className="text-[13px] text-text-3">{x(M.crm_filter_no_results)}</p>
      )}
    </div>
  )
}
