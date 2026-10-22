import { ClipboardCheck, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionIntro } from '../SectionIntro'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'
import { MarketingTryLinks } from './MarketingTryLinks'

interface Step {
  num: string
  icon: LucideIcon
  title: LandingMessageKey
  body: LandingMessageKey
}

const STEPS: Step[] = [
  { num: '01', icon: MessageSquare, title: 'landing_how1_t', body: 'landing_how1_p' },
  { num: '02', icon: Sparkles, title: 'landing_how2_t', body: 'landing_how2_p' },
  { num: '03', icon: ClipboardCheck, title: 'landing_how3_t', body: 'landing_how3_p' },
]

export function HowItWorks() {
  const { lt } = useLanding()
  return (
    <section id="how" className="lp-col scroll-mt-20 py-8 sm:py-10">
      <SectionIntro
        badge={lt('landing_how_badge')}
        title={lt('landing_how_title')}
        sub={lt('landing_how_sub')}
      />
      <div className="marketing-auto-grid marketing-auto-grid--260 gap-3">
        {STEPS.map((step) => (
          <div key={step.num} className="lp-card lp-card-pad">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-serif text-[1.375rem] font-bold text-gold-strong">
                {step.num}
              </span>
              <step.icon size={18} className="text-gold-strong" aria-hidden="true" />
            </div>
            <div className="mt-3 text-[0.9375rem] font-semibold text-text">{lt(step.title)}</div>
            <p className="mt-1.5 text-sm leading-[1.55] text-text-2">{lt(step.body)}</p>
          </div>
        ))}
      </div>
      <p className="lp-note mt-4">
        <ShieldCheck size={16} aria-hidden="true" />
        {lt('landing_how_risk_callout')}
      </p>
      <MarketingTryLinks className="mt-4" />
    </section>
  )
}
