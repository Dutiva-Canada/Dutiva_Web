import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { usePublicPath } from '@/seo/usePublicPath'
import { GUIDE_ARTICLES, articlePath } from '../articles'
import { MarketingPageShell, PageAside, PageCta, PageHero, PageSection } from './MarketingPage'

/**
 * /guides — index of the evergreen employment-law guides. Cards render from
 * the article registry (src/features/marketing/articles) and link to each
 * guide's own page, so this index and the landing teaser share one source.
 * `/guides/template-usage` is listed separately: it is a product how-to with
 * its own registry route rather than an article in the collection.
 *
 * The `PageAside` hands a reader who needs the other half of the split — which
 * regime governs them, before any document exists — over to `/blog`, which is
 * otherwise reachable only from the footer and one landing-page link. See the
 * collection split in `articles/articleModel.ts`.
 */
export function GuidesIndexPage() {
  const { t, x, lang } = useI18n()
  const { p } = usePublicPath()

  return (
    <MarketingPageShell>
      <Seo route="guides" pageType="CollectionPage" />
      <PageHero
        eyebrow={t('guidesIdx_eyebrow')}
        title={t('guidesIdx_h1')}
        intro={t('guidesIdx_intro')}
      />

      <PageSection title={t('guidesIdx_section_title')}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {GUIDE_ARTICLES.map((guide) => (
            <Link
              key={guide.slug}
              to={articlePath(guide, lang)}
              className="premium-card-soft group block p-[22px]"
            >
              <div className="flex items-start gap-3">
                <BookOpen size={16} className="mt-0.5 flex-none text-gold-strong" />
                <div>
                  <div className="text-xs font-medium text-gold-strong">
                    {x(guide.topic)} ·{' '}
                    {x({
                      en: `${guide.readingMinutes} min read`,
                      fr: `${guide.readingMinutes} min de lecture`,
                    })}
                  </div>
                  <h3 className="mt-1.5 text-[0.9375rem] font-semibold text-text">
                    {x(guide.title)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-[1.55] text-text-2">{x(guide.summary)}</p>
                  <span className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong">
                    {x({ en: 'Read the guide', fr: 'Lire le guide' })}
                    <ArrowRight
                      size={14}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          to={p('templateUsage')}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
        >
          {t('tmplGuide_h1')}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </PageSection>

      <PageAside
        title={t('guidesIdx_toBlog_t')}
        body={t('guidesIdx_toBlog_p')}
        action={t('guidesIdx_toBlog_link')}
        to={p('blog')}
      />

      <PageCta
        title={t('guidesIdx_cta_t')}
        body={t('guidesIdx_cta_p')}
        action={t('guidesIdx_cta_btn')}
        to={p('pricing')}
      />
    </MarketingPageShell>
  )
}
