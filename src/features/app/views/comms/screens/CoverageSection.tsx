import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useCoverage } from '../data/useCoverage'
import { useInitiatives } from '../data/useInitiatives'
import type { CommsCoverageItem, CommsCoverageSentiment } from '../data/types'
import { SENTIMENT_LABEL } from '../commsLabels'

const SENTIMENTS: CommsCoverageSentiment[] = ['positive', 'neutral', 'negative', 'mixed']

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

function sentimentTone(sentiment: CommsCoverageSentiment | undefined) {
  switch (sentiment) {
    case 'positive':
      return 'success'
    case 'negative':
      return 'risk'
    case 'mixed':
      return 'warning'
    case 'neutral':
    default:
      return 'neutral'
  }
}

export function CoverageSection() {
  const { x, lang } = useI18n()
  const { initiatives } = useInitiatives()
  const { coverageItems, canWrite, addCoverageItem, removeCoverageItem } = useCoverage()
  const [open, setOpen] = useState(false)
  const [outlet, setOutlet] = useState('')
  const [headline, setHeadline] = useState('')
  const [language, setLanguage] = useState<'en' | 'fr' | 'bilingual'>('en')
  const [publishedDate, setPublishedDate] = useState('')
  const [url, setUrl] = useState('')
  const [reach, setReach] = useState('')
  const [sentiment, setSentiment] = useState<CommsCoverageSentiment>('neutral')
  const [provenance, setProvenance] = useState<CommsCoverageItem['provenance']>('manual')
  const [notes, setNotes] = useState('')
  const [initiativeId, setInitiativeId] = useState('')

  useEffect(() => {
    setInitiativeId(initiatives[0]?.id ?? '')
  }, [initiatives])

  const reset = () => {
    setOpen(false)
    setOutlet('')
    setHeadline('')
    setLanguage('en')
    setPublishedDate('')
    setUrl('')
    setReach('')
    setSentiment('neutral')
    setProvenance('manual')
    setNotes('')
    setInitiativeId(initiatives[0]?.id ?? '')
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!outlet.trim() || !headline.trim()) return
    await addCoverageItem({
      initiativeId: initiativeId || undefined,
      outlet: { en: outlet, fr: `[FR] ${outlet}` },
      headline: { en: headline, fr: `[FR] ${headline}` },
      language,
      publishedDate: publishedDate || undefined,
      url: url || undefined,
      reach: reach ? Number(reach) : undefined,
      sentiment,
      provenance,
      owner: 'Workspace user',
      notes: notes ? { en: notes, fr: `[FR] ${notes}` } : undefined,
    })
    reset()
  }

  return (
    <section className="rounded-[12px] border border-border bg-surface p-[16px]">
      <div className="mb-[12px] flex flex-wrap items-center justify-between gap-[12px]">
        <h3 className="text-[15px] font-semibold text-text">{x(M.comms_intelligence_coverage)}</h3>
        {canWrite && !open && (
          <button
            type="button"
            onClick={() => {
              reset()
              setOpen(true)
            }}
            className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
          >
            <Plus size={14} aria-hidden="true" />
            {x(M.comms_intelligence_add_coverage)}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mb-[12px] rounded-[10px] border border-border bg-inset p-[12px]">
          <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_intelligence_headline)}</label>
              <input required value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_intelligence_outlet)}</label>
              <input required value={outlet} onChange={(e) => setOutlet(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_initiatives_name)}</label>
              <select value={initiativeId} onChange={(e) => setInitiativeId(e.target.value)} className={inputClass}>
                <option value="">{x(M.comms_none)}</option>
                {initiatives.map((i) => (
                  <option key={i.id} value={i.id}>{x(i.title)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_content_language)}</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value as typeof language)} className={inputClass}>
                <option value="en">{x(M.comms_language_en)}</option>
                <option value="fr">{x(M.comms_language_fr)}</option>
                <option value="bilingual">{x(M.comms_language_bilingual)}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_content_due)}</label>
              <input type="date" value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_intelligence_sentiment)}</label>
              <select value={sentiment} onChange={(e) => setSentiment(e.target.value as CommsCoverageSentiment)} className={inputClass}>
                {SENTIMENTS.map((s) => (
                  <option key={s} value={s}>{x(SENTIMENT_LABEL[s])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_intelligence_reach)}</label>
              <input type="number" min={0} value={reach} onChange={(e) => setReach(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_results_provenance)}</label>
              <select value={provenance} onChange={(e) => setProvenance(e.target.value as CommsCoverageItem['provenance'])} className={inputClass}>
                <option value="manual">{x(M.comms_results_provenance_manual)}</option>
                <option value="provider">{x(M.comms_results_provenance_provider)}</option>
                <option value="ai_estimate">{x(M.comms_results_provenance_ai_estimate)}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>URL</label>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_notes)}</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="mt-[12px] flex gap-[8px]">
            <button type="submit" className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white">
              {x(M.comms_create)}
            </button>
            <button type="button" onClick={reset} className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text">
              {x(M.comms_cancel)}
            </button>
          </div>
        </form>
      )}

      {coverageItems.length === 0 ? (
        <p className="text-[13px] text-text-muted">{x(M.comms_intelligence_coverage_empty)}</p>
      ) : (
        <ul className="m-0 flex flex-col gap-[10px] p-0">
          {coverageItems.map((item) => {
            const initiative = initiatives.find((i) => i.id === item.initiativeId)
            const tone = sentimentTone(item.sentiment)
            return (
              <li key={item.id} className="rounded-[8px] bg-inset p-[12px]">
                <div className="flex flex-wrap items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[14px] font-semibold text-text">{x(item.headline)}</div>
                    <div className="text-[12px] text-text-muted">
                      {x(item.outlet)} · {x(M[`comms_language_${item.language}` as keyof typeof M])}
                      {initiative ? ` · ${x(initiative.title)}` : ''}
                      {item.publishedDate ? ` · ${item.publishedDate}` : ''}
                    </div>
                  </div>
                  {item.sentiment && (
                    <span className={`rounded-[100px] px-[10px] py-[3px] text-[12px] font-semibold whitespace-nowrap ${tone === 'success' ? 'bg-ok-bg text-ok-fg' : tone === 'risk' ? 'bg-risk-bg text-risk-fg' : tone === 'warning' ? 'bg-warn-bg text-warn-fg' : 'bg-inset text-text-muted'}`}>
                      {x(SENTIMENT_LABEL[item.sentiment])}
                    </span>
                  )}
                </div>
                {typeof item.reach === 'number' && (
                  <div className="mt-[6px] text-[13px] text-text">
                    {x(M.comms_intelligence_reach)}: {item.reach.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
                  </div>
                )}
                <div className="mt-[4px] text-[12px] text-text-muted">
                  {x(M.comms_results_provenance)}: {x(M[`comms_results_provenance_${item.provenance}` as keyof typeof M])}
                </div>
                {item.notes && <div className="mt-[4px] text-[12px] text-text-2">{x(item.notes)}</div>}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-[4px] inline-block text-[12px] text-accent hover:underline">
                    {item.url}
                  </a>
                )}
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => removeCoverageItem(item.id)}
                    className="mt-[8px] text-[12px] font-semibold text-risk-fg"
                  >
                    {x(M.comms_remove)}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-[10px] text-[11px] leading-normal text-text-faint">{x(M.comms_intelligence_reach_note)}</p>
    </section>
  )
}
