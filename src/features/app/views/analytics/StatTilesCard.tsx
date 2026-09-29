import { AnalyticsCard, CardEmpty } from './AnalyticsCard'
import { StatTile } from './StatTile'
import { CardData } from './CardData'
import type { ModuleDep } from './moduleRows'
import type { StatTiles } from './statTiles'

/**
 * Shared chrome for the StatTile-grid cards (security, operations,
 * governance, revenue, specialists, comms) — same skeleton/error gate and
 * empty state, differing only in title, deps, and the derived tiles.
 */
export function StatTilesCard({
  title,
  subtitle,
  hidden,
  deps,
  emptyText,
  stats,
}: {
  readonly title: string
  readonly subtitle?: string
  readonly hidden: boolean
  readonly deps: readonly ModuleDep[]
  readonly emptyText: string
  readonly stats: StatTiles
}) {
  return (
    <AnalyticsCard title={title} subtitle={subtitle} hidden={hidden}>
      <CardData deps={deps} skeletonLines={2}>
        {() =>
          !stats.hasData ? (
            <CardEmpty text={emptyText} />
          ) : (
            <div className="flex flex-wrap gap-[10px]">
              {stats.tiles.map((tile) => (
                <StatTile
                  key={tile.label}
                  value={tile.value}
                  label={tile.label}
                  alert={tile.alert}
                />
              ))}
            </div>
          )
        }
      </CardData>
    </AnalyticsCard>
  )
}
