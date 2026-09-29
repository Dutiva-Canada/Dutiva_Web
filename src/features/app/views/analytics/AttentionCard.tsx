import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { fill } from '@/lib/format'
import { AnalyticsCard, CardEmpty } from './AnalyticsCard'
import { CardData } from './CardData'
import type { ModuleDep } from './moduleRows'
import { AttentionList } from './AttentionList'
import type { AttentionRow } from './AttentionList'

/** "Needs attention" — ranked overdue/upcoming items across modules. */
export function AttentionCard({
  hidden,
  deps,
  rows,
  totalCount,
}: {
  readonly hidden: boolean
  readonly deps: readonly ModuleDep[]
  readonly rows: readonly AttentionRow[]
  readonly totalCount: number
}) {
  const { x } = useI18n()
  return (
    <AnalyticsCard
      title={x(M.analytics_attention_title)}
      subtitle={x(M.analytics_attention_sub)}
      hidden={hidden}
    >
      <CardData deps={deps} skeletonLines={4}>
        {() =>
          rows.length === 0 ? (
            <CardEmpty text={x(M.analytics_attention_empty)} />
          ) : (
            <AttentionList
              rows={rows}
              viewAllHref="/app/planning/tasks"
              viewAllLabel={fill(x(M.analytics_attention_view_all), { n: totalCount })}
            />
          )
        }
      </CardData>
    </AnalyticsCard>
  )
}
