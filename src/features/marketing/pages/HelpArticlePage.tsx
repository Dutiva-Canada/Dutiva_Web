import { useEffect } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import {
  helpArticleByFrSlug,
  helpArticleBySlug,
  helpDocDescription,
  helpDocPath,
  helpDocTitle,
  langOfPath,
  seoRoute,
} from '@/seo/routes'
import {
  groupHelpBlocks,
  helpArticlesByCategory,
  helpCategory,
} from '@/features/support/help/helpCenterData'
/* Bodies live outside the article record so the router does not carry the
   whole Help Centre — see help/helpContent.ts. This route is lazy. */
import { helpArticleSections } from '@/features/support/help/helpContent'
import { HelpfulnessWidget } from '@/features/support/help/HelpfulnessWidget'
import { HelpContactCta } from '@/features/support/help/HelpContactCta'
import { trackEvent } from '@/features/support/analytics/supportAnalytics'
import { MarketingPageShell } from './MarketingPage'

/**
 * One Help Centre article at /help/:slug (EN) or /fr/aide/:slug (FR — localized
 * slugs). Content is bundled `Bi` data (no lazy import; articles are short), so
 * this renders synchronously. Unknown slugs redirect to the Help Centre index.
 * The cross-locale fallback mirrors PolicyPage: a URL in the other locale's
 * slug space still resolves, with its canonical tag pointing at the correct
 * localized URL.
 */
export function HelpArticlePage() {
  const { slug } = useParams()
  const { pathname } = useLocation()
  const { t, x, lang } = useI18n()
  const pathLang = langOfPath(pathname)
  const article =
    pathLang === 'fr'
      ? (helpArticleByFrSlug(slug ?? '') ?? helpArticleBySlug(slug ?? ''))
      : (helpArticleBySlug(slug ?? '') ?? helpArticleByFrSlug(slug ?? ''))

  const articleSlug = article?.slug ?? null
  useEffect(() => {
    if (articleSlug) trackEvent({ event_type: 'help_article_view', article_slug: articleSlug, locale: lang })
  }, [articleSlug, lang])

  const helpIndex = seoRoute('help').path[pathLang]

  if (!article) return <Navigate to={helpIndex} replace />

  const expectedSlug = pathLang === 'fr' ? article.frSlug : article.slug
  if ((slug ?? '') !== expectedSlug) {
    return <Navigate to={helpDocPath(article, pathLang)} replace />
  }

  const category = helpCategory(article.category)
  const related = helpArticlesByCategory(article.category).filter((a) => a.slug !== article.slug)

  return (
    <MarketingPageShell>
      <article className="mx-auto max-w-[760px] px-6 pt-12 pb-10">
        <Seo
          page={{
            title: {
              en: `${helpDocTitle(article, 'en')} | Dutiva Help`,
              fr: `${helpDocTitle(article, 'fr')} | Aide Dutiva`,
            },
            description: {
              en: helpDocDescription(article, 'en'),
              fr: helpDocDescription(article, 'fr'),
            },
            path: { en: helpDocPath(article, 'en'), fr: helpDocPath(article, 'fr') },
            indexable: true,
          }}
          breadcrumb={[
            { name: 'Dutiva', path: lang === 'fr' ? '/fr' : '/' },
            { name: x({ en: 'Help Centre', fr: 'Centre d’aide' }), path: helpIndex },
            { name: helpDocTitle(article, lang) },
          ]}
        />
        <Link
          to={helpIndex}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {t('help_back')}
        </Link>

        <p className="mt-6 text-xs font-semibold tracking-[0.14em] text-text-3 uppercase">
          {x(category.title)}
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.625rem,3vw,2.25rem)] leading-[1.14] font-semibold tracking-[-0.02em] text-text">
          {x(article.title)}
        </h1>
        <p className="mt-3.5 text-lg leading-[1.6] text-text-2">{x(article.summary)}</p>

        {helpArticleSections(article.slug).map((section, sectionIndex) => (
          <section key={section.heading ? x(section.heading) : `s${sectionIndex}`}>
            {section.heading && (
              <h2 className="mt-8 font-display text-[1.1875rem] font-semibold tracking-[-0.01em] text-text">
                {x(section.heading)}
              </h2>
            )}
            {groupHelpBlocks(section.blocks).map((group, groupIndex) =>
              group.kind === 'p' ? (
                <p
                  key={`p${groupIndex}`}
                  className="mt-3.5 text-[0.9375rem] leading-[1.7] text-text-2"
                >
                  {x(group.text)}
                </p>
              ) : (
                <ul key={`l${groupIndex}`} className="mt-3.5 grid list-disc gap-2 pl-5">
                  {group.items.map((item) => (
                    <li
                      key={x(item)}
                      className="text-[0.9375rem] leading-[1.65] text-text-2 marker:text-gold-strong"
                    >
                      {x(item)}
                    </li>
                  ))}
                </ul>
              ),
            )}
          </section>
        ))}

        <HelpfulnessWidget key={article.slug} slug={article.slug} />

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold tracking-[0.14em] text-text-3 uppercase">
              {t('help_related_title')}
            </h2>
            <ul className="mt-3 grid gap-2.5">
              {related.map((a) => (
                <li key={a.slug}>
                  <Link
                    to={helpDocPath(a, lang)}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-bg px-[18px] py-3.5 transition-colors hover:border-gold-strong"
                  >
                    <span className="text-[0.9375rem] font-semibold text-text">{x(a.title)}</span>
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="flex-none text-text-3 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 flex items-start gap-2.5 border-t border-border pt-5">
          <Info size={14} className="mt-0.5 flex-none text-gold-strong" aria-hidden="true" />
          <span className="text-[12.5px] leading-[1.6] text-text-3">{t('disclaimer_full')}</span>
        </div>
      </article>

      <HelpContactCta />
    </MarketingPageShell>
  )
}
