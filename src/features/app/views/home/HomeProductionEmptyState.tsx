import { Check, ListTodo, Sparkles } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { Disclaimer } from '@/components/Disclaimer'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { SuggestionChips } from '@/features/app/advisor/SuggestionChips'
import { homeMessages as M } from '@/i18n/messages/home'
import type { WorkspaceIdentity } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  markEmptyWorkspaceWorkflowVisited,
  readEmptyWorkspaceProgress,
} from '@/features/app/workspaceMode/emptyWorkspaceOnboarding'
import {
  computeSetupSteps,
  remainingSetupSteps,
  type SetupDataSignals,
  type SetupStep,
} from './setupPath'
import { HomeOrgProfileSetup } from './HomeOrgProfileSetup'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Home in production mode — the app's "reset stage": no Northgate Logistics
 * Inc. sample data, just a real, empty workspace and the setup path — five
 * foundation-first steps derived from live org data (profile, documents,
 * policies, guided processes, then people when ready). Remaining steps can
 * be written into the real Tasks register, and Advisor prompts sit under the
 * composer for "tell me what to do" questions. Steps that finish stay
 * visible as the Keep-going card once records exist (HomeSetupCard).
 * See docs/EMPTY_WORKSPACE_ONBOARDING.md.
 */
export function HomeProductionEmptyState({
  identity,
  onSend,
  signals,
  onAddStepsAsTasks,
  afterChecklist,
  title,
  body,
}: {
  readonly identity: WorkspaceIdentity
  readonly onSend: (text: string) => void
  /** Live org signals feeding step completion (workflow visit is read here). */
  readonly signals: SetupDataSignals
  /** Writes remaining steps as real tasks; parent refreshes stats after. */
  readonly onAddStepsAsTasks: (steps: readonly SetupStep[]) => Promise<void>
  /** Optional strip below the checklist (e.g. plan upgrade nudge). */
  readonly afterChecklist?: ReactNode
  /** Override the default empty-state title and body for role-specific Home. */
  readonly title?: Bi
  readonly body?: Bi
}) {
  const { x } = useI18n()
  const { root } = useWorkspaceRoot()
  const { organizationId, isOrgAdmin } = useWorkspaceMode()
  const [progress, setProgress] = useState(() => readEmptyWorkspaceProgress(organizationId))
  const [addingTasks, setAddingTasks] = useState(false)

  useEffect(() => {
    setProgress(readEmptyWorkspaceProgress(organizationId))
  }, [organizationId])

  const steps = computeSetupSteps({
    ...signals,
    workflowVisited: progress.workflowVisited,
  })
  const remaining = remainingSetupSteps(steps)

  const addTasks = async () => {
    if (addingTasks) return
    setAddingTasks(true)
    try {
      await onAddStepsAsTasks(remaining)
    } finally {
      setAddingTasks(false)
    }
  }

  return (
    <AppPage width="narrow" responsivePad innerClassName="pt-[48px] text-center">
      <div className="mx-auto mb-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-accent-soft">
        <Sparkles size={20} strokeWidth={1.7} className="text-accent" aria-hidden="true" />
      </div>
      <div className="mb-[10px] text-[11px] font-bold tracking-[0.09em] text-text-faint uppercase">
        {x(M.home_production_workspace_label)}: {identity.companyName}
      </div>
      <h1 className="m-0 mb-[10px] font-display text-[22px] font-semibold text-text">
        {x(title ?? M.home_production_title)}
      </h1>
      <p className="m-0 mb-[24px] text-[13.5px] leading-[1.6] text-text-muted">
        {x(body ?? M.home_production_body)}
      </p>

      {/* Step 1 inline — until the org has a jurisdiction, the basics are
          the first thing on the page, not a link away. */}
      {!signals.jurisdictionsConfigured && <HomeOrgProfileSetup />}

      <div className="mb-[10px] text-left text-[11px] font-bold tracking-wider text-text-muted uppercase">
        {x(M.home_setup_label)}
      </div>
      <ol className="mb-[12px] grid gap-[8px] text-left">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <li key={step.key}>
              <Link
                to={workspacePath(root, step.to)}
                onClick={() => {
                  if (!step.marksWorkflowVisit) return
                  markEmptyWorkspaceWorkflowVisited(organizationId)
                  setProgress(readEmptyWorkspaceProgress(organizationId))
                }}
                className="flex items-start gap-[12px] rounded-[10px] border border-border bg-surface px-[14px] py-[12px] text-text hover:border-(--accent-soft-border)"
              >
                <span
                  className={
                    step.done
                      ? 'mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-ok-border bg-ok-bg text-ok-fg'
                      : 'mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-border bg-inset text-[11px] font-bold text-text-muted'
                  }
                  aria-hidden="true"
                >
                  {step.done ? <Check size={12} strokeWidth={2.6} /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-[7px] text-[13px] font-semibold">
                    <Icon size={14} strokeWidth={1.9} aria-hidden="true" className="shrink-0" />
                    {x(step.label)}
                  </span>
                  <span className="mt-[2px] block text-[12px] leading-[1.45] text-text-muted">
                    {x(step.hint)}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>

      {isOrgAdmin && remaining.length > 0 && (
        <div className="mb-[16px] text-left">
          <button
            type="button"
            disabled={addingTasks}
            onClick={() => void addTasks()}
            className="inline-flex cursor-pointer items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[14px] py-[12px] font-sans text-[12.5px] font-semibold text-text hover:border-(--accent-soft-border) disabled:cursor-not-allowed disabled:opacity-60 md:py-[9px]"
          >
            <ListTodo size={14} strokeWidth={1.9} aria-hidden="true" />
            {addingTasks ? x(M.home_setup_adding_tasks) : x(M.home_setup_add_tasks)}
          </button>
        </div>
      )}

      <p className="m-0 mb-[22px] text-[12.5px] leading-[1.5] text-text-muted">
        <Link
          to={workspacePath(root, 'settings')}
          className="font-semibold text-accent hover:opacity-80"
        >
          {x(M.home_production_demo_link)}
        </Link>
      </p>

      {afterChecklist ? <div className="mb-[22px] text-left">{afterChecklist}</div> : null}

      <div className="mb-[8px] text-left text-[11px] font-bold tracking-wider text-text-muted uppercase">
        {x(M.home_setup_ask_label)}
      </div>
      <div className="mb-[16px] text-left">
        <SuggestionChips
          chips={[
            { label: M.home_setup_prompt_solo, onClick: () => onSend(x(M.home_setup_prompt_solo)) },
            {
              label: M.home_setup_prompt_first_hire,
              onClick: () => onSend(x(M.home_setup_prompt_first_hire)),
            },
          ]}
        />
      </div>

      <div className="rounded-[14px] shadow-float">
        <ChatComposer
          variant="chat"
          placeholder={x(M.home_composer_placeholder)}
          onSend={onSend}
          // No autofocus on phones: it would pop the keyboard on arrival and
          // cover the setup path the page exists to show.
          autoFocus={
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(min-width: 768px)').matches
          }
        />
      </div>
      <Disclaimer className="mt-[8px] text-center" />
    </AppPage>
  )
}
