import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useI18n } from '@/i18n/context'
import { crmMessages as M } from '@/i18n/messages/crm'
import { CrmWorkspace } from './CrmWorkspace'

/** Production-mode CRM workspace — persists to browser localStorage. */
export function CrmProductionView() {
  const { x } = useI18n()
  const { organizationId } = useWorkspaceMode()

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.crm_title)} />
  }

  return <CrmWorkspace mode="production" organizationId={organizationId} />
}
