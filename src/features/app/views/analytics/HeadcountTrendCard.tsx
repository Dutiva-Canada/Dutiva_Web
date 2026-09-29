import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { fill } from '@/lib/format'
import { AnalyticsCard, CardEmpty } from './AnalyticsCard'
import { CardData } from './CardData'
import type { ModuleDep } from './moduleRows'
import { DeltaChip } from './DeltaChip'
import { TrendLineChart } from './TrendLineChart'
import { formatMonthISO } from './aggregation'
import { formatPct, formatSignedDecimal, intlLocale } from './format'

/**
 * Headcount & turnover — headcount history accumulates via the monthly
 * snapshot; turnover awaits termination history.
 */
export function HeadcountTrendCard({
  hidden,
  deps,
  liveHeadcount,
  turnoverNow,
  turnoverDelta,
  priorWindowEndISO,
  headcountTrend,
}: {
  readonly hidden: boolean
  readonly deps: readonly ModuleDep[]
  readonly liveHeadcount: number | null
  readonly turnoverNow: number | null
  readonly turnoverDelta: number | null
  readonly priorWindowEndISO: string
  readonly headcountTrend: readonly { monthISO: string; value: number }[]
}) {
  const { x, lang } = useI18n()
  const locale = intlLocale(lang)
  return (
    <AnalyticsCard
      title={x(M.analytics_trend_title)}
      subtitle={x(M.analytics_trend_sub)}
      className="min-[900px]:col-span-2"
      hidden={hidden}
    >
      <CardData deps={deps} skeletonLines={4}>
        {() =>
          liveHeadcount === null || liveHeadcount === 0 ? (
            <CardEmpty text={x(M.analytics_trend_empty)} />
          ) : (
            <>
              {turnoverNow !== null && (
                <div className="mb-[12px] flex gap-[10px]">
                  <div className="min-w-0 flex-1 rounded-[10px] border border-border-soft bg-surface-2 px-[12px] py-[10px]">
                    <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[4px]">
                      <span className="font-display text-[22px] font-bold text-text">
                        {formatPct(turnoverNow, locale)}
                      </span>
                      {turnoverDelta !== null && (
                        <DeltaChip
                          delta={turnoverDelta}
                          goodWhenUp={false}
                          label={fill(x(M.analytics_turnover_delta), {
                            delta: formatSignedDecimal(turnoverDelta, locale),
                            month: formatMonthISO(priorWindowEndISO, locale, 'long'),
                          })}
                        />
                      )}
                    </div>
                    <div className="mt-[2px] text-[11.5px] text-text-muted">
                      {x(M.analytics_turnover_label)}
                    </div>
                  </div>
                </div>
              )}
              {headcountTrend.length >= 2 ? (
                <TrendLineChart
                  points={headcountTrend}
                  ariaLabel={x(M.analytics_trend_chart_aria).replace(
                    '{points}',
                    headcountTrend
                      .map((p) => `${formatMonthISO(p.monthISO, locale, 'long')} ${p.value}`)
                      .join(', '),
                  )}
                  valueHeader={x(M.analytics_trend_table_value)}
                />
              ) : (
                <p className="m-0 text-[12.5px] text-text-muted">
                  {x(M.analytics_trend_first_point)}
                </p>
              )}
              {turnoverNow === null && (
                <p className="mt-[8px] mb-0 text-[11.5px] text-text-faint">
                  {x(M.analytics_turnover_prod_note)}
                </p>
              )}
            </>
          )
        }
      </CardData>
    </AnalyticsCard>
  )
}
