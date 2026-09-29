import type { ReactNode } from 'react'
import { CardError, CardSkeleton } from './AnalyticsCard'
import type { ModuleDep } from './moduleRows'

/** Skeleton / error / ready gate over the modules a card depends on. */
export function CardData({
  deps,
  skeletonLines = 3,
  children,
}: {
  readonly deps: readonly ModuleDep[]
  readonly skeletonLines?: number
  readonly children: () => ReactNode
}) {
  if (deps.some((d) => d.state.status === 'error')) {
    return (
      <CardError
        onRetry={() => {
          for (const dep of deps) if (dep.state.status === 'error') dep.retry()
        }}
      />
    )
  }
  if (deps.some((d) => d.state.status === 'loading')) {
    return <CardSkeleton lines={skeletonLines} />
  }
  return <>{children()}</>
}
