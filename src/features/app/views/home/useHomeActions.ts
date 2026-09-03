import { useCallback } from 'react'
import { useOpenCatalogueDocument } from '@/features/app/documents/useOpenCatalogueDocument'
import { usePayRail, useWellbeingRail } from '@/features/app/rail/useEntityRails'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import type { AdvisorStartFlowNavState } from '@/features/app/views/advisor/advisorNav'
import type { HomeAction } from './homeData'

/**
 * Resolve the Home view's declarative actions (`homeData.ts`) into real
 * navigation, Documents wizard / DocStudio overlay, and Advisor-rail calls —
 * the port of the prototype's `openCase` / `selectChat` / `handleGenerateDoc`
 * / `startFlow` / `askAboutComp` / `askAboutWellbeing` wiring.
 */
export function useHomeActions(): (action: HomeAction) => void {
  const navigate = useWorkspaceNavigate()
  const openCatalogueDocument = useOpenCatalogueDocument()
  const openPayRail = usePayRail()
  const openWellbeingRail = useWellbeingRail()

  return useCallback(
    (action: HomeAction) => {
      switch (action.kind) {
        case 'route':
          navigate(action.to)
          break
        case 'chat':
          navigate('/app/advisor', { state: { chatId: action.chatId } })
          break
        case 'doc':
          openCatalogueDocument(action.templateKey)
          break
        case 'flow':
          /* Bi prompt + explicit key — live language toggles re-localize the
             seeded bubble, and the flow never depends on keyword routing. */
          navigate('/app/advisor', {
            state: {
              prompt: action.prompt,
              flowKey: action.flowKey,
            } satisfies AdvisorStartFlowNavState,
          })
          break
        case 'comp-rail':
          openPayRail(action.employeeId)
          break
        case 'wellbeing-rail':
          openWellbeingRail(action.employeeId)
          break
      }
    },
    [navigate, openCatalogueDocument, openPayRail, openWellbeingRail],
  )
}
