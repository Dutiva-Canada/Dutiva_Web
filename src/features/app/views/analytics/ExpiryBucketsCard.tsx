import { AnalyticsCard, CardEmpty } from './AnalyticsCard'
import { CardData } from './CardData'
import type { ModuleDep } from './moduleRows'
import { ExpiryBucketsSection } from './ExpiryBucketsSection'
import type { ExpiryDisplayRow } from './ExpiryBucketsSection'

/**
 * Certifications / document expiries share one shape: bucket counts plus the
 * flattened row list. `hasRecords` distinguishes "module empty in production"
 * from "records exist but nothing due in the window".
 */
export function ExpiryBucketsCard({
  title,
  subtitle,
  hidden,
  deps,
  hasRecords,
  counts,
  rows,
  prodEmptyText,
  emptyText,
}: {
  readonly title: string
  readonly subtitle: string
  readonly hidden: boolean
  readonly deps: readonly ModuleDep[]
  readonly hasRecords: boolean
  readonly counts: {
    readonly expired: number
    readonly within30: number
    readonly within60: number
    readonly within90: number
  }
  readonly rows: readonly ExpiryDisplayRow[]
  readonly prodEmptyText: string
  readonly emptyText: string
}) {
  return (
    <AnalyticsCard title={title} subtitle={subtitle} hidden={hidden}>
      <CardData deps={deps} skeletonLines={4}>
        {() =>
          !hasRecords ? (
            <CardEmpty text={prodEmptyText} />
          ) : rows.length === 0 ? (
            <CardEmpty text={emptyText} />
          ) : (
            <ExpiryBucketsSection counts={counts} rows={rows} />
          )
        }
      </CardData>
    </AnalyticsCard>
  )
}
