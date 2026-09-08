import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useSources } from '../data/useSources'
import type { CommsSourceType } from '../data/types'
import { SOURCE_TYPE_LABEL } from '../commsLabels'

const SOURCE_TYPES: CommsSourceType[] = [
  'official_notice',
  'news',
  'social',
  'press_release',
  'internal',
  'partner',
  'manual',
]

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

function sourceTone(sourceType: CommsSourceType) {
  switch (sourceType) {
    case 'official_notice':
      return 'info'
    case 'news':
    case 'press_release':
      return 'neutral'
    case 'internal':
      return 'warning'
    case 'partner':
      return 'success'
    case 'social':
      return 'info'
    default:
      return 'neutral'
  }
}

export function IntelligenceFeed() {
  const { x, lang } = useI18n()
  const { canWrite, addSource, removeSource, sources } = useSources()
  const [open, setOpen] = useState(false)
  const [sourceTypeFilter, setSourceTypeFilter] = useState<CommsSourceType | 'all'>('all')
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all')
  const [publisher, setPublisher] = useState('')
  const [sourceType, setSourceType] = useState<CommsSourceType>('manual')
  const [jurisdiction, setJurisdiction] = useState('')
  const [classification, setClassification] = useState('')
  const [publishedDate, setPublishedDate] = useState('')
  const [url, setUrl] = useState('')
  const [supports, setSupports] = useState('')

  const jurisdictions = useMemo(
    () => Array.from(new Set(sources.map((s) => s.jurisdiction?.[lang]).filter(Boolean))),
    [sources, lang],
  )

  const filtered = useMemo(() => {
    return sources.filter((s) => {
      const typeOk = sourceTypeFilter === 'all' || s.sourceType === sourceTypeFilter
      const jurisOk = jurisdictionFilter === 'all' || s.jurisdiction?.[lang] === jurisdictionFilter
      return typeOk && jurisOk
    })
  }, [sources, sourceTypeFilter, jurisdictionFilter, lang])

  const reset = () => {
    setOpen(false)
    setPublisher('')
    setSourceType('manual')
    setJurisdiction('')
    setClassification('')
    setPublishedDate('')
    setUrl('')
    setSupports('')
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await addSource({
      sourceType,
      publisher: { en: publisher, fr: `[FR] ${publisher}` },
      jurisdiction: jurisdiction ? { en: jurisdiction, fr: jurisdiction } : undefined,
      classification: { en: classification, fr: `[FR] ${classification}` },
      publishedDate: publishedDate || undefined,
      url: url || undefined,
      supports: supports ? { en: supports, fr: `[FR] ${supports}` } : undefined,
    })
    reset()
  }

  return (
    <section className="rounded-[12px] border border-border bg-surface p-[16px]">
      <div className="mb-[12px] flex flex-wrap items-center justify-between gap-[12px]">
        <h3 className="text-[15px] font-semibold text-text">{x(M.comms_intelligence_feed)}</h3>
        {canWrite && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
          >
            <Plus size={14} aria-hidden="true" />
            {x(M.comms_intelligence_add_source)}
          </button>
        )}
      </div>

      <div className="mb-[12px] flex flex-wrap gap-[10px]">
        <div>
          <label className={labelClass}>{x(M.comms_intelligence_filter_source_type)}</label>
          <select
            value={sourceTypeFilter}
            onChange={(e) => setSourceTypeFilter(e.target.value as CommsSourceType | 'all')}
            className={inputClass}
          >
            <option value="all">{x(M.comms_intelligence_filter_all)}</option>
            {SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{x(SOURCE_TYPE_LABEL[t])}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_intelligence_filter_jurisdiction)}</label>
          <select
            value={jurisdictionFilter}
            onChange={(e) => setJurisdictionFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">{x(M.comms_intelligence_filter_all)}</option>
            {jurisdictions.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mb-[12px] rounded-[10px] border border-border bg-inset p-[12px]">
          <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_intelligence_outlet)}</label>
              <input required value={publisher} onChange={(e) => setPublisher(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_intelligence_filter_source_type)}</label>
              <select value={sourceType} onChange={(e) => setSourceType(e.target.value as CommsSourceType)} className={inputClass}>
                {SOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{x(SOURCE_TYPE_LABEL[t])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_intelligence_filter_jurisdiction)}</label>
              <input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_policy_stage)}</label>
              <input required value={classification} onChange={(e) => setClassification(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_content_due)}</label>
              <input type="date" value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>URL</label>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_intelligence_supports)}</label>
              <input value={supports} onChange={(e) => setSupports(e.target.value)} className={inputClass} />
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

      {filtered.length === 0 ? (
        <p className="text-[13px] text-text-muted">{x(M.comms_intelligence_empty)}</p>
      ) : (
        <ul className="m-0 flex flex-col gap-[10px] p-0">
          {filtered.map((source) => (
            <li key={source.id} className="rounded-[8px] bg-inset p-[12px]">
              <div className="flex flex-wrap items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[14px] font-semibold text-text">{x(source.publisher)}</div>
                  <div className="text-[12px] text-text-muted">
                    {x(SOURCE_TYPE_LABEL[source.sourceType])}
                    {source.jurisdiction ? ` · ${x(source.jurisdiction)}` : ''}
                    {source.publishedDate ? ` · ${source.publishedDate}` : ''}
                    {source.retrievedAt ? ` · ${x(M.comms_intelligence_retrieved)} ${source.retrievedAt}` : ''}
                  </div>
                </div>
                <span className={`rounded-[100px] px-[10px] py-[3px] text-[12px] font-semibold whitespace-nowrap ${sourceTone(source.sourceType) === 'info' ? 'bg-accent-soft text-accent' : sourceTone(source.sourceType) === 'success' ? 'bg-ok-bg text-ok-fg' : sourceTone(source.sourceType) === 'warning' ? 'bg-warn-bg text-warn-fg' : 'bg-inset text-text-muted'}`}>
                  {x(SOURCE_TYPE_LABEL[source.sourceType])}
                </span>
              </div>
              <div className="mt-[6px] text-[13px] text-text-2">{x(source.classification)}</div>
              {source.supports && (
                <div className="mt-[4px] text-[12px] text-text-muted">
                  <span className="font-semibold">{x(M.comms_intelligence_supports)}:</span> {x(source.supports)}
                </div>
              )}
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-[6px] inline-block text-[12px] text-accent hover:underline"
                >
                  {source.url}
                </a>
              )}
              {source.rights && (
                <div className="mt-[4px] text-[11px] text-text-faint">
                  {x(M.comms_intelligence_rights)}: {x(source.rights)}
                </div>
              )}
              {canWrite && (
                <button
                  type="button"
                  onClick={() => removeSource(source.id)}
                  className="mt-[8px] text-[12px] font-semibold text-risk-fg"
                >
                  {x(M.comms_remove)}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
