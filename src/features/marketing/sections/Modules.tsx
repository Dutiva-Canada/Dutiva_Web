import { Activity, Banknote, BarChart3, BookOpen, Send, ShieldCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'
import { usePublicPath } from '@/seo/usePublicPath'
import { IconChip } from './IconChip'

/**
 * `roadmap: true` marks a module that is not shipped capability. **Nothing
 * carries it today** — the flag and the note below are kept because the next
 * module added will need them, not because everything here is aspirational.
 *
 * Compensation, Communications and Wellbeing were the last three, and they
 * came off roadmap when they gained real persistence (migrations 0039–0041):
 * each now dispatches to a production view on org-scoped tables rather than
 * rendering demo fixtures behind `gated(…)`.
 *
 * **Their production views are narrower than their demos, deliberately.** No
 * market salary benchmark, no Advisor review chips on a message, no
 * per-person wellbeing signals — the product performs none of those, and each
 * view's header says so. If marketing copy for these three ever describes a
 * capability, check it against the view rather than against the demo.
 *
 * Still true, and still the trap CANONICAL_FACTS §4 spells out: **a chip is a
 * module, not a ring.** Rings 2, 3 and 4 ship as templates in Document Studio,
 * guides under `/app/knowledge` and flows under `/app/workflows`. A ring being
 * complete was never what promoted a chip, and is not what promoted these.
 */
const MODULES: {
  icon: LucideIcon
  label: LandingMessageKey
  demoPath: string
  roadmap?: true
}[] = [
  { icon: ShieldCheck, label: 'landing_mod1_label', demoPath: 'compliance' },
  { icon: Users, label: 'landing_mod2_label', demoPath: 'employees' },
  { icon: BookOpen, label: 'landing_mod3_label', demoPath: 'knowledge' },
  { icon: Banknote, label: 'landing_mod4_label', demoPath: 'compensation' },
  { icon: Send, label: 'landing_mod5_label', demoPath: 'communications' },
  { icon: Activity, label: 'landing_mod6_label', demoPath: 'wellbeing' },
  { icon: BarChart3, label: 'landing_mod7_label', demoPath: 'analytics' },
]

const hasRoadmapModule = MODULES.some((m) => m.roadmap === true)

/** "One workspace" band — Advisor on top of day-to-day HR modules. */
export function Modules() {
  const { lt } = useLanding()
  const { p } = usePublicPath()
  const demoRoot = p('demoWorkspace')
  return (
    <section className="mx-auto max-w-300 px-4 pt-2 pb-10 sm:px-6">
      <div className="rounded-[22px] border border-border bg-bg-elevated p-4 sm:p-7">
        <span className="badge">{lt('landing_mod_badge')}</span>
        {/* h2 like the sibling landing sections (visual size unchanged) —
            an h3 here skipped a heading level in the document outline. */}
        <h2 className="mt-3.5 mb-4 max-w-[56ch] font-display text-[clamp(1.25rem,2vw,1.625rem)] leading-[1.35] font-semibold tracking-[-0.01em] text-text">
          {lt('landing_mod_title')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {MODULES.map((mod) => (
            <IconChip
              key={mod.label}
              icon={mod.icon}
              label={lt(mod.label)}
              note={mod.roadmap === true ? lt('landing_mod_roadmap') : undefined}
              to={`${demoRoot}/${mod.demoPath}`}
            />
          ))}
        </div>
        {/* The note explains the Roadmap chip, so it goes when no chip has
            one — otherwise it points at a marker that is not on the page. */}
        {hasRoadmapModule && (
          <p className="mt-3.5 text-sm leading-6 text-text-muted">
            {lt('landing_mod_roadmap_note')}
          </p>
        )}
      </div>
    </section>
  )
}
