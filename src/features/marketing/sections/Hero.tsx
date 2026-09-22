import { Link } from 'react-router-dom'
import { ArrowRight, CircleCheck, LayoutGrid, ShieldCheck } from 'lucide-react'
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
 * Hero — renders the prototype's default "director" headline variant
 * (`?hh=director`): plain lead + gilded trailing phrase, and the bold-lead
 * subcopy. The alternate "infrastructure" / "question" variants' strings are
 * kept in the landing message module for completeness.
 */
export function Hero() {
  const { lt } = useLanding()
  const { p } = usePublicPath()
  return (
    <section
      id="top"
      className="mx-auto max-w-300 scroll-mt-20 px-4 pt-14 pb-8 sm:px-6 sm:pt-18 sm:pb-10"
    >
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left */}
        <div className="animate-fade-up">
          <span className="badge">{lt('landing_hero_badge')}</span>
          <h1 className="mt-5.5 font-display text-[clamp(2.125rem,4vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.02em] text-text">
            {lt('landing_h_dir_a')}
            <span className="gradient-text">{lt('landing_h_dir_b')}</span>
          </h1>
          <p className="mt-5 max-w-[42ch] text-lg leading-[1.6] text-text-2">
            <strong className="font-semibold text-text">{lt('landing_sub_dir_strong')}</strong>
            {lt('landing_sub_dir_rest')}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to={p('pricing')}
              className="gold-button gold-button-lg px-6"
              onClick={() =>
                trackMarketingEvent('cta_click', { cta: 'see_plans', location: 'hero' })
              }
            >
              {lt('landing_cta_nocard')}
              <ArrowRight size={16} />
            </Link>
            <Link
              to={`${p('demoWorkspace')}/home`}
              className="ghost-button ghost-button-lg inline-flex items-center gap-2 px-[22px]"
              onClick={() =>
                trackMarketingEvent('cta_click', { cta: 'open_demo', location: 'hero' })
              }
            >
              <LayoutGrid size={16} aria-hidden="true" />
              {lt('landing_open_in_demo')}
            </Link>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3.5 py-1.75 text-xs font-medium text-text">
            <ShieldCheck size={14} className="text-gold-strong" />
            {lt('landing_hero_disclaimer')}
          </div>

          <p className="mt-3 max-w-[48ch] text-xs leading-normal text-text-3">
            {lt('landing_hero_scope')}
          </p>

          <div className="mt-5 grid gap-2.5 text-[0.9375rem] text-text-2">
            {CHECK_KEYS.map((key) => (
              <div key={key} className="flex items-start gap-2">
                <CircleCheck size={16} className="mt-0.5 flex-none text-gold-strong" />
                {lt(key)}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Advisor demo (mirrors the real Advisor chat) */}
        <AdvisorDemo />
      </div>
    </section>
  )
}
