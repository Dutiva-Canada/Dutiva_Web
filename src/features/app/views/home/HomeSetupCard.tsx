import { ChevronRight, ListTodo, X } from 'lucide-react'
import { useState } from 'react'
import { WorkspaceLink } from '@/features/app/workspaceRoot/WorkspaceLink'
import { useI18n } from '@/i18n/context'
import { homeMessages as M } from '@/i18n/messages/home'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { markEmptyWorkspaceWorkflowVisited } from '@/features/app/workspaceMode/emptyWorkspaceOnboarding'
import { remainingSetupSteps, type SetupStep } from './setupPath'

/**
 * "Keep going" card on the populated production Home — the setup path kept
 * alive after the first real record graduates Home off the welcome state.
 * Lists only remaining steps, marks the workflow step on navigation, and can
 * write the rest into the real Tasks register. Dismissible per device
 * (org-scoped localStorage); hides entirely once every step is done.
 * See docs/EMPTY_WORKSPACE_ONBOARDING.md.
 */
export function HomeSetupCard({
  steps,
  onDismiss,
  onAddStepsAsTasks,
}: {
  readonly steps: readonly SetupStep[]
  readonly onDismiss: () => void
  /** Omit for members without write access — hides the Tasks action. */
  readonly onAddStepsAsTasks?: (steps: readonly SetupStep[]) => Promise<void>
}) {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()
  const [adding, setAdding] = useState(false)
  const remaining = remainingSetupSteps(steps)

  const addTasks = async () => {
    if (adding || !onAddStepsAsTasks) return
    setAdding(true)
    try {
      await onAddStepsAsTasks(remaining)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mb-[20px] rounded-[12px] border border-border bg-surface p-[16px]">
      <div className="mb-[10px] flex items-start justify-between gap-[12px]">
        <div>
          <div className="text-[13px] font-bold text-text">{x(M.home_setup_card_title)}</div>
          <div className="mt-[2px] text-[12px] text-text-muted">
            {steps.length - remaining.length}/{steps.length} {x(M.home_setup_card_done)}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex cursor-pointer items-center gap-[5px] rounded-[7px] border-none bg-transparent px-[8px] py-[10px] font-sans text-[12px] font-semibold text-text-muted hover:bg-inset md:py-[4px]"
        >
          <X size={13} strokeWidth={2} aria-hidden="true" />
          {x(M.home_setup_card_dismiss)}
        </button>
      </div>
      <ol className="grid gap-[6px]">
        {remaining.map((step) => {
          const Icon = step.icon
          return (
            <li key={step.key}>
              <WorkspaceLink
                to={`/app/${step.to}`}
                onClick={() =>
                  step.marksWorkflowVisit && markEmptyWorkspaceWorkflowVisited(organizationId)
                }
                className="flex items-center gap-[10px] rounded-[9px] border border-border-soft bg-inset px-[12px] py-[12px] text-[12.5px] font-semibold text-text hover:border-(--accent-soft-border) md:py-[9px]"
              >
                <Icon size={14} strokeWidth={1.9} className="shrink-0 text-text-muted" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{x(step.label)}</span>
                <ChevronRight
                  size={14}
                  strokeWidth={1.9}
                  className="shrink-0 text-text-faint"
                  aria-hidden="true"
                />
              </WorkspaceLink>
            </li>
          )
        })}
      </ol>
      {onAddStepsAsTasks && (
        <button
          type="button"
          disabled={adding}
          onClick={() => void addTasks()}
          className="mt-[4px] inline-flex cursor-pointer items-center gap-[6px] rounded-[8px] border-none bg-transparent px-[2px] py-[12px] font-sans text-[12px] font-semibold text-accent hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 md:mt-[10px] md:py-[2px]"
        >
          <ListTodo size={13} strokeWidth={1.9} aria-hidden="true" />
          {adding ? x(M.home_setup_adding_tasks) : x(M.home_setup_add_tasks)}
        </button>
      )}
    </div>
  )
}
