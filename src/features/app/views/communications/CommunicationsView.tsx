import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { CommunicationsDemoView } from './CommunicationsDemoView'
import { CommunicationsProductionView } from './CommunicationsProductionView'

/**
 * Communications view — the announcement pipeline with Advisor review
 * dimensions, linked entities, and the sensitive-send review gate. Port of
 * the prototype's `isCommunicationsView` markup + `buildCommunicationsView()`
 * / `sendCommunication()` / `markCommSent()` (App v2.dc.html).
 *
 * Production renders the real log (CommunicationsProductionView,
 * public.hr_communications) instead of the fixtures below. The review
 * dimensions do not cross over — nothing performs that analysis, so they stay
 * a demo device. See the production view's header.
 */
export function CommunicationsView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <CommunicationsProductionView />
  return <CommunicationsDemoView />
}
