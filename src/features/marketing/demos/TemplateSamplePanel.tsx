import { useI18n } from '@/i18n/context'
import { DocPaper } from '@/features/app/documents/components'
import { buildTemplatePreview, compactDocPaperProps } from './templatePreviewModel'

export function TemplateSamplePanel({
  tid,
  className,
  maxHeightClass = 'max-h-[420px]',
}: {
  readonly tid: string
  readonly className?: string
  readonly maxHeightClass?: string
}) {
  const { x, lang, t } = useI18n()
  const preview = buildTemplatePreview(tid, lang)
  if (!preview) return null
  const { template, blocks } = preview
  const docPreview = compactDocPaperProps(preview, lang)
  return (
    <div className={className}>
      <div className="mb-2 text-sm font-semibold text-text">{x(template.name)}</div>
      <p className="mb-3 text-sm leading-[1.55] text-text-2">{x(template.desc)}</p>
      <DocPaper
        blocks={blocks}
        values={docPreview.values}
        bilingual={docPreview.bilingual}
        docLang={docPreview.docLang}
        className={`${maxHeightClass} overflow-y-auto`}
      />
      <p className="mt-2 text-[11px] leading-normal text-text-faint">{t('tplPreview_sample_note')}</p>
    </div>
  )
}
