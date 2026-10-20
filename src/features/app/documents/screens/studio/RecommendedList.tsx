import { ArrowRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { JurisdictionText } from '../../components'
import type { DocTemplate } from '../../data'
import { displayTemplateTitle, reviewLevelInfo } from '../../presentation'

/**
 * "Recommended for your organization" — the top-ranked templates for the
 * current org profile as a compact static list inside the catalogue column.
 * The card rail it replaced duplicated every template's CTAs and added a
 * second scrollbar; a row now just selects into the detail panel (which
 * owns the actions). Rendered only in the unfiltered landing state.
 */
export function RecommendedList({
  templates,
  selectedId,
  onSelect,
}: {
  readonly templates: DocTemplate[]
  readonly selectedId: string | null
  readonly onSelect: (template: DocTemplate) => void
}) {
  const { t, x } = useI18n()
  if (templates.length === 0) return null

  return (
    <section aria-labelledby="doclib-recommended-heading" className="mb-5">
      <h2
        id="doclib-recommended-heading"
        className="mb-1.5 text-[13px] font-bold tracking-wide text-text-muted uppercase"
      >
        {t('doclib_studio_recommendedFor')}
      </h2>
      <ul className="-mx-2 divide-y divide-border-soft">
        {templates.map((template) => {
          const review = reviewLevelInfo(template.risk)
          const title = displayTemplateTitle(x(template.name), template.jurisdictions)
          const selected = template.id === selectedId
          return (
            <li key={template.id}>
              <button
                type="button"
                aria-current={selected || undefined}
                onClick={() => onSelect(template)}
                className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-2 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                  selected ? 'bg-navy/5' : 'hover:bg-inset'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-text">
                    {title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-text-muted">
                    <JurisdictionText codes={template.jurisdictions} />
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{x(review.label)}</span>
                  </span>
                </span>
                <ArrowRight
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="shrink-0 text-text-faint transition-colors group-hover:text-text"
                />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
