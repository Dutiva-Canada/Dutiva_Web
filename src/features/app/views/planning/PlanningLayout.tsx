import { Outlet, useLocation } from 'react-router-dom'
import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'

import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'

/**
 * Shared frame for /app/planning — Tasks and Calendar as sub-tabs.
 * Each child view (TasksView, CalendarView) owns its own scroll container,
 * so this layout is a flex-col wrapper that only contributes the tab strip.
 *
 * Nav landmark with `aria-current` — route navigation, not WAI-ARIA tabs.
 */
function PlanningTabs() {
  const { x } = useI18n()
  const { pathname } = useLocation()
  const calendar = pathname.startsWith('/app/planning/calendar')
  const linkClass = (active: boolean) =>
    `relative inline-flex min-h-[44px] shrink-0 items-center rounded-none border-b-2 border-transparent px-[14px] py-[9px] font-sans text-[13px] font-semibold whitespace-nowrap transition-[color] duration-200 ease-out after:absolute after:right-[14px] after:bottom-[-2px] after:left-[14px] after:h-[2px] after:origin-left after:rounded-full after:bg-navy after:transition-transform after:duration-200 after:ease-out after:content-[""] ${
      active ? 'text-text after:scale-x-100' : 'text-text-muted after:scale-x-0'
    }`
  return (
    <nav
      aria-label={x(M.shell_nav_planning)}
      className="shrink-0 flex gap-[2px] overflow-x-auto border-b border-border px-[16px] sm:px-[24px] md:px-[32px]"
    >
      <Link
        to="/app/planning/tasks"
        aria-current={!calendar ? 'page' : undefined}
        className={linkClass(!calendar)}
      >
        {x(M.shell_nav_tasks)}
      </Link>
      <Link
        to="/app/planning/calendar"
        aria-current={calendar ? 'page' : undefined}
        className={linkClass(calendar)}
      >
        {x(M.shell_nav_calendar)}
      </Link>
    </nav>
  )
}

export function PlanningLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PlanningTabs />
      {/* TasksView / CalendarView each provide flex-1 overflow-y-auto */}
      <Outlet />
    </div>
  )
}
