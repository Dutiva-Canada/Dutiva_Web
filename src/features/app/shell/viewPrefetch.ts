import { useCallback } from 'react'
import { workspaceViewPreloads } from '@/app/viewPreloads'

const started = new Set<string>()

function saveDataEnabled(): boolean {
  if (typeof navigator === 'undefined') return false
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}

/** Warm the lazy chunk for a sidebar nav item (hover / focus / touch intent). */
export function prefetchWorkspaceView(key: string): void {
  if (started.has(key) || saveDataEnabled()) return
  const load = workspaceViewPreloads[key]
  if (!load) return
  started.add(key)
  void load().catch(() => {
    started.delete(key)
  })
}

/** Reset prefetch state — tests only. */
export function resetWorkspaceViewPrefetchForTests(): void {
  started.clear()
}

/** Intent handlers for nav links — spread onto `<Link>`. */
export function usePrefetchIntent(key: string | undefined) {
  const prefetch = useCallback(() => {
    if (key) prefetchWorkspaceView(key)
  }, [key])

  return {
    onMouseEnter: prefetch,
    onFocus: prefetch,
    onTouchStart: prefetch,
  }
}
