import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Book,
  CalendarCheck,
  ChartNoAxesColumn,
  DollarSign,
  FileStack,
  Folder,
  House,
  MessageCircle,
  Send,
  ShieldCheck,
  Users,
  Waypoints,
} from 'lucide-react'
import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'
import { shellMessages as M } from '@/i18n/messages/shell'
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

export function getNavGroups(root: string): NavGroup[] {
  const p = (suffix: string) => `${root}/${suffix}`
  return [
    {
      heading: null,
      items: [
        { key: 'home', to: p('home'), icon: House, label: M.shell_nav_home },
        { key: 'advisor', to: p('advisor'), icon: MessageCircle, label: M.shell_nav_advisor_home },
        {
          key: 'workflows',
          to: p('workflows'),
          icon: Waypoints,
          label: M.shell_nav_workflows,
        },
      ],
    },
    {
      heading: M.shell_sec_records,
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
          key: 'documents',
          to: p('documents/hr-library'),
          icon: FileStack,
          label: M.shell_nav_library,
          isActive: (pathname) => pathname.startsWith(`${root}/documents`),
        },
        { key: 'knowledge', to: p('knowledge'), icon: Book, label: M.shell_nav_knowledge },
      ],
    },
    {
      heading: M.shell_sec_programs,
      items: [
        {
          key: 'compliance',
          to: p('compliance'),
          icon: ShieldCheck,
          label: M.shell_nav_compliance,
          badge: { value: COMPLIANCE_BADGE, tone: 'warn' },
        },
        {
          key: 'compensation',
          to: p('compensation'),
          icon: DollarSign,
          label: M.shell_nav_compensation,
        },
        {
          key: 'communications',
          to: p('communications'),
          icon: Send,
          label: M.shell_nav_communications,
        },
        {
          key: 'wellbeing',
          to: p('wellbeing'),
          icon: Activity,
          label: M.shell_nav_wellbeing,
          badge: { value: WELLBEING_BADGE, tone: 'warn' },
        },
        {
          key: 'planning',
          to: p('planning/tasks'),
          icon: CalendarCheck,
          label: M.shell_nav_planning,
          isActive: (pathname) => pathname.startsWith(`${root}/planning`),
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
        },
      ],
    },
  ]
}

export const NAV_GROUPS: NavGroup[] = getNavGroups('/app')

/** Curated sidebar for the indexable public demo — no settings or support admin. */
export const PUBLIC_DEMO_NAV_KEYS = new Set([
  'home',
  'advisor',
  'workflows',
  'employees',
  'cases',
  'documents',
  'knowledge',
  'compliance',
  'communications',
  'compensation',
  'wellbeing',
  'analytics',
])

export function getPublicDemoNavGroups(root: string): NavGroup[] {
  return getNavGroups(root)
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
    return M.shell_v_settings
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
