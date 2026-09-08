import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { crmMessages as M } from '@/i18n/messages/crm'
import type { UseCrmDataReturn } from './useCrmData'
import { bi } from '@/i18n/core'
import type { CrmActivityType } from './types'
import { CRM_ACTIVITY_TYPES, fromBi, toBi } from './crmUtils'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

export function CrmActivities({ crm }: { readonly crm: UseCrmDataReturn }) {
  const { x, lang } = useI18n()
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<CrmActivityType>(CRM_ACTIVITY_TYPES[0])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [contactId, setContactId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [dealId, setDealId] = useState('')
  const [summary, setSummary] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  const reset = () => {
    setType(CRM_ACTIVITY_TYPES[0])
    setDate(new Date().toISOString().slice(0, 10))
    setContactId('')
    setCompanyId('')
    setDealId('')
    setSummary('')
    setFollowUpDate('')
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!summary.trim()) return
    crm.addActivity({
      type,
      date,
      contactId: contactId || undefined,
      companyId: companyId || undefined,
      dealId: dealId || undefined,
      summary: toBi(summary, lang) ?? bi('', ''),
      followUpDate: followUpDate || undefined,
    })
    reset()
    setShowForm(false)
  }

  return (
    <div className="grid gap-[16px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-text">{x(M.crm_tab_activities)}</h2>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
        >
          <Plus size={16} />
          {x(M.crm_add_activity)}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-[8px] rounded-[10px] border border-border bg-inset p-[14px]">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div>
              <label className={labelClass}>{x(M.crm_type)}</label>
              <select value={type} onChange={(e) => setType(e.target.value as typeof CRM_ACTIVITY_TYPES[number])} className={inputClass}>
                {CRM_ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>{x(M[`crm_activity_${t}` as keyof typeof M])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_date)}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_company)}</label>
              <select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setContactId(''); setDealId('') }} className={inputClass}>
                <option value="">{x(M.crm_no_company)}</option>
                {crm.state.companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_contact)}</label>
              <select value={contactId} onChange={(e) => { setContactId(e.target.value); setDealId('') }} className={inputClass}>
                <option value="">{x(M.crm_no_contact)}</option>
                {crm.state.contacts
                  .filter((c) => !companyId || c.companyId === companyId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_tab_deals)}</label>
              <select value={dealId} onChange={(e) => setDealId(e.target.value)} className={inputClass}>
                <option value="">{x(M.crm_no_deal)}</option>
                {crm.state.deals
                  .filter((d) => !companyId || d.companyId === companyId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_follow_up)}</label>
              <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.crm_summary)}</label>
              <input value={summary} onChange={(e) => setSummary(e.target.value)} className={inputClass} />
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
        {crm.state.activities.map((activity) => (
          <li key={activity.id} className="rounded-[10px] border border-border bg-surface p-[14px]">
            <div className="flex flex-wrap items-start justify-between gap-[8px]">
              <div>
                <div className="text-[14px] font-semibold text-text">
                  {x(M[`crm_activity_${activity.type}` as keyof typeof M])} · {activity.date}
                </div>
                <div className="text-[12px] text-text-2">
                  {crm.companyName(activity.companyId)} · {crm.contactName(activity.contactId)} · {crm.dealTitle(activity.dealId)}
                </div>
              </div>
              <div className="flex items-center gap-[8px]">
                {activity.followUpDate && (
                  <span className="text-[12px] text-text-3">
                    {x(M.crm_follow_up)} {activity.followUpDate}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => crm.removeActivity(activity.id)}
                  className="rounded-[6px] p-[4px] text-text-3 hover:text-risk"
                  aria-label={x(M.crm_remove)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <p className="mt-[8px] text-[13px] text-text-2">{fromBi(activity.summary, lang)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
