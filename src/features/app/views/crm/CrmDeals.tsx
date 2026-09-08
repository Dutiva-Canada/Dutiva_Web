import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { crmMessages as M } from '@/i18n/messages/crm'
import type { UseCrmDataReturn } from './useCrmData'
import type { CrmDealStage } from './types'
import { CRM_DEAL_STAGES, fromBi, toBi } from './crmUtils'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

export function CrmDeals({ crm }: { readonly crm: UseCrmDataReturn }) {
  const { x, lang } = useI18n()
  const [showForm, setShowForm] = useState(false)
  const [stageFilter, setStageFilter] = useState<string>('')
  const [title, setTitle] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [contactId, setContactId] = useState('')
  const [stage, setStage] = useState<CrmDealStage>(CRM_DEAL_STAGES[0])
  const [value, setValue] = useState('')
  const [currency, setCurrency] = useState('CAD')
  const [closeDate, setCloseDate] = useState('')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setTitle('')
    setCompanyId('')
    setContactId('')
    setStage(CRM_DEAL_STAGES[0])
    setValue('')
    setCurrency('CAD')
    setCloseDate('')
    setNotes('')
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim()) return
    crm.addDeal({
      title: title.trim(),
      companyId: companyId || undefined,
      contactId: contactId || undefined,
      stage,
      value: Number(value) || 0,
      currency,
      closeDate: closeDate || undefined,
      notes: toBi(notes, lang),
    })
    reset()
    setShowForm(false)
  }

  const filtered = stageFilter
    ? crm.state.deals.filter((d) => d.stage === stageFilter)
    : crm.state.deals

  const contactsForCompany = companyId
    ? crm.state.contacts.filter((c) => c.companyId === companyId)
    : crm.state.contacts

  return (
    <div className="grid gap-[16px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <h2 className="text-[16px] font-semibold text-text">{x(M.crm_tab_deals)}</h2>
        <div className="flex items-center gap-[8px]">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className={`${inputClass} w-auto`}
          >
            <option value="">{x(M.crm_stage)}</option>
            {CRM_DEAL_STAGES.map((s) => (
              <option key={s} value={s}>{x(M[`crm_stage_${s}` as keyof typeof M])}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
          >
            <Plus size={16} />
            {x(M.crm_add_deal)}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-[8px] rounded-[10px] border border-border bg-inset p-[14px]">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.crm_title_deal)}</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_company)}</label>
              <select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setContactId('') }} className={inputClass}>
                <option value="">{x(M.crm_no_company)}</option>
                {crm.state.companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_contact)}</label>
              <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={inputClass}>
                <option value="">{x(M.crm_no_contact)}</option>
                {contactsForCompany.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_stage)}</label>
              <select value={stage} onChange={(e) => setStage(e.target.value as typeof CRM_DEAL_STAGES[number])} className={inputClass}>
                {CRM_DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>{x(M[`crm_stage_${s}` as keyof typeof M])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_value)}</label>
              <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_currency)}</label>
              <input value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_close_date)}</label>
              <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} className={inputClass} />
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
        {filtered.map((deal) => (
          <li key={deal.id} className="rounded-[10px] border border-border bg-surface p-[14px]">
            <div className="flex flex-wrap items-start justify-between gap-[8px]">
              <div>
                <div className="text-[14px] font-semibold text-text">{deal.title}</div>
                <div className="text-[12px] text-text-2">
                  {crm.companyName(deal.companyId)} · {crm.contactName(deal.contactId)}
                </div>
                <div className="mt-[2px] text-[12px] text-text-3">
                  {deal.closeDate && `${x(M.crm_close_date)} ${deal.closeDate}`}
                </div>
              </div>
              <div className="flex items-center gap-[8px]">
                <span className="text-[13px] font-semibold text-text">${(deal.value ?? 0).toLocaleString()}</span>
                <span className="rounded-[6px] bg-inset px-[8px] py-[3px] text-[11px] font-semibold text-text-2">
                  {x(M[`crm_stage_${deal.stage}` as keyof typeof M])}
                </span>
                <button
                  type="button"
                  onClick={() => crm.removeDeal(deal.id)}
                  className="rounded-[6px] p-[4px] text-text-3 hover:text-risk"
                  aria-label={x(M.crm_remove)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {deal.notes && (
              <p className="mt-[8px] text-[12px] text-text-2">{fromBi(deal.notes, lang)}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
