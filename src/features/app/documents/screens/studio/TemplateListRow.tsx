import { Star } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { DocChip, JurisdictionPill } from '../../components'
import type { DocTemplate, OrgProfile } from '../../data'
import { displayTemplateTitle, presentApplicability, reviewLevelInfo } from '../../presentation'

export function TemplateListRow({
  template,
  org,
  selected,
  onSelect,
}: {
  readonly template: DocTemplate
  readonly org: OrgProfile
  readonly selected: boolean
  readonly onSelect: () => void
}) {
  const { t, x } = useI18n()
  const review = reviewLevelInfo(template.risk)
  const applic = presentApplicability(template, org)
  const title = displayTemplateTitle(x(template.name), template.jurisdictions)
  const recommended = applic.kind === 'recommended' || applic.kind === 'required'

  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onClick={onSelect}
        className={`flex w-full cursor-pointer flex-col gap-1.5 rounded-[10px] border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
          selected
            ? 'border-navy bg-navy/5 ring-1 ring-navy'
            : 'border-transparent hover:border-border hover:bg-inset'
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${selected ? 'bg-navy' : 'bg-transparent border border-border'}`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[13.5px] leading-snug font-semibold text-text">{title}</span>
              {recommended && (
                <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-gold-fg">
                  <Star size={11} strokeWidth={2} aria-hidden="true" fill="currentColor" />
                  <span className="sr-only">{t('doclib_studio_recommendedBadge')}</span>
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {template.jurisdictions.map((code) => (
                <JurisdictionPill key={code} code={code} />
              ))}
              <DocChip tone={review.tone}>{x(review.label)}</DocChip>
            </div>
          </div>
        </div>
      </button>
    </li>
  )
}
