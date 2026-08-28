import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { CalendarDemoView } from './CalendarDemoView'
import { CalendarProductionView } from './CalendarProductionView'

/**
 * Calendar view — the July 2026 month grid with event chips plus the
 * Upcoming list (prototype `buildCalendarView()` + calendar markup,
 * App v2.dc.html lines 1154–1202). The grid is desktop/tablet only
 * (`isDesktopOrTabletFrame`); phones get just the Upcoming list. Clicking an
 * event (chip or upcoming row) opens the Advisor rail with the event detail.
 */

export function CalendarView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <CalendarProductionView />
  return <CalendarDemoView />
}
