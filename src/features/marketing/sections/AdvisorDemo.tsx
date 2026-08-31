import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import { advisorScenarios } from '@/features/app/views/advisor/advisorScenarios'
import type { ScenarioId } from '@/features/app/views/advisor/advisorScenarios'
import { LANDING_ADVISOR_SCENARIO_IDS } from '../demos/landingAdvisorScenarios'
import { AdvisorTranscriptPreview } from '../demos/AdvisorTranscriptPreview'
import { useLanding } from '../useLanding'
import { usePublicPath } from '@/seo/usePublicPath'
import { useI18n } from '@/i18n/context'

/**
 * Hero product frame — switches between curated Advisor scenarios so visitors
 * see breadth before sign-in. Static transcript data from `advisorScenarios`.
 */
export function AdvisorDemo() {
  const { lt } = useLanding()
  const { p } = usePublicPath()
  const { x } = useI18n()
  const [activeId, setActiveId] = useState<ScenarioId>(LANDING_ADVISOR_SCENARIO_IDS[0]!)
  const scenario = advisorScenarios[activeId]

  return (
    <div id="advisor" className="premium-card animate-fade-up scroll-mt-20 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-bg-elevated px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-gold">
            <Sparkles size={19} />
          </span>
          <span>
            <span className="block font-semibold text-text">{lt('landing_adv_name')}</span>
            <span className="block text-[0.8125rem] text-text-2">
              {x(scenario.turn.jurisdictionLine)}
            </span>
          </span>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-bg-soft px-2.5 py-1 text-xs font-semibold text-text-2 sm:inline-flex">
          {lt('landing_adv_preview')}
        </span>
      </div>

      <AdvisorTranscriptPreview activeId={activeId} onActiveIdChange={setActiveId} />

      <div className="border-t border-border bg-bg-elevated px-5 py-3">
        <Link
          to={`${p('demoWorkspace')}/advisor`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
        >
          {lt('landing_open_in_demo')}
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
