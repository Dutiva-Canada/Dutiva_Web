import { useId, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { DocPaper } from '@/features/app/documents/components'
import { buildTemplatePreview, compactDocPaperProps } from './templatePreviewModel'

export function TemplateSamplePanel({
  tid,
  className,
  maxHeightClass = 'max-h-[420px]',
  defaultExpanded = false,
}: {
  readonly tid: string
  readonly className?: string
  readonly maxHeightClass?: string
  readonly defaultExpanded?: boolean
}) {
  const { x, lang, t } = useI18n()
  const previewId = useId()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [hasOpened, setHasOpened] = useState(defaultExpanded)
  const preview = buildTemplatePreview(tid, lang)
  if (!preview) return null
  const { template, blocks } = preview
  const docPreview = compactDocPaperProps(preview, lang)

  function showPreview() {
    setHasOpened(true)
    setExpanded(true)
  }

  return (
    <div className={className}>
      <div className="mb-2 text-sm font-semibold text-text">{x(template.name)}</div>
      <p className="text-sm leading-[1.55] text-text-2">{x(template.desc)}</p>

      <button
        type="button"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm font-semibold text-text transition-colors hover:border-gold-border hover:text-gold-strong"
        aria-expanded={expanded}
        aria-controls={previewId}
        onClick={() => (expanded ? setExpanded(false) : showPreview())}
      >
        {expanded ? t('tplPreview_hide_sample') : t('tplPreview_show_sample')}
        {expanded ? (
          <ChevronUp size={15} aria-hidden="true" />
        ) : (
          <ChevronDown size={15} aria-hidden="true" />
        )}
      </button>

      {hasOpened && (
        <div
          id={previewId}
          hidden={!expanded}
          className={expanded ? 'mt-4' : undefined}
        >
          <DocPaper
            blocks={blocks}
            values={docPreview.values}
            bilingual={docPreview.bilingual}
            docLang={docPreview.docLang}
            className={`${maxHeightClass} overflow-y-auto`}
          />
          <p className="mt-2 text-[11px] leading-normal text-text-faint">{t('tplPreview_sample_note')}</p>
        </div>
      )}
    </div>
  )
}
