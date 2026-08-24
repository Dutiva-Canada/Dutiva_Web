import { ProgressFill } from '@/components/ProgressFill'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Check, File, Route, Share2, Star, User } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { Disclaimer } from '@/components/Disclaimer'
import type { Bi } from '@/i18n/core'
import { workflowsMessages as M } from '@/i18n/messages/workflows'
import { flowsMessages as F } from '@/i18n/messages/flows'
import { flows } from '@/features/app/flows/data'
import type { AdvisorSearchNavState } from '@/features/app/search/searchCorpus'
import type { AdvisorStartFlowNavState } from '@/features/app/views/advisor/advisorNav'
import { chipToneClass, statusChipClass } from '@/components/chips'
import { inFlightWorkflows, terminationStages, workflowCatalog } from './workflowsData'
import type { TerminationStageState, WorkflowChipTone, WorkflowNav } from './workflowsData'

/**
 * Workflows view — guided multi-step HR processes (prototype markup 548–627,
 * `buildWorkflowsView()` + `buildTerminationMap()`): the in-flight rows with
 * progress/risk/meta, the flagship termination map (expandable, starts open —
 * prototype `wfMapOpen: true`), and the start-a-workflow catalog grid.
 *
 * Since the guided flows landed (`src/features/app/flows/`) this view handles
 * both workspace modes itself rather than being route-gated: the flow list is
 * real content and a production workspace needs to reach it, while everything
 * from the prototype stays demo-only.
 */

/* Map-stage chip per state (prototype `chipFor`). */
const stageChips: Record<TerminationStageState, { tone: WorkflowChipTone; label: Bi }> = {
  done: { tone: 'success', label: M.workflows_chip_done },
  current: { tone: 'info', label: M.workflows_chip_in_progress },
  partial: { tone: 'info', label: M.workflows_chip_partial },
  waiting: { tone: 'warning', label: M.workflows_chip_waiting },
  upcoming: { tone: 'neutral', label: M.workflows_chip_upcoming },
  always: { tone: 'neutral', label: M.workflows_chip_continuous },
}

/** 22px stage marker: green check (done), navy number (current/partial),
 *  amber number (waiting), flat number (upcoming/always). */
function StageMarker({ n, state }: { readonly n: number; readonly state: TerminationStageState }) {
  const base = 'mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full'
  if (state === 'done') {
    return (
      <div className={`${base} border border-ok-border bg-ok-bg text-ok-fg`}>
        <Check size={11} strokeWidth={2.6} aria-hidden="true" />
      </div>
    )
  }
  if (state === 'current' || state === 'partial') {
    return <div className={`${base} bg-navy text-[10.5px] font-bold text-gold-on-navy`}>{n}</div>
  }
  if (state === 'waiting') {
    return (
      <div
        className={`${base} border border-warn-border bg-warn-bg text-[10.5px] font-bold text-warn-fg`}
      >
        {n}
      </div>
    )
  }
  return <div className={`${base} bg-inset text-[10.5px] font-bold text-text-muted`}>{n}</div>
}

/**
 * The guided flows the product actually ships (`src/features/app/flows/`).
 * Everything else on this view is fixture content ported from the prototype;
 * these run.
 */
function GuidedProcesses() {
  const { x } = useI18n()
  if (flows.length === 0) return null

  return (
    <div className="mb-[24px]">
      <div className="mb-[8px] text-[11px] font-bold tracking-wider text-text-muted uppercase">
        {x(F.flows_section_label)} · {flows.length}
      </div>
      <p className="mb-[10px] text-[12.5px] text-text-muted">{x(F.flows_section_intro)}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[10px]">
        {flows.map((flow) => (
          <Link
            key={flow.slug}
            to={`/app/workflows/${flow.slug}`}
            className="flex flex-col gap-[5px] rounded-[12px] border border-border bg-surface px-[16px] py-[14px]"
          >
            <span className="flex items-center gap-[8px]">
              <Route
                size={14}
                strokeWidth={1.9}
                className="shrink-0 text-gold-fg"
                aria-hidden="true"
              />
              <span className="text-[13.5px] font-semibold text-text">{x(flow.title)}</span>
            </span>
            <span className="text-[12.5px] leading-[1.5] text-text-muted">{x(flow.summary)}</span>
            <span className="mt-[3px] text-[11.5px] font-semibold text-accent">
              {x(F.flows_start)} · {flow.estMinutes} {x(F.flows_minutes)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function WorkflowsView() {
  const { x } = useI18n()
  const navigate = useNavigate()
  const { mode } = useWorkspaceMode()
  /* Prototype initial state: `wfMapOpen: true` (App v2.dc.html 2409). */
  const [mapOpen, setMapOpen] = useState(true)

  /* This view is no longer route-gated: the guided processes are real and a
     production workspace should reach them. Everything below them is
     prototype fixture content — Northgate's in-flight rows, the termination
     map built from them, and the Advisor catalogue — and has nothing to say
     about a real, empty workspace. */
  const showFixtures = mode === 'demo'

  const openWorkflow = (nav: WorkflowNav) => {
    if (nav.kind === 'case') {
      navigate(`/app/cases/${nav.caseId}`)
    } else {
      navigate('/app/advisor', {
        state: { chatId: nav.chatId } satisfies AdvisorSearchNavState,
      })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-[32px] pt-[28px] pb-[60px]">
      <div className="mx-auto max-w-[900px]">
        {/* Header */}
        <div className="mb-[20px]">
          <h1 className="mb-[5px] font-display text-[21px] font-semibold text-text">
            {x(M.workflows_title)}
          </h1>
          <p className="max-w-[620px] text-[13.5px] text-text-muted">{x(M.workflows_sub)}</p>
        </div>

        {/* Guided processes — real content, unlike everything below it on
            this page, and the only section a production workspace renders. */}
        <GuidedProcesses />

        {!showFixtures && (
          <p className="mb-[24px] max-w-[620px] text-[13px] leading-[1.6] text-text-muted">
            {x(M.workflows_prod_intro)}
          </p>
        )}

        {showFixtures && (
          <>
            {/* In-flight rows */}
            <div className="mb-[8px] text-[11px] font-bold tracking-wider text-text-muted uppercase">
              {x(M.workflows_inflight_title)} · {inFlightWorkflows.length}
            </div>
            <div className="mb-[24px] overflow-hidden rounded-[12px] border border-border bg-surface">
              {inFlightWorkflows.map((w) => (
                <div key={w.id} className="border-t border-inset px-[16px] py-[14px]">
                  <div className="flex flex-wrap items-center gap-[14px]">
                    <div className="min-w-[180px] flex-[1.2_1_180px]">
                      <div className="flex flex-wrap items-center gap-[8px]">
                        <span className="text-[13.5px] font-bold text-text">{x(w.name)}</span>
                        {w.riskLabel && (
                          <span className={statusChipClass(w.riskTone)}>{x(w.riskLabel)}</span>
                        )}
                      </div>
                      <div className="mt-[2px] text-[12px] text-text-muted">
                        {`${x(w.person)} · ${x(w.where)}`}
                      </div>
                    </div>
                    <div className="min-w-[160px] flex-[1_1_160px]">
                      <div className="flex items-center gap-[8px]">
                        <div className="h-[6px] flex-1 overflow-hidden rounded-[100px] bg-inset">
                          <ProgressFill
                            pct={Math.round((w.step / w.of) * 100)}
                            className="h-full w-full rounded-[100px] text-navy"
                          />
                        </div>
                        <span className="text-[11px] font-bold whitespace-nowrap text-text-3">
                          {x(w.stepLabel)}
                        </span>
                      </div>
                      <div className="mt-[4px] overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap text-text-muted">
                        {x(w.currentStep)}
                      </div>
                    </div>
                    <div className="min-w-[170px] flex-[1_1_170px] text-[12px] text-text-3">
                      <span className="text-text-muted">{x(M.workflows_next)}</span>
                      {` · ${x(w.next)}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => openWorkflow(w.open)}
                      className="shrink-0 cursor-pointer rounded-[7px] border-none bg-navy px-[13px] py-[7px] font-sans text-[12px] font-bold text-white hover:opacity-[.92]"
                    >
                      {x(M.workflows_continue)}
                    </button>
                  </div>
                  <div className="mt-[9px] flex flex-wrap items-center gap-[14px] border-t border-dashed border-border-soft pt-[9px] text-[11.5px] text-text-muted">
                    <span className="inline-flex items-center gap-[5px]">
                      <User size={12} strokeWidth={1.8} aria-hidden="true" />
                      {x(w.ownerLabel)}
                    </span>
                    <span className="inline-flex items-center gap-[5px]">
                      <Calendar size={12} strokeWidth={1.8} aria-hidden="true" />
                      {x(w.dueLabel)}
                    </span>
                    <span className="inline-flex items-center gap-[5px]">
                      <File size={12} strokeWidth={1.8} aria-hidden="true" />
                      {x(w.docsLabel)}
                    </span>
                    <span className="inline-flex items-center gap-[5px] text-gold-fg">
                      <Star size={12} strokeWidth={1.8} aria-hidden="true" />
                      {x(w.impact)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Flagship end-to-end map (Termination) */}
            <div className="mb-[24px] overflow-hidden rounded-[14px] border border-gold-border bg-surface">
              <div className="flex flex-wrap items-center gap-[12px] bg-gold-bg px-[18px] py-[15px]">
                <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px] bg-navy">
                  {/* Prototype icon: two nodes merging right — Share2 mirrored. */}
                  <Share2
                    size={15}
                    strokeWidth={1.8}
                    className="-scale-x-100 text-gold-on-navy"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-[200px] flex-1">
                  <div className="text-[10.5px] font-bold tracking-[.06em] text-gold-dot uppercase">
                    {x(M.workflows_flagship_eyebrow)}
                  </div>
                  <div className="mt-px text-[14.5px] font-bold text-text">
                    {x(M.workflows_flagship_title)}
                  </div>
                  <div className="mt-px text-[11.5px] text-text-muted">
                    {x(M.workflows_flagship_sub)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMapOpen((open) => !open)}
                  aria-expanded={mapOpen}
                  className="shrink-0 cursor-pointer rounded-[7px] border border-gold-border bg-surface px-[12px] py-[6px] font-sans text-[12px] font-semibold text-gold-fg"
                >
                  {mapOpen ? x(M.workflows_flagship_collapse) : x(M.workflows_flagship_expand)}
                </button>
              </div>
              {mapOpen && (
                <div className="px-[18px] pt-[6px] pb-[14px]">
                  {terminationStages.map((st) => {
                    const chip = stageChips[st.state]
                    return (
                      <div
                        key={st.n}
                        className="flex items-start gap-[12px] border-b border-border-soft py-[12px] sm:py-[10px]"
                      >
                        <StageMarker n={st.n} state={st.state} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-[8px] sm:gap-[12px]">
                            <span className="text-[13px] font-semibold text-text">
                              {x(st.title)}
                            </span>
                            <span
                              className={`inline-flex rounded-[100px] px-[9px] py-[2px] text-[11px] font-semibold whitespace-nowrap ${chipToneClass(chip.tone)}`}
                            >
                              {x(chip.label)}
                            </span>
                          </div>
                          <div className="mt-[2px] text-[12px] leading-normal text-text-3">
                            {x(st.sub)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="mt-[12px] flex flex-wrap items-center gap-[12px]">
                    <button
                      type="button"
                      onClick={() => navigate('/app/cases/case1')}
                      className="cursor-pointer rounded-[8px] border-none bg-navy px-[15px] py-[8px] font-sans text-[12.5px] font-bold text-white hover:opacity-[.92]"
                    >
                      {x(M.workflows_flagship_cta)}
                    </button>
                    <div className="min-w-[220px] flex-1 text-[11px] text-text-faint">
                      {x(M.workflows_flagship_note)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Start-a-workflow catalog */}
            <div className="mb-[8px] text-[11px] font-bold tracking-wider text-text-muted uppercase">
              {x(M.workflows_start_title)}
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[11px]">
              {workflowCatalog.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      /* A tile with a guided flow behind it opens that; the rest
                     keep the prototype's startFlow(key, query) — explicit key
                     + Bi prompt so FR routes correctly and live toggles
                     re-localize. */
                      item.flowSlug !== undefined
                        ? navigate(`/app/workflows/${item.flowSlug}`)
                        : navigate('/app/advisor', {
                            state: {
                              prompt: item.query,
                              flowKey: item.flowKey,
                            } satisfies AdvisorStartFlowNavState,
                          })
                    }
                    className="flex cursor-pointer flex-col items-start gap-[9px] rounded-[12px] border border-border bg-surface p-[14px] text-left font-sans transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-(--accent-soft-border)"
                  >
                    <div className="flex h-[29px] w-[29px] items-center justify-center rounded-[8px] bg-navy text-gold-on-navy">
                      <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-text">{x(item.label)}</div>
                      <div className="mt-[2px] text-[11.5px] text-text-muted">{x(item.sub)}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <Disclaimer className="mt-[18px]" />
      </div>
    </div>
  )
}
