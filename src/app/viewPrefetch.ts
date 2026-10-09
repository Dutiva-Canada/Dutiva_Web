import { useCallback } from 'react'
import {
  marketingViewPreloads,
  portalViewPreloads,
  screenViewPreloads,
  workspaceViewPreloads,
} from './viewPrefetchRegistry'

const started = new Set<string>()

const viewPreloads: Record<string, () => Promise<unknown>> = {
  ...workspaceViewPreloads,
  ...screenViewPreloads,
  ...portalViewPreloads,
  ...marketingViewPreloads,
}

function saveDataEnabled(): boolean {
  if (typeof navigator === 'undefined') return false
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}

function meteredConnection(): boolean {
  if (typeof navigator === 'undefined') return false
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } })
    .connection
  return connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g'
}

/**
 * Warm the lazy chunk for a nav target — sidebar item (`cases`), module tab
 * (`comms.initiatives`), detail route (`cases.detail`), or portal page
 * (`invest.chat`). Deduped per key; a failed fetch resets so a retry works.
 */
export function prefetchView(key: string): void {
  if (started.has(key) || saveDataEnabled()) return
  const load = viewPreloads[key]
  if (!load) return
  started.add(key)
  void load().catch(() => {
    started.delete(key)
  })
}

/** Back-compat alias — sidebar callers predate the namespaced registry. */
export const prefetchWorkspaceView = prefetchView

/**
 * Warm a set of chunks during browser idle — one per idle slice so a cold
 * session doesn't burst-fetch everything during first paint. No-ops on
 * metered connections and Save-Data. Returns a cancel fn for effect cleanup.
 */
export function warmViewsOnIdle(keys: readonly string[]): () => void {
  if (saveDataEnabled() || meteredConnection()) return () => {}
  let cancelled = false
  let pending = 0
  const ric = (
    globalThis as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }
  ).requestIdleCallback
  const cic = (
    globalThis as { cancelIdleCallback?: (h: number) => void }
  ).cancelIdleCallback

  const schedule = (i: number) => {
    if (cancelled || i >= keys.length) return
    const key = keys[i]
    const step = () => {
      pending = 0
      if (cancelled || key === undefined) return
      prefetchView(key)
      schedule(i + 1)
    }
    /* Safari: no requestIdleCallback — a short delay still keeps warm-up off
       the critical path. */
    pending = ric ? ric(step, { timeout: 4000 }) : (setTimeout(step, 1200) as unknown as number)
  }
  const start = () => schedule(0)

  /* Hold warm-up until the current load finishes — firing mid-boot steals
     bandwidth from the chunk the user is actually waiting on. */
  const waitForLoad =
    typeof document !== 'undefined' &&
    typeof window !== 'undefined' &&
    document.readyState !== 'complete'
  if (waitForLoad) window.addEventListener('load', start, { once: true })
  else start()

  return () => {
    cancelled = true
    if (waitForLoad) window.removeEventListener('load', start)
    if (pending === 0) return
    if (ric && cic) cic(pending)
    else if (!ric) clearTimeout(pending)
    pending = 0
  }
}

/** Reset prefetch state — tests only. */
export function resetWorkspaceViewPrefetchForTests(): void {
  started.clear()
}

/**
 * Portal nav `to` → preload key: `/invest/chat` → `invest.chat`, the bare
 * portal root → `portal.home`, and the candidate portal's `/portal` infix is
 * dropped (`/careers/portal/profile` → `careers.profile`).
 */
export function portalNavKey(to: string): string {
  const seg = to.replace(/^\/+/, '').replace(/\/+$/, '')
  const parts = seg.split('/').filter((p) => p !== 'portal')
  return parts.length === 1 ? `${parts[0]}.home` : parts.join('.')
}

/** Intent handlers — spread onto `<Link>`/`<NavLink>` in map loops (no hooks). */
export function viewIntentProps(key: string) {
  const prefetch = () => prefetchView(key)
  return {
    onMouseEnter: prefetch,
    onFocus: prefetch,
    onTouchStart: prefetch,
  }
}

/** Intent handlers for nav links — spread onto `<Link>`. */
export function usePrefetchIntent(key: string | undefined) {
  const prefetch = useCallback(() => {
    if (key) prefetchView(key)
  }, [key])

  return {
    onMouseEnter: prefetch,
    onFocus: prefetch,
    onTouchStart: prefetch,
  }
}
