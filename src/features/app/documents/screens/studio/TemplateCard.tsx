import { BookOpen, Briefcase, FileText, Scale, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { WorkspaceLink as Link } from '@/features/app/workspaceRoot/WorkspaceLink'
import { DocChip, JurisdictionPill } from '../../components'
import { templateCategories } from '../../data'
import type { DocTemplate, OrgProfile, TemplateCategoryId } from '../../data'
import { displayTemplateTitle, presentApplicability, reviewLevelInfo } from '../../presentation'

const CATEGORY_ICON: Partial<Record<TemplateCategoryId, LucideIcon>> = {
  hiring: Briefcase,
  agreements: FileText,
  policies: BookOpen,
  termination: Scale,
}

/**
 * Actionable template card — doc icon, title, review/time line, tappable
 * tag pills, and explicit Preview / Use template actions. Used by the
 * recommended strip (all breakpoints) and the card feed below lg.
 */
export function TemplateCard({
  template,
  org,
  selected,
  onPreview,
}: {
  readonly template: DocTemplate
  readonly org: OrgProfile
  readonly selected?: boolean
  readonly onPreview: () => void
}) {
  const { t, x } = useI18n()
  const { root } = useWorkspaceRoot()
  const review = reviewLevelInfo(template.risk)
  const applic = presentApplicability(template, org)
  const title = displayTemplateTitle(x(template.name), template.jurisdictions)
  const recommended = applic.kind === 'recommended' || applic.kind === 'required'
  const category = templateCategories.find((cat) => cat.id === template.category)
  const Icon = CATEGORY_ICON[template.category] ?? FileText

  return (
    <div
      className={`flex h-full flex-col rounded-[12px] border bg-surface p-[14px] transition-colors ${
        selected ? 'border-navy ring-1 ring-navy' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-inset text-navy">
          <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <h3 className="text-[14px] leading-snug font-semibold text-text">{title}</h3>
            {recommended && (
              <span className="mt-0.5 inline-flex shrink-0 items-center text-gold-fg">
                <Star size={12} strokeWidth={2} fill="currentColor" aria-hidden="true" />
                <span className="sr-only">{t('doclib_studio_recommendedBadge')}</span>
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] text-text-muted">
            {x(review.label)} · {template.estMinutes} {t('doclib_studio_est')}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {category && <DocChip tone="neutral">{x(category.name)}</DocChip>}
        {template.jurisdictions.map((code) => (
          <JurisdictionPill key={code} code={code} />
        ))}
      </div>

      <div className="mt-auto flex gap-2 pt-3">
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex min-h-[40px] flex-1 cursor-pointer items-center justify-center rounded-[9px] border border-border-strong bg-surface px-3 text-[12.5px] font-semibold text-text hover:bg-inset"
        >
          {t('doclib_studio_preview')}
        </button>
        <Link
          to={workspacePath(root, `documents/generate/${template.id}`)}
          className="inline-flex min-h-[40px] flex-[1.2] items-center justify-center rounded-[9px] bg-navy px-3 text-[12.5px] font-bold text-white hover:opacity-90"
        >
          {t('doclib_studio_useTemplate')}
        </Link>
      </div>
    </div>
  )
}
