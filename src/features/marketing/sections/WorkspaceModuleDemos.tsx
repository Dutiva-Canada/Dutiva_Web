import { useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Banknote,
  BarChart3,
  Book,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  Cog,
  Contact,
  DollarSign,
  FileSignature,
  FileStack,
  FileText,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Scale,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  UserCheck,
  Users,
  UsersRound,
  Waypoints,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { ScoreHero } from '@/features/app/views/analytics/ScoreHero'
import { SectionIntro } from '../SectionIntro'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'
import { usePublicPath } from '@/seo/usePublicPath'
import { useI18n } from '@/i18n/context'
import { trackMarketingEvent } from '../analytics/track'
import {
  landingAttentionPreview,
  landingCasePreview,
  landingCommPreview,
  landingFinancePreview,
  landingHiringPreview,
  landingScorePreview,
} from '../demos/workspaceDemoModel'
import { IconChip } from './IconChip'
import { LandingDemoPath } from './LandingDemoPath'
import { DocumentStudioDemo } from '../demos/DocumentStudioDemo'

const ATTENTION_CHIP_TONE = { overdue: 'risk', due_soon: 'warning', upcoming: 'neutral' } as const

/** Every workspace module, ordered like the shell nav — the visible breadth
    claim. Each chip deep-links into the public demo. */
const MODULES: {
  icon: LucideIcon
  label: LandingMessageKey
  demoPath: string
  highlighted?: true
}[] = [
  { icon: MessageCircle, label: 'landing_mod9_label', demoPath: 'advisor' },
  { icon: Waypoints, label: 'landing_mod10_label', demoPath: 'workflows' },
  { icon: FileStack, label: 'landing_mod11_label', demoPath: 'documents/studio' },
  { icon: Book, label: 'landing_mod3_label', demoPath: 'knowledge' },
  { icon: CalendarCheck, label: 'landing_mod12_label', demoPath: 'planning/tasks' },
  { icon: Cog, label: 'landing_mod13_label', demoPath: 'operations' },
  { icon: Users, label: 'landing_mod2_label', demoPath: 'employees' },
  { icon: UserCheck, label: 'landing_mod8_label', demoPath: 'hiring', highlighted: true },
  { icon: Activity, label: 'landing_mod6_label', demoPath: 'wellbeing' },
  { icon: Send, label: 'landing_mod21_label', demoPath: 'communications' },
  { icon: Megaphone, label: 'landing_mod5_label', demoPath: 'comms' },
  { icon: Banknote, label: 'landing_mod14_label', demoPath: 'finance/overview', highlighted: true },
  { icon: DollarSign, label: 'landing_mod4_label', demoPath: 'compensation' },
  { icon: TrendingUp, label: 'landing_mod15_label', demoPath: 'revenue' },
  { icon: Contact, label: 'landing_mod16_label', demoPath: 'crm' },
  { icon: Scale, label: 'landing_mod17_label', demoPath: 'governance' },
  { icon: ShieldCheck, label: 'landing_mod1_label', demoPath: 'compliance' },
  { icon: BookOpen, label: 'landing_mod20_label', demoPath: 'policies' },
  { icon: Shield, label: 'landing_mod18_label', demoPath: 'security' },
  { icon: UsersRound, label: 'landing_mod19_label', demoPath: 'specialists' },
  { icon: BarChart3, label: 'landing_mod7_label', demoPath: 'analytics', highlighted: true },
]

type TabId = 'studio' | 'analytics' | 'cases' | 'comms' | 'hiring' | 'finance'

/** Document Studio capability strip, folded in from the old Product section —
    the pane shows the demo; these name what it does. */
const STUDIO_FEATURES: { icon: LucideIcon; title: LandingMessageKey; body: LandingMessageKey }[] = [
  { icon: FileText, title: 'landing_prod1_t', body: 'landing_prod1_p' },
  { icon: ShieldCheck, title: 'landing_prod2_t', body: 'landing_prod2_p' },
  { icon: Sparkles, title: 'landing_prod3_t', body: 'landing_prod3_p' },
  { icon: MessageSquare, title: 'landing_prod4_t', body: 'landing_prod4_p' },
  { icon: FileSignature, title: 'landing_prod5_t', body: 'landing_prod5_p' },
]

const TABS: { id: TabId; labelKey: LandingMessageKey }[] = [
  { id: 'studio', labelKey: 'landing_ws_demo_studio_title' },
  { id: 'analytics', labelKey: 'landing_ws_demo_analytics_title' },
  { id: 'cases', labelKey: 'landing_ws_demo_cases_title' },
  { id: 'comms', labelKey: 'landing_ws_demo_comms_title' },
  { id: 'hiring', labelKey: 'landing_ws_demo_hiring_title' },
  { id: 'finance', labelKey: 'landing_ws_demo_finance_title' },
]

/**
 * Workspace showcase — one tabbed preview per module family, the guided demo
 * tour, and a chip strip covering the full module surface. The point is
 * breadth: HR compliance is the spine, but the same workspace runs hiring,
 * communications, finance, and governance.
 */
export function WorkspaceModuleDemos() {
  const { lt } = useLanding()
  const { x } = useI18n()
  const { p } = usePublicPath()
  const demoRoot = p('demoWorkspace')
  const [activeTab, setActiveTab] = useState<TabId>('studio')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const { score, delta } = landingScorePreview()
  const attention = landingAttentionPreview()
  const caseFile = landingCasePreview()
  const comm = landingCommPreview()
  const hiring = landingHiringPreview()
  const finance = landingFinancePreview()

  const selectTab = (id: TabId) => {
    setActiveTab(id)
    trackMarketingEvent('showcase_tab', { tab: id })
  }

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (index + 1) % TABS.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (index - 1 + TABS.length) % TABS.length
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = TABS.length - 1
    }
    const target = TABS[next]
    if (target) {
      event.preventDefault()
      selectTab(target.id)
      tabRefs.current[next]?.focus()
    }
  }

  return (
    <section id="workspace" className="mx-auto max-w-300 scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16">
      <SectionIntro
        badge={lt('landing_ws_demo_badge')}
        title={lt('landing_ws_demo_title')}
        sub={lt('landing_ws_demo_sub')}
      />

      <LandingDemoPath />

      {/* Tabbed preview — one pane at a time so the section stays short while
          the module count stays honest. `id="product"` keeps the footer
          Templates link landing on the showcase (studio tab is default). */}
      <div
        role="tablist"
        aria-label={lt('landing_ws_tabs_label')}
        className="mt-8 flex scroll-mt-20 gap-2 overflow-x-auto pb-1"
        id="product"
      >
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el
            }}
            type="button"
            role="tab"
            id={`showcase-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`showcase-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => selectTab(tab.id)}
            onKeyDown={(e) => onTabKeyDown(e, index)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'border-gold-border bg-bg-soft text-gold-strong'
                : 'border-border bg-bg-elevated text-text-2 hover:text-text'
            }`}
          >
            {lt(tab.labelKey)}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`showcase-panel-${activeTab}`}
        aria-labelledby={`showcase-tab-${activeTab}`}
        className="premium-card-soft mt-4 p-4 sm:p-5"
      >
        {activeTab === 'studio' && (
          <>
            <h3 className="text-base font-semibold text-text">
              {lt('landing_ws_demo_studio_title')}
            </h3>
            <p className="mt-1 text-sm leading-[1.55] text-text-2">
              {lt('landing_ws_demo_studio_sub')}
            </p>
            <div className="marketing-auto-grid marketing-auto-grid--240 mt-4 gap-3">
              {STUDIO_FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-xl border border-border bg-bg-soft p-4">
                  <feature.icon size={18} className="text-gold-strong" aria-hidden="true" />
                  <div className="mt-2.5 text-sm font-semibold text-text">{lt(feature.title)}</div>
                  <p className="mt-1 text-xs leading-[1.55] text-text-2">{lt(feature.body)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-border bg-bg-soft p-4">
              <div className="mb-3 text-xs font-bold tracking-[0.14em] text-text-muted uppercase">
                {lt('landing_cat_label')}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <IconChip icon={Users} label={lt('landing_cat_hiring')} />
                <IconChip icon={ShieldCheck} label={lt('landing_cat_policies')} />
                <IconChip icon={FileText} label={lt('landing_cat_discipline')} />
                <IconChip icon={FileText} label={lt('landing_cat_termination')} />
                <a
                  href={p('templates')}
                  className="ml-1.5 inline-flex items-center gap-1 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
                >
                  {lt('landing_cat_browse')}
                  <ChevronRight size={14} aria-hidden="true" />
                </a>
              </div>
            </div>
            <DocumentStudioDemo embedded />
          </>
        )}

        {activeTab === 'analytics' && (
          <Pane
            title={lt('landing_ws_demo_analytics_title')}
            sub={lt('landing_ws_demo_analytics_sub')}
            to={`${demoRoot}/analytics`}
          >
            <div className="landing-score-hero">
              <ScoreHero score={score} delta={delta} />
            </div>
            <ul className="mt-4 grid gap-2.5 border-t border-border pt-3">
              {attention.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-snug text-text">
                      {x(row.title)}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-3">{x(row.secondary)}</span>
                  </span>
                  <span
                    className={`${statusChipClass(ATTENTION_CHIP_TONE[row.status])} shrink-0 items-center self-start sm:self-center`}
                  >
                    {row.status === 'overdue' ? (
                      <TriangleAlert
                        size={12}
                        strokeWidth={1.9}
                        className="mr-[5px]"
                        aria-hidden="true"
                      />
                    ) : null}
                    {x(row.chipLabel)}
                  </span>
                </li>
              ))}
            </ul>
          </Pane>
        )}

        {activeTab === 'cases' && (
          <Pane
            title={lt('landing_ws_demo_cases_title')}
            sub={lt('landing_ws_demo_cases_sub')}
            to={`${demoRoot}/cases/${caseFile.id}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 font-semibold text-text">{x(caseFile.title)}</span>
              <span className={`${statusChipClass(caseFile.tone)} shrink-0`}>
                {x(caseFile.status)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-[1.55] text-text-2">{x(caseFile.summary)}</p>
            <p className="mt-3 border-t border-border pt-3 text-xs text-text-3">
              <span className="font-semibold text-text-2">{lt('landing_ws_demo_case_next')}: </span>
              {x(caseFile.nextStep)}
            </p>
          </Pane>
        )}

        {activeTab === 'comms' && (
          <Pane
            title={lt('landing_ws_demo_comms_title')}
            sub={lt('landing_ws_demo_comms_sub')}
            to={`${demoRoot}/comms/overview`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 font-semibold text-text">{x(comm.title)}</span>
              <span className={`${statusChipClass(comm.tone)} shrink-0`}>{x(comm.status)}</span>
            </div>
            <p className="mt-1 text-xs text-text-3">
              {x(comm.initiative)} · {x(comm.channel)} · {x(comm.dueDate)} · {x(comm.owner)}
            </p>
            <p className="mt-2 text-sm leading-[1.55] text-text-2">{x(comm.note)}</p>
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-2 text-[10px] font-bold tracking-[0.08em] text-text-3 uppercase">
                {lt('landing_ws_demo_comms_caps')}
              </div>
              <ul className="flex flex-wrap gap-2">
                {comm.capabilities.map((cap) => (
                  <li key={cap.key} className={`${statusChipClass('neutral')} shrink-0`}>
                    {x(cap.label)}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3 text-xs leading-normal text-text-2">{x(comm.bulkImport)}</p>
          </Pane>
        )}

        {activeTab === 'hiring' && (
          <Pane
            title={lt('landing_ws_demo_hiring_title')}
            sub={lt('landing_ws_demo_hiring_sub')}
            to={`${demoRoot}/hiring`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 font-semibold text-text">{hiring.candidate.name}</span>
              <span className={`${statusChipClass(hiring.candidate.tone)} shrink-0`}>
                {x(hiring.candidate.status)}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-3">
              {x(hiring.candidate.position)} · {x(hiring.candidate.location)}
            </p>
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-2 text-[10px] font-bold tracking-[0.08em] text-text-3 uppercase">
                {lt('landing_ws_demo_hiring_funnel')}
              </div>
              <ul className="grid gap-1.5">
                {hiring.funnel.map((stage, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-text-2">{x(stage.label)}</span>
                    <span className="font-semibold text-text">{stage.count}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-border pt-2 text-xs text-text-3">
                <span className="font-semibold text-text-2">
                  {lt('landing_ws_demo_hiring_time')}:{' '}
                </span>
                {x(hiring.timeToHire)}
              </p>
            </div>
          </Pane>
        )}

        {activeTab === 'finance' && (
          <Pane
            title={lt('landing_ws_demo_finance_title')}
            sub={lt('landing_ws_demo_finance_sub')}
            to={`${demoRoot}/finance/overview`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="min-w-0 font-semibold text-text">{finance.entity}</span>
              <span className="text-xs text-text-3">{x(finance.month)}</span>
            </div>
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {finance.stats.map((stat) => (
                <li
                  key={stat.key}
                  className="rounded-lg border border-border bg-bg-elevated px-3 py-2"
                >
                  <span className="block font-display text-lg font-bold text-text">
                    {stat.value}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.08em] text-text-3 uppercase">
                    {x(stat.label)}
                  </span>
                </li>
              ))}
            </ul>
            <ul className="mt-3 grid gap-1.5 border-t border-border pt-3">
              {finance.rows.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-text-2">{x(row.name)}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-text">{row.amount}</span>
                    <span className={`${statusChipClass(row.tone)} shrink-0`}>{x(row.status)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Pane>
        )}
      </div>

      <p className="mt-4 text-xs leading-normal text-text-faint">
        {lt('landing_ws_demo_preview_note')}
      </p>

      <div className="mt-10 rounded-[22px] border border-border bg-bg-elevated p-4 sm:p-7">
        <h3 className="m-0 text-base font-semibold text-text">
          {lt('landing_ws_demo_modules_heading')}
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {MODULES.map((mod) => (
            <IconChip
              key={mod.label}
              icon={mod.icon}
              label={lt(mod.label)}
              to={`${demoRoot}/${mod.demoPath}`}
              highlighted={mod.highlighted}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function Pane({
  title,
  sub,
  to,
  children,
}: {
  readonly title: string
  readonly sub: string
  readonly to: string
  readonly children: ReactNode
}) {
  const { lt } = useLanding()
  return (
    <>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="mt-1 text-sm leading-[1.55] text-text-2">{sub}</p>
      <div className="mt-4 rounded-xl border border-border bg-bg-soft p-3 sm:p-4">{children}</div>
      <div className="mt-4 pt-1">
        <Link
          to={to}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
          onClick={() =>
            trackMarketingEvent('cta_click', { cta: 'open_demo', location: 'showcase' })
          }
        >
          {lt('landing_open_in_demo')}
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </>
  )
}
