import { FileText } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { templateCategories } from '@/features/app/documents/data'
import { allTemplates } from '@/features/app/documents/catalogue'
import type { DocRiskLevel, Jurisdiction } from '@/features/app/documents/data'
import { FEATURED_TEMPLATE_TIDS } from '@/features/marketing/demos/templatePreviewModel'
import { TemplateSamplePanel } from '@/features/marketing/demos/TemplateSamplePanel'
import { Seo } from '@/seo/Seo'
import { usePublicPath } from '@/seo/usePublicPath'
import { MarketingPageShell, PageCta, PageHero, PageSection } from './MarketingPage'

const RISK_CLASS: Record<DocRiskLevel, string> = {
  low: 'bg-ok-bg text-ok-fg',
  medium: 'bg-warn-bg text-warn-fg',
  high: 'bg-risk-bg text-risk-fg',
}

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  ON: 'ON',
  QC: 'QC',
  FED: 'FED',
}

/**
 * /templates — marketing preview of the Document Studio catalogue, linked
 * from the landing page's Product section ("Browse all templates"). Renders
 * the real product catalogue (`src/features/app/documents/data`) grouped by
 * category, so this page can't drift out of sync with what Document Studio
 * actually ships — no separate marketing-only content to maintain.
 */
export function TemplatesPage() {
  const { t, x, lang } = useI18n()
  const { p } = usePublicPath()
  const riskLabel: Record<DocRiskLevel, string> = {
    low: lang === 'fr' ? 'Risque faible' : 'Low risk',
    medium: lang === 'fr' ? 'Risque moyen' : 'Medium risk',
    high: lang === 'fr' ? 'Risque élevé' : 'High risk',
  }

  return (
    <MarketingPageShell>
      <Seo route="templates" pageType="CollectionPage" />
      <PageHero
        eyebrow={t('tplPreview_eyebrow')}
        title={t('tplPreview_h1')}
        intro={t('tplPreview_intro')}
      />

      <PageSection title={t('tplPreview_samples_title')}>
        <p className="mb-6 max-w-2xl text-sm leading-6 text-text-2">{t('tplPreview_samples_intro')}</p>
        <div className="grid gap-6 lg:grid-cols-3">
          {FEATURED_TEMPLATE_TIDS.map((tid) => (
            <div key={tid} className="premium-card-soft p-5">
              <TemplateSamplePanel tid={tid} />
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection title={`${allTemplates.length} ${t('tplPreview_count')}`}>
        <div className="space-y-10">
          {templateCategories
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((category) => {
              const templates = allTemplates.filter((tpl) => tpl.category === category.id)
              if (templates.length === 0) return null
              return (
                <div key={category.id}>
                  <div className="mb-1 text-base font-semibold text-text">{x(category.name)}</div>
                  <p className="mb-4 text-sm leading-6 text-text-2">{x(category.desc)}</p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
                    {templates.map((tpl) => (
                      <div key={tpl.id} className="premium-card-soft p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <FileText size={16} className="mt-0.5 flex-none text-gold-strong" />
                            <div className="text-[0.9375rem] font-semibold text-text">
                              {x(tpl.name)}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap ${RISK_CLASS[tpl.risk]}`}
                          >
                            {riskLabel[tpl.risk]}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-[1.55] text-text-2">{x(tpl.desc)}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {tpl.jurisdictions.map((code) => (
                            <span
                              key={code}
                              className="rounded-full border border-border bg-bg-elevated px-2 py-0.5 text-[10.5px] font-semibold text-text-3"
                            >
                              {JURISDICTION_LABEL[code]}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      </PageSection>

      <PageCta
        title={t('tplPreview_cta_t')}
        body={t('tplPreview_cta_p')}
        action={t('tplPreview_cta_btn')}
        to={p('pricing')}
      />
    </MarketingPageShell>
  )
}
