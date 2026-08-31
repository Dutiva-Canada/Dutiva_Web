import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ChevronRight, X } from 'lucide-react'
import { DEMO_TOUR_STOPS, type DemoTourStop } from '@/features/app/demo/demoTourModel'
import { useEscapeToClose } from '@/lib/escapeStack'
import { useLanding } from '../useLanding'
import { usePublicPath } from '@/seo/usePublicPath'

const TourStopPreviewBody = lazy(() =>
  import('../demos/TourStopPreviewBody').then((m) => ({ default: m.TourStopPreviewBody })),
)

/** Horizontal tour pills on the landing page — preview, then the public demo. */
export function LandingDemoPath() {
  const { lt, x } = useLanding()
  const { p } = usePublicPath()
  const demoRoot = p('demoWorkspace')
  const [openStopId, setOpenStopId] = useState<string | null>(null)
  const openStop = DEMO_TOUR_STOPS.find((stop) => stop.id === openStopId) ?? null

  return (
    <div className="mt-6">
      <p className="m-0 text-[10px] font-semibold tracking-[0.08em] text-text-3 uppercase">
        {lt('landing_ws_demo_path_label')}
      </p>
      <ol className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DEMO_TOUR_STOPS.map((stop, index) => {
          const selected = stop.id === openStopId
          return (
            <li key={stop.id} className="shrink-0">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={selected}
                onClick={() => setOpenStopId(stop.id)}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                  selected
                    ? 'border-gold-border bg-gold-subtle text-gold-strong'
                    : 'border-border bg-bg-soft text-text-2 hover:border-gold-border/60 hover:text-text'
                }`}
              >
                <span className="text-[10px] font-bold tracking-[0.06em] text-text-faint">
                  {index + 1}
                </span>
                {x(stop.title)}
              </button>
            </li>
          )
        })}
      </ol>
      {openStop ? (
        <TourStopPreviewDialog
          stop={openStop}
          demoTo={`${demoRoot}/${openStop.pathSuffix}`}
          onSelectStop={setOpenStopId}
          onClose={() => setOpenStopId(null)}
        />
      ) : null}
    </div>
  )
}

function TourStopPreviewDialog({
  stop,
  demoTo,
  onSelectStop,
  onClose,
}: {
  readonly stop: DemoTourStop
  readonly demoTo: string
  readonly onSelectStop: (id: string) => void
  readonly onClose: () => void
}) {
  const { lt, x } = useLanding()
  const titleId = useId()
  const restoreRef = useRef<Element | null>(null)

  useEscapeToClose(true, onClose)
  useEffect(() => {
    restoreRef.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus()
    }
  }, [])

  return createPortal(
    <div className="surface-marketing dutiva-surface text-text fixed inset-0 z-300 pt-[env(safe-area-inset-top)]">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-overlay-scrim-mid" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-0 flex items-center justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 pointer-events-none sm:p-4"
      >
        <div className="pointer-events-auto flex max-h-[min(92vh,860px)] w-[min(880px,100%)] flex-col overflow-hidden rounded-[16px] border border-border bg-bg-elevated shadow-modal">
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="font-display text-[18px] font-semibold tracking-[-0.01em] text-text"
              >
                {x(stop.title)}
              </h2>
              <p className="mt-1 m-0 text-sm leading-[1.45] text-text-2">{x(stop.blurb)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-bg-elevated p-2 text-text-muted transition-colors hover:text-text"
              aria-label={lt('landing_ws_demo_close_preview')}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <div
            className="flex gap-1.5 overflow-x-auto border-b border-border px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5"
            role="tablist"
            aria-label={lt('landing_ws_demo_stops_label')}
          >
            {DEMO_TOUR_STOPS.map((item, index) => {
              const selected = item.id === stop.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onSelectStop(item.id)}
                  className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selected
                      ? 'border-gold-border bg-gold-subtle text-gold-strong'
                      : 'border-border bg-bg-soft text-text-2 hover:text-text'
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-[0.06em] text-text-faint">
                    {index + 1}
                  </span>
                  {x(item.title)}
                </button>
              )
            })}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <Suspense
              fallback={
                <div className="min-h-[240px] rounded-[14px] border border-border bg-bg-soft" />
              }
            >
              <TourStopPreviewBody key={stop.id} stop={stop} />
            </Suspense>
            <p className="mt-3 m-0 text-xs leading-normal text-text-faint">
              {lt('landing_ws_demo_try')} {lt('landing_ws_demo_preview_note')}
            </p>
          </div>
          <div className="flex justify-end border-t border-border px-4 py-3 sm:px-5">
            <Link
              to={demoTo}
              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
            >
              {lt('landing_ws_demo_see_more')}
              <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
