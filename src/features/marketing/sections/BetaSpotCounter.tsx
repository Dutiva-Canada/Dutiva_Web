import { useEffect, useState } from 'react'
import { BETA_COHORT_LIMIT } from '@/config/beta'
import { getBetaCohortStatus } from '../betaCohortApi'
import { useLanding } from '../useLanding'

/** Decorative placeholder circles shown beside the spot counter — not photos. */
const AVATAR_SLOTS = 10

/**
 * Live "X of 15 beta spots taken" counter with a decorative avatar stack.
 * Fetches an aggregate count only (no signup PII). `extraTaken` lets the
 * parent bump the display after a successful non-waitlisted signup without
 * a refetch.
 */
export function BetaSpotCounter({ extraTaken = 0 }: { readonly extraTaken?: number }) {
  const { lt } = useLanding()
  const [taken, setTaken] = useState(0)
  const [limit, setLimit] = useState(BETA_COHORT_LIMIT)

  useEffect(() => {
    let cancelled = false
    getBetaCohortStatus()
      .then((status) => {
        if (!cancelled) {
          setTaken(status.taken)
          setLimit(status.limit)
        }
      })
      .catch((e: unknown) => console.error('beta cohort: failed to load', e))
    return () => {
      cancelled = true
    }
  }, [])

  const displayTaken = Math.min(taken + extraTaken, limit)
  const filled = Math.min(displayTaken, AVATAR_SLOTS)
  const label = lt('landing_cta_spots')
    .replace('{taken}', String(displayTaken))
    .replace('{limit}', String(limit))

  return (
    <div className="mb-4" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2" aria-hidden="true">
          {Array.from({ length: AVATAR_SLOTS }, (_, i) => (
            <span
              key={i}
              className={
                i < filled
                  ? 'inline-block size-7 rounded-full border-2 border-bg bg-gold-subtle ring-1 ring-border'
                  : 'inline-block size-7 rounded-full border-2 border-dashed border-border bg-bg-elevated'
              }
            />
          ))}
        </div>
        <p className="m-0 text-[0.8125rem] font-semibold text-text">{label}</p>
      </div>
    </div>
  )
}
