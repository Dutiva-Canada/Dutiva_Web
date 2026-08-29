import { useState } from 'react'
import { ArrowUp, ClipboardCheck, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { advisorScenarios } from '@/features/app/views/advisor/advisorScenarios'
import type { AdvisorScenario, ScenarioId } from '@/features/app/views/advisor/advisorScenarios'
import { documentTemplatesByKey } from '@/data/documents'
import { useI18n } from '@/i18n/context'
import { LANDING_ADVISOR_SCENARIO_IDS } from './landingAdvisorScenarios'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'

type ComplianceLevel = 'low' | 'medium' | 'high'

const RISK_LABEL: Record<ComplianceLevel, LandingMessageKey> = {
  low: 'landing_adv_risk_low',
  medium: 'landing_adv_risk_medium',
  high: 'landing_adv_risk_high',
}

const RISK_BADGE_CLASS: Record<ComplianceLevel, string> = {
  low: 'border-ok-border bg-ok-bg text-ok-fg',
  medium: 'border-warn-border bg-warn-bg text-warn-fg',
  high: 'border-risk-border bg-risk-bg text-risk-fg',
}

/**
 * Curated Advisor transcript — hero demo and tour-stop preview share this.
 * Static scenario data; generate chips are illustrative unless `interactive`.
 */
export function AdvisorTranscriptPreview({
  compact = false,
  interactive = false,
  activeId: activeIdProp,
  onActiveIdChange,
}: {
  readonly compact?: boolean
  readonly interactive?: boolean
  readonly activeId?: ScenarioId
  readonly onActiveIdChange?: (id: ScenarioId) => void
}) {
  const { lt } = useLanding()
  const { x } = useI18n()
  const [uncontrolledId, setUncontrolledId] = useState<ScenarioId>(LANDING_ADVISOR_SCENARIO_IDS[0]!)
  const activeId = activeIdProp ?? uncontrolledId
  const setActiveId = onActiveIdChange ?? setUncontrolledId
  const scenario = advisorScenarios[activeId]

  return (
    <div>
      <div className={compact ? 'border-b border-border px-3 py-2.5' : 'border-b border-border px-4 py-3 sm:px-5'}>
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
                className={`min-h-11 cursor-pointer rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
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
        {compact ? null : (
          <p className="mt-2 text-xs leading-normal text-text-faint">{lt('landing_adv_preview_note')}</p>
        )}
      </div>
      <ScenarioTranscript key={activeId} scenario={scenario} compact={compact} interactive={interactive} />
    </div>
  )
}

function ScenarioTranscript({
  scenario,
  compact,
  interactive,
}: {
  readonly scenario: AdvisorScenario
  readonly compact: boolean
  readonly interactive: boolean
}) {
  const { lt } = useLanding()
  const { x, t } = useI18n()
  const { turn } = scenario
  const compliance = turn.response.risk.compliance as ComplianceLevel
  const sourceItem = turn.response.legalBasis.items.find((item) => item.valid)
  const [pickedDoc, setPickedDoc] = useState<string | null>(null)

  return (
    <div className={`grid bg-bg-soft ${compact ? 'gap-3 p-3' : 'gap-3.5 p-4 sm:p-5'}`}>
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
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {lt(RISK_LABEL[compliance])}
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
                interactive={interactive}
                pressed={pickedDoc === docKey}
                onPick={() => setPickedDoc(docKey)}
              />
            )
          })}
        </div>
      ) : null}
      {interactive && pickedDoc ? (
        <p className="m-0 text-xs leading-normal text-text-2">{lt('landing_ws_demo_advisor_doc_hint')}</p>
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
  interactive,
  pressed,
  onPick,
}: {
  readonly icon: LucideIcon
  readonly label: string
  readonly action: string
  readonly interactive: boolean
  readonly pressed: boolean
  readonly onPick: () => void
}) {
  const className = `flex min-w-0 max-w-full items-center gap-2 rounded-[10px] border py-1.75 pr-2 pl-2.25 text-[0.8125rem] ${
    pressed ? 'border-gold-border bg-gold-subtle' : 'border-border bg-bg-elevated'
  }`
  const inner = (
    <>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-bg-soft">
        <Icon size={12} className="text-text-3" />
      </span>
      <span className="min-w-0 truncate font-semibold text-text">{label}</span>
      <span className="rounded-md bg-gold-subtle px-2.25 py-1 text-xs font-bold text-gold-strong">
        {action}
      </span>
    </>
  )
  if (!interactive) {
    return <span className={className}>{inner}</span>
  }
  return (
    <button type="button" className={`${className} cursor-pointer`} onClick={onPick} aria-pressed={pressed}>
      {inner}
    </button>
  )
}
