import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { HomeDemoView } from './HomeDemoView'
import { HomeProductionView } from './HomeProductionView'
import type { AdvisorStartFlowNavState } from '@/features/app/views/advisor/advisorNav'

/**
 * Home — Command Centre (prototype `App v2.dc.html` markup 335–547,
 * `buildHomeView()` in its default "brief" hero emphasis). Order: AdvisorBrief
 * hero (with MetricChips) → PriorityQueue (Act now / mobile WorkflowCards /
 * This week / Watching) → WorkflowLauncher → right rail (CompliancePrediction
 * + desktop WorkflowCards) → AdvisorComposer.
 *
 * In production mode (admin-only, see WorkspaceModeProvider) this renders
 * HomeProductionView instead — the real command centre (live counts, due
 * soon, policy attention), or the welcome state while the workspace is
 * empty. The Northgate Logistics Inc. fixtures below stay demo-only.
 */
export function HomeView() {
  const navigate = useWorkspaceNavigate()
  const { mode } = useWorkspaceMode()

  const sendToAdvisor = (text: string) => {
    navigate('/app/advisor', { state: { prompt: text } satisfies AdvisorStartFlowNavState })
  }

  if (mode === 'production') {
    return <HomeProductionView onSend={sendToAdvisor} />
  }

  return <HomeDemoView />
}
