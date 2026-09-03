import { Check, FileStack, Route, Sparkles, Users } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { Disclaimer } from '@/components/Disclaimer'
import { ChatComposer } from '@/features/app/advisor/ChatComposer'
import { homeMessages as M } from '@/i18n/messages/home'
import { flowsMessages as F } from '@/i18n/messages/flows'
import type { WorkspaceIdentity } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  markEmptyWorkspaceStudioVisited,
  markEmptyWorkspaceWorkflowVisited,
  readEmptyWorkspaceProgress,
} from '@/features/app/workspaceMode/emptyWorkspaceOnboarding'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Home in production mode — the app's "reset stage": no Northgate Logistics
 * Inc. sample data, just a real, empty workspace and a three-step first-run
 * checklist (people, Studio, guided processes) plus the Advisor composer.
 * See docs/EMPTY_WORKSPACE_ONBOARDING.md.
 */
export function HomeProductionEmptyState({
  identity,
  onSend,
  employeeCount = 0,
  afterChecklist,
}: {
  readonly identity: WorkspaceIdentity
  readonly onSend: (text: string) => void
  /** Live employee count — usually 0 while this empty Home is shown. */
  readonly employeeCount?: number
  /** Optional strip below the checklist (e.g. plan upgrade nudge). */
  readonly afterChecklist?: ReactNode
}) {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()
  const [session, setSession] = useState(() => readEmptyWorkspaceProgress(organizationId))

  useEffect(() => {
    setSession(readEmptyWorkspaceProgress(organizationId))
  }, [organizationId])

  const steps = [
    {
      key: 'person',
      done: employeeCount > 0,
      to: '/app/employees?new=1',
      label: M.home_production_step_person,
      hint: M.home_production_step_person_hint,
      icon: Users,
      onNavigate: undefined as (() => void) | undefined,
    },
    {
      key: 'studio',
      done: session.studioVisited,
      to: '/app/documents/studio',
      label: M.home_production_step_studio,
      hint: M.home_production_step_studio_hint,
      icon: FileStack,
      onNavigate: () => {
        markEmptyWorkspaceStudioVisited(organizationId)
        setSession(readEmptyWorkspaceProgress(organizationId))
      },
    },
    {
      key: 'workflow',
      done: session.workflowVisited,
      to: '/app/workflows/statutory-notice-ontario',
      label: M.home_production_step_workflow,
      hint: M.home_production_step_workflow_hint,
      icon: Route,
      onNavigate: () => {
        markEmptyWorkspaceWorkflowVisited(organizationId)
        setSession(readEmptyWorkspaceProgress(organizationId))
      },
    },
  ] as const

  return (
    <AppPage width="narrow" responsivePad innerClassName="pt-[48px] text-center">
      <div className="mx-auto mb-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-accent-soft">
        <Sparkles size={20} strokeWidth={1.7} className="text-accent" aria-hidden="true" />
      </div>
      <div className="mb-[10px] text-[11px] font-bold tracking-[0.09em] text-text-faint uppercase">
        {x(M.home_production_workspace_label)}: {identity.companyName}
      </div>
      <h1 className="m-0 mb-[10px] font-display text-[22px] font-semibold text-text">
        {x(M.home_production_title)}
      </h1>
      <p className="m-0 mb-[24px] text-[13.5px] leading-[1.6] text-text-muted">
        {x(M.home_production_body)}
      </p>

      <div className="mb-[10px] text-left text-[11px] font-bold tracking-wider text-text-muted uppercase">
        {x(M.home_production_checklist_label)}
      </div>
      <ol className="mb-[16px] grid gap-[8px] text-left">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <li key={step.key}>
              <Link
                to={step.to}
                onClick={() => step.onNavigate?.()}
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

      <p className="m-0 mb-[22px] text-[12.5px] leading-[1.5] text-text-muted">
        <Link to="/app/settings" className="font-semibold text-accent hover:opacity-80">
          {x(M.home_production_demo_link)}
        </Link>
      </p>

      {afterChecklist ? <div className="mb-[22px] text-left">{afterChecklist}</div> : null}

      <div className="mb-[8px] text-left text-[11px] font-bold tracking-wider text-text-muted uppercase">
        {x(M.home_production_pinned_label)}
      </div>
      <div className="mb-[24px] grid grid-cols-1 gap-[8px] text-left sm:grid-cols-3">
        <Link
          to="/app/workflows/statutory-notice-ontario"
          onClick={() => {
            markEmptyWorkspaceWorkflowVisited(organizationId)
            setSession(readEmptyWorkspaceProgress(organizationId))
          }}
          className="rounded-[10px] border border-border bg-surface px-[12px] py-[11px] text-[12.5px] font-semibold text-text hover:border-(--accent-soft-border)"
        >
          {x(F.flows_pin_notice_on)}
        </Link>
        <Link
          to="/app/workflows/severance-eligibility-ontario"
          onClick={() => {
            markEmptyWorkspaceWorkflowVisited(organizationId)
            setSession(readEmptyWorkspaceProgress(organizationId))
          }}
          className="rounded-[10px] border border-border bg-surface px-[12px] py-[11px] text-[12.5px] font-semibold text-text hover:border-(--accent-soft-border)"
        >
          {x(F.flows_pin_severance)}
        </Link>
        <Link
          to="/app/workflows/duty-to-accommodate"
          onClick={() => {
            markEmptyWorkspaceWorkflowVisited(organizationId)
            setSession(readEmptyWorkspaceProgress(organizationId))
          }}
          className="rounded-[10px] border border-border bg-surface px-[12px] py-[11px] text-[12.5px] font-semibold text-text hover:border-(--accent-soft-border)"
        >
          {x(F.flows_pin_accommodate)}
        </Link>
      </div>

      <div className="rounded-[14px] shadow-float">
        <ChatComposer
          variant="chat"
          placeholder={x(M.home_composer_placeholder)}
          onSend={onSend}
          autoFocus
        />
      </div>
      <Disclaimer className="mt-[8px] text-center" />
    </AppPage>
  )
}
