import { useCallback } from 'react'
import { useDocStudio } from '@/features/app/docstudio/docStudioContext'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import { catalogueGeneratePath } from './catalogueGeneratePath'

/**
 * Open a catalogue template in the Documents generate wizard when the key
 * resolves to a doclib/custom template; otherwise fall back to the legacy
 * DocStudio overlay (title-string keys from older fixtures).
 */
export function useOpenCatalogueDocument(): (
  templateKey: string,
  options?: { initialContent?: string },
) => void {
  const navigate = useWorkspaceNavigate()
  const { openDocStudio } = useDocStudio()

  return useCallback(
    (templateKey: string, options?: { initialContent?: string }) => {
      /* Overlay still owns "revise this draft" when initial content is passed. */
      if (options?.initialContent) {
        openDocStudio(templateKey, options)
        return
      }
      const path = catalogueGeneratePath(templateKey)
      if (path) {
        navigate(path)
        return
      }
      openDocStudio(templateKey, options)
    },
    [navigate, openDocStudio],
  )
}
