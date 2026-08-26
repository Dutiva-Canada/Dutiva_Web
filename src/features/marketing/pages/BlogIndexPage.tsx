import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { usePublicPath } from '@/seo/usePublicPath'
import { BLOG_ARTICLES, articlePath } from '../articles'
import { ArticlePublishedLabel } from '../articles/ArticlePublishedLabel'
import { MarketingPageShell, PageAside, PageCta, PageHero } from './MarketingPage'

/**
 * /blog — article index. Cards render from the article registry
 * (src/features/marketing/articles) and link to each post's own page.
 *
 * The blog topics are deliberately disjoint from the /guides collection:
 * both indexes previously listed the same six topics, and giving each of
 * those a URL under both prefixes would have shipped duplicate pages
 * competing with one another in search. What each collection is *for* — the
 * split this page's copy speaks to — is documented in
 * `articles/articleModel.ts`; the `PageAside` sends a reader who wants the
 * document rather than the obligation over to `/guides`.
 */
export function BlogIndexPage() {
  const { t, x, lang } = useI18n()
  const { p } = usePublicPath()
  return (
    <MarketingPageShell>
      <Seo route="blog" pageType="CollectionPage" />
      <PageHero eyebrow={t('blog_eyebrow')} title={t('blog_h1')} intro={t('blog_intro')} />

      <section className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {BLOG_ARTICLES.map((post) => (
            <article key={post.slug} className="premium-card-soft group p-[22px]">
              <div className="text-xs font-medium text-gold-strong">
                <ArticlePublishedLabel
                  iso={post.updated}
                  lang={lang}
                  template={t('blog_published')}
                />{' '}
                · {x(post.topic)} ·{' '}
                {x({
                  en: `${post.readingMinutes} min read`,
                  fr: `${post.readingMinutes} min de lecture`,
                })}
              </div>
              <h2 className="mt-2.5 text-[0.9375rem] font-semibold text-text">
                <Link to={articlePath(post, lang)} className="transition-opacity hover:opacity-80">
                  {x(post.title)}
                </Link>
              </h2>
              <p className="mt-1.5 text-sm leading-[1.55] text-text-2">{x(post.summary)}</p>
              <Link
                to={articlePath(post, lang)}
                className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong"
              >
                {x({ en: 'Read the article', fr: 'Lire l’article' })}
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <PageAside
        title={t('blog_toGuides_t')}
        body={t('blog_toGuides_p')}
        action={t('blog_toGuides_link')}
        to={p('guides')}
      />

      <PageCta
        title={t('blog_cta_t')}
        body={t('blog_cta_p')}
        action={t('blog_cta_btn')}
        to={p('pricing')}
      />
    </MarketingPageShell>
  )
}
