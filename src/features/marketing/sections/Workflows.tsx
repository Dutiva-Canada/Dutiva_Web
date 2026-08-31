import {
  Accessibility,
  Award,
  CalendarClock,
  FileText,
  Search,
  TrendingUp,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionIntro } from '../SectionIntro'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'
import { WorkflowExampleCard } from './WorkflowExampleCard'
import type { WorkflowExampleCardProps } from './WorkflowExampleCard'

export const LANDING_WORKFLOW_EXAMPLES: WorkflowExampleCardProps[] = [
  {
    nameKey: 'landing_wf_ex_name',
    riskKey: 'landing_wf_ex_risk',
    riskTone: 'high',
    metaKey: 'landing_wf_ex_meta',
    stepKey: 'landing_wf_ex_step',
    nextLabelKey: 'landing_wf_ex_next_label',
    nextKey: 'landing_wf_ex_next',
    progressPct: 57,
  },
  {
    nameKey: 'landing_wf_ex2_name',
    riskKey: 'landing_wf_ex2_risk',
    riskTone: 'medium',
    metaKey: 'landing_wf_ex2_meta',
    stepKey: 'landing_wf_ex2_step',
    nextLabelKey: 'landing_wf_ex2_next_label',
    nextKey: 'landing_wf_ex2_next',
    progressPct: 40,
  },
]

interface Tile {
  icon: LucideIcon
  label: LandingMessageKey
  sub: LandingMessageKey
}

export const LANDING_WORKFLOW_TILES: Tile[] = [
  { icon: UserPlus, label: 'landing_wf1_label', sub: 'landing_wf1_sub' },
  { icon: UserMinus, label: 'landing_wf2_label', sub: 'landing_wf2_sub' },
  { icon: Accessibility, label: 'landing_wf3_label', sub: 'landing_wf3_sub' },
  { icon: TrendingUp, label: 'landing_wf4_label', sub: 'landing_wf4_sub' },
  { icon: CalendarClock, label: 'landing_wf5_label', sub: 'landing_wf5_sub' },
  { icon: Search, label: 'landing_wf6_label', sub: 'landing_wf6_sub' },
  { icon: Award, label: 'landing_wf7_label', sub: 'landing_wf7_sub' },
  { icon: FileText, label: 'landing_wf8_label', sub: 'landing_wf8_sub' },
]

export function Workflows() {
  const { lt } = useLanding()
  return (
    <section
      id="workflows"
      className="mx-auto max-w-[1200px] scroll-mt-[80px] px-4 py-12 sm:px-6 sm:py-16"
    >
      <SectionIntro
        badge={lt('landing_wf_badge')}
        title={lt('landing_wf_title')}
        sub={lt('landing_wf_sub')}
      />
      <div className="marketing-auto-grid marketing-auto-grid--150 gap-2.5">
        {LANDING_WORKFLOW_TILES.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-bg-elevated p-4">
            <tile.icon size={18} className="text-gold-strong" />
            <div className="mt-2.5 text-[0.8125rem] font-semibold text-text">{lt(tile.label)}</div>
            <div className="mt-0.5 text-xs text-text-3">{lt(tile.sub)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {LANDING_WORKFLOW_EXAMPLES.map((example) => (
          <WorkflowExampleCard key={example.nameKey} {...example} />
        ))}
      </div>
    </section>
  )
}
