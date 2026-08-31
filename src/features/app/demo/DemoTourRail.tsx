import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { DEMO_TOUR_STOPS } from './demoTourModel'
import {
  useWorkspaceRoot,
  workspacePath,
  workspaceSegments,
} from '@/features/app/workspaceRoot/workspaceRootContext'

function useCompactTour(): boolean {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => setCompact(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return compact
}

function resolveActiveStop(pathname: string) {
  const segments = workspaceSegments(pathname)
  const activeKey = segments[0] === 'documents' ? 'studio' : (segments[0] ?? 'home')
  return (
    DEMO_TOUR_STOPS.find(
      (stop) =>
        stop.id === activeKey ||
        (stop.id === 'studio' && segments[0] === 'documents') ||
        (stop.id === 'home' && segments.length === 0),
    ) ?? DEMO_TOUR_STOPS[0]!
  )
}

/** Step rail for the public demo — compact pills, one blurb for the active stop. */
export function DemoTourRail() {
  const { x } = useI18n()
  const { root, isPublicDemo } = useWorkspaceRoot()
  const { pathname } = useLocation()
  const compact = useCompactTour()
  const [showAllStops, setShowAllStops] = useState(false)

  useEffect(() => {
    setShowAllStops(false)
  }, [pathname])

  if (!isPublicDemo) return null

  const activeStop = resolveActiveStop(pathname)
  const activeIndex = DEMO_TOUR_STOPS.findIndex((stop) => stop.id === activeStop.id)
  const nextStop = DEMO_TOUR_STOPS[(activeIndex + 1) % DEMO_TOUR_STOPS.length]!

  const pillClass = (selected: boolean) =>
    `inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
      selected
        ? 'border-gold-border bg-gold-subtle text-gold-strong'
        : 'border-border bg-bg-soft text-text-2 hover:border-gold-border/60 hover:text-text'
    }`

  return (
    <aside
      className="border-b border-border bg-bg-elevated px-4 py-2 lg:px-6"
      aria-label={x(M.demo_tour_label)}
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-[10px] font-semibold tracking-[0.08em] text-text-3 uppercase">
            {x(M.demo_tour_eyebrow)}
          </p>
          <Link
            to="/app/welcome"
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-gold-strong transition-opacity hover:opacity-80"
          >
            {x(M.demo_tour_signin)}
            <ChevronRight size={12} aria-hidden="true" />
          </Link>
        </div>

        {compact && !showAllStops ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className={pillClass(true)}>
              <span className="text-[10px] font-bold tracking-[0.06em] text-text-faint">
                {activeIndex + 1}
              </span>
              {x(activeStop.title)}
            </span>
            <Link
              to={workspacePath(root, nextStop.pathSuffix)}
              className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-gold-strong transition-opacity hover:opacity-80"
            >
              {x(M.demo_tour_next)}: {x(nextStop.title)}
              <ChevronRight size={12} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setShowAllStops(true)}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-bg-soft px-3 py-2 text-xs font-semibold text-text-2 hover:border-gold-border/60 hover:text-text"
            >
              {x(M.demo_tour_all_stops)} ({DEMO_TOUR_STOPS.length})
            </button>
          </div>
        ) : (
          <>
            {compact ? (
              <button
                type="button"
                onClick={() => setShowAllStops(false)}
                className="self-start text-[11px] font-semibold text-text-3 hover:text-text"
              >
                {x(M.demo_tour_hide_stops)}
              </button>
            ) : null}
            <ol className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {DEMO_TOUR_STOPS.map((stop, index) => {
                const to = workspacePath(root, stop.pathSuffix)
                const selected = stop.id === activeStop.id
                return (
                  <li key={stop.id} className="shrink-0">
                    <Link
                      to={to}
                      aria-current={selected ? 'step' : undefined}
                      className={pillClass(selected)}
                    >
                      <span className="text-[10px] font-bold tracking-[0.06em] text-text-faint">
                        {index + 1}
                      </span>
                      {x(stop.title)}
                    </Link>
                  </li>
                )
              })}
            </ol>
          </>
        )}

        {activeStop ? (
          <p className="m-0 text-[11px] leading-snug text-text-3">{x(activeStop.blurb)}</p>
        ) : null}
      </div>
    </aside>
  )
}
