import type { ComponentProps } from 'react'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { fill } from '@/lib/format'
import { AnalyticsCard, CardEmpty } from './AnalyticsCard'
import { CardData } from './CardData'
import type { ModuleDep } from './moduleRows'
import { ScoreBreakdownMeters } from './ScoreBreakdownMeters'
import { ScoreHero } from './ScoreHero'
import { TrendLineChart } from './TrendLineChart'
import { CRITICAL_SCORE_CEILING, formatMonthISO } from './aggregation'
import type { ScoreDelta } from './aggregation'
import { intlLocale } from './format'

/** Compliance score — hero figure, history chart, and per-component meters. */
export function ScoreCard({
  hidden,
  deps,
  liveScore,
  delta,
  capped,
  history,
  hasOlderFormulaPoints,
  breakdownRows,
}: {
  readonly hidden: boolean
  readonly deps: readonly ModuleDep[]
  readonly liveScore: number | null
  readonly delta: ScoreDelta | null
  readonly capped: boolean
  readonly history: readonly { monthISO: string; score: number }[]
  readonly hasOlderFormulaPoints: boolean
  readonly breakdownRows: ComponentProps<typeof ScoreBreakdownMeters>['rows']
}) {
  const { x, lang } = useI18n()
  const locale = intlLocale(lang)
  return (
    <AnalyticsCard
      title={x(M.analytics_score_title)}
      className="min-[900px]:col-span-2"
      hidden={hidden}
    >
      <CardData deps={deps} skeletonLines={4}>
        {() =>
          liveScore === null ? (
            <CardEmpty text={x(M.analytics_score_empty)} />
          ) : (
            <>
              <ScoreHero score={liveScore} delta={delta} />
              {capped && (
                <p className="mt-[8px] mb-0 text-[12.5px] font-medium text-risk-fg">
                  {fill(x(M.analytics_score_capped_note), {
                    ceiling: CRITICAL_SCORE_CEILING,
                  })}
                </p>
              )}
              {history.length >= 2 ? (
                <div className="mt-[10px]">
                  <TrendLineChart
                    points={history.map((p) => ({ monthISO: p.monthISO, value: p.score }))}
                    ariaLabel={x(M.analytics_score_chart_aria).replace(
                      '{points}',
                      history
                        .map((p) => `${formatMonthISO(p.monthISO, locale, 'long')} ${p.score}`)
                        .join(', '),
                    )}
                    valueHeader={x(M.analytics_score_table_score)}
                    clampMax={100}
                  />
                </div>
              ) : (
                <p className="mt-[10px] mb-0 text-[12.5px] text-text-muted">
                  {x(M.analytics_score_first_point)}
                </p>
              )}
              {hasOlderFormulaPoints && (
                <p className="mt-[8px] mb-0 text-[11.5px] text-text-faint">
                  {x(M.analytics_score_formula_note)}
                </p>
              )}
              {breakdownRows.length > 0 && (
                <div className="mt-[14px] border-t border-border-soft pt-[14px]">
                  <div className="mb-[10px] text-[11.5px] font-bold tracking-[0.04em] uppercase text-text-muted">
                    {x(M.analytics_score_breakdown_title)}
                  </div>
                  <ScoreBreakdownMeters rows={breakdownRows} />
                </div>
              )}
            </>
          )
        }
      </CardData>
    </AnalyticsCard>
  )
}
