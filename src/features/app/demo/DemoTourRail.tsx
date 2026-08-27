import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { DEMO_TOUR_STOPS } from './demoTourModel'
import { useWorkspaceRoot, workspacePath, workspaceSegments } from '@/features/app/workspaceRoot/workspaceRootContext'

/** Step rail for the public demo — honest preview, not a live workspace. */
export function DemoTourRail() {
  const { x } = useI18n()
  const { root, isPublicDemo } = useWorkspaceRoot()
  const { pathname } = useLocation()
  if (!isPublicDemo) return null

  const segments = workspaceSegments(pathname)
  const activeKey = segments[0] === 'documents' ? 'studio' : (segments[0] ?? 'home')

  return (
    <aside
      className="border-b border-border bg-bg-elevated px-4 py-3 lg:px-6"
      aria-label={x(M.demo_tour_label)}
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
            {x(M.demo_tour_eyebrow)}
          </p>
          <Link
            to="/app/welcome"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gold-strong transition-opacity hover:opacity-80"
          >
            {x(M.demo_tour_signin)}
            <ChevronRight size={12} aria-hidden="true" />
          </Link>
        </div>
        <ol className="flex flex-wrap gap-2">
          {DEMO_TOUR_STOPS.map((stop, index) => {
            const to = workspacePath(root, stop.pathSuffix)
            const selected =
              stop.id === activeKey ||
              (stop.id === 'studio' && segments[0] === 'documents') ||
              (stop.id === 'home' && segments.length === 0)
            return (
              <li key={stop.id}>
                <Link
                  to={to}
                  className={`block rounded-xl border px-3 py-2 transition-colors ${
                    selected
                      ? 'border-gold-border bg-gold-subtle'
                      : 'border-border bg-bg-soft hover:border-gold-border/60'
                  }`}
                >
                  <span className="block text-[10px] font-bold tracking-[0.08em] text-text-faint uppercase">
                    {x(M.demo_tour_step)} {index + 1}
                  </span>
                  <span className="block text-sm font-semibold text-text">{x(stop.title)}</span>
                  <span className="mt-0.5 block max-w-[28ch] text-[11px] leading-snug text-text-3">
                    {x(stop.blurb)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </aside>
  )
}
