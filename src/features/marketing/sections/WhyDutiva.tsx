import { Languages, Scale, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { FounderIdentity } from '../FounderIdentity'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'

const POINTS: { icon: LucideIcon; title: LandingMessageKey; body: LandingMessageKey }[] = [
  { icon: Scale, title: 'landing_why1_t', body: 'landing_why1_p' },
  { icon: Languages, title: 'landing_why2_t', body: 'landing_why2_p' },
  { icon: ShieldCheck, title: 'landing_why3_t', body: 'landing_why3_p' },
]

export function WhyDutiva() {
  const { lt } = useLanding()
  return (
    <section className="lp-col py-8 sm:py-10">
      <div className="lp-card lp-card-pad marketing-auto-grid marketing-auto-grid--300 items-start gap-6 sm:gap-8">
        <div>
          <span className="lp-eyebrow">{lt('landing_why_badge')}</span>
          <h2 className="lp-h2 mt-2">
            {lt('landing_why_title_a')}
            <span className="gradient-text">{lt('landing_why_title_b')}</span>
          </h2>
          <blockquote className="mt-4 border-l-2 border-gold-border pl-4">
            <p className="text-[0.9375rem] leading-[1.65] text-text-2 italic">
              {lt('landing_why_p')}
            </p>
            <footer className="mt-3 text-sm font-semibold not-italic text-text">
              — {lt('landing_why_attribution')}
            </footer>
          </blockquote>
          <p className="mt-3 text-sm text-text-3">{lt('landing_why_foot')}</p>
          <FounderIdentity size="compact" />
        </div>
        <ul className="lp-mini-list m-0 p-0">
          {POINTS.map((point) => (
            <li key={point.title} className="flex items-start gap-3.5 py-4 first:pt-1 last:pb-1">
              <point.icon size={18} className="mt-0.5 flex-none text-gold-strong" />
              <div>
                <div className="font-semibold text-text">{lt(point.title)}</div>
                <p className="mt-1 text-sm leading-normal text-text-2">{lt(point.body)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
