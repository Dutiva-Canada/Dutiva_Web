import { useI18n } from '@/i18n/context'
import type { DocTemplate, OrgProfile } from '../../data'
import { TemplateCard } from './TemplateCard'

/**
 * "Recommended for your organization" — the top-ranked templates for the
 * current org profile as a horizontal card rail (snap-scroll on every
 * breakpoint; on lg it simply scrolls less). Rendered only while the
 * catalogue is in its unfiltered landing state.
 */
export function RecommendedStrip({
  templates,
  org,
  selectedId,
  onPreview,
}: {
  readonly templates: DocTemplate[]
  readonly org: OrgProfile
  readonly selectedId: string | null
  readonly onPreview: (template: DocTemplate) => void
}) {
  const { t } = useI18n()
  if (templates.length === 0) return null

  return (
    <section aria-labelledby="doclib-recommended-heading" className="mt-4 mb-5">
      <h2
        id="doclib-recommended-heading"
        className="mb-2.5 text-[13px] font-bold tracking-wide text-text-muted uppercase"
      >
        {t('doclib_studio_recommendedFor')}
      </h2>
      <ul className="-mx-[14px] flex snap-x gap-3 overflow-x-auto px-[14px] pt-0.5 pb-2 sm:mx-0 sm:px-0">
        {templates.map((template) => (
          <li
            key={template.id}
            className="w-[85%] max-w-[330px] shrink-0 snap-start sm:w-[320px]"
          >
            <TemplateCard
              template={template}
              org={org}
              selected={template.id === selectedId}
              onPreview={() => onPreview(template)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
