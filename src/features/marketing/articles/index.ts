import type { Lang } from '@/i18n/core'
import { BLOG_ARTICLES } from './blogArticles'
import { GUIDE_ARTICLES } from './guideArticles'
import type { Article, ArticleCollection } from './articleModel'

export * from './articleModel'
export { GUIDE_ARTICLES } from './guideArticles'
export { BLOG_ARTICLES } from './blogArticles'

/** Every editorial article across both collections — the input the SEO
    registry uses to mint one indexable URL pair per article. */
export const ALL_ARTICLES: readonly Article[] = [...GUIDE_ARTICLES, ...BLOG_ARTICLES]

function articlesIn(collection: ArticleCollection): readonly Article[] {
  return collection === 'guide' ? GUIDE_ARTICLES : BLOG_ARTICLES
}

/**
 * Resolves a slug within one collection. Both slug spaces are searched — the
 * requested locale first — so a URL carrying the other locale's slug still
 * renders, with its canonical tag pointing at the correctly localized URL.
 * This mirrors how PolicyPage and HelpArticlePage resolve their slugs.
 */
export function articleBySlug(
  collection: ArticleCollection,
  slug: string,
  lang: Lang,
): Article | undefined {
  const pool = articlesIn(collection)
  const byEn = pool.find((a) => a.slug === slug)
  const byFr = pool.find((a) => a.frSlug === slug)
  return lang === 'fr' ? (byFr ?? byEn) : (byEn ?? byFr)
}

/** Other articles in the same collection, for the "keep reading" list. */
export function relatedArticles(article: Article): Article[] {
  return articlesIn(article.collection).filter((a) => a.slug !== article.slug)
}
