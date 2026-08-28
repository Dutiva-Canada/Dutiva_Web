import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus()
    }
  }, [])

  return createPortal(
    <div className="surface-marketing dutiva-surface text-text fixed inset-0 z-300 pt-[env(safe-area-inset-top)]">
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-overlay-scrim-mid"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={templateName}
        className="absolute inset-0 flex items-center justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 pointer-events-none sm:p-4"
      >
        <div className="pointer-events-auto flex max-h-[min(88vh,920px)] w-[min(720px,100%)] flex-col overflow-hidden rounded-[16px] border border-border bg-bg-elevated shadow-modal">
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
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-elevated p-2 text-text-muted transition-colors hover:text-text"
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
        </div>
      </div>
    </div>,
    document.body,
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
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-gold-border hover:text-gold-strong"
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
