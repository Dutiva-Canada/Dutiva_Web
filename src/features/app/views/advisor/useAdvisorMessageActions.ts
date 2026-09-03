import { useCallback } from 'react'
import { pick } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { exportProtectionMessages as XP } from '@/i18n/messages/exportProtection'
import { useAuth } from '@/features/app/auth/authContext'
import { useOpenCatalogueDocument } from '@/features/app/documents/useOpenCatalogueDocument'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { authorizeExport, encodeInvisibleTag, exportDenialMessage } from '@/lib/exportProtection'

/** Copy/export message handlers shared by ChatPane in AdvisorView. */
export function useAdvisorMessageActions() {
  const { showToast } = useToasts()
  const openCatalogueDocument = useOpenCatalogueDocument()
  const { lang } = useI18n()
  const auth = useAuth()
  const workspaceModeCtx = useWorkspaceMode()

  const handleCopyMessage = useCallback(
    async (text: string) => {
      const identity = workspaceModeCtx?.identity
      const actorLabel = identity
        ? `${identity.user.name} (${identity.user.email})`
        : pick(XP.exportprot_demo_actor, lang)
      const workspaceLabel = identity?.companyName ?? pick(XP.exportprot_demo_workspace, lang)

      const decision = await authorizeExport({
        surface: 'advisor',
        kind: 'text',
        title: pick(M.advisorview_chat_copy_title, lang),
        content: text,
        lang,
        actorLabel,
        workspaceLabel,
        session: auth?.session ?? null,
      })
      if (!decision.allowed) {
        showToast(exportDenialMessage(decision), 'info')
        return
      }

      const tagged = text + encodeInvisibleTag(decision.stamp.exportId)
      navigator.clipboard.writeText(tagged).then(
        () => showToast({ en: 'Copied to clipboard', fr: 'Copié dans le presse-papiers' }, 'ok'),
        () => showToast({ en: 'Could not copy', fr: 'Impossible de copier' }, 'info'),
      )
    },
    [showToast, workspaceModeCtx, auth, lang],
  )

  const handleExportMessage = useCallback(
    (text: string) => {
      openCatalogueDocument('T10', { initialContent: text })
      showToast({ en: 'Drafting document...', fr: 'Rédaction du document...' }, 'ok')
    },
    [openCatalogueDocument, showToast],
  )

  return { handleCopyMessage, handleExportMessage }
}
