import { BLOG_SECTIONS } from './blogContent/index'
import { GUIDE_SECTIONS } from './guideContent/index'
import type { ArticleCollection, ArticleSection } from './articleModel'

/**
 * The editorial prose, separate from `./index` on purpose.
 *
 * `./index` is reachable from the router (`src/seo/routes.ts` → `routes.tsx`),
 * so anything it exports is in the eager entry graph of every public page.
 * This module is imported only by `ArticlePage`, which is a lazy route — so
 * the ~200kB of article bodies live in that route's chunk and are downloaded
 * by readers of an article, not by everyone.
 *
 * **Do not re-export this from `./index`.** That single line would put all of
 * it back on the marketing critical path, and `scripts/check-entry-graph.mjs`
 * is what would tell you — see docs/TODO.md EF6b for how it got there the
 * first time.
 *
 * The import is static, not dynamic: the bodies are plain `Bi` data, so
 * `ArticlePage` still renders synchronously and prerendering needs no await.
 */
export function articleSections(
  collection: ArticleCollection,
  slug: string,
): readonly ArticleSection[] {
  const pool = collection === 'guide' ? GUIDE_SECTIONS : BLOG_SECTIONS
  return pool[slug] ?? []
}

export { BLOG_SECTIONS } from './blogContent/index'
export { GUIDE_SECTIONS } from './guideContent/index'
