import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleHelp, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick, pickL } from '@/i18n/core'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { homeMessages as HM } from '@/i18n/messages/home'
import { workspaceModeMessages as WM } from '@/i18n/messages/workspaceMode'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { SuggestionChipGrid, SuggestionChips } from '@/features/app/advisor/SuggestionChips'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { dotToneClass, statusChipClass } from '@/components/chips'
import { homePriorities, severityLabels } from '@/features/app/views/home/homeData'
import type { HomeAction } from '@/features/app/views/home/homeData'
import { useHomeProductionStats } from '@/features/app/views/home/useHomeProductionStats'
import { scenarioSuggestions } from './advisorScenarios'
import type { ScenarioId } from './advisorScenarios'
import { buildDailyBrief, buildHomeMetrics } from './advisorHomeData'
import type { HomeMetric } from './advisorHomeData'
import { ThreadListOpenButton } from './ThreadList'

/**
 * Advisor home — the empty state shown when no conversation is active
 * (prototype `showEmptyState` markup): spark hero, metric tiles, the gold
 * daily-brief card, the 'Priorities today' feed with Why expanders, the home
 * composer, and the suggestion chip grid.
 */

const metricValueClass: Record<HomeMetric['tone'], string> = {
  risk: 'text-risk-dot',
  warning: 'text-gold-dot',
  info: 'text-accent',
  success: 'text-ok-fg',
}

const metricTrendClass: Record<HomeMetric['trendTone'], string> = {
  risk: 'text-risk-fg',
  success: 'text-ok-fg',
  muted: 'text-text-muted',
}

const metricLabelKeys = {
  compliance: M.advisorview_metric_compliance,
  risk: M.advisorview_metric_risk,
  cases: M.advisorview_metric_cases,
  signals: M.advisorview_metric_signals,
} as const

const productionPrompts = [
  M.advisorview_prod_prompt_policy,
  M.advisorview_prod_prompt_probation,
  M.advisorview_prod_prompt_comms,
] as const

export interface AdvisorHomeProps {
  /** Free-form send from the home composer (routes a response mode). */
  readonly onSend: (text: string) => void
  /** Suggestion-grid chip click — starts that demo response-mode scenario. */
  readonly onScenario: (scenarioId: ScenarioId) => void
  readonly onPriorityAction: (action: HomeAction) => void
  /** Metric tile deep link (route segment under /app). */
  readonly onMetricClick: (view: HomeMetric['view']) => void
  /** Opens the conversation list when it is collapsed (desktop). */
  readonly onOpenThreads?: () => void
  /** When true, the conversations toggle is hidden (list already open). */
  readonly threadsOpen?: boolean
}

function ThreadsAccessBar({
  onOpen,
  show,
}: {
  readonly onOpen: () => void
  readonly show: boolean
}) {
  if (!show) return null
  return (
    <div className="flex shrink-0 items-center justify-center border-b border-border-soft px-[14px] py-[8px]">
      <ThreadListOpenButton onOpen={onOpen} />
    </div>
  )
}

export function AdvisorHome({
  onSend,
  onScenario,
  onPriorityAction,
  onMetricClick,
  onOpenThreads,
  threadsOpen = false,
}: AdvisorHomeProps) {
  const { x, lang } = useI18n()
  const { mode } = useWorkspaceMode()
  const { loading, stats, dueItems, totalRecords } = useHomeProductionStats()
  const [whyOpen, setWhyOpen] = useState<Record<string, boolean>>({})
  const metrics = useMemo(() => buildHomeMetrics(), [])
  const brief = useMemo(() => buildDailyBrief(), [])
  const showThreadsAccess = onOpenThreads != null && !threadsOpen

  /* Production: live stat row + due-soon strip when the workspace has records;
     otherwise the reset-stage sub copy and starter prompt chips. */
  if (mode === 'production') {
    const subCopy =
      !loading && totalRecords === 0 ? x(HM.home_production_body) : x(WM.wsmode_advisor_sub)

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <ThreadsAccessBar onOpen={onOpenThreads ?? (() => {})} show={showThreadsAccess} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-start overflow-y-auto px-6 pt-[10vh] pb-10">
        <div className="w-full max-w-170 text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-navy">
            <Sparkle size={22} className="fill-gold-on-navy" strokeWidth={0} aria-hidden="true" />
          </div>
          <h1 className="m-0 mb-1.5 font-display text-[27px] font-semibold text-text">
            {x(WM.wsmode_advisor_greeting)}
          </h1>
          <p className="m-0 mb-5.5 text-[14.5px] leading-[1.55] text-text-muted">{subCopy}</p>

          {!loading && totalRecords > 0 && (
            <>
              <div className="mb-4 flex flex-wrap justify-center gap-2.5 text-left">
                {stats.map((stat) => (
                  <Link
                    key={stat.label.en}
                    to={stat.to}
                    className="min-w-[120px] flex-1 rounded-xl border border-border bg-surface px-3.5 py-3 transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-(--accent-soft-border)"
                  >
                    <div className="font-display text-[24px] font-semibold leading-none text-text">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-[11.5px] text-text-muted">{x(stat.label)}</div>
                  </Link>
                ))}
              </div>

              {dueItems.length > 0 && (
                <div className="mb-5 overflow-hidden rounded-xl border border-border bg-surface text-left">
                  {dueItems.map((item) => (
                    <Link
                      key={item.key}
                      to={item.to}
                      className="flex items-center gap-2.5 border-t border-inset px-3.5 py-2.75 first:border-t-0 hover:bg-inset"
                    >
                      <span className={statusChipClass(item.overdue ? 'risk' : 'info')}>
                        {item.overdue ? x(HM.home_prod_overdue) : x(item.kind)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[11.5px] text-text-muted">{item.dueDate}</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="text-left">
            <ChatComposer
              variant="home"
              placeholder={x(M.advisorview_composer_home)}
              onSend={onSend}
            />
          </div>

          <div className="mt-4 flex justify-center">
            <SuggestionChips
              chips={productionPrompts.map((prompt) => ({
                label: prompt,
                onClick: () => onSend(pickL(prompt, lang)),
              }))}
            />
          </div>
        </div>
      </div>
    </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadsAccessBar onOpen={onOpenThreads ?? (() => {})} show={showThreadsAccess} />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-start overflow-y-auto px-6 pt-[6vh] pb-10">
      <div className="w-full max-w-170 text-center">
        {/* Spark hero */}
        <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-navy">
          <Sparkle size={22} className="fill-gold-on-navy" strokeWidth={0} aria-hidden="true" />
        </div>
        <h1 className="m-0 mb-1.5 font-display text-[27px] font-semibold text-text">
          {x(M.advisorview_greeting)}
        </h1>
        <p className="m-0 mb-5.5 text-[14.5px] text-text-muted">{x(M.advisorview_digest_sub)}</p>

        {/* Metric tiles */}
        <div className="mb-6.5 grid grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-2.5 text-left">
          {metrics.map((metric) => (
            <button
              key={metric.labelKey}
              type="button"
              onClick={() => onMetricClick(metric.view)}
              className="cursor-pointer rounded-xl border border-border bg-surface p-3.5 text-left font-sans transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-(--accent-soft-border)"
            >
              <div
                className={`font-display text-[26px] leading-none font-semibold ${metricValueClass[metric.tone]}`}
              >
                {metric.value}
                <span className="font-sans text-[13px] text-text-faint">{metric.suffix}</span>
              </div>
              <div className="mt-1.5 text-[12px] text-text-muted">
                {x(metricLabelKeys[metric.labelKey])}
              </div>
              <div
                className={`mt-0.75 text-[10.5px] font-semibold ${metricTrendClass[metric.trendTone]}`}
              >
                {pick(metric.trend, lang)}
              </div>
            </button>
          ))}
        </div>

        {/* Daily brief */}
        <div className="mb-5.5 flex items-start gap-2.75 rounded-[14px] border border-gold-border bg-gold-bg px-4 py-3.5 text-left">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy">
            <Sparkle size={15} className="fill-gold-on-navy" strokeWidth={0} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="mb-0.75 text-[11px] font-bold tracking-wider text-gold-dot uppercase">
              {x(M.advisorview_daily_brief)}
            </div>
            <div className="text-[13.5px] leading-[1.55] text-text-2">{pick(brief, lang)}</div>
          </div>
        </div>

        {/* Priorities today */}
        <div className="mb-7 text-left">
          <div className="mb-2.5 flex items-baseline justify-between">
            <div className="font-display text-[16px] font-semibold text-text">
              {x(M.advisorview_priorities_title)}
            </div>
            <div className="text-[12px] text-text-muted">
              {homePriorities.length} {x(M.advisorview_signals_label)}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {homePriorities.map((p) => (
              <div key={p.id} className="border-t border-inset px-4 py-3.25">
                <div className="flex items-start gap-2.75">
                  <div
                    className={`mt-1.25 h-2 w-2 shrink-0 rounded-full ${dotToneClass(p.tone)}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={statusChipClass(p.tone)}>
                        {pick(severityLabels[p.severity], lang)}
                      </span>
                      <span className="text-[13.5px] font-semibold text-text">
                        {pick(p.title, lang)}
                      </span>
                    </div>
                    <div className="mt-0.75 text-[12px] text-text-muted">{pick(p.meta, lang)}</div>
                    <div className="mt-2.25 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPriorityAction(p.action)}
                        className="cursor-pointer rounded-[7px] border-none bg-navy px-3 py-1.5 font-sans text-[12px] font-bold text-white"
                      >
                        {pick(p.actionLabel, lang)}
                      </button>
                      <button
                        type="button"
                        aria-expanded={whyOpen[p.id] === true}
                        onClick={() =>
                          setWhyOpen((prev) => ({ ...prev, [p.id]: prev[p.id] !== true }))
                        }
                        className="flex cursor-pointer items-center gap-1 border-none bg-transparent px-1 py-1.5 font-sans text-[12px] font-semibold text-text-muted"
                      >
                        <CircleHelp size={12} strokeWidth={2} aria-hidden="true" />
                        {x(M.advisorview_why)}
                      </button>
                    </div>
                    {whyOpen[p.id] === true && (
                      <div className="mt-2.25 rounded-[9px] bg-inset px-3 py-2.5 text-[12.5px] leading-[1.55] text-text-3">
                        {pick(p.why, lang)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Home composer */}
        <div className="text-left">
          <ChatComposer
            variant="home"
            placeholder={x(M.advisorview_composer_home)}
            onSend={onSend}
          />
        </div>

        {/* Suggestion chip grid — the six demo response modes */}
        <div className="mt-5.5">
          <SuggestionChipGrid
            chips={scenarioSuggestions.map((chip) => ({
              label: chip.label,
              sub: chip.sub,
              onClick: () => onScenario(chip.scenarioId),
            }))}
          />
        </div>
      </div>
    </div>
    </div>
  )
}
