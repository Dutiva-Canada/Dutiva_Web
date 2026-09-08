import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { CrmDemoView } from './CrmDemoView'
import { CrmProductionView } from './CrmProductionView'

/**
 * Lightweight CRM workspace dispatch — contacts, companies, deals and
 * follow-ups. Demo loads fixtures; production persists to localStorage.
 */
export function CrmView() {
  const { mode } = useWorkspaceMode()
  if (mode === 'production') {
    return <CrmProductionView />
  }
  return <CrmDemoView />
}
