import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useCommsData } from '../data/useCommsData'
import { SENTIMENT_LABEL } from '../commsLabels'

export function Results() {
  const { x, lang } = useI18n()
  const { state } = useCommsData()

  return (
    <div className="flex flex-col gap-[16px]">
      <h2 className="text-[18px] font-semibold text-text">{x(M.comms_results_title)}</h2>

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
        {state.coverageItems.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_intelligence_coverage_empty)}</p>
        ) : (
          <>
            <div className="mb-[12px] grid grid-cols-1 gap-[10px] sm:grid-cols-2">
              <div className="rounded-[8px] bg-inset px-[12px] py-[10px]">
                <div className="text-[12px] text-text-muted">{x(M.comms_results_coverage_total)}</div>
                <div className="mt-[4px] text-[18px] font-bold text-text">
                  {state.coverageItems.reduce((sum, item) => sum + (item.reach ?? 0), 0).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
                </div>
              </div>
            </div>
            <ul className="m-0 flex flex-col gap-[10px] p-0">
              {state.coverageItems.map((item) => {
                const initiative = state.initiatives.find((i) => i.id === item.initiativeId)
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
                      {typeof item.reach === 'number' && (
                        <div className="text-[14px] font-semibold text-text">
                          {item.reach.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
                        </div>
                      )}
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
