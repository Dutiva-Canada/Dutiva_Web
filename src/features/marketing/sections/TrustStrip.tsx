import { Languages, Lock, MapPin, ShieldCheck } from 'lucide-react'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'
import { ReviewTrustSignals } from '../ReviewTrustSignals'
import type { LucideIcon } from 'lucide-react'

const ITEMS: { icon: LucideIcon; key: LandingMessageKey }[] = [
  { icon: MapPin, key: 'landing_trust_ottawa' },
  { icon: Lock, key: 'landing_trust_pipeda' },
  { icon: ShieldCheck, key: 'landing_trust_law25' },
  { icon: Languages, key: 'landing_trust_bilingual' },
]

/** Single quiet hairline row of trust signals — the portal trust line. */
export function TrustStrip() {
  const { lt } = useLanding()
  return (
    <section className="lp-col py-2">
      <div className="lp-card flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <span className="lp-eyebrow">{lt('landing_trust_lead')}</span>
        {ITEMS.map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-text-2"
          >
            <item.icon size={14} className="text-gold-strong" aria-hidden="true" />
            {lt(item.key)}
          </span>
        ))}
        <span className="ml-auto">
          <ReviewTrustSignals compact />
        </span>
      </div>
    </section>
  )
}
