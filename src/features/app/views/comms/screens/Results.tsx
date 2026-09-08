import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { Bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useCommsData } from '../data/useCommsData'
import { useCoverage } from '../data/useCoverage'
import { useInitiatives } from '../data/useInitiatives'
import type { CommsInitiative, CommsMetric } from '../data/types'
import { SENTIMENT_LABEL } from '../commsLabels'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const PROVENANCES: CommsMetric['provenance'][] = ['manual', 'provider', 'ai_estimate']

function biInput(value: string, lang: 'en' | 'fr'): Bi | undefined {
  const text = value.trim()
  if (!text) return undefined
  return lang === 'fr'
    ? { en: `[EN review] ${text}`, fr: text }
    : { en: text, fr: `[FR review] ${text}` }
}

function numberValue(value: string): number | undefined {
  const n = Number(value)
  return value === '' ? undefined : Number.isNaN(n) ? undefined : n
}

function MetricForm({
  onCancel,
  initiatives,
}: {
  onCancel: () => void
  initiatives: CommsInitiative[]
}) {
  const { x, lang } = useI18n()
  const { addMetric } = useCommsData()
  const [name, setName] = useState('')
  const [period, setPeriod] = useState('')
  const [value, setValue] = useState('')
  const [baseline, setBaseline] = useState('')
  const [target, setTarget] = useState('')
  const [provenance, setProvenance] = useState<CommsMetric['provenance']>('manual')
  const [owner, setOwner] = useState('')
  const [initiativeId, setInitiativeId] = useState('')

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim() || !owner.trim() || !initiativeId) return
    addMetric({
      initiativeId,
      name: biInput(name, lang) ?? { en: name.trim(), fr: `[FR review] ${name.trim()}` },
      period: biInput(period, lang),
      value: numberValue(value),
      baseline: numberValue(baseline),
      target: numberValue(target),
      provenance,
      owner: owner.trim(),
    })
    onCancel()
  }

  return (
    <form onSubmit={onSubmit} className="mb-[16px] rounded-[10px] border border-border bg-inset p-[14px]">
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>{x(M.comms_results_name)}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_results_metric_initiative)}</label>
          <select
            value={initiativeId}
            onChange={(e) => setInitiativeId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">{x(M.comms_org_none)}</option>
            {initiatives.map((i) => (
              <option key={i.id} value={i.id}>{x(i.title)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_results_period)}</label>
          <input value={period} onChange={(e) => setPeriod(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_results_value)}</label>
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_results_baseline)}</label>
          <input type="number" value={baseline} onChange={(e) => setBaseline(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_results_target)}</label>
          <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_results_provenance_label)}</label>
          <select
            value={provenance}
            onChange={(e) => setProvenance(e.target.value as CommsMetric['provenance'])}
            className={inputClass}
          >
            {PROVENANCES.map((p) => (
              <option key={p} value={p}>{x(M[`comms_results_provenance_${p}` as keyof typeof M])}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{x(M.comms_results_owner)}</label>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} required />
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

export function Results() {
  const { x, lang } = useI18n()
  const { state, canWrite, removeMetric } = useCommsData()
  const { initiatives } = useInitiatives()
  const { coverageItems, canWrite: coverageCanWrite, removeCoverageItem } = useCoverage()
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center justify-between gap-[12px]">
        <h2 className="text-[18px] font-semibold text-text">{x(M.comms_results_title)}</h2>
        {canWrite && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
          >
            <Plus size={14} aria-hidden="true" />
            {x(M.comms_results_add_metric)}
          </button>
        )}
      </div>

      {adding && <MetricForm onCancel={() => setAdding(false)} initiatives={initiatives} />}

      {state.metrics.length === 0 ? (
        <p className="text-[13px] text-text-muted">{x(M.comms_results_empty)}</p>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {state.metrics.map((metric) => (
            <div key={metric.id} className="rounded-[12px] border border-border bg-surface p-[16px]">
              <div className="flex flex-wrap items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[14.5px] font-semibold text-text">{x(metric.name)}</div>
                  <div className="text-[12px] text-text-muted">
                    {metric.period ? x(metric.period) : ''}
                    {metric.owner ? ` · ${metric.owner}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-[8px]">
                  <div className="text-right">
                    <div className="text-[18px] font-bold text-text">
                      {metric.value == null ? x(M.comms_results_no_data) : metric.value}
                    </div>
                    {metric.target != null && (
                      <div className="text-[12px] text-text-muted">
                        {x(M.comms_results_target)} {metric.target}
                      </div>
                    )}
                  </div>
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => removeMetric(metric.id)}
                      aria-label={x(M.comms_remove)}
                      className="text-text-muted hover:text-risk-fg"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              {metric.baseline != null && (
                <div className="mt-[10px] text-[12px] text-text-2">
                  <span className="font-semibold">{x(M.comms_results_baseline)}:</span> {metric.baseline}
                </div>
              )}
              <div className="mt-[6px] text-[11px] text-text-faint">
                {x(M.comms_results_provenance)}: {x(M[`comms_results_provenance_${metric.provenance}` as keyof typeof M])}
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h3 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_results_coverage)}</h3>
        {coverageItems.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_intelligence_coverage_empty)}</p>
        ) : (
          <>
            <div className="mb-[12px] grid grid-cols-1 gap-[10px] sm:grid-cols-2">
              <div className="rounded-[8px] bg-inset px-[12px] py-[10px]">
                <div className="text-[12px] text-text-muted">{x(M.comms_results_coverage_total)}</div>
                <div className="mt-[4px] text-[18px] font-bold text-text">
                  {coverageItems.reduce((sum, item) => sum + (item.reach ?? 0), 0).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
                </div>
              </div>
            </div>
            <ul className="m-0 flex flex-col gap-[10px] p-0">
              {coverageItems.map((item) => {
                const initiative = initiatives.find((i) => i.id === item.initiativeId)
                return (
                  <li key={item.id} className="flex flex-col gap-[4px] rounded-[8px] bg-inset p-[12px]">
                    <div className="flex flex-wrap items-start justify-between gap-[12px]">
                      <div>
                        <div className="text-[14px] font-semibold text-text">{x(item.headline)}</div>
                        <div className="text-[12px] text-text-muted">
                          {x(item.outlet)} · {initiative ? x(initiative.title) : x(M.comms_none)}
                          {item.publishedDate ? ` · ${item.publishedDate}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-[8px]">
                        {typeof item.reach === 'number' && (
                          <div className="text-[14px] font-semibold text-text">
                            {item.reach.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
                          </div>
                        )}
                        {coverageCanWrite && (
                          <button
                            type="button"
                            onClick={() => removeCoverageItem(item.id)}
                            aria-label={x(M.comms_remove)}
                            className="text-text-muted hover:text-risk-fg"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    {item.sentiment && (
                      <div className="text-[12px] text-text-muted">
                        {x(M.comms_intelligence_sentiment)}: {x(SENTIMENT_LABEL[item.sentiment])}
                      </div>
                    )}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-accent hover:underline">
                        {item.url}
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="mt-[10px] text-[11px] leading-normal text-text-faint">{x(M.comms_results_coverage_disclaimer)}</p>
          </>
        )}
      </section>
    </div>
  )
}
