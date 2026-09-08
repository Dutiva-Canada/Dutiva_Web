import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { crmMessages as M } from '@/i18n/messages/crm'
import type { UseCrmDataReturn } from './useCrmData'
import { fromBi, toBi } from './crmUtils'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

export function CrmCompanies({ crm }: { readonly crm: UseCrmDataReturn }) {
  const { x, lang } = useI18n()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [industry, setIndustry] = useState('')
  const [size, setSize] = useState('')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setName('')
    setDomain('')
    setIndustry('')
    setSize('')
    setNotes('')
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    crm.addCompany({
      name: name.trim(),
      domain: domain.trim() || undefined,
      industry: industry.trim() || undefined,
      size: size.trim() || undefined,
      notes: toBi(notes, lang),
    })
    reset()
    setShowForm(false)
  }

  return (
    <div className="grid gap-[16px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-text">{x(M.crm_tab_companies)}</h2>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
        >
          <Plus size={16} />
          {x(M.crm_add_company)}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-[8px] rounded-[10px] border border-border bg-inset p-[14px]">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.crm_name)}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_domain)}</label>
              <input value={domain} onChange={(e) => setDomain(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.crm_industry)}</label>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.crm_size)}</label>
              <input value={size} onChange={(e) => setSize(e.target.value)} className={inputClass} />
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
        {crm.state.companies.map((company) => (
          <li key={company.id} className="rounded-[10px] border border-border bg-surface p-[14px]">
            <div className="flex flex-wrap items-start justify-between gap-[8px]">
              <div>
                <div className="text-[14px] font-semibold text-text">{company.name}</div>
                <div className="text-[12px] text-text-2">
                  {company.domain} {company.industry && `· ${company.industry}`} {company.size && `· ${company.size}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => crm.removeCompany(company.id)}
                className="rounded-[6px] p-[4px] text-text-3 hover:text-risk"
                aria-label={x(M.crm_remove)}
              >
                <X size={16} />
              </button>
            </div>
            {company.notes && (
              <p className="mt-[8px] text-[12px] text-text-2">{fromBi(company.notes, lang)}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
