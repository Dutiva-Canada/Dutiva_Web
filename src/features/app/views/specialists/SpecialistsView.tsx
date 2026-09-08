import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { SpecialistsDemoView } from './SpecialistsDemoView'
import { SpecialistsProductionView } from './SpecialistsProductionView'

/**
 * External specialists directory. A tracker, not a full contract management
 * system.
 */
export function SpecialistsView() {
  const { mode } = useWorkspaceMode()

  if (mode === 'production') {
    return <SpecialistsProductionView />
  }

  return <SpecialistsDemoView />
}
