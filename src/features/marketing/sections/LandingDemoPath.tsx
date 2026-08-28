import { Link } from 'react-router-dom'
import { DEMO_TOUR_STOPS } from '@/features/app/demo/demoTourModel'
import { useLanding } from '../useLanding'
import { usePublicPath } from '@/seo/usePublicPath'

/** Horizontal tour pills on the landing page — mirrors the public demo tour. */
export function LandingDemoPath() {
  const { lt, x } = useLanding()
  const { p } = usePublicPath()
  const demoRoot = p('demoWorkspace')

  return (
    <div className="mt-6">
      <p className="m-0 text-[10px] font-semibold tracking-[0.08em] text-text-3 uppercase">
        {lt('landing_ws_demo_path_label')}
      </p>
      <ol className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DEMO_TOUR_STOPS.map((stop, index) => (
          <li key={stop.id} className="shrink-0">
            <Link
              to={`${demoRoot}/${stop.pathSuffix}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-bg-soft px-3 py-2 text-xs font-semibold text-text-2 transition-colors hover:border-gold-border/60 hover:text-text"
            >
              <span className="text-[10px] font-bold tracking-[0.06em] text-text-faint">{index + 1}</span>
              {x(stop.title)}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
