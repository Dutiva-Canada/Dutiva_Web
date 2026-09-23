import { BookOpen, Building2, FileStack, Route, Users, type LucideIcon } from 'lucide-react'
import type { Bi } from '@/i18n/core'
import { homeMessages as M } from '@/i18n/messages/home'

/**
 * The production "setup path" — the ordered foundation steps shown on an
 * empty Home and kept alive as the Keep-going card until they're genuinely
 * done. Ordered foundation-first so a solo founder who hasn't hired yet gets
 * the right next action (profile → documents → policies → explore → people),
 * not "add a person" as step one.
 *
 * Steps complete from live org data wherever a durable signal exists —
 * jurisdictions, generated documents, the policy register, headcount. The
 * guided-process step is the exception: flows run client-side with no
 * server record yet, so it completes from a device-local visit mark
 * (emptyWorkspaceOnboarding.ts). See docs/EMPTY_WORKSPACE_ONBOARDING.md.
 */
export interface SetupSignals {
  /** organizations.jurisdictions non-empty — scopes what Dutiva monitors. */
  readonly jurisdictionsConfigured: boolean
  /** hr_generated_documents rows for the org. */
  readonly documents: number
  /** hr_policies register rows (written policies and flagged gaps). */
  readonly policies: number
  /** People entered in Employees. */
  readonly employees: number
  /** Device-local mark — Workflows catalog or a flow runner was opened. */
  readonly workflowVisited: boolean
}

/** Signals a caller supplies; the workflow visit mark is read per-surface. */
export type SetupDataSignals = Omit<SetupSignals, 'workflowVisited'>

export type SetupStepKey = 'profile' | 'documents' | 'policies' | 'explore' | 'people'

export interface SetupStep {
  readonly key: SetupStepKey
  readonly label: Bi
  readonly hint: Bi
  readonly icon: LucideIcon
  /** Workspace-relative target — resolve with workspacePath(root, step.to). */
  readonly to: string
  readonly done: boolean
  /** True when following this step should mark the workflow-visit signal. */
  readonly marksWorkflowVisit: boolean
}

export function computeSetupSteps(signals: SetupSignals): SetupStep[] {
  return [
    {
      key: 'profile',
      label: M.home_setup_step_profile,
      hint: M.home_setup_step_profile_hint,
      icon: Building2,
      to: 'settings',
      done: signals.jurisdictionsConfigured,
      marksWorkflowVisit: false,
    },
    {
      key: 'documents',
      label: M.home_setup_step_documents,
      hint: M.home_setup_step_documents_hint,
      icon: FileStack,
      to: 'documents/studio',
      done: signals.documents > 0,
      marksWorkflowVisit: false,
    },
    {
      key: 'policies',
      label: M.home_setup_step_policies,
      hint: M.home_setup_step_policies_hint,
      icon: BookOpen,
      to: 'policies',
      done: signals.policies > 0,
      marksWorkflowVisit: false,
    },
    {
      key: 'explore',
      label: M.home_setup_step_explore,
      hint: M.home_setup_step_explore_hint,
      icon: Route,
      to: 'workflows',
      done: signals.workflowVisited,
      marksWorkflowVisit: true,
    },
    {
      key: 'people',
      label: M.home_setup_step_people,
      hint: M.home_setup_step_people_hint,
      icon: Users,
      to: 'employees?new=1',
      done: signals.employees > 0,
      marksWorkflowVisit: false,
    },
  ]
}

/** Remaining steps — what the Keep-going card and "add to Tasks" act on. */
export function remainingSetupSteps(steps: readonly SetupStep[]): SetupStep[] {
  return steps.filter((s) => !s.done)
}
