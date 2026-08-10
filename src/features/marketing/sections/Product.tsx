import { ChevronRight, FileSignature, FileText, MessageSquare, ShieldCheck, Sparkles, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionIntro } from '../SectionIntro'
import { usePublicPath } from '@/seo/usePublicPath'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'
import { IconChip } from './IconChip'

interface Feature {
  icon: LucideIcon
  tone: 'gold' | 'accent'
  title: LandingMessageKey
  body: LandingMessageKey
}

const FEATURES: Feature[] = [
  { icon: FileText, tone: 'gold', title: 'landing_prod1_t', body: 'landing_prod1_p' },
  { icon: ShieldCheck, tone: 'accent', title: 'landing_prod2_t', body: 'landing_prod2_p' },
  { icon: Sparkles, tone: 'gold', title: 'landing_prod3_t', body: 'landing_prod3_p' },
  { icon: MessageSquare, tone: 'accent', title: 'landing_prod4_t', body: 'landing_prod4_p' },
  { icon: FileSignature, tone: 'gold', title: 'landing_prod5_t', body: 'landing_prod5_p' },
]

export function Product() {
  const { lt } = useLanding()
  const { p } = usePublicPath()
  return (
    <section id="product" className="mx-auto max-w-300 scroll-mt-20 px-6 py-16">
      <SectionIntro
        badge={lt('landing_prod_badge')}
        title={lt('landing_prod_title')}
        sub={lt('landing_prod_sub')}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="premium-card-soft p-6">
            <span
              className={`grid h-11 w-11 place-items-center rounded-xl ${
                feature.tone === 'gold'
                  ? 'bg-gold-subtle text-gold-strong'
                  : 'bg-accent-soft text-accent'
              }`}
            >
              <feature.icon size={20} />
            </span>
            <div className="mt-4 text-base font-semibold text-text">{lt(feature.title)}</div>
            <p className="mt-2 text-sm leading-[1.55] text-text-2">{lt(feature.body)}</p>
          </div>
        ))}
      </div>

      {/* Template categories */}
      <div className="mt-6 rounded-[22px] border border-border bg-bg-elevated p-6">
        <div className="mb-3.5 text-sm font-semibold text-text">{lt('landing_cat_label')}</div>
        <div className="flex flex-wrap items-center gap-2">
          <IconChip icon={Users} label={lt('landing_cat_hiring')} />
          <IconChip icon={ShieldCheck} label={lt('landing_cat_policies')} />
          <IconChip icon={FileText} label={lt('landing_cat_discipline')} />
          <IconChip icon={FileText} label={lt('landing_cat_termination')} />
          <a
            href={p('templates')}
            className="ml-1.5 inline-flex items-center gap-1 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
          >
            {lt('landing_cat_browse')}
            <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </section>
  )
}
