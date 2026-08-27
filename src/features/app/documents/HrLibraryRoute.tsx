import { Navigate } from 'react-router-dom'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { TemplatesView } from '@/features/app/views/templates/TemplatesView'

/**
 * Demo renders the legacy HR Library gallery; production redirects to Studio
 * (real catalogue) so search and tabs never land on a gated empty route.
 */
export function HrLibraryRoute() {
  const { mode } = useWorkspaceMode()
  const { root } = useWorkspaceRoot()
  if (mode === 'production') {
    return <Navigate to={workspacePath(root, 'documents/studio')} replace />
  }
  return <TemplatesView />
}
