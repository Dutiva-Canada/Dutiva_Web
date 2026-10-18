import type { Bi } from '@/i18n/core'
import { shellMessages as SHELL } from '@/i18n/messages/shell'
import { financeMessages as FINANCE } from '@/i18n/messages/finance'
import { crmMessages as CRM } from '@/i18n/messages/crm'
import { commsMessages as COMMS } from '@/i18n/messages/comms'
import { memoryMessages as MEMORY } from '@/i18n/messages/memory'

/**
 * Canonical workspace module keys. Each key maps to a top-level route
 * segment under /app and to a NavItem in src/features/app/shell/navConfig.ts.
 *
 * Missing keys in an organization's enabled_modules map default to enabled
 * for backward compatibility.
 */
const WORKSPACE_MODULE_KEYS = [
  'home',
  'advisor',
  'memory',
  'workflows',
  'revenue',
  'crm',
  'comms',
  'operations',
  'planning',
  'documents',
  'knowledge',
  'employees',
  'cases',
  'hiring',
  'wellbeing',
  'communications',
  'finance',
  'compensation',
  'governance',
  'compliance',
  'policies',
  'security',
  'specialists',
  'analytics',
] as const

export type WorkspaceModuleKey = (typeof WORKSPACE_MODULE_KEYS)[number]

/**
 * Modules that are always on and cannot be toggled off. They are platform
 * primitives, not optional capabilities.
 */
const ALWAYS_ENABLED_MODULES: readonly WorkspaceModuleKey[] = ['home', 'advisor', 'analytics']

/**
 * Modules that can be disabled by org admins. Derived from the full list
 * minus the always-on platform modules.
 */
export const TOGGLEABLE_MODULES: readonly WorkspaceModuleKey[] = WORKSPACE_MODULE_KEYS.filter(
  (key) => !ALWAYS_ENABLED_MODULES.includes(key as WorkspaceModuleKey),
) as WorkspaceModuleKey[]

/** Resolve whether a module is enabled, defaulting to true if not set. */
export function isModuleEnabled(
  enabled: Record<string, boolean> | undefined | null,
  key: WorkspaceModuleKey,
): boolean {
  if (enabled == null) return true
  return enabled[key] !== false
}

/**
 * Modules an org admin may grant to a scoped member (consultant/viewer via
 * organization_members.granted_modules, migration 0244). 'home' is excluded
 * — it is the shell landing every member keeps, not a grantable module.
 */
export const SCOPABLE_MODULES: readonly WorkspaceModuleKey[] = WORKSPACE_MODULE_KEYS.filter(
  (key) => key !== 'home',
)

/** User-facing label per module key — shared by the module editors. */
export const MODULE_LABELS: Record<WorkspaceModuleKey, Bi> = {
  home: SHELL.shell_nav_home,
  advisor: SHELL.shell_nav_advisor_home,
  memory: MEMORY.memory_title,
  workflows: SHELL.shell_nav_workflows,
  revenue: SHELL.shell_nav_revenue,
  crm: CRM.crm_title,
  comms: COMMS.comms_title,
  operations: SHELL.shell_nav_operations,
  planning: SHELL.shell_nav_planning,
  documents: SHELL.shell_nav_library,
  knowledge: SHELL.shell_nav_knowledge,
  employees: SHELL.shell_nav_people,
  cases: SHELL.shell_nav_cases,
  hiring: SHELL.shell_nav_hiring,
  wellbeing: SHELL.shell_nav_wellbeing,
  communications: SHELL.shell_nav_communications,
  finance: FINANCE.finance_title,
  compensation: SHELL.shell_nav_compensation,
  governance: SHELL.shell_nav_governance,
  compliance: SHELL.shell_nav_compliance,
  policies: SHELL.shell_nav_policies,
  security: SHELL.shell_nav_security,
  specialists: SHELL.shell_nav_specialists,
  analytics: SHELL.shell_nav_analytics,
}
