import { shellMessages } from './shell'
import { advisorCore } from './advisorCore'
import { searchMessages } from './search'
import { docstudioMessages } from './docstudio'
import { homeMessages } from './home'
import { advisorViewMessages } from './advisorView'
import { advisorWorkspaceMessages } from './advisorWorkspace'
import { workflowsMessages } from './workflows'
import { flowsMessages } from './flows'
import { casesMessages } from './cases'
import { employeesMessages } from './employees'
import { complianceMessages } from './compliance'
import { policiesMessages } from './policies'
import { tasksMessages } from './tasks'
import { calendarMessages } from './calendar'
import { analyticsMessages } from './analytics'
import { templatesMessages } from './templates'
import { knowledgeMessages } from './knowledge'
import { referenceMessages } from './reference'
import { settingsMessages } from './settings'
import { communicationsMessages } from './communications'
import { compensationMessages } from './compensation'
import { wellbeingMessages } from './wellbeing'
import { doclibMessages } from './doclib'
import { guidanceMessages } from './guidance'
import { authMessages } from './auth'
import { memoryMessages } from './memory'
import { workspaceModeMessages } from './workspaceMode'
import { exportProtectionMessages } from './exportProtection'
import { capacityMessages } from './capacity'
import { hiringMessages } from './hiring'
import { sharedMessages } from './shared'

/**
 * The workspace (`/app…`) catalogue: every module read only from
 * `src/features/app/**` (plus the workspace-only helpers under
 * `src/components/advisor/` and `src/lib/exportProtection/`), merged with the
 * shared set. `LangProvider` is the only consumer that should import this —
 * see `index.ts` for why the split exists and what it does not do yet.
 */
export const workspaceMessages = {
  ...shellMessages,
  ...advisorCore,
  ...searchMessages,
  ...docstudioMessages,
  ...homeMessages,
  ...advisorViewMessages,
  ...advisorWorkspaceMessages,
  ...workflowsMessages,
  ...flowsMessages,
  ...casesMessages,
  ...employeesMessages,
  ...complianceMessages,
  ...policiesMessages,
  ...tasksMessages,
  ...calendarMessages,
  ...analyticsMessages,
  ...templatesMessages,
  ...knowledgeMessages,
  ...referenceMessages,
  ...settingsMessages,
  ...communicationsMessages,
  ...compensationMessages,
  ...wellbeingMessages,
  ...doclibMessages,
  ...guidanceMessages,
  ...authMessages,
  ...memoryMessages,
  ...workspaceModeMessages,
  ...exportProtectionMessages,
  ...capacityMessages,
  ...hiringMessages,
  ...sharedMessages,
} as const

/**
 * Keys a workspace call site may use: workspace-only plus shared. Using this
 * on a structure the workspace reads is what stops a marketing-only key
 * being referenced from `src/features/app/**`.
 */
export type WorkspaceMessageKey = keyof typeof workspaceMessages
