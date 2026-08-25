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
    <section className="mx-auto max-w-[1200px] px-6 pt-6 pb-10">
      <div className="premium-card grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-10 p-[clamp(28px,4vw,56px)]">
        <div>
          <span className="badge">{lt('landing_why_badge')}</span>
          <h2 className="mt-4 font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-text">
            {lt('landing_why_title_a')}
            <span className="gradient-text">{lt('landing_why_title_b')}</span>
          </h2>
          <p className="mt-4 text-base leading-[1.65] text-text-2">{lt('landing_why_p')}</p>
          <p className="mt-3 text-sm text-text-3">{lt('landing_why_foot')}</p>
          <FounderIdentity size="compact" />
        </div>
        <div className="grid gap-3">
          {POINTS.map((point) => (
            <div
              key={point.title}
              className="flex items-start gap-3.5 rounded-[14px] border border-border bg-bg-elevated p-[18px]"
            >
              <point.icon size={20} className="mt-0.5 flex-none text-gold-strong" />
              <div>
                <div className="font-semibold text-text">{lt(point.title)}</div>
                <p className="mt-1 text-sm leading-normal text-text-2">{lt(point.body)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
