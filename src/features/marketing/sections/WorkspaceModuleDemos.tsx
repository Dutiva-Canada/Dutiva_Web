import { Link } from 'react-router-dom'
import { ChevronRight, TriangleAlert } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { ScoreHero } from '@/features/app/views/analytics/ScoreHero'
import { SectionIntro } from '../SectionIntro'
import { useLanding } from '../useLanding'
import { usePublicPath } from '@/seo/usePublicPath'
import { useI18n } from '@/i18n/context'
import {
  landingAttentionPreview,
  landingCasePreview,
  landingCommPreview,
  landingScorePreview,
} from '../demos/workspaceDemoModel'

const ATTENTION_CHIP_TONE = { overdue: 'risk', due_soon: 'warning', upcoming: 'neutral' } as const

const COMM_DIMS = ['tone', 'legal', 'clarity', 'policy'] as const

/** Static workspace module frames on the landing page — fixture data, links to `/demo`. */
export function WorkspaceModuleDemos() {
  const { lt } = useLanding()
  const { x } = useI18n()
  const { p } = usePublicPath()
  const demoRoot = p('demoWorkspace')

  const { score, delta } = landingScorePreview()
  const attention = landingAttentionPreview()
  const caseFile = landingCasePreview()
  const comm = landingCommPreview()

  const dimLabels = {
    tone: lt('landing_ws_demo_comms_dim_tone'),
    legal: lt('landing_ws_demo_comms_dim_legal'),
    clarity: lt('landing_ws_demo_comms_dim_clarity'),
    policy: lt('landing_ws_demo_comms_dim_policy'),
  }

  return (
    <section
      id="workspace-demos"
      className="mx-auto max-w-300 scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16"
    >
      <SectionIntro
        badge={lt('landing_ws_demo_badge')}
        title={lt('landing_ws_demo_title')}
        sub={lt('landing_ws_demo_sub')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Analytics */}
        <article className="premium-card-soft flex min-w-0 flex-col p-4 sm:p-5">
          <h3 className="text-base font-semibold text-text">{lt('landing_ws_demo_analytics_title')}</h3>
          <p className="mt-1 text-sm leading-[1.55] text-text-2">{lt('landing_ws_demo_analytics_sub')}</p>
          <div className="mt-4 rounded-xl border border-border bg-bg-soft p-3 sm:p-4">
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
                </li>
              ))}
            </ul>
          </div>
          <DemoFooter to={`${demoRoot}/analytics`} label={lt('landing_ws_demo_open')} />
        </article>

        {/* Cases */}
        <article className="premium-card-soft flex min-w-0 flex-col p-4 sm:p-5">
          <h3 className="text-base font-semibold text-text">{lt('landing_ws_demo_cases_title')}</h3>
          <p className="mt-1 text-sm leading-[1.55] text-text-2">{lt('landing_ws_demo_cases_sub')}</p>
          <div className="mt-4 rounded-xl border border-border bg-bg-soft p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 font-semibold text-text">{x(caseFile.title)}</span>
              <span className={`${statusChipClass(caseFile.tone)} shrink-0`}>{x(caseFile.status)}</span>
            </div>
            <p className="mt-2 text-sm leading-[1.55] text-text-2">{x(caseFile.summary)}</p>
            <p className="mt-3 border-t border-border pt-3 text-xs text-text-3">
              <span className="font-semibold text-text-2">{lt('landing_ws_demo_case_next')}: </span>
              {x(caseFile.nextStep)}
            </p>
          </div>
          <DemoFooter to={`${demoRoot}/cases/${caseFile.id}`} label={lt('landing_ws_demo_open')} />
        </article>

        {/* Communications */}
        <article className="premium-card-soft flex min-w-0 flex-col p-4 sm:p-5">
          <h3 className="text-base font-semibold text-text">{lt('landing_ws_demo_comms_title')}</h3>
          <p className="mt-1 text-sm leading-[1.55] text-text-2">{lt('landing_ws_demo_comms_sub')}</p>
          <div className="mt-4 rounded-xl border border-border bg-bg-soft p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 font-semibold text-text">{x(comm.title)}</span>
              <span className={`${statusChipClass(comm.tone)} shrink-0`}>{x(comm.status)}</span>
            </div>
            <p className="mt-2 text-sm leading-[1.55] text-text-2">{x(comm.note)}</p>
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-2 text-[10px] font-bold tracking-[0.08em] text-text-3 uppercase">
                {lt('landing_ws_demo_comms_review')}
              </div>
              <ul className="flex flex-wrap gap-2">
                {COMM_DIMS.map((dim) => {
                  const passed = comm.review[dim]
                  return (
                    <li
                      key={dim}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        passed
                          ? 'border-ok-border bg-ok-bg text-ok-fg'
                          : 'border-warn-border bg-warn-bg text-warn-fg'
                      }`}
                    >
                      {dimLabels[dim]} ·{' '}
                      {passed ? lt('landing_ws_demo_comms_pass') : lt('landing_ws_demo_comms_flag')}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <DemoFooter to={`${demoRoot}/communications`} label={lt('landing_ws_demo_open')} />
        </article>
      </div>

      <p className="mt-4 text-xs leading-normal text-text-faint">{lt('landing_ws_demo_preview_note')}</p>
    </section>
  )
}

function DemoFooter({ to, label }: { readonly to: string; readonly label: string }) {
  return (
    <div className="mt-4 pt-1">
      <Link
        to={to}
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
      >
        {label}
        <ChevronRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}
