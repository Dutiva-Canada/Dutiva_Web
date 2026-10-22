import { Link } from 'react-router-dom'
import { ArrowRight, Check, LayoutGrid, ShieldCheck } from 'lucide-react'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'
import { usePublicPath } from '@/seo/usePublicPath'
import { trackMarketingEvent } from '../analytics/track'
import { AdvisorDemo } from './AdvisorDemo'

const CHECK_KEYS: LandingMessageKey[] = [
  'landing_hero_check1',
  'landing_hero_check2',
  'landing_hero_check3',
]

/**
 * Hero — portal page-head treatment: caps eyebrow, serif headline, muted
 * sub, navy pill + outline pill, and the disclaimer as a quiet `lp-note`.
 * The Advisor preview stays as the right-hand proof column.
 */
export function Hero() {
  const { lt } = useLanding()
  const { p } = usePublicPath()
  return (
    <section id="top" className="lp-col scroll-mt-20 pt-10 pb-6 sm:pt-14 sm:pb-8">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left */}
        <div>
          <span className="lp-eyebrow">{lt('landing_hero_badge')}</span>
          <h1 className="lp-h1 mt-3">
            {lt('landing_h_dir_a')}
            <span className="gradient-text">{lt('landing_h_dir_b')}</span>
          </h1>
          <p className="mt-4 max-w-[46ch] text-[1.0625rem] leading-[1.6] text-text-2">
            <strong className="font-semibold text-text">{lt('landing_sub_dir_strong')}</strong>
            {lt('landing_sub_dir_rest')}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={p('pricing')}
              className="lp-btn lp-btn-primary"
              onClick={() =>
                trackMarketingEvent('cta_click', { cta: 'see_plans', location: 'hero' })
              }
            >
              {lt('landing_cta_nocard')}
              <ArrowRight size={16} />
            </Link>
            <Link
              to={`${p('demoWorkspace')}/home`}
              className="lp-btn lp-btn-secondary"
              onClick={() =>
                trackMarketingEvent('cta_click', { cta: 'open_demo', location: 'hero' })
              }
            >
              <LayoutGrid size={16} aria-hidden="true" />
              {lt('landing_open_in_demo')}
            </Link>
          </div>
          <p className="mt-3 text-sm text-text-3">{lt('landing_hero_price')}</p>

          <div className="mt-5 grid gap-2">
            {CHECK_KEYS.map((key) => (
              <div key={key} className="lp-check-row">
                <Check size={15} aria-hidden="true" />
                {lt(key)}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <p className="lp-note max-w-[52ch]">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>
                {lt('landing_hero_disclaimer')}
                <span className="mt-1 block text-[0.8125rem]">{lt('landing_hero_scope')}</span>
              </span>
            </p>
          </div>
        </div>

        {/* Right: Advisor demo (mirrors the real Advisor chat) */}
        <AdvisorDemo />
      </div>
    </section>
  )
}
