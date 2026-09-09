/**
 * Canonical workspace module keys. Each key maps to a top-level route
 * segment under /app and to a NavItem in src/features/app/shell/navConfig.ts.
 *
 * Missing keys in an organization's enabled_modules map default to enabled
 * for backward compatibility.
 */
export const WORKSPACE_MODULE_KEYS = [
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
export const ALWAYS_ENABLED_MODULES: readonly WorkspaceModuleKey[] = [
  'home',
  'advisor',
  'analytics',
]

/**
 * Modules that can be disabled by org admins. Derived from the full list
 * minus the always-on platform modules.
 */
export const TOGGLEABLE_MODULES: readonly WorkspaceModuleKey[] = WORKSPACE_MODULE_KEYS.filter(
  (key) => !ALWAYS_ENABLED_MODULES.includes(key as WorkspaceModuleKey),
) as WorkspaceModuleKey[]

/** Default: every module is enabled. */
export function defaultEnabledModules(): Record<WorkspaceModuleKey, boolean> {
  return Object.fromEntries(WORKSPACE_MODULE_KEYS.map((key) => [key, true])) as Record<
    WorkspaceModuleKey,
    boolean
  >
}

/** Resolve whether a module is enabled, defaulting to true if not set. */
export function isModuleEnabled(
  enabled: Record<string, boolean> | undefined | null,
  key: WorkspaceModuleKey,
): boolean {
  if (enabled == null) return true
  return enabled[key] !== false
}
