import { useI18n } from '@/i18n/context'
import { hiringMessages as M } from '@/i18n/messages/hiring'
import type { ProductionFunnelMetrics } from './productionApi'

/** Funnel analytics tab — conversion counts and percentages per stage. */
const STAGES: { key: keyof ProductionFunnelMetrics; label: keyof typeof M }[] = [
  { key: 'totalApplications', label: 'hiring_funnel_applications' },
  { key: 'basicQualified', label: 'hiring_funnel_basic_qualified' },
  { key: 'evidenceQualified', label: 'hiring_funnel_evidence_qualified' },
  { key: 'workSamples', label: 'hiring_funnel_work_samples' },
  { key: 'interviews', label: 'hiring_funnel_interviews' },
  { key: 'hires', label: 'hiring_funnel_hires' },
]

export function FunnelAnalytics({ funnel }: { funnel: ProductionFunnelMetrics }) {
  const { x } = useI18n()

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <h2 className="mb-[16px] text-[16px] font-bold text-text">{x(M.hiring_funnel_title)}</h2>
        <p className="mb-[20px] text-[13px] text-text-muted">{x(M.hiring_funnel_description)}</p>

        <div className="space-y-[8px]">
          {STAGES.map((stage, index) => {
            const count = funnel[stage.key]
            const width =
              funnel.totalApplications > 0
                ? Math.round((count / funnel.totalApplications) * 100)
                : 0
            return (
              <div key={stage.key} className="flex items-center gap-[12px]">
                <div className="w-[140px] shrink-0 text-[13px] text-text-2">
                  {x(M[stage.label])}
                </div>
                <div className="flex-1">
                  <div className="mb-[4px] flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-text">{count}</span>
                    <span className="text-text-muted">{width}%</span>
                  </div>
                  <div className="h-[24px] overflow-hidden rounded-[6px] bg-inset">
                    <div
                      className="h-full rounded-[6px] bg-navy transition-all"
                      style={{ width: `${index === 0 ? 100 : width}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
