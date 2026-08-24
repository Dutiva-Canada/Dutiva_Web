import { Link } from 'react-router-dom'
import { ArrowRight, CircleCheck, ShieldCheck } from 'lucide-react'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'
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
  return (
    <section id="top" className="mx-auto max-w-300 scroll-mt-20 px-6 pt-18 pb-10">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] items-center gap-12">
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
              to="/app/welcome"
              className="gold-button gold-button-lg px-6"
            >
              {lt('landing_cta_nocard')}
              <ArrowRight size={16} />
            </Link>
            <a
              href="#how"
              className="ghost-button ghost-button-lg px-[22px]"
            >
              {lt('landing_cta_seehow')}
            </a>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3.5 py-1.75 text-xs font-medium text-text">
            <ShieldCheck size={14} className="text-gold-strong" />
            {lt('landing_hero_disclaimer')}
          </div>

          {/* Slim stat strip — values from docs/CANONICAL_FACTS.md */}
          <div className="mt-7 flex flex-wrap items-center gap-7 rounded-2xl border border-border bg-bg-elevated px-6 py-4.5">
            <HeroStat value="50" label={lt('landing_stat_templates')} />
            <span className="w-px self-stretch bg-border" />
            <HeroStat value="3" label={lt('landing_stat_legal')} />
            <span className="w-px self-stretch bg-border" />
            <HeroStat value="EN/FR" label={lt('landing_stat_workflows')} />
          </div>

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

function HeroStat({ value, label }: { readonly value: string; readonly label: string }) {
  return (
    <span className="text-center">
      <span className="gradient-text block font-display text-[1.75rem] font-bold">{value}</span>
      <span className="mt-0.5 block text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-text-3">
        {label}
      </span>
    </span>
  )
}
