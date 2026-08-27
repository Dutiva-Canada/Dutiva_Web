import { useState } from 'react'
import { ArrowUp, ClipboardCheck, FileText, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { advisorScenarios } from '@/features/app/views/advisor/advisorScenarios'
import type { AdvisorScenario, ScenarioId } from '@/features/app/views/advisor/advisorScenarios'
import { documentTemplatesByKey } from '@/data/documents'
import { useI18n } from '@/i18n/context'
import { LANDING_ADVISOR_SCENARIO_IDS } from '../demos/landingAdvisorScenarios'
import { useLanding } from '../useLanding'

type ComplianceLevel = 'low' | 'medium' | 'high'

const RISK_BADGE_CLASS: Record<ComplianceLevel, string> = {
  low: 'border-ok-border bg-ok-bg text-ok-fg',
  medium: 'border-warn-border bg-warn-bg text-warn-fg',
  high: 'border-risk-border bg-risk-bg text-risk-fg',
}

/**
 * Hero product frame — switches between curated Advisor scenarios so visitors
 * see breadth before sign-in. Static transcript data from `advisorScenarios`.
 */
export function AdvisorDemo() {
  const { lt } = useLanding()
  const { x } = useI18n()
  const [activeId, setActiveId] = useState<ScenarioId>(LANDING_ADVISOR_SCENARIO_IDS[0]!)
  const scenario = advisorScenarios[activeId]

  return (
    <div id="advisor" className="premium-card animate-fade-up scroll-mt-20 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-bg-elevated px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-gold">
            <Sparkles size={19} />
          </span>
          <span>
            <span className="block font-semibold text-text">{lt('landing_adv_name')}</span>
            <span className="block text-[0.8125rem] text-text-2">{x(scenario.turn.jurisdictionLine)}</span>
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-2.5 py-1 text-xs font-semibold text-text-2">
          {lt('landing_adv_preview')}
        </span>
      </div>

      <div className="border-b border-border bg-bg-elevated px-5 py-3">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label={lt('landing_adv_scenarios_label')}
        >
          {LANDING_ADVISOR_SCENARIO_IDS.map((id) => {
            const item = advisorScenarios[id]
            const selected = id === activeId
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selected
                    ? 'border-gold-border bg-gold-subtle text-gold-strong'
                    : 'border-border bg-bg-soft text-text-2 hover:text-text'
                }`}
                onClick={() => setActiveId(id)}
              >
                {x(item.title)}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] leading-normal text-text-faint">{lt('landing_adv_preview_note')}</p>
      </div>

      <ScenarioTranscript scenario={scenario} />
    </div>
  )
}

function ScenarioTranscript({ scenario }: { readonly scenario: AdvisorScenario }) {
  const { lt } = useLanding()
  const { x, t } = useI18n()
  const { turn } = scenario
  const compliance = turn.response.risk.compliance as ComplianceLevel
  const sourceItem = turn.response.legalBasis.items.find((item) => item.valid)

  return (
    <div className="grid gap-3.5 bg-bg-soft p-5">
      <div className="ml-auto max-w-[86%] rounded-[16px_16px_3px_16px] bg-navy px-4 py-2.75 text-[0.9375rem] leading-[1.55] text-white">
        {x(scenario.user)}
      </div>

      <div className="max-w-[94%] rounded-[16px_16px_16px_3px] border border-border bg-bg-elevated px-4 py-3.5">
        {turn.banner?.tone === 'support' ? (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-soft px-2.25 py-0.75 text-[0.6875rem] font-bold tracking-[0.06em] uppercase text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {x(turn.banner.title).trim()}
          </div>
        ) : (
          <div
            className={`mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.25 py-0.75 text-[0.6875rem] font-bold tracking-[0.06em] uppercase ${RISK_BADGE_CLASS[compliance]}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full bg-current`} />
            {`${t(compliance === 'high' ? 'advws_risk_high' : compliance === 'medium' ? 'advws_risk_medium' : 'advws_risk_low')} ${t('landing_adv_risk_suffix')}`}
          </div>
        )}
        <p className="m-0 whitespace-pre-line text-[0.9375rem] leading-[1.55] text-text">{x(turn.reply)}</p>
        {turn.banner?.tone === 'support' ? (
          <p className="mt-2 text-xs leading-normal text-text-2">{x(turn.banner.text)}</p>
        ) : null}
        {sourceItem ? (
          <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-text-3">
            <FileText size={12} />
            {t('landing_adv_source_prefix')}{' '}
            {typeof sourceItem.label === 'string' ? sourceItem.label : x(sourceItem.label)}
          </div>
        ) : null}
      </div>

      {turn.docs && turn.docs.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {turn.docs.slice(0, 2).map((docKey) => {
            const meta = documentTemplatesByKey[docKey]
            const label = meta ? x(meta.title) : docKey
            const icon = docKey.includes('Checklist') ? ClipboardCheck : FileText
            return (
              <DocChip
                key={docKey}
                icon={icon}
                label={label}
                action={lt('landing_adv_generate')}
              />
            )
          })}
        </div>
      ) : null}

      <div className="flex items-end gap-2.5 rounded-[14px] border border-border bg-bg-elevated p-2 pl-4 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.35)]">
        <span className="flex-1 py-2 text-sm text-text-3">
          {turn.followups?.[0] ?? lt('landing_adv_followup')}
        </span>
        <span className="grid h-8.5 w-8.5 flex-none place-items-center rounded-[9px] bg-navy">
          <ArrowUp size={15} className="text-white" />
        </span>
      </div>
    </div>
  )
}

function DocChip({
  icon: Icon,
  label,
  action,
}: {
  readonly icon: LucideIcon
  readonly label: string
  readonly action: string
}) {
  return (
    <span className="flex items-center gap-2 rounded-[10px] border border-border bg-bg-elevated py-1.75 pr-2 pl-2.25 text-[0.8125rem]">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-bg-soft">
        <Icon size={12} className="text-text-3" />
      </span>
      <span className="font-semibold text-text">{label}</span>
      <span className="rounded-md bg-gold-subtle px-2.25 py-1 text-xs font-bold text-gold-strong">
        {action}
      </span>
    </span>
  )
}
