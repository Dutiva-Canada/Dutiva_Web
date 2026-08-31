import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { AnalyticsDemoView } from './AnalyticsDemoView'
import { AnalyticsProductionView } from './AnalyticsProductionView'

/**
 * Analytics (formerly Reports) — the workspace dashboard. Phase 1: the
 * compliance score (trend + breakdown + per-jurisdiction scores), the
 * needs-attention queue, headcount by jurisdiction, open-case aging and
 * policy acknowledgments. Phase 2 adds certifications & training expiring,
 * service milestones, document expiries, the leave overview and the headcount
 * & turnover trend.
 *
 * Demo mode renders the Northgate diorama below — every number computed
 * from `src/data` fixtures against the diorama's fixed "today"; production
 * renders AnalyticsProductionView (live aggregation).
 */

export function AnalyticsView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <AnalyticsProductionView />
  return <AnalyticsDemoView />
}
