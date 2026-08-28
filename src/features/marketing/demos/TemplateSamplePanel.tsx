import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { DocPaper } from '@/features/app/documents/components'
import { useEscapeToClose } from '@/lib/escapeStack'
import { buildTemplatePreview, compactDocPaperProps } from './templatePreviewModel'

function TemplateSamplePreviewModal({
  templateName,
  blocks,
  docPreview,
  onClose,
}: {
  readonly templateName: string
  readonly blocks: NonNullable<ReturnType<typeof buildTemplatePreview>>['blocks']
  readonly docPreview: ReturnType<typeof compactDocPaperProps>
  readonly onClose: () => void
}) {
  const { t } = useI18n()
  const restoreRef = useRef<Element | null>(null)

  useEscapeToClose(true, onClose)
  useEffect(() => {
    restoreRef.current = document.activeElement
    return () => {
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus()
    }
  }, [])

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-300 bg-overlay-scrim-mid"
      />
      <dialog
        open
        aria-label={templateName}
        className="fixed top-1/2 left-1/2 z-310 flex max-h-[min(88vh,920px)] w-[min(720px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-border bg-surface font-sans shadow-modal"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-text">
              {templateName}
            </h2>
            <p className="mt-1 text-[12px] leading-normal text-text-faint">{t('tplPreview_sample_note')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-border bg-bg-elevated p-2 text-text-muted transition-colors hover:text-text"
            aria-label={t('tplPreview_close_sample')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <DocPaper
            blocks={blocks}
            values={docPreview.values}
            bilingual={docPreview.bilingual}
            docLang={docPreview.docLang}
          />
        </div>
      </dialog>
    </>
  )
}

export function TemplateSamplePanel({
  tid,
  className,
  defaultOpen = false,
}: {
  readonly tid: string
  readonly className?: string
  /** Opens the preview modal on mount — useful in tests. */
  readonly defaultOpen?: boolean
}) {
  const { x, lang, t } = useI18n()
  const [open, setOpen] = useState(defaultOpen)
  const preview = buildTemplatePreview(tid, lang)
  if (!preview) return null
  const { template, blocks } = preview
  const docPreview = compactDocPaperProps(preview, lang)

  return (
    <div className={className}>
      <div className="mb-2 text-sm font-semibold text-text">{x(template.name)}</div>
      <p className="text-sm leading-[1.55] text-text-2">{x(template.desc)}</p>

      <button
        type="button"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm font-semibold text-text transition-colors hover:border-gold-border hover:text-gold-strong"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {t('tplPreview_show_sample')}
      </button>

      {open && (
        <TemplateSamplePreviewModal
          templateName={x(template.name)}
          blocks={blocks}
          docPreview={docPreview}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
