import { Navigate } from 'react-router-dom'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { TemplatesView } from '@/features/app/views/templates/TemplatesView'

/**
 * Demo renders the legacy HR Library gallery; production redirects to Studio
 * (real catalogue) so search and tabs never land on a gated empty route.
 */
export function HrLibraryRoute() {
  const { mode } = useWorkspaceMode()
  if (mode === 'production') {
    return <Navigate to="/app/documents/studio" replace />
  }
  return <TemplatesView />
}
