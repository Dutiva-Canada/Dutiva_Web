import type { ComponentProps } from 'react'
import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { AnalyticsCard, CardEmpty } from './AnalyticsCard'
import { CardData } from './CardData'
import type { ModuleDep } from './moduleRows'
import { ServiceMilestoneList } from './ServiceMilestoneList'

/** Service milestones due — probation end dates within 30 days. */
export function ServiceMilestonesCard({
  hidden,
  deps,
  hasProbationDates,
  rows,
}: {
  readonly hidden: boolean
  readonly deps: readonly ModuleDep[]
  readonly hasProbationDates: boolean
  readonly rows: ComponentProps<typeof ServiceMilestoneList>['rows']
}) {
  const { x } = useI18n()
  return (
    <AnalyticsCard
      title={x(M.analytics_service_milestone_title)}
      subtitle={x(M.analytics_service_milestone_sub)}
      hidden={hidden}
    >
      <CardData deps={deps} skeletonLines={3}>
        {() =>
          !hasProbationDates ? (
            <CardEmpty text={x(M.analytics_service_milestone_prod_empty)} />
          ) : rows.length === 0 ? (
            <CardEmpty text={x(M.analytics_service_milestone_empty)} />
          ) : (
            <ServiceMilestoneList rows={rows} />
          )
        }
      </CardData>
    </AnalyticsCard>
  )
}
