import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useI18n } from '@/i18n/context'
import { specialistsMessages as M } from '@/i18n/messages/specialists'
import { SpecialistsDataProvider } from './SpecialistsDataProvider'
import { SpecialistsLayout } from './SpecialistsLayout'

export function SpecialistsProductionView() {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.spec_title)} />
  }

  return (
    <SpecialistsDataProvider mode="production">
      <SpecialistsLayout />
    </SpecialistsDataProvider>
  )
}
