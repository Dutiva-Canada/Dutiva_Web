import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Banknote,
  Book,
  BookOpen,
  Brain,
  CalendarCheck,
  ChartNoAxesColumn,
  Contact,
  Cog,
  DollarSign,
  FileStack,
  Folder,
  House,
  Megaphone,
  MessageCircle,
  Scale,
  Send,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  UserCheck,
  UsersRound,
  Waypoints,
} from 'lucide-react'
import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'
import { shellMessages as M } from '@/i18n/messages/shell'
import type { OrgMemberRole } from '@/features/app/workspaceMode/roles'
import { isModuleEnabled, type WorkspaceModuleKey } from '@/features/app/workspaceMode/workspaceModules'
import { commsMessages as COMMS } from '@/i18n/messages/comms'
import { crmMessages as CRM } from '@/i18n/messages/crm'
import { financeMessages as FINANCE } from '@/i18n/messages/finance'
import { memoryMessages as MEM } from '@/i18n/messages/memory'
import { cases, employeeDetails, employees } from '@/data'
import { VIEW_LABELS, isDoclibStudioPath } from './navLabels'
import { workspaceSegments } from '@/features/app/workspaceRoot/workspaceRootContext'

/**
 * Sidebar navigation model — order, grouping, icons and badges verbatim from
 * the App v2 prototype sidebar (`SidebarNav` markup + `renderVals()`).
 */

export type NavBadgeTone = 'gold' | 'neutral' | 'risk' | 'warn'

export interface NavItem {
  /** Stable key; also the first path segment under /app. */
  key: string
  to: string
  icon: LucideIcon
  label: Bi
  badge?: { value: string; tone: NavBadgeTone }
  /** Custom active predicate for items sharing a path prefix (doclib). */
  isActive?: (pathname: string) => boolean
  /** Roles that may see this item. `undefined` means visible to everyone. */
  roles?: OrgMemberRole[]
}

export interface NavGroup {
  /** Uppercase section heading (only rendered when the sidebar is expanded). */
  heading: Bi | null
  items: NavItem[]
}

/* Badge counts — derivations from the prototype's renderVals() (line ~5150):
   cases = non-Resolved, wellbeing = employees whose sentiment is trending
   down (<55). Compliance is a literal in the prototype. Workflows has no
   live count in either mode (guided processes are a catalogue, not a queue),
   so it ships without a badge rather than a misleading "3". */
const CASES_BADGE = String(cases.filter((c) => c.status.en !== 'Resolved').length)
const COMPLIANCE_BADGE = '3'
const WELLBEING_BADGE = String(
  Object.values(employeeDetails).filter((d) => d.sentiment != null && d.sentiment < 55).length,
)

const OWNER_ADMIN: OrgMemberRole[] = ['owner', 'admin']
const PROFESSIONAL: OrgMemberRole[] = ['owner', 'admin', 'manager', 'professional']
const CONSULTANT: OrgMemberRole[] = ['owner', 'admin', 'manager', 'professional', 'consultant']
const OPERATORS: OrgMemberRole[] = ['owner', 'admin', 'manager', 'professional', 'member', 'consultant']
const ALL_ROLES: OrgMemberRole[] = ['owner', 'admin', 'manager', 'professional', 'member', 'consultant', 'viewer']

function itemVisible(
  item: NavItem,
  role: OrgMemberRole | null,
  enabledModules?: Record<string, boolean>,
): boolean {
  if (!isModuleEnabled(enabledModules, item.key as WorkspaceModuleKey)) return false
  if (item.roles == null || item.roles.length === 0) return true
  if (role == null) return true
  return item.roles.includes(role)
}

export function getNavGroups(
  root: string,
  role: OrgMemberRole | null = null,
  enabledModules?: Record<string, boolean>,
): NavGroup[] {
  const p = (suffix: string) => `${root}/${suffix}`
  const groups: NavGroup[] = [
    {
      heading: null,
      items: [
        { key: 'home', to: p('home'), icon: House, label: M.shell_nav_home },
        {
          key: 'advisor',
          to: p('advisor'),
          icon: MessageCircle,
          label: M.shell_nav_advisor_home,
        },
        {
          key: 'memory',
          to: p('settings/memory'),
          icon: Brain,
          label: MEM.memory_title,
          isActive: (pathname) => pathname.includes('/settings/memory'),
        },
        {
          key: 'workflows',
          to: p('workflows'),
          icon: Waypoints,
          label: M.shell_nav_workflows,
        },
      ],
    },
    {
      heading: M.shell_sec_revenue,
      items: [
        {
          key: 'revenue',
          to: p('revenue'),
          icon: TrendingUp,
          label: M.shell_nav_revenue,
          roles: CONSULTANT,
        },
        {
          key: 'crm',
          to: p('crm'),
          icon: Contact,
          label: CRM.crm_title,
          roles: CONSULTANT,
        },
        {
          key: 'comms',
          to: p('comms/overview'),
          icon: Megaphone,
          label: COMMS.comms_title,
          isActive: (pathname) => pathname.startsWith(`${root}/comms`),
          roles: CONSULTANT,
        },
      ],
    },
    {
      heading: M.shell_sec_operations,
      items: [
        {
          key: 'operations',
          to: p('operations'),
          icon: Cog,
          label: M.shell_nav_operations,
          roles: OPERATORS,
        },
        {
          key: 'planning',
          to: p('planning/tasks'),
          icon: CalendarCheck,
          label: M.shell_nav_planning,
          isActive: (pathname) => pathname.startsWith(`${root}/planning`),
        },
        {
          key: 'documents',
          to: p('documents/studio'),
          icon: FileStack,
          label: M.shell_nav_library,
          isActive: (pathname) => pathname.startsWith(`${root}/documents`),
        },
        { key: 'knowledge', to: p('knowledge'), icon: Book, label: M.shell_nav_knowledge },
      ],
    },
    {
      heading: M.shell_sec_people,
      items: [
        { key: 'employees', to: p('employees'), icon: Users, label: M.shell_nav_people },
        {
          key: 'cases',
          to: p('cases'),
          icon: Folder,
          label: M.shell_nav_cases,
          badge: { value: CASES_BADGE, tone: 'neutral' },
        },
        {
          key: 'hiring',
          to: p('hiring'),
          icon: UserCheck,
          label: M.shell_nav_hiring,
          roles: PROFESSIONAL,
        },
        {
          key: 'wellbeing',
          to: p('wellbeing'),
          icon: Activity,
          label: M.shell_nav_wellbeing,
          badge: { value: WELLBEING_BADGE, tone: 'warn' },
        },
        {
          key: 'communications',
          to: p('communications'),
          icon: Send,
          label: M.shell_nav_communications,
        },
      ],
    },
    {
      heading: M.shell_sec_finance,
      items: [
        {
          key: 'finance',
          to: p('finance/overview'),
          icon: Banknote,
          label: FINANCE.finance_title,
          isActive: (pathname) => pathname.startsWith(`${root}/finance`),
          roles: CONSULTANT,
        },
        {
          key: 'compensation',
          to: p('compensation'),
          icon: DollarSign,
          label: M.shell_nav_compensation,
          roles: ALL_ROLES,
        },
      ],
    },
    {
      heading: M.shell_sec_governance,
      items: [
        {
          key: 'governance',
          to: p('governance'),
          icon: Scale,
          label: M.shell_nav_governance,
          roles: [...OWNER_ADMIN, 'viewer'],
        },
        {
          key: 'compliance',
          to: p('compliance'),
          icon: ShieldCheck,
          label: M.shell_nav_compliance,
          badge: { value: COMPLIANCE_BADGE, tone: 'warn' },
          roles: PROFESSIONAL,
        },
        {
          key: 'policies',
          to: p('policies'),
          icon: BookOpen,
          label: M.shell_nav_policies,
        },
      ],
    },
    {
      heading: M.shell_sec_security,
      items: [
        {
          key: 'security',
          to: p('security'),
          icon: Shield,
          label: M.shell_nav_security,
          roles: CONSULTANT,
        },
      ],
    },
    {
      heading: M.shell_sec_external,
      items: [
        {
          key: 'specialists',
          to: p('specialists'),
          icon: UsersRound,
          label: M.shell_nav_specialists,
          roles: OPERATORS,
        },
      ],
    },
    {
      heading: null,
      items: [
        {
          key: 'analytics',
          to: p('analytics'),
          icon: ChartNoAxesColumn,
          label: M.shell_nav_analytics,
          roles: ALL_ROLES,
        },
      ],
    },
  ]

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => itemVisible(item, role, enabledModules)),
    }))
    .filter((group) => group.heading === null || group.items.length > 0)
}

export const NAV_GROUPS: NavGroup[] = getNavGroups('/app')

/** Curated sidebar for the indexable public demo — no settings or support admin. */
export const PUBLIC_DEMO_NAV_KEYS = new Set([
  'home',
  'advisor',
  'memory',
  'workflows',
  'employees',
  'cases',
  'hiring',
  'wellbeing',
  'operations',
  'planning',
  'documents',
  'knowledge',
  'compliance',
  'communications',
  'comms',
  'revenue',
  'crm',
  'finance',
  'compensation',
  'governance',
  'policies',
  'security',
  'specialists',
  'analytics',
])

export function getPublicDemoNavGroups(
  root: string,
  role: OrgMemberRole | null = null,
  enabledModules?: Record<string, boolean>,
): NavGroup[] {
  return getNavGroups(root, role, enabledModules)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => PUBLIC_DEMO_NAV_KEYS.has(item.key)),
    }))
    .filter((group) => group.items.length > 0)
}

/* The pure route vocabulary lives in navLabels.ts and is re-exported here so
   call sites keep one import. ModeGate imports it from there directly, not
   through this module — see that file for why the seam exists. */
export { VIEW_LABELS, isDoclibStudioPath, isNavActive, moduleLabelFor } from './navLabels'

export function viewLabelFor(pathname: string): Bi {
  const parts = workspaceSegments(pathname)
  const segment = parts[0] ?? ''
  if (segment === 'employees' && parts[1]) {
    const emp = employees.find((e) => e.id === parts[1])
    if (emp) return bi(emp.name, emp.name)
  }
  if (segment === 'documents') {
    if (pathname.includes('/documents/hr-library')) return M.shell_hr_studio_templates
    return isDoclibStudioPath(pathname) ? M.shell_hr_studio_studio : M.shell_hr_studio_library
  }
  if (segment === 'planning') {
    return pathname.includes('/planning/calendar') ? M.shell_nav_calendar : M.shell_nav_tasks
  }
  if (segment === 'settings' && pathname.includes('/settings/memory')) {
    return MEM.memory_title
  }
  if (segment === 'comms') {
    return COMMS.comms_title
  }
  if (segment === 'finance') {
    return FINANCE.finance_title
  }
  return VIEW_LABELS[segment] ?? M.shell_v_home
}

/* Sample signed-in identity (prototype sidebar footer). Kept local on purpose:
   the data agent owns '@/data' and works in parallel — swap this for the real
   fixture import once it lands. */
export const WORKSPACE_USER = {
  name: 'Riley Summers',
  initials: 'RS',
  role: { en: 'HR Lead', fr: 'Responsable RH' } satisfies Bi,
  email: 'riley@northgatelogistics.ca',
}

export const WORKSPACE_NAME = 'Northgate Logistics Inc.'
