import { ProgressFill } from '@/components/ProgressFill'
import { useI18n } from '@/i18n/context'
import { homeMessages as M } from '@/i18n/messages/home'
import { statusChipBaseClass, chipToneClass } from '@/components/chips'
import { inFlightWorkflows } from '@/features/app/views/workflows/workflowsData'
import type { InFlightWorkflow, WorkflowNav } from '@/features/app/views/workflows/workflowsData'
import type { HomeAction } from './homeData'

/**
 * WorkflowCards — the "Workflows in flight" list. Two placements, per the
 * prototype's Home markup: `rail` (desktop right column, lines 517–532) and
 * `mobile` (after Act now on phones, lines 430–445). Rows come from the
 * workflows feature's canonical `inFlightWorkflows`.
 */

/** Row navigation (prototype `openCase` / `selectChat`) as a Home action. */
function navToAction(nav: WorkflowNav): HomeAction {
  return nav.kind === 'case'
    ? { kind: 'route', to: `/app/cases/${nav.caseId}` }
    : { kind: 'chat', chatId: nav.chatId }
}

function WorkflowRisk({ w, small }: { readonly w: InFlightWorkflow; readonly small: boolean }) {
  const { x } = useI18n()
  if (!w.riskLabel) return null
  return (
    <span
      className={`${statusChipBaseClass} ${chipToneClass(w.riskTone)} ${
        small ? 'px-[8px] py-px text-[10.5px]' : ''
      }`}
    >
      {x(w.riskLabel)}
    </span>
  )
}

function WorkflowProgress({
  w,
  gapTop,
}: {
  readonly w: InFlightWorkflow
  readonly gapTop: string
}) {
  const { x } = useI18n()
  return (
    <div className={`flex items-center gap-[8px] ${gapTop}`}>
      <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-inset">
        <ProgressFill
          pct={Math.round((w.step / w.of) * 100)}
          className="h-full w-full rounded-full text-navy"
        />
      </div>
      <span className="text-[11px] font-bold whitespace-nowrap text-text-3">{x(w.stepLabel)}</span>
    </div>
  )
}

function WorkflowMetaLines({ w }: { readonly w: InFlightWorkflow }) {
  const { x } = useI18n()
  return (
    <>
      <div className="mt-[4px] text-[11.5px] text-text-3">
        <span className="text-text-muted">{x(M.home_wf_next)}</span> · {x(w.next)}
      </div>
      <div className="mt-[3px] text-[10.5px] text-text-muted">
        {x(w.dueLabel)} · {x(w.docsLabel)} · <span className="text-gold-fg">{x(w.impact)}</span>
      </div>
    </>
  )
}

/** Desktop right-rail card (`showRailWorkflows`). */
export function HomeWorkflowsRailCard({
  onAction,
}: {
  readonly onAction: (action: HomeAction) => void
}) {
  const { x } = useI18n()
  return (
    <div className="hidden rounded-[12px] border border-border bg-surface px-[16px] py-[15px] sm:block">
      <div className="mb-[11px] flex items-baseline justify-between">
        <span className="text-[12.5px] font-bold text-text">{x(M.home_wf_title)}</span>
        <button
          type="button"
          onClick={() => onAction({ kind: 'route', to: '/app/workflows' })}
          className="cursor-pointer border-none bg-transparent p-0 font-sans text-[11.5px] font-semibold text-gold-fg"
        >
          {x(M.home_wf_all)}
        </button>
      </div>
      <div className="flex flex-col gap-[13px]">
        {inFlightWorkflows.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onAction(navToAction(w.open))}
            className="block w-full cursor-pointer border-none bg-transparent p-0 text-left font-sans"
          >
            <div className="flex flex-wrap items-center gap-[7px]">
              <span className="text-[12.5px] font-semibold text-text">{x(w.name)}</span>
              <WorkflowRisk w={w} small />
              <span className="ml-auto overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-text-muted">
                {x(w.person)}
              </span>
            </div>
            <WorkflowProgress w={w} gapTop="mt-[5px]" />
            <WorkflowMetaLines w={w} />
          </button>
        ))}
      </div>
    </div>
  )
}

/** Mobile list, directly after Act now (`showMobileWorkflows`). */
export function HomeWorkflowsMobileList({
  onAction,
}: {
  readonly onAction: (action: HomeAction) => void
}) {
  const { x } = useI18n()
  return (
    <div className="sm:hidden">
      <div className="mb-[7px] flex items-baseline justify-between">
        <span className="font-display text-[12.5px] font-semibold text-gold-fg">
          {x(M.home_wf_title)}
        </span>
        <button
          type="button"
          onClick={() => onAction({ kind: 'route', to: '/app/workflows' })}
          className="cursor-pointer border-none bg-transparent p-0 font-sans text-[11.5px] font-semibold text-gold-fg"
        >
          {x(M.home_wf_all)}
        </button>
      </div>
      <div className="rounded-[12px] border border-border bg-surface px-[14px] py-[4px]">
        {inFlightWorkflows.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onAction(navToAction(w.open))}
            className="block w-full cursor-pointer border-t border-t-border-soft bg-transparent py-[11px] text-left font-sans"
          >
            <div className="flex flex-wrap items-center gap-[8px]">
              <span className="text-[12.5px] font-semibold text-text">{x(w.name)}</span>
              <WorkflowRisk w={w} small={false} />
              <span className="ml-auto text-[11px] text-text-muted">{x(w.person)}</span>
            </div>
            <WorkflowProgress w={w} gapTop="mt-[6px]" />
            <WorkflowMetaLines w={w} />
          </button>
        ))}
      </div>
    </div>
  )
}
