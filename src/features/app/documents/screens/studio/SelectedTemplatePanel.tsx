import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Briefcase, FileText, MessageSquare, Scale } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { useRail } from '@/features/app/rail/railContext'
import { useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { DocChip, JurisdictionPill } from '../../components'
import type { DocTemplate, OrgProfile, TemplateCategoryId } from '../../data'
import { displayTemplateTitle, presentApplicability, reviewLevelInfo } from '../../presentation'

const CATEGORY_ICON: Partial<Record<TemplateCategoryId, LucideIcon>> = {
  hiring: Briefcase,
  agreements: FileText,
  policies: BookOpen,
  termination: Scale,
}

function templateSections(template: DocTemplate): Bi[] {
  if (template.includes.length > 0) return template.includes
  const seen = new Set<string>()
  const out: Bi[] = []
  for (const q of template.questions) {
    if (seen.has(q.section.en)) continue
    seen.add(q.section.en)
    out.push(q.section)
  }
  return out
}

export function SelectedTemplatePanel({
  template,
  org,
}: {
  readonly template: DocTemplate | null
  readonly org: OrgProfile
}) {
  const { t, x } = useI18n()
  const { root } = useWorkspaceRoot()
  const { openRail } = useRail()

  if (!template) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-[12px] border border-dashed border-border bg-surface px-6 py-12 text-center">
        <p className="max-w-[36ch] text-[13.5px] text-text-muted">
          {t('doclib_studio_selectPrompt')}
        </p>
      </div>
    )
  }

  const review = reviewLevelInfo(template.risk)
  const applic = presentApplicability(template, org)
  const title = displayTemplateTitle(x(template.name), template.jurisdictions)
  const Icon = CATEGORY_ICON[template.category] ?? FileText
  const whyHeading =
    applic.kind === 'recommended'
      ? t('doclib_studio_whyRecommended')
      : t('doclib_studio_whyApplies')
  const sections = templateSections(template)

  const askAdvisor = () => {
    openRail(
      title,
      {
        text: {
          en: `You asked about the template “${template.name.en}” (${template.tid}). Jurisdiction: ${template.jurisdictions.join(', ')}. Category: ${template.category}. Review level: ${review.label.en}. Applicability: ${applic.label.en}. ${applic.reason.en} How can I help with this template?`,
          fr: `Vous avez demandé des précisions sur le modèle « ${template.name.fr} » (${template.tid}). Territoire : ${template.jurisdictions.join(', ')}. Catégorie : ${template.category}. Niveau de révision : ${review.label.fr}. Applicabilité : ${applic.label.fr}. ${applic.reason.fr} Comment puis-je vous aider avec ce modèle ?`, // [FR self-authored]
        },
      },
      {
        chips: [x(review.label), x(applic.label), ...template.jurisdictions],
      },
    )
  }

  return (
    <article
      aria-labelledby="doclib-selected-template-title"
      className="flex h-full flex-col rounded-[12px] border border-border bg-surface"
    >
      <div className="border-b border-border-soft px-4 py-4 max-[640px]:px-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-inset text-navy">
            <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="doclib-selected-template-title"
              tabIndex={-1}
              className="font-display text-[18px] leading-snug font-bold text-text outline-none max-[640px]:text-[16px]"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{x(template.desc)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {template.jurisdictions.map((code) => (
                <JurisdictionPill key={code} code={code} expanded />
              ))}
              <DocChip tone={applic.tone}>{x(applic.label)}</DocChip>
              <DocChip tone={review.tone}>{x(review.label)}</DocChip>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 max-[640px]:px-3">
        <section aria-labelledby="doclib-why-heading">
          <h3
            id="doclib-why-heading"
            className="text-[12px] font-bold tracking-wide text-text-muted uppercase"
          >
            {whyHeading}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-text-2">{x(applic.reason)}</p>
        </section>

        {sections.length > 0 && (
          <section aria-labelledby="doclib-sections-heading">
            <h3
              id="doclib-sections-heading"
              className="text-[12px] font-bold tracking-wide text-text-muted uppercase"
            >
              {t('doclib_studio_sections')}
            </h3>
            <p className="mt-1 text-[12.5px] text-text-muted">{t('doclib_studio_sectionsSub')}</p>
            <ol className="mt-3 space-y-1.5">
              {sections.slice(0, 10).map((item, index) => (
                <li key={item.en} className="flex gap-2 text-[13px] text-text">
                  <span className="w-5 shrink-0 font-mono text-[11px] font-bold text-text-faint">
                    {index + 1}.
                  </span>
                  <span>{x(item)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <div className="sticky bottom-0 space-y-2 border-t border-border bg-surface px-4 py-3 max-[640px]:px-3">
        <button
          type="button"
          onClick={askAdvisor}
          className="inline-flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-border bg-surface px-3 text-[13px] font-semibold text-text hover:bg-inset"
        >
          <MessageSquare size={15} strokeWidth={1.8} aria-hidden="true" />
          {t('doclib_studio_askAdvisor')}
        </button>
        <div className="flex flex-wrap gap-2">
          <Link
            to={workspacePath(root, `documents/templates/${template.tid}`)}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-[9px] border border-border-strong bg-surface px-3 text-[13px] font-semibold text-text hover:bg-inset"
          >
            {t('doclib_studio_open')}
          </Link>
          <Link
            to={workspacePath(root, `documents/generate/${template.id}`)}
            className="inline-flex min-h-[42px] flex-[1.2] items-center justify-center gap-1.5 rounded-[9px] bg-navy px-3 text-[13px] font-bold text-white hover:opacity-90"
          >
            {t('doclib_studio_generate')}
            <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
