import { FileText } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'
import { DocChip } from '../../components'
import { documentStatusInfo } from '../../data'
import type { GeneratedDoc } from '../../data'

/**
 * "Continue drafting" — in-progress documents from My documents as a compact
 * horizontal rail. Empty in a production workspace (no documents yet), so the
 * section simply doesn't render there.
 */
export function ContinueDrafting({ documents }: { readonly documents: GeneratedDoc[] }) {
  const { t, x } = useI18n()
  const { root } = useWorkspaceRoot()
  if (documents.length === 0) return null

  return (
    <section aria-labelledby="doclib-continue-heading" className="mb-5">
      <h2
        id="doclib-continue-heading"
        className="mb-2.5 text-[13px] font-bold tracking-wide text-text-muted uppercase"
      >
        {t('doclib_studio_continueDrafting')}
      </h2>
      <ul className="-mx-[14px] flex gap-2.5 overflow-x-auto px-[14px] pb-1 sm:mx-0 sm:px-0">
        {documents.map((doc) => (
          <li key={doc.id} className="w-[220px] shrink-0">
            <Link
              to={workspacePath(root, `documents/${doc.id}`)}
              className="flex h-full flex-col gap-2.5 rounded-[10px] border border-border bg-surface p-3 hover:border-border-strong"
            >
              <span className="flex items-start gap-2">
                <FileText
                  size={15}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0 text-text-faint"
                  aria-hidden="true"
                />
                <span className="min-w-0 text-[12.5px] leading-snug font-semibold text-text">
                  {x(doc.title)}
                </span>
              </span>
              <span className="mt-auto">
                <DocChip tone={documentStatusInfo[doc.status].tone}>
                  {x(documentStatusInfo[doc.status].label)}
                </DocChip>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
