import type { ComponentProps } from 'react'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { fill } from '@/lib/format'
import { AnalyticsCard, CardEmpty } from './AnalyticsCard'
import { CardData } from './CardData'
import type { ModuleDep } from './moduleRows'
import { JurisdictionBars } from './JurisdictionBars'

/** Headcount by jurisdiction — bars plus the roster-scope footnote. */
export function HeadcountCard({
  hidden,
  deps,
  activeCount,
  rows,
}: {
  readonly hidden: boolean
  readonly deps: readonly ModuleDep[]
  readonly activeCount: number
  readonly rows: ComponentProps<typeof JurisdictionBars>['rows']
}) {
  const { x } = useI18n()
  return (
    <AnalyticsCard
      title={x(M.analytics_headcount_title)}
      subtitle={
        activeCount > 0
          ? fill(
              x(
                activeCount === 1
                  ? M.analytics_headcount_total_one
                  : M.analytics_headcount_total_many,
              ),
              { n: activeCount },
            )
          : undefined
      }
      hidden={hidden}
    >
      <CardData deps={deps} skeletonLines={4}>
        {() =>
          rows.length === 0 ? (
            <CardEmpty text={x(M.analytics_headcount_empty)} />
          ) : (
            <>
              <JurisdictionBars rows={rows} />
              <p className="mt-[10px] mb-0 text-[11.5px] text-text-faint">
                {x(M.analytics_headcount_footnote)}
              </p>
            </>
          )
        }
      </CardData>
    </AnalyticsCard>
  )
}
