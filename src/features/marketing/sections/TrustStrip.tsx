import { Languages, Lock, MapPin, ShieldCheck } from 'lucide-react'
import { useLanding } from '../useLanding'
import { ReviewTrustSignals } from '../ReviewTrustSignals'

export function TrustStrip() {
  const { lt } = useLanding()
  return (
    <section className="mx-auto max-w-[1200px] px-6 pt-4 pb-2">
      <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2.5">
        <span className="text-[0.8125rem] font-semibold text-text-2">
          {lt('landing_trust_lead')}
        </span>
        <span className="text-border-strong">·</span>
        <span className="dutiva-pill">
          <MapPin size={14} className="text-gold-strong" />
          {lt('landing_trust_ottawa')}
        </span>
        <span className="dutiva-pill">
          <Lock size={14} className="text-gold-strong" />
          {lt('landing_trust_pipeda')}
        </span>
        <span className="dutiva-pill">
          <ShieldCheck size={14} className="text-gold-strong" />
          {lt('landing_trust_law25')}
        </span>
        <span className="dutiva-pill">
          <Languages size={14} className="text-gold-strong" />
          {lt('landing_trust_bilingual')}
        </span>
      </div>
      <div className="mt-4 flex justify-center">
        <ReviewTrustSignals compact />
      </div>
    </section>
  )
}
