import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { AnalyticsCard, CardEmpty } from './AnalyticsCard'
import { CardData } from './CardData'
import type { ModuleDep } from './moduleRows'
import { LeaveList } from './LeaveList'
import type { LeaveDisplayRow } from './LeaveList'

/** Leave overview — real records plus bare roster fallbacks. */
export function LeaveOverviewCard({
  hidden,
  deps,
  rows,
  bareCount,
}: {
  readonly hidden: boolean
  readonly deps: readonly ModuleDep[]
  readonly rows: readonly LeaveDisplayRow[]
  readonly bareCount: number
}) {
  const { x } = useI18n()
  return (
    <AnalyticsCard
      title={x(M.analytics_leave_title)}
      subtitle={x(M.analytics_leave_sub)}
      hidden={hidden}
    >
      <CardData deps={deps} skeletonLines={3}>
        {() =>
          rows.length === 0 ? (
            <CardEmpty text={x(M.analytics_leave_empty)} />
          ) : (
            <>
              <LeaveList rows={rows} />
              {bareCount > 0 && (
                <p className="mt-[8px] mb-0 text-[11.5px] text-text-faint">
                  {x(M.analytics_leave_prod_note)}
                </p>
              )}
            </>
          )
        }
      </CardData>
    </AnalyticsCard>
  )
}
