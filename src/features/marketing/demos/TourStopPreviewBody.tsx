import { useState } from 'react'
import {
  Activity,
  BarChart3,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Send,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { ScoreHero } from '@/features/app/views/analytics/ScoreHero'
import { DocPaper } from '@/features/app/documents/components'
import { useI18n } from '@/i18n/context'
import type { DemoTourStop } from '@/features/app/demo/demoTourModel'
import { AdvisorTranscriptPreview } from './AdvisorTranscriptPreview'
import {
  FEATURED_TEMPLATE_TIDS,
  buildTemplatePreview,
  compactDocPaperProps,
  demoAnswerDisplay,
  templateByTid,
} from './templatePreviewModel'
import {
  landingAttentionPreview,
  landingCommPreview,
  landingScorePreview,
} from './workspaceDemoModel'
import { TOUR_STOP_FIXTURES } from './tourStopDemoFixtures'
import { WorkflowExampleCard } from '../sections/WorkflowExampleCard'
import {
  LANDING_WORKFLOW_EXAMPLES,
  LANDING_WORKFLOW_TILES,
} from '../sections/Workflows'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'

const ATTENTION_CHIP_TONE = { overdue: 'risk', due_soon: 'warning', upcoming: 'neutral' } as const
const COMM_DIMS = ['tone', 'legal', 'clarity', 'policy'] as const
const CASE_TABS = ['overview', 'docs', 'next'] as const
const STUDIO_WIZARD_IDS = ['employee_name', 'position_title', 'start_date'] as const

const FRAME_NAV: readonly LucideIcon[] = [
  LayoutDashboard,
  Sparkles,
  FileText,
  Activity,
  FolderOpen,
  BarChart3,
  Send,
]

const STOP_ICON: Record<string, LucideIcon> = {
  home: LayoutDashboard,
  advisor: Sparkles,
  studio: FileText,
  workflows: Activity,
  cases: FolderOpen,
  analytics: BarChart3,
  communications: Send,
}

const WF_EXAMPLE_BY_LABEL: Partial<Record<LandingMessageKey, (typeof LANDING_WORKFLOW_EXAMPLES)[number]>> = {
  landing_wf2_label: LANDING_WORKFLOW_EXAMPLES[0],
  landing_wf3_label: LANDING_WORKFLOW_EXAMPLES[1],
}

/** Illustrated product window wrapping a stop’s interactive preview. */
export function TourStopPreviewBody({ stop }: { readonly stop: DemoTourStop }) {
  const { x } = useI18n()
  const Icon = STOP_ICON[stop.id] ?? LayoutDashboard
  return (
    <TourProductFrame title={x(stop.title)} icon={Icon}>
      <StopPreview stopId={stop.id} />
    </TourProductFrame>
  )
}

function TourProductFrame({
  title,
  icon: Icon,
  children,
}: {
  readonly title: string
  readonly icon: LucideIcon
  readonly children: React.ReactNode
}) {
  const { x } = useI18n()
  const org = TOUR_STOP_FIXTURES.home.org
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-bg-soft shadow-[0_16px_40px_-24px_rgba(0,0,0,0.55)]">
      <div className="flex items-center gap-2 border-b border-border bg-navy px-3 py-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-gold-subtle text-gold-strong">
          <Icon size={13} aria-hidden="true" />
        </span>
        <span className="min-w-0 truncate text-[11px] font-semibold tracking-[0.04em] text-gold">
          {x(org)} · {title}
        </span>
      </div>
      <div className="flex min-h-[240px]">
        <div
          className="hidden w-10 shrink-0 flex-col items-center gap-2.5 border-r border-border bg-navy/90 py-3 sm:flex"
          aria-hidden="true"
        >
          {FRAME_NAV.map((NavIcon, index) => (
            <NavIcon
              key={index}
              size={14}
              className={NavIcon === Icon ? 'text-gold' : 'text-gold/35'}
            />
          ))}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden bg-bg-soft">{children}</div>
      </div>
    </div>
  )
}

function StopPreview({ stopId }: { readonly stopId: string }) {
  switch (stopId) {
    case 'home':
      return <HomeTourPreview />
    case 'advisor':
      return <AdvisorTranscriptPreview compact interactive />
    case 'studio':
      return <StudioTourPreview />
    case 'workflows':
      return <WorkflowsTourPreview />
    case 'cases':
      return <CasesTourPreview />
    case 'analytics':
      return <AnalyticsTourPreview />
    case 'communications':
      return <CommsTourPreview />
    default:
      return null
  }
}

function HomeTourPreview() {
  const { lt, x } = useLanding()
  const home = TOUR_STOP_FIXTURES.home
  const [activeId, setActiveId] = useState<string>(home.metrics[0]!.id)
  const active = home.metrics.find((row) => row.id === activeId) ?? home.metrics[0]!

  return (
    <div className="p-3 sm:p-4">
      <div className="rounded-[12px] border border-gold-border bg-gold-bg px-3.5 py-3">
        <div className="text-[10px] font-bold tracking-[0.08em] text-gold-dot uppercase">
          {x(home.briefTitle)}
        </div>
        <p className="mt-1.5 m-0 text-sm leading-[1.5] text-text-2">{x(home.briefLead)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {home.metrics.map((metric) => {
          const selected = metric.id === activeId
          return (
            <button
              key={metric.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setActiveId(metric.id)}
              className={`flex min-h-11 cursor-pointer items-baseline gap-1.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                selected
                  ? 'border-gold-border bg-gold-subtle'
                  : 'border-border bg-bg-elevated hover:border-gold-border/60'
              }`}
            >
              <span className="font-display text-[18px] font-semibold leading-none text-text">
                {metric.value}
                {'suffix' in metric && metric.suffix ? (
                  <span className="font-sans text-[10px] font-semibold text-text-faint">{metric.suffix}</span>
                ) : null}
              </span>
              <span className="text-[11px] font-semibold text-text-2">{x(metric.label)}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 m-0 border-t border-border pt-3 text-xs leading-normal text-text-2">
        <span className="font-semibold text-text">{lt('landing_ws_demo_selected')}: </span>
        {x(active.detail)}
      </p>
    </div>
  )
}

function StudioTourPreview() {
  const { lt, x, lang } = useLanding()
  const [tid, setTid] = useState<(typeof FEATURED_TEMPLATE_TIDS)[number]>(FEATURED_TEMPLATE_TIDS[0])
  const preview = buildTemplatePreview(tid, lang)
  const template = templateByTid(tid)
  if (!preview || !template) return null
  const docPreview = compactDocPaperProps(preview, lang)
  const wizardSteps = STUDIO_WIZARD_IDS.map((id) => template.questions.find((q) => q.id === id)).filter(
    (question): question is NonNullable<typeof question> => question !== undefined,
  )

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={lt('landing_ws_demo_studio_templates')}>
        {FEATURED_TEMPLATE_TIDS.map((id) => {
          const item = templateByTid(id)
          const selected = id === tid
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTid(id)}
              className={`min-h-11 cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                selected
                  ? 'border-gold-border bg-gold-subtle text-gold-strong'
                  : 'border-border bg-bg-elevated text-text-2 hover:text-text'
              }`}
            >
              {item ? x(item.name) : id}
            </button>
          )
        })}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ol className="grid gap-2">
          {wizardSteps.slice(0, 3).map((question, index) => (
            <li key={question.id} className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5">
              <div className="text-[10px] font-bold tracking-[0.08em] text-text-3 uppercase">
                {lt('landing_studio_demo_step')} {index + 1}
              </div>
              <div className="mt-1 text-xs font-semibold text-text">{x(question.label)}</div>
              <div className="mt-0.5 text-xs text-text-2">{demoAnswerDisplay(tid, question.id, lang) ?? '—'}</div>
            </li>
          ))}
        </ol>
        <DocPaper
          blocks={preview.blocks}
          values={docPreview.values}
          bilingual={docPreview.bilingual}
          docLang={docPreview.docLang}
          className="max-h-[280px] overflow-y-auto"
        />
      </div>
    </div>
  )
}

function WorkflowsTourPreview() {
  const { lt } = useLanding()
  const [label, setLabel] = useState<LandingMessageKey>('landing_wf2_label')
  const example = WF_EXAMPLE_BY_LABEL[label]
  const tile = LANDING_WORKFLOW_TILES.find((item) => item.label === label)

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-wrap gap-1.5">
        {LANDING_WORKFLOW_TILES.map((item) => {
          const selected = item.label === label
          return (
            <button
              key={item.label}
              type="button"
              aria-pressed={selected}
              onClick={() => setLabel(item.label)}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                selected
                  ? 'border-gold-border bg-gold-subtle text-gold-strong'
                  : 'border-border bg-bg-elevated text-text-2 hover:text-text'
              }`}
            >
              <item.icon size={13} aria-hidden="true" />
              {lt(item.label)}
            </button>
          )
        })}
      </div>
      <div className="mt-3">
        {example ? (
          <WorkflowExampleCard {...example} />
        ) : (
          <div className="rounded-2xl border border-border bg-bg-elevated px-[22px] py-5">
            <div className="font-semibold text-text">{tile ? lt(tile.label) : lt(label)}</div>
            <p className="mt-1 m-0 text-sm text-text-2">{tile ? lt(tile.sub) : null}</p>
            <p className="mt-3 m-0 text-xs text-text-3">{lt('landing_ws_demo_workflow_open')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CasesTourPreview() {
  const { lt, x } = useLanding()
  const cases = TOUR_STOP_FIXTURES.cases
  const [caseId, setCaseId] = useState<string>(cases[0]!.id)
  const [tab, setTab] = useState<(typeof CASE_TABS)[number]>('overview')
  const file = cases.find((item) => item.id === caseId) ?? cases[0]!
  const tabCopy = {
    overview: x(file.summary),
    docs: x(file.tabDocs),
    next: x(file.nextStep),
  }
  const tabLabel: Record<(typeof CASE_TABS)[number], LandingMessageKey> = {
    overview: 'landing_ws_demo_case_overview',
    docs: 'landing_ws_demo_case_docs',
    next: 'landing_ws_demo_case_next',
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-wrap gap-2">
        {cases.map((item) => {
          const selected = item.id === caseId
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setCaseId(item.id)
                setTab('overview')
              }}
              className={`min-h-11 cursor-pointer rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                selected
                  ? 'border-gold-border bg-gold-subtle text-gold-strong'
                  : 'border-border bg-bg-elevated text-text-2 hover:text-text'
              }`}
            >
              {x(item.title)}
            </button>
          )
        })}
      </div>
      <div className="mt-3 rounded-xl border border-border bg-bg-elevated p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-text">{x(file.title)}</span>
          <span className={`${statusChipClass(file.tone)} shrink-0`}>{x(file.status)}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label={lt('landing_ws_demo_case_tabs')}>
          {CASE_TABS.map((id) => {
            const selected = id === tab
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(id)}
                className={`min-h-11 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  selected
                    ? 'border-gold-border bg-gold-subtle text-gold-strong'
                    : 'border-border bg-bg-soft text-text-2'
                }`}
              >
                {lt(tabLabel[id])}
              </button>
            )
          })}
        </div>
        <p className="mt-3 m-0 text-sm leading-[1.55] text-text-2">{tabCopy[tab]}</p>
      </div>
    </div>
  )
}

function AnalyticsTourPreview() {
  const { x } = useLanding()
  const { score, delta } = landingScorePreview()
  const attention = landingAttentionPreview()
  const [activeId, setActiveId] = useState<string>(attention[0]!.id)
  const active = attention.find((row) => row.id === activeId) ?? attention[0]!
  const activeDetail =
    TOUR_STOP_FIXTURES.attentionDetail[active.id as keyof typeof TOUR_STOP_FIXTURES.attentionDetail]

  return (
    <div className="p-3 sm:p-4">
      <div className="landing-score-hero rounded-xl border border-border bg-bg-elevated px-3 py-3">
        <ScoreHero score={score} delta={delta} />
      </div>
      <ul className="mt-3 grid gap-2">
        {attention.map((row) => {
          const selected = row.id === activeId
          return (
            <li key={row.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveId(row.id)}
                className={`flex w-full min-h-11 cursor-pointer flex-col gap-2 rounded-lg border px-3 py-2.5 text-left sm:flex-row sm:items-start sm:justify-between ${
                  selected
                    ? 'border-gold-border bg-gold-subtle'
                    : 'border-border bg-bg-elevated hover:border-gold-border/60'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold leading-snug text-text">{x(row.title)}</span>
                  <span className="mt-0.5 block text-xs text-text-3">{x(row.secondary)}</span>
                </span>
                <span
                  className={`${statusChipClass(ATTENTION_CHIP_TONE[row.status])} shrink-0 items-center self-start sm:self-center`}
                >
                  {row.status === 'overdue' ? (
                    <TriangleAlert size={12} strokeWidth={1.9} className="mr-[5px]" aria-hidden="true" />
                  ) : null}
                  {x(row.chipLabel)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 m-0 text-xs leading-normal text-text-2">{x(activeDetail)}</p>
    </div>
  )
}

function CommsTourPreview() {
  const { lt, x } = useLanding()
  const comm = landingCommPreview()
  const [dim, setDim] = useState<(typeof COMM_DIMS)[number] | null>(null)
  const dimLabels = {
    tone: lt('landing_ws_demo_comms_dim_tone'),
    legal: lt('landing_ws_demo_comms_dim_legal'),
    clarity: lt('landing_ws_demo_comms_dim_clarity'),
    policy: lt('landing_ws_demo_comms_dim_policy'),
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="rounded-xl border border-border bg-bg-elevated p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 font-semibold text-text">{x(comm.title)}</span>
          <span className={`${statusChipClass(comm.tone)} shrink-0`}>{x(comm.status)}</span>
        </div>
        <p className="mt-2 m-0 text-sm leading-[1.55] text-text-2">{x(comm.note)}</p>
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-2 text-[10px] font-bold tracking-[0.08em] text-text-3 uppercase">
            {lt('landing_ws_demo_comms_review')}
          </div>
          <ul className="flex flex-wrap gap-2">
            {COMM_DIMS.map((key) => {
              const passed = comm.review[key]
              const selected = dim === key
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setDim(key)}
                    className={`${statusChipClass(passed ? 'success' : 'warning')} min-h-11 cursor-pointer ${
                      selected ? 'outline-2 outline-offset-2 outline-gold-border' : ''
                    }`}
                  >
                    {dimLabels[key]} ·{' '}
                    {passed ? lt('landing_ws_demo_comms_pass') : lt('landing_ws_demo_comms_flag')}
                  </button>
                </li>
              )
            })}
          </ul>
          {dim ? (
            <p className="mt-3 m-0 text-xs leading-normal text-text-2">{x(TOUR_STOP_FIXTURES.reviewNotes[dim])}</p>
          ) : (
            <p className="mt-3 m-0 text-xs leading-normal text-text-3">{lt('landing_ws_demo_comms_tap')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
