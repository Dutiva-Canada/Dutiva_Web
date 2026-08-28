import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Route } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { markEmptyWorkspaceWorkflowVisited } from '@/features/app/workspaceMode/emptyWorkspaceOnboarding'
import { Disclaimer } from '@/components/Disclaimer'
import { workflowsMessages as M } from '@/i18n/messages/workflows'
import { flowsMessages as F } from '@/i18n/messages/flows'
import { calculatorFlows, guideFlows } from '@/features/app/flows/data'
import type { Flow } from '@/features/app/flows/flowModel'
import { AppPage, AppPageLead } from '@/features/app/shell/AppPage'
import { WorkflowsDemoFixtures } from './WorkflowsDemoFixtures'

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

function FlowCardGrid({ items }: { readonly items: readonly Flow[] }) {
  const { x } = useI18n()
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[10px]">
      {items.map((flow) => (
        <Link
          key={flow.slug}
          to={`/app/workflows/${flow.slug}`}
          className="flex flex-col gap-[5px] rounded-[12px] border border-border bg-surface px-[16px] py-[14px] transition-[border-color,background-color] hover:border-(--accent-soft-border) hover:bg-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
  )
}

function GuidedProcesses() {
  const { x } = useI18n()
  if (calculatorFlows.length === 0 && guideFlows.length === 0) return null

  return (
    <div className="mb-[24px] flex flex-col gap-[22px]">
      {calculatorFlows.length > 0 && (
        <div>
          <div className="mb-[8px] text-[11px] font-bold tracking-wider text-text-muted uppercase">
            {x(F.flows_section_calculators)} · {calculatorFlows.length}
          </div>
          <p className="mb-[10px] text-[12.5px] text-text-muted">
            {x(F.flows_section_calculators_intro)}
          </p>
          <FlowCardGrid items={calculatorFlows} />
        </div>
      )}
      {guideFlows.length > 0 && (
        <div>
          <div className="mb-[8px] text-[11px] font-bold tracking-wider text-text-muted uppercase">
            {x(F.flows_section_guides)} · {guideFlows.length}
          </div>
          <p className="mb-[10px] text-[12.5px] text-text-muted">
            {x(F.flows_section_guides_intro)}
          </p>
          <FlowCardGrid items={guideFlows} />
        </div>
      )}
    </div>
  )
}

export function WorkflowsView() {
  const { x } = useI18n()
  const { mode, organizationId } = useWorkspaceMode()

  useEffect(() => {
    if (mode === 'production') markEmptyWorkspaceWorkflowVisited(organizationId)
  }, [mode, organizationId])

  const showFixtures = mode === 'demo'

  return (
    <AppPage width="default">
      <AppPageLead>{x(M.workflows_sub)}</AppPageLead>
      <GuidedProcesses />
      {!showFixtures && (
        <p className="mb-[24px] max-w-[620px] text-[13px] leading-[1.6] text-text-muted">
          {x(M.workflows_prod_intro)}
        </p>
      )}
      {showFixtures && <WorkflowsDemoFixtures />}
      <Disclaimer className="mt-[18px]" />
    </AppPage>
  )
}
