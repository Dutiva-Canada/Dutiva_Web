import { ClipboardCheck, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionIntro } from '../SectionIntro'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'
import { MarketingTryLinks } from './MarketingTryLinks'

interface Step {
  num: string
  icon: LucideIcon
  tone: 'gold' | 'accent'
  title: LandingMessageKey
  body: LandingMessageKey
}

const STEPS: Step[] = [
  { num: '01', icon: MessageSquare, tone: 'gold', title: 'landing_how1_t', body: 'landing_how1_p' },
  { num: '02', icon: Sparkles, tone: 'accent', title: 'landing_how2_t', body: 'landing_how2_p' },
  {
    num: '03',
    icon: ClipboardCheck,
    tone: 'gold',
    title: 'landing_how3_t',
    body: 'landing_how3_p',
  },
]

export function HowItWorks() {
  const { lt } = useLanding()
  return (
    <section
      id="how"
      className="mx-auto max-w-[1200px] scroll-mt-[80px] px-4 py-12 sm:px-6 sm:py-16"
    >
      <SectionIntro
        badge={lt('landing_how_badge')}
        title={lt('landing_how_title')}
        sub={lt('landing_how_sub')}
      />
      <div className="marketing-auto-grid marketing-auto-grid--260 gap-4">
        {STEPS.map((step) => (
          <div key={step.num} className="premium-card-soft p-7">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-display text-[1.5rem] font-bold text-gold-strong">
                {step.num}
              </span>
              <span
                className={`grid h-11 w-11 place-items-center rounded-xl ${
                  step.tone === 'gold'
                    ? 'bg-gold-subtle text-gold-strong'
                    : 'bg-accent-soft text-accent'
                }`}
              >
                <step.icon size={20} />
              </span>
            </div>
            <div className="text-[1.0625rem] font-semibold text-text">{lt(step.title)}</div>
            <p className="mt-2 text-[0.9375rem] leading-[1.55] text-text-2">{lt(step.body)}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-bg-elevated px-5 py-4 text-[0.9375rem] leading-[1.55] text-text-2">
        <ShieldCheck size={18} className="mt-0.5 flex-none text-gold-strong" aria-hidden="true" />
        {lt('landing_how_risk_callout')}
      </p>
      <MarketingTryLinks className="mt-5" />
    </section>
  )
}
