import { useI18n } from '@/i18n/context'
import { workflowsMessages as M } from '@/i18n/messages/workflows'
import type { AdvisorStartFlowNavState } from '@/features/app/views/advisor/advisorNav'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import { workflowCatalog } from './workflowsData'

/**
 * "Start a workflow" launcher grid — shared by the demo fixtures and the
 * production Workflows view. Every tile lands on a real surface: a guided
 * flow runner (`flowSlug`) or an Advisor conversation seeded with the
 * workflow's opening prompt. The tiles are entry points, not sample data,
 * so they ship in both workspace modes.
 */
export function WorkflowCatalogGrid() {
  const { x } = useI18n()
  const navigate = useWorkspaceNavigate()

  return (
    <>
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
              item.flowSlug !== undefined
                ? navigate(`/app/workflows/${item.flowSlug}`)
                : navigate('/app/advisor', {
                    state: {
                      prompt: item.query,
                      flowKey: item.flowKey,
                    } satisfies AdvisorStartFlowNavState,
                  })
            }
            className="flex cursor-pointer flex-col items-start gap-[9px] rounded-[12px] border border-border bg-surface p-[14px] text-left font-sans transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-(--accent-soft-border) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <div className="flex h-[29px] w-[29px] items-center justify-center rounded-[8px] bg-navy text-gold-on-navy">
              <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-[6px] text-[13px] font-bold text-text">
                {x(item.label)}
                {item.flowSlug !== undefined && (
                  <span className="rounded-[4px] bg-accent-soft px-[5px] py-px text-[9.5px] font-bold tracking-[.05em] text-accent uppercase">
                    {x(M.workflows_guided)}
                  </span>
                )}
              </div>
              <div className="mt-[2px] text-[11.5px] text-text-muted">{x(item.sub)}</div>
            </div>
          </button>
        )
      })}
      </div>
    </>
  )
}
